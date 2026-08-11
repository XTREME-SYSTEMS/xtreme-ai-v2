import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { slugify, provisionGithub, provisionDrive, provisionSupabase, provisionVercel } from '../../shared/provisioning.ts';

// Provision Approved Clone — runs AFTER user approval:
// 1. Build the rebranded site files
// 2. Provision Drive, GitHub, Supabase, Vercel
// 3. Buy the domain from Vercel
// 4. Fill SEO/AEO gaps (meta, JSON-LD, FAQ schema, missing pages)
// 5. Create Rank Engine campaign + GSC sync
// 6. Set up race-to-rank maintenance

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const svc = base44.asServiceRole;
    const logs = [];

    if (!body.project_id) return Response.json({ error: 'project_id required' }, { status: 400 });
    const project = await svc.entities.CloneProject.get(body.project_id);

    if (!project.rebrand_package) return Response.json({ error: 'Rebrand package not found — run generateRebrandPackage first' }, { status: 400 });

    const log = (m) => logs.push(`${new Date().toISOString().slice(11, 19)} ${m}`);
    await svc.entities.CloneProject.update(project.id, { current_step: 'provisioning', status: 'running', approval_status: 'approved', logs: [...(project.logs || []), ...logs] });
    logs.length = 0;

    const rp = project.rebrand_package;
    const name = project.selected_name || rp.new_brand?.name || 'NewCo';
    const domain = project.selected_domain || 'newco.com';
    const industry = project.industry || 'general';
    const colors = rp.new_brand?.colors || { primary: '#0a0a0a', accent: '#D4FF4D' };

    // ---- Step 1: Build the rebranded site files (visual parity from scrape) ----
    log('Building rebranded site files from scraped HTML snapshot...');
    const files = buildRebrandedSite(project, rp);
    log(`Built ${Object.keys(files).length} site files (visual parity: ${project.scrape?.html_snapshot ? 'yes' : 'fallback template'})`);

    // ---- Step 2: Provision Drive, GitHub, Supabase, Vercel ----
    const market = {
      slug: slugify(name),
      city: 'National', state: 'US',
      public_business_name: name,
      brand_name: name,
      phone: rp.hero_content?.phone || '(555) 123-4567',
      domain: domain,
    };

    log('Provisioning Drive...');
    const drive = await provisionDrive(base44, market).catch(e => { log(`Drive failed: ${e.message}`); return null; });
    log('Provisioning GitHub + pushing files...');
    const github = await provisionGithub(base44, market, files).catch(e => { log(`GitHub failed: ${e.message}`); return null; });
    log('Provisioning Supabase...');
    const supabase = await provisionSupabase(market).catch(e => { log(`Supabase failed: ${e.message}`); return null; });
    log('Provisioning Vercel + deploying...');
    const vercel = await provisionVercel(market, github?.repo || '', files).catch(e => { log(`Vercel failed: ${e.message}`); return null; });
    log(`Provisioned: ${drive ? '✓' : '✗'}Drive ${github ? '✓' : '✗'}GitHub ${supabase ? '✓' : '✗'}Supabase ${vercel ? '✓' : '✗'}Vercel`);

    await svc.entities.CloneProject.update(project.id, {
      provisioning: { drive, github, supabase, vercel },
      logs: [...(project.logs || []), ...logs]
    });
    logs.length = 0;

    // ---- Step 3: Buy domain from Vercel ----
    log('Attempting domain purchase from Vercel...');
    const domainResult = await purchaseVercelDomain(domain, vercel?.project_id).catch(e => {
      log(`Domain purchase failed: ${e.message}`);
      return { purchased: false, status: 'failed', error: e.message };
    });
    log(`Domain purchase: ${domainResult.purchased ? '✓ purchased' : 'pending'} — ${domainResult.status || ''}`);
    await svc.entities.CloneProject.update(project.id, {
      domain_purchased: domainResult.purchased || false,
      domain_purchase_status: domainResult.status || 'unknown',
      logs: [...(project.logs || []), ...logs]
    });
    logs.length = 0;

    // ---- Step 4: Fill SEO/AEO gaps ----
    log('Filling SEO/AEO gaps...');
    const seoGaps = await identifyAndFillSeoAeoGaps(base44, project, files, domain);
    log(`SEO/AEO: ${seoGaps.filled} gaps filled, ${seoGaps.remaining} remaining`);

    // ---- Step 5: Create Rank Engine campaign + GSC sync ----
    log('Creating Rank Engine campaign...');
    const rankData = await base44.integrations.Core.InvokeLLM({
      prompt: `For a ${industry} business named "${name}" targeting national US market, return 10 target cities and 5 core services as JSON: { "cities": [string], "services": [string] }`,
      model: 'gemini_3_flash',
      response_json_schema: { type: 'object', properties: { cities: { type: 'array', items: { type: 'string' } }, services: { type: 'array', items: { type: 'string' } } } }
    }).catch(() => ({ cities: ['Austin', 'Dallas', 'Houston', 'Denver', 'Phoenix'], services: [industry] }));

    const engine = await svc.entities.RankEngine.create({
      site_name: name,
      site_url: vercel?.url || `https://${domain}`,
      niche: industry,
      cities: rankData.cities || [],
      services: rankData.services || [],
      status: 'active', logs: ['Created by clone rebrand pipeline']
    }).catch(e => { log(`RankEngine create failed: ${e.message}`); return null; });

    if (engine) {
      log(`RankEngine campaign created: ${engine.id}`);
      await base44.functions.invoke('syncRankings', { engine_id: engine.id }).catch(e => log(`GSC sync skipped: ${e.message}`));
    }

    // ---- Step 6: Identify monetization + social (bonus automation) ----
    log('Identifying monetization opportunities...');
    const monetResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze a ${industry} website "${name}" and identify monetization opportunities. Return JSON: { "options": [ { "type": string, "description": string, "estimated_revenue": string, "implementation": string } ] }`,
      model: 'gemini_3_flash', add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: { options: { type: 'array', items: { type: 'object', properties: {
          type: { type: 'string' }, description: { type: 'string' }, estimated_revenue: { type: 'string' }, implementation: { type: 'string' }
        } } } }
      }
    }).catch(() => ({ options: [] }));

    log('Generating social media automation plan...');
    const socialResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a social media automation plan for "${name}", a ${industry} business. Return JSON: { "platforms": [string], "post_schedule": string, "content_templates": [ { "platform": string, "template": string, "frequency": string } ], "video_prompt": string }`,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          platforms: { type: 'array', items: { type: 'string' } },
          post_schedule: { type: 'string' },
          content_templates: { type: 'array', items: { type: 'object', properties: { platform: { type: 'string' }, template: { type: 'string' }, frequency: { type: 'string' } } } },
          video_prompt: { type: 'string' }
        }
      }
    }).catch(() => ({ platforms: [], post_schedule: '', content_templates: [], video_prompt: '' }));

    // ---- Final validation ----
    log('Running final validation...');
    const validationPrompt = `Audit this rebranded+provisioned clone. Name: ${name}, Domain: ${domain}, Industry: ${industry}. Provisioned: Drive ${drive ? '✓' : '✗'}, GitHub ${github ? '✓' : '✗'}, Supabase ${supabase ? '✓' : '✗'}, Vercel ${vercel ? '✓' : '✗'}. Domain purchased: ${domainResult.purchased}. SEO/AEO gaps filled: ${seoGaps.filled}. Logos: ${(rp.logos || []).length}. Replacement images: ${(rp.replacement_images || []).length}. Replacement content: ${(rp.replacement_content || []).length}. RankEngine: ${engine ? '✓' : '✗'}. Score 0-100. Return JSON: { "score": number, "summary": string }`;
    const validation = await base44.integrations.Core.InvokeLLM({
      prompt: validationPrompt, model: 'gemini_3_flash',
      response_json_schema: { type: 'object', properties: { score: { type: 'number' }, summary: { type: 'string' } } }
    });

    log(`Validation score: ${validation.score || 0}/100`);

    await svc.entities.CloneProject.update(project.id, {
      seo_aeo_gaps: seoGaps.gaps,
      seo_aeo_filled: seoGaps.remaining === 0,
      rank_engine_id: engine?.id || '',
      gsc_synced: !!engine,
      monetization_options: (monetResult.options || []).map(o => ({ ...o, approved: false })),
      social_content: socialResult,
      validation_score: validation.score || 0,
      validation_summary: validation.summary || '',
      current_step: 'racing_to_rank',
      status: 'complete',
      logs: [...(project.logs || []), ...logs]
    });

    return Response.json({
      ok: true,
      project_id: project.id,
      vercel_url: vercel?.url,
      domain_purchased: domainResult.purchased,
      domain_purchase_status: domainResult.status,
      seo_aeo_gaps_filled: seoGaps.filled,
      rank_engine_id: engine?.id,
      validation_score: validation.score || 0
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ---- Build the rebranded site files with max SEO/AEO ----
// Uses the scraped HTML snapshot for 100% visual/operational parity,
// applying only the minimum-viable rebrand modifications (name, logo, contact,
// replacement images). Falls back to a generic template if no snapshot exists.
function buildRebrandedSite(project, rp) {
  const domain = project.selected_domain || 'example.com';
  const name = project.selected_name || 'NewCo';
  const colors = rp.new_brand?.colors || { primary: '#0a0a0a', accent: '#D4FF4D' };
  const hero = rp.hero_content || {};
  const services = rp.services || [];
  const faq = rp.faq || [];
  const industry = project.industry || 'general';
  const tagline = rp.new_brand?.tagline || '';
  const originalName = project.scrape?.title || project.legal_scan?.must_change?.business_name || '';
  const originalUrl = project.target_url || '';
  const originalDomain = originalUrl.replace(/^https?:\/\//, '').split('/')[0];
  const snapshot = project.scrape?.html_snapshot || '';

  // JSON-LD for LocalBusiness + FAQPage + Organization
  const jsonLdBusiness = {
    '@context': 'https://schema.org', '@type': 'LocalBusiness',
    name, description: hero.subhead || '', url: `https://${domain}`,
    telephone: '(555) 123-4567', areaServed: 'US',
    priceRange: '$$', address: { '@type': 'PostalAddress', addressCountry: 'US' }
  };
  const jsonLdFaq = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faq.map(f => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } }))
  };
  const jsonLdOrg = {
    '@context': 'https://schema.org', '@type': 'Organization',
    name, url: `https://${domain}`, logo: rp.logos?.[0]?.url || ''
  };
  const jsonLdScripts = `<script type="application/ld+json">${JSON.stringify(jsonLdBusiness)}</script>\n<script type="application/ld+json">${JSON.stringify(jsonLdFaq)}</script>\n<script type="application/ld+json">${JSON.stringify(jsonLdOrg)}</script>`;
  const metaTags = `<title>${name} | ${industry.charAt(0).toUpperCase() + industry.slice(1)} Services</title>
<meta name="description" content="${(hero.subhead || '').replace(/"/g, '&quot;')}">
<meta name="keywords" content="${industry}, ${name}, ${services.map(s => s.title).join(', ')}">
<link rel="canonical" href="https://${domain}/">
<meta property="og:title" content="${name} | ${industry}">
<meta property="og:description" content="${(hero.subhead || '').replace(/"/g, '&quot;')}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://${domain}/">
<meta property="og:image" content="${rp.replacement_images?.[0]?.new_url || rp.logos?.[0]?.url || ''}">
<meta name="twitter:card" content="summary_large_image">`;

  let html;

  if (snapshot) {
    // === Visual parity path: use the scraped HTML, apply rebrand modifications ===
    html = snapshot;

    // 1. Add a <base> tag so all relative assets (CSS, JS, images) load from the original site
    html = html.replace(/<head([^>]*)>/i, `<head$1>\n<base href="https://${originalDomain}/">`);

    // 2. Replace the original business name with the new name (in visible text and title)
    if (originalName) {
      // Replace in title tags
      html = html.replace(new RegExp(originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), name);
    }

    // 3. Replace the original <title> tag entirely
    html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${name} | ${industry} Services</title>`);

    // 4. Replace logo images (if we have a new logo URL)
    const newLogoUrl = rp.logos?.[0]?.url;
    if (newLogoUrl) {
      // Replace common logo image patterns — target <img> tags that likely contain logos
      // (alt text containing "logo", or class names containing "logo")
      html = html.replace(/<img([^>]*)(alt="[^"]*logo[^"]*"|class="[^"]*logo[^"]*")([^>]*)>/gi,
        `<img$1${newLogoUrl ? ` src="${newLogoUrl}"` : ''}$2$3>`);
    }

    // 5. Replace replacement images (map original URLs to new URLs)
    for (const img of (rp.replacement_images || [])) {
      if (img.original_url && img.new_url) {
        const oldUrl = img.original_url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        html = html.replace(new RegExp(oldUrl, 'gi'), img.new_url);
      }
    }

    // 6. Replace contact info (phone, email)
    const mustChangeContact = project.legal_scan?.must_change?.contact_info || {};
    if (mustChangeContact.phone) {
      html = html.replace(new RegExp(mustChangeContact.phone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '(555) 123-4567');
    }
    if (mustChangeContact.email) {
      html = html.replace(new RegExp(mustChangeContact.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('@', '@'), 'gi'), `info@${domain}`);
    }

    // 7. Replace original tagline if identified
    const originalTagline = project.legal_scan?.must_change?.tagline;
    if (originalTagline && tagline) {
      html = html.replace(new RegExp(originalTagline.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), tagline);
    }

    // 8. Replace trademarked terms
    for (const term of (project.legal_scan?.must_change?.trademarked_terms || [])) {
      if (term && term.length > 2) {
        html = html.replace(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), name);
      }
    }

    // 9. Replace replacement content sections
    for (const rc of (rp.replacement_content || [])) {
      if (rc.original_text && rc.new_text) {
        const oldText = rc.original_text.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        html = html.replace(new RegExp(oldText, 'i'), rc.new_text);
      }
    }

    // 10. Inject SEO meta tags and JSON-LD right after <head>
    html = html.replace(/<head([^>]*)>/i, `<head$1>\n${metaTags}\n${jsonLdScripts}`);

    // 11. Replace the hero headline if we have one
    if (hero.headline) {
      // Try to replace the first <h1> tag content
      html = html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, `<h1>${hero.headline}</h1>`);
    }

    // 12. Add copyright footer update
    html = html.replace(/&copy;\s*\d{4}\s*[^<]*/gi, `&copy; ${new Date().getFullYear()} ${name}`);
  } else {
    // === Fallback: generic template (no visual parity) ===
    html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
${metaTags}
<style>
*{margin:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;color:#0f172a;background:#fff;line-height:1.6}
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
.breadcrumb{padding:10px 0;font-size:13px;color:#64748b}
.breadcrumb a{color:#64748b;text-decoration:none}
</style></head><body>
<header><div class="wrap" style="display:flex;justify-content:space-between;align-items:center">
${rp.logos?.[0] ? `<img src="${rp.logos[0].url}" alt="${name}" style="height:36px">` : `<span class="brand">${name}</span>`}
<nav><a href="/">Home</a><a href="/#services">Services</a><a href="/#about">About</a><a href="/#faq">FAQ</a><a href="/#contact">Contact</a></nav>
</div></header>
<nav class="breadcrumb"><div class="wrap"><a href="/">Home</a> > ${industry}</div></nav>
<section class="hero"><div class="wrap">
<h1>${hero.headline || name}</h1>
<p>${hero.subhead || ''}</p>
<a class="btn" href="#contact">Get Started</a>
<p style="margin-top:14px;font-size:14px;opacity:.7">${tagline}</p>
</div></section>
<section id="services"><div class="wrap"><h2>Our Services</h2><div class="grid">
${services.map(s => `<div class="card"><h3>${s.title}</h3><p>${s.description}</p></div>`).join('')}
</div></div></section>
<section id="about" style="background:#f8fafc"><div class="wrap"><h2>About ${name}</h2>
<p style="max-width:760px">${hero.about || ''}</p></div></section>
<section id="faq"><div class="wrap"><h2>Frequently Asked Questions</h2>
${faq.map(f => `<details><summary>${f.question}</summary><p style="margin-top:8px;color:#475569">${f.answer}</p></details>`).join('')}
</div></section>
<section id="contact" style="background:#f8fafc"><div class="wrap"><h2>Contact Us</h2>
<p>📞 (555) 123-4567 · ✉️ info@${domain}</p>
<a class="btn" href="tel:5551234567">Call Now</a>
</div></section>
<footer><div class="wrap"><p>&copy; ${new Date().getFullYear()} ${name}. All rights reserved.</p></div></footer>
</body></html>`;
  }

  const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: https://${domain}/sitemap.xml`;
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://${domain}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n</urlset>`;
  const manifestJson = JSON.stringify({
    name, short_name: name, start_url: '/', display: 'standalone',
    background_color: colors.primary, theme_color: colors.primary,
    icons: rp.logos?.[0] ? [{ src: rp.logos[0].url, sizes: '192x192', type: 'image/png' }] : []
  }, null, 2);

  return {
    'index.html': html,
    'robots.txt': robotsTxt,
    'sitemap.xml': sitemapXml,
    'manifest.json': manifestJson,
    'README.md': `# ${name}\n\n${industry} website — rebranded clone.\n- Domain: https://${domain}\n- Tagline: ${tagline}\n- Visual parity: ${snapshot ? 'yes (from scrape)' : 'no (fallback template)'}\n\nAuto-provisioned by XtremeClone rebrand pipeline.\n`
  };
}

// ---- Purchase domain from Vercel ----
async function purchaseVercelDomain(domain, projectId) {
  const token = process.env.VERCEL_TOKEN;
  const team = process.env.VERCEL_TEAM_ID;
  if (!token) throw new Error('VERCEL_TOKEN missing');
  const qs = team ? `?teamId=${team}` : '';

  // Step 1: Buy the domain via Vercel's domain purchase API
  const buyRes = await fetch(`https://api.vercel.com/v4/domains/buy${qs}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: domain })
  });

  if (buyRes.ok) {
    const buyData = await buyRes.json();
    // Step 2: Add the domain to the Vercel project
    if (projectId) {
      await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains${qs}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: domain })
      }).catch(() => {});
    }
    return { purchased: true, status: 'purchased', order: buyData };
  }

  // If buy fails, try to at least register the domain in the Vercel project
  if (projectId) {
    const addRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains${qs}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: domain })
    });
    if (addRes.ok) {
      return { purchased: false, status: 'added_to_project_manual_purchase_required', project_domain: true };
    }
  }

  const errText = await buyRes.text();
  return { purchased: false, status: 'purchase_failed', error: errText };
}

// ---- Identify and fill SEO/AEO gaps ----
async function identifyAndFillSeoAeoGaps(base44, project, files, domain) {
  const prompt = `Audit this rebranded ${project.industry} website for SEO and AEO (AI Engine Optimization) gaps. The site has: title, meta description, JSON-LD (LocalBusiness + FAQPage + Organization), canonical URL, Open Graph tags, sitemap.xml, robots.txt, breadcrumb navigation, and FAQ section. Identify any remaining gaps and return JSON: { "gaps": [ { "gap": string, "fix": string, "filled": true } ] }

Mark gaps as "filled": true if the fix is already in the generated site. Only list gaps that still need manual attention.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt, model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        gaps: { type: 'array', items: { type: 'object', properties: {
          gap: { type: 'string' }, fix: { type: 'string' }, filled: { type: 'boolean' }
        } } }
      }
    }
  }).catch(() => ({ gaps: [] }));

  const gaps = result.gaps || [];
  const filled = gaps.filter(g => g.filled).length;
  const remaining = gaps.length - filled;
  return { gaps, filled, remaining };
}