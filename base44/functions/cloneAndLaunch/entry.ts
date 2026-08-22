import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { slugify, provisionGithub, provisionDrive, provisionSupabase, provisionVercel } from '../../shared/provisioning.ts';
import { detectIndustry as detectIndustryShared, scrapeTarget } from '../../shared/cloneUtils.ts';

// The unified clone-to-launch pipeline.
// Runs as a phase machine: each invocation executes the next pending phase,
// checkpoints progress on the CloneProject, and advances current_step.
// A scheduled workflow resumes any project that hasn't reached 'complete'.
//
// Phases: scraping → analyzing → recommending → rebranding → provisioning →
// branding → imaging → seo → monetizing → social → validating → complete

const PHASES = ['scraping', 'analyzing', 'recommending', 'rebranding', 'provisioning', 'branding', 'imaging', 'seo', 'monetizing', 'social', 'validating'];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const svc = base44.asServiceRole;
    const logs = [];

    // Resolve project
    let project;
    if (body.project_id) {
      project = await svc.entities.CloneProject.get(body.project_id);
    } else if (body.target_url) {
      project = await svc.entities.CloneProject.create({
        target_url: body.target_url,
        industry: body.industry || '',
        business_name: body.business_name || '',
        auto_proceed: body.auto_proceed !== false,
        status: 'running', current_step: 'scraping',
        logs: [`Pipeline initiated for ${body.target_url}`]
      });
    } else {
      // Resume the most recent stuck project
      const stuck = await svc.entities.CloneProject.filter({ status: 'running' }, '-updated_date', 1);
      project = stuck[0];
      if (!project) return Response.json({ error: 'No project_id or target_url provided' }, { status: 400 });
    }

    const log = (m) => { logs.push(`${new Date().toISOString().slice(11, 19)} ${m}`); };
    const persist = async (updates) => {
      project = { ...project, ...updates };
      await svc.entities.CloneProject.update(project.id, { ...updates, logs: [...(project.logs || []), ...logs] });
      logs.length = 0;
    };

    await svc.entities.CloneProject.update(project.id, { status: 'running' });

    // Run phases from current_step forward
    const startIdx = PHASES.indexOf(project.current_step);
    if (startIdx === -1 && project.current_step !== 'complete') {
      await persist({ current_step: 'scraping' });
    }

    for (let i = Math.max(0, startIdx); i < PHASES.length; i++) {
      const phase = PHASES[i];
      log(`▶ Phase: ${phase}`);
      try {
        await svc.entities.CloneProject.update(project.id, { current_step: phase });
        project.current_step = phase;

        if (phase === 'scraping') await doScrape(base44, project, log, persist);
        else if (phase === 'analyzing') await doAnalyze(base44, project, log, persist);
        else if (phase === 'recommending') await doRecommend(base44, project, log, persist);
        else if (phase === 'rebranding') await doRebrand(base44, project, log, persist);
        else if (phase === 'provisioning') await doProvision(base44, project, log, persist);
        else if (phase === 'branding') await doBranding(base44, project, log, persist);
        else if (phase === 'imaging') await doImaging(base44, project, log, persist);
        else if (phase === 'seo') await doSEO(base44, project, log, persist);
        else if (phase === 'monetizing') await doMonetize(base44, project, log, persist);
        else if (phase === 'social') await doSocial(base44, project, log, persist);
        else if (phase === 'validating') await doValidate(base44, project, log, persist);

      } catch (phaseErr) {
        log(`✗ Phase ${phase} failed: ${phaseErr.message}`);
        await persist({ error: `${phase}: ${phaseErr.message}` });
        // Non-fatal: continue to next phase (provisioning failures shouldn't block SEO)
      }
    }

    await persist({ status: 'complete', current_step: 'complete', validation_summary: project.validation_summary || 'Pipeline complete' });
    return Response.json({ ok: true, project_id: project.id, status: 'complete', validation_score: project.validation_score || 0, vercel_url: project.provisioning?.vercel?.url, logs: project.logs });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ---- Phase 1: Scrape target site ----
async function doScrape(base44, project, log, persist) {
  const scraped = await scrapeTarget(project.target_url);
  log(`Scraped ${scraped.html_size} chars, ${scraped.colors.length} colors, ${scraped.headings.length} headings`);
  await persist({
    scrape: {
      html_size: scraped.html_size,
      title: scraped.title,
      meta_description: scraped.meta_description,
      colors: scraped.colors,
      structure_summary: scraped.headings.join(' | '),
      html_snapshot: scraped.html.slice(0, 80000)
    },
    industry: project.industry || detectIndustryShared(scraped.html, scraped.title)
  });
}

// ---- Phase 2: Identify changeable parts (legal) ----
async function doAnalyze(base44, project, log, persist) {
  const html = project.scrape?.html_snapshot || '';
  const prompt = `Analyze this cloned website HTML and identify ALL parts specific to the original owner that MUST change to avoid trademark/branding issues and make the clone unique. HTML (truncated):\n${html.slice(0, 50000)}\n\nReturn JSON with exact current values for: logo (type, current_value, location), accent_colors (hex + usage), key_images (url + description), trademark_content (type, current_text, location), contact_info (phone, email, address, social_links).`;
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt, model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        logo: { type: 'object', properties: { type: { type: 'string' }, current_value: { type: 'string' }, location: { type: 'string' } } },
        accent_colors: { type: 'array', items: { type: 'object', properties: { hex: { type: 'string' }, usage: { type: 'string' } } } },
        key_images: { type: 'array', items: { type: 'object', properties: { url: { type: 'string' }, description: { type: 'string' } } } },
        trademark_content: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, current_text: { type: 'string' }, location: { type: 'string' } } } },
        contact_info: { type: 'object', properties: { phone: { type: 'string' }, email: { type: 'string' }, address: { type: 'string' }, social_links: { type: 'array', items: { type: 'string' } } } }
      }
    }
  });
  log(`Identified ${(result.trademark_content || []).length} trademark items, ${(result.accent_colors || []).length} colors to change`);
  await persist({ changeable_parts: result });
}

// ---- Phase 3: Generate 20 name + domain recommendations ----
async function doRecommend(base44, project, log, persist) {
  const prompt = `You are a brand strategist. A website in the "${project.industry}" industry is being cloned and rebranded to avoid trademark issues. The original site is ${project.target_url}. Generate 20 unique, brandable business name + domain recommendations. Each name must be distinct from the original, memorable, industry-appropriate, and the domain should be a .com that is likely available. Search the web to check domain availability trends. Return JSON: { "options": [ { "name": string, "domain": string (e.g. "newbrand.com"), "rationale": string, "available": boolean } ] }`;
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt, model: 'gemini_3_flash', add_context_from_internet: true,
    response_json_schema: {
      type: 'object',
      properties: {
        options: { type: 'array', items: { type: 'object', properties: {
          name: { type: 'string' }, domain: { type: 'string' }, rationale: { type: 'string' }, available: { type: 'boolean' }
        } } }
      }
    }
  });
  const options = result.options || [];
  log(`Generated ${options.length} name+domain options`);
  // Auto-select best available option
  const best = options.find(o => o.available) || options[0] || { name: project.business_name || 'NewCo', domain: `${slugify(project.industry || 'new')}-${Date.now().toString(36).slice(-4)}.com` };
  await persist({ name_options: options, selected_name: best.name, selected_domain: best.domain });
}

// ---- Phase 4: Generate rebranded content ----
async function doRebrand(base44, project, log, persist) {
  const prompt = `Generate complete rebranded website content for "${project.selected_name}", a ${project.industry} business. The original site had these trademark elements that must be replaced: ${JSON.stringify(project.changeable_parts?.trademark_content || []).slice(0, 2000)}. Generate unique, non-infringing content. Return JSON: { "hero_headline": string, "hero_subhead": string, "about": string (2 paragraphs), "services": [ { "title": string, "description": string } ], "faq": [ { "question": string, "answer": string } ], "tagline": string, "new_colors": { "primary": string (hex), "accent": string (hex) }, "phone": string (fake 555 number), "email": string }`;
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt, model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        hero_headline: { type: 'string' }, hero_subhead: { type: 'string' }, about: { type: 'string' },
        services: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' } } } },
        faq: { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, answer: { type: 'string' } } } },
        tagline: { type: 'string' },
        new_colors: { type: 'object', properties: { primary: { type: 'string' }, accent: { type: 'string' } } },
        phone: { type: 'string' }, email: { type: 'string' }
      }
    }
  });
  log(`Rebranded content: ${(result.services || []).length} services, ${(result.faq || []).length} FAQ`);
  await persist({ rebranded_content: result });
}

// ---- Phase 5: Provision Drive, GitHub, Supabase, Vercel ----
async function doProvision(base44, project, log, persist) {
  const market = {
    slug: slugify(project.selected_name || project.industry),
    city: 'National', state: 'US',
    public_business_name: project.selected_name,
    brand_name: project.selected_name,
    phone: project.rebranded_content?.phone || '(555) 123-4567',
    domain: project.selected_domain,
  };
  const files = buildCloneSiteFiles(project);
  log('Provisioning Drive...');
  const drive = await provisionDrive(base44, market).catch(e => { log(`Drive failed: ${e.message}`); return null; });
  log('Provisioning GitHub + pushing files...');
  const github = await provisionGithub(base44, market, files).catch(e => { log(`GitHub failed: ${e.message}`); return null; });
  log('Provisioning Supabase...');
  const supabase = await provisionSupabase(market).catch(e => { log(`Supabase failed: ${e.message}`); return null; });
  log('Provisioning Vercel + deploying...');
  const vercel = await provisionVercel(market, github?.repo || '', files).catch(e => { log(`Vercel failed: ${e.message}`); return null; });
  log(`Provisioned: ${drive ? '✓' : '✗'}Drive ${github ? '✓' : '✗'}GitHub ${supabase ? '✓' : '✗'}Supabase ${vercel ? '✓' : '✗'}Vercel`);
  await persist({ provisioning: { drive, github, supabase, vercel } });
}

function buildCloneSiteFiles(project) {
  const c = project.rebranded_content || {};
  const domain = project.selected_domain || 'example.com';
  const name = project.selected_name || 'NewCo';
  const colors = c.new_colors || { primary: '#0a0a0a', accent: '#D4FF4D' };
  const services = c.services || [];
  const faq = c.faq || [];
  const jsonLd = { '@context': 'https://schema.org', '@type': 'LocalBusiness', name, telephone: c.phone, areaServed: 'US' };
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(f => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) };

  const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${name} | ${project.industry}</title>
<meta name="description" content="${c.hero_subhead || ''}">
<link rel="canonical" href="https://${domain}/">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<script type="application/ld+json">${JSON.stringify(faqLd)}</script>
<style>
*{margin:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;color:#0f172a;background:#fff;line-height:1.6}
.wrap{max-width:1100px;margin:0 auto;padding:0 20px}
header{position:sticky;top:0;background:${colors.primary};color:#fff;padding:14px 0;z-index:10}
header .brand{font-weight:700;font-size:18px}
header a{color:#fff;text-decoration:none;margin-left:18px;font-size:14px}
.hero{background:linear-gradient(135deg,${colors.primary},#1a1a1a);color:#fff;padding:70px 0;text-align:center}
.hero h1{font-size:38px;margin-bottom:14px;max-width:800px;margin-inline:auto}
.hero p{font-size:18px;opacity:.85;max-width:640px;margin:0 auto 22px}
.btn{display:inline-block;background:${colors.accent};color:#000;padding:13px 26px;border-radius:8px;font-weight:700;text-decoration:none}
section{padding:54px 0}h2{font-size:28px;margin-bottom:18px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px}
.card{border:1px solid #e2e8f0;border-radius:12px;padding:22px}.card h3{font-size:18px;margin-bottom:8px}
details{border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:10px}summary{font-weight:600;cursor:pointer}
footer{background:${colors.primary};color:#9ca3af;padding:30px 0;text-align:center}
</style></head><body>
<header><div class="wrap" style="display:flex;justify-content:space-between;align-items:center"><span class="brand">${name}</span><nav><a href="/">Home</a><a href="/#services">Services</a><a href="/#faq">FAQ</a><a href="/#contact">Contact</a></nav></div></header>
<section class="hero"><div class="wrap"><h1>${c.hero_headline || name}</h1><p>${c.hero_subhead || ''}</p><a class="btn" href="#contact">Get Started</a><p style="margin-top:14px;font-size:14px;opacity:.7">${c.tagline || ''}</p></div></section>
<section id="services"><div class="wrap"><h2>Our Services</h2><div class="grid">${services.map(s => `<div class="card"><h3>${s.title}</h3><p>${s.description}</p></div>`).join('')}</div></div></section>
<section style="background:#f8fafc"><div class="wrap"><h2>About ${name}</h2><p style="max-width:760px">${c.about || ''}</p></div></section>
<section id="faq"><div class="wrap"><h2>FAQ</h2>${faq.map(f => `<details><summary>${f.question}</summary><p style="margin-top:8px;color:#475569">${f.answer}</p></details>`).join('')}</div></section>
<section id="contact" style="background:#f8fafc"><div class="wrap"><h2>Contact Us</h2><p>📞 ${c.phone || ''} · ✉️ ${c.email || ''}</p></div></section>
<footer><div class="wrap"><p>&copy; ${new Date().getFullYear()} ${name}</p></div></footer>
</body></html>`;

  const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: https://${domain}/sitemap.xml`;
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://${domain}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n</urlset>`;
  return { 'index.html': html, 'robots.txt': robotsTxt, 'sitemap.xml': sitemapXml };
}

// ---- Phase 6: Generate 3 logo options ----
async function doBranding(base44, project, log, persist) {
  const name = project.selected_name || 'NewCo';
  const colors = project.rebranded_content?.new_colors || { primary: '#0a0a0a', accent: '#D4FF4D' };
  const styles = ['minimalist geometric', 'bold emblem badge', 'modern abstract monogram'];
  const prompts = styles.map(s => `Professional logo for "${name}", a ${project.industry} company. Style: ${s}. Colors: ${colors.primary} and ${colors.accent}. Clean, scalable, on white background. No text except the brand name "${name}".`);
  log(`Generating ${prompts.length} logo options in parallel...`);
  const results = await Promise.all(prompts.map(p =>
    base44.asServiceRole.integrations.Core.GenerateImage({ prompt: p }).catch(e => { log(`Logo gen failed: ${e.message}`); return null; })
  ));
  const logos = results.filter(Boolean).map((r, i) => ({ url: r.url, prompt: prompts[i] }));
  log(`Generated ${logos.length} logos`);
  await persist({ logo_options: logos, selected_logo_url: logos[0]?.url || '' });
}

// ---- Phase 7: Generate hero + section images ----
async function doImaging(base44, project, log, persist) {
  const industry = project.industry || 'business';
  const prompts = [
    { type: 'hero', prompt: `Cinematic wide hero image for a ${industry} company website. Professional, high-end, aspirational. No text.` },
    { type: 'team', prompt: `Professional team working in a ${industry} setting, authentic, documentary style. No text.` },
  ];
  log(`Generating ${prompts.length} images in parallel...`);
  const results = await Promise.all(prompts.map(p =>
    base44.asServiceRole.integrations.Core.GenerateImage({ prompt: p.prompt }).catch(e => { log(`Image gen failed: ${e.message}`); return null; })
  ));
  const images = results.filter(Boolean).map((r, i) => ({ type: prompts[i].type, url: r.url, prompt: prompts[i].prompt }));
  log(`Generated ${images.length} images`);
  await persist({ generated_images: images });
}

// ---- Phase 8: Create Rank Engine campaign + GSC sync ----
async function doSEO(base44, project, log, persist) {
  const rankRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `For a ${project.industry} business named "${project.selected_name}" targeting national US market, return 10 target cities and 5 core services as JSON: { "cities": [string], "services": [string] }`,
    model: 'gemini_3_flash',
    response_json_schema: { type: 'object', properties: { cities: { type: 'array', items: { type: 'string' } }, services: { type: 'array', items: { type: 'string' } } } }
  }).catch(() => ({ cities: ['Austin', 'Dallas', 'Houston', 'Denver', 'Phoenix'], services: [project.industry] }));

  // Create RankEngine campaign
  const engine = await base44.asServiceRole.entities.RankEngine.create({
    site_name: project.selected_name,
    site_url: project.provisioning?.vercel?.url || `https://${project.selected_domain}`,
    niche: project.industry,
    cities: rankRes.cities || [],
    services: rankRes.services || [],
    status: 'active', logs: ['Created by clone pipeline']
  }).catch(e => { log(`RankEngine create failed: ${e.message}`); return null; });

  if (engine) {
    log(`Created RankEngine campaign: ${engine.id}`);
    // Sync GSC rankings
    await base44.functions.invoke('syncRankings', { engine_id: engine.id }).catch(e => log(`GSC sync skipped: ${e.message}`));
  }
  await persist({ rank_engine_id: engine?.id || '', gsc_synced: true });
}

// ---- Phase 9: Identify monetization opportunities ----
async function doMonetize(base44, project, log, persist) {
  const prompt = `Analyze a ${project.industry} website "${project.selected_name}" and identify all monetization opportunities. Return JSON: { "options": [ { "type": string (e.g. "lead_gen", "adsense", "affiliate", "ecommerce", "subscriptions", "appointments"), "description": string, "estimated_revenue": string, "implementation": string } ] }`;
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt, model: 'gemini_3_flash', add_context_from_internet: true,
    response_json_schema: {
      type: 'object',
      properties: {
        options: { type: 'array', items: { type: 'object', properties: {
          type: { type: 'string' }, description: { type: 'string' }, estimated_revenue: { type: 'string' }, implementation: { type: 'string' }
        } } }
      }
    }
  });
  const options = (result.options || []).map(o => ({ ...o, approved: false }));
  log(`Identified ${options.length} monetization opportunities`);
  await persist({ monetization_options: options });
}

// ---- Phase 10: Generate social media content plan ----
async function doSocial(base44, project, log, persist) {
  const prompt = `Create a social media automation plan for "${project.selected_name}", a ${project.industry} business. Return JSON: { "platforms": [string], "post_schedule": string, "content_templates": [ { "platform": string, "template": string, "frequency": string } ], "video_prompt": string }`;
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt, model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        platforms: { type: 'array', items: { type: 'string' } },
        post_schedule: { type: 'string' },
        content_templates: { type: 'array', items: { type: 'object', properties: { platform: { type: 'string' }, template: { type: 'string' }, frequency: { type: 'string' } } } },
        video_prompt: { type: 'string' }
      }
    }
  });
  log(`Social plan: ${(result.platforms || []).length} platforms, ${(result.content_templates || []).length} templates`);
  await persist({ social_content: result });
}

// ---- Phase 11: Validate + audit the full pipeline ----
async function doValidate(base44, project, log, persist) {
  const prompt = `Audit this cloned+rebranded website project end-to-end. Industry: ${project.industry}, Name: ${project.selected_name}, Domain: ${project.selected_domain}. Provisioned: Drive ${project.provisioning?.drive ? '✓' : '✗'}, GitHub ${project.provisioning?.github ? '✓' : '✗'}, Supabase ${project.provisioning?.supabase ? '✓' : '✗'}, Vercel ${project.provisioning?.vercel ? '✓' : '✗'}. Logos: ${(project.logo_options || []).length}, Images: ${(project.generated_images || []).length}, RankEngine: ${project.rank_engine_id ? '✓' : '✗'}, Monetization options: ${(project.monetization_options || []).length}, Social plan: ${project.social_content?.platforms?.length || 0} platforms. Score the overall completeness 0-100 and list any gaps. Return JSON: { "score": number, "summary": string, "gaps": [string] }`;
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt, model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        score: { type: 'number' }, summary: { type: 'string' }, gaps: { type: 'array', items: { type: 'string' } }
      }
    }
  });
  log(`Validation score: ${result.score || 0}/100`);
  await persist({ validation_score: result.score || 0, validation_summary: result.summary || '' });
}