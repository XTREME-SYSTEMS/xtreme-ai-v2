// generateMassWebsites — bulk generates every auto-builder step for all sites
// in a MassBuildProject batch. For each city+name combination, generates:
//   1. Logo(s) via GenerateImage
//   2. Website content via InvokeLLM
//   3. Full HTML from template + content + colors
// Then stores the HTML as a file and updates each MassBuildSite record.
//
// Admin-only. Processes sites in parallel batches to stay within latency limits.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

const TEMPLATE_LIBRARY: Record<string, any> = {
  'epoxy-elite': {
    heroImage: 'https://images.unsplash.com/photo-1766801075605-8c036a5c4ec3?w=1920&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1780362507424-a624df756101?w=1920&q=80',
    afterImage: 'https://images.unsplash.com/photo-1771531072574-af6ed6b954c0?w=1920&q=80',
    ctaImage: 'https://images.unsplash.com/photo-1479470226080-e1b5c1e4a2a1?w=1920&q=80',
  },
  'roofing-authority': {
    heroImage: 'https://images.unsplash.com/photo-1518709268805-4e9012a4d8d8?w=1920&q=80',
    ctaImage: 'https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=1920&q=80',
  },
  'hvac-pros': {
    heroImage: 'https://images.unsplash.com/photo-1631545806609-29d6b5f6f6b2?w=1920&q=80',
    ctaImage: 'https://images.unsplash.com/photo-1581094271901-8022e4e4f6e3?w=1920&q=80',
  },
  'plumbing-masters': {
    heroImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80',
    ctaImage: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1920&q=80',
  },
  'landscape-luxe': {
    heroImage: 'https://images.unsplash.com/photo-1416879595882-3377a0410ec1?w=1920&q=80',
    ctaImage: 'https://images.unsplash.com/photo-1558904541-efa831a6dbb7?w=1920&q=80',
  },
  'solar-savvy': {
    heroImage: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1920&q=80',
    ctaImage: 'https://images.unsplash.com/photo-1508514179223-5ffe5a916892?w=1920&q=80',
  },
  'concrete-kings': {
    heroImage: 'https://images.unsplash.com/photo-1503387762-592e58b7857f?w=1920&q=80',
    ctaImage: 'https://images.unsplash.com/photo-1545179605-1296651e9d43?w=1920&q=80',
  },
  'fence-masters': {
    heroImage: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1920&q=80',
    ctaImage: 'https://images.unsplash.com/photo-1566126125-9d6e2f6e4a3f?w=1920&q=80',
  },
  'paint-perfection': {
    heroImage: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1920&q=80',
    ctaImage: 'https://images.unsplash.com/photo-1589939765438-269ad9c4a5d3?w=1920&q=80',
  },
  'clean-swipe': {
    heroImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1920&q=80',
    ctaImage: 'https://images.unsplash.com/photo-1521791135224-4918b4d1a3f3?w=1920&q=80',
  },
  'auto-detail-elite': {
    heroImage: 'https://images.unsplash.com/photo-1605164599321-60c5de0b9a37?w=1920&q=80',
    ctaImage: 'https://images.unsplash.com/photo-1503376780353-7e6691122351?w=1920&q=80',
  },
  'tree-care-pros': {
    heroImage: 'https://images.unsplash.com/photo-1597223557154-721c1cecc4c0?w=1920&q=80',
    ctaImage: 'https://images.unsplash.com/photo-1518709268805-4e9012a4d8d8?w=1920&q=80',
  },
};

function buildHtml(site: any, template: any, content: any, images: any): string {
  const bg = site.background_color || template.default_colors.background;
  const accent = site.accent_color || template.default_colors.accent;
  const text = template.default_colors.text;
  const cityName = site.city;
  const bizName = site.website_name;
  const phone = '(555) 123-4567';

  const services = (content.services || []).map((s: any) => `
    <div class="service-card">
      <div class="service-icon" style="color:${accent}">${s.icon || '★'}</div>
      <h3>${s.title}</h3>
      <p>${s.desc}</p>
    </div>`).join('');

  const faq = (content.faq || []).map((f: any) => `
    <details><summary>${f.question}</summary><p>${f.answer}</p></details>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="${bg}">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="manifest" href="manifest.json">
<title>${bizName} | ${cityName} ${template.industry.replace(/_/g,' ')} Experts</title>
<meta name="description" content="${content.hero_subtext || ''}">
<meta property="og:title" content="${bizName}">
<meta property="og:description" content="${content.hero_subtext || ''}">
<meta property="og:type" content="website">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness","name":"${bizName}","telephone":"${phone}","areaServed":"${cityName}","address":{"addressLocality":"${cityName}"}}</script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:${bg};color:${text};line-height:1.6;scroll-behavior:smooth}
.container{max-width:1200px;margin:0 auto;padding:0 24px}
header{position:sticky;top:0;z-index:100;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);border-bottom:1px solid ${accent}33}
.nav{display:flex;align-items:center;justify-content:space-between;padding:16px 0}
.logo{display:flex;align-items:center;gap:12px;font-weight:800;font-size:20px}
.logo img{height:40px;width:40px;border-radius:8px}
.nav-links{display:flex;gap:28px;list-style:none}
.nav-links a{color:${text};text-decoration:none;font-size:14px;font-weight:600;transition:color .2s}
.nav-links a:hover{color:${accent}}
.nav-cta{background:${accent};color:${bg};padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px}
.hero{min-height:100vh;display:flex;align-items:center;position:relative;background:linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)),url("${images.heroImage}");background-size:cover;background-position:center}
.hero-content{max-width:700px;padding:80px 0}
.hero h1{font-size:56px;font-weight:800;margin-bottom:16px;line-height:1.1}
.hero h1 span{color:${accent}}
.hero p{font-size:20px;margin-bottom:32px;opacity:0.9}
.hero-buttons{display:flex;gap:16px;flex-wrap:wrap}
.btn-primary{background:${accent};color:${bg};padding:16px 32px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block}
.btn-secondary{background:transparent;color:${text};border:2px solid ${text};padding:16px 32px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block}
.hero-badges{display:flex;gap:24px;margin-top:40px;flex-wrap:wrap}
.hero-badges span{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600}
section{padding:100px 0}
.section-title{text-align:center;font-size:40px;font-weight:800;margin-bottom:16px}
.section-sub{text-align:center;font-size:18px;opacity:0.7;margin-bottom:60px}
.services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px}
.service-card{background:${bg === '#F5F5F5' || bg === '#E8F5E9' ? '#FFFFFF' : '#1A1A1A'};border:1px solid ${accent}22;border-radius:12px;padding:32px;text-align:center;transition:transform .2s,border-color .2s}
.service-card:hover{transform:translateY(-4px);border-color:${accent}}
.service-icon{font-size:40px;margin-bottom:16px}
.service-card h3{font-size:20px;margin-bottom:8px}
.service-card p{font-size:14px;opacity:0.7}
.cta-panel{background:linear-gradient(rgba(0,0,0,0.6),rgba(0,0,0,0.6)),url("${images.ctaImage}");background-size:cover;background-position:center;text-align:center;padding:120px 0}
.cta-panel h2{font-size:44px;margin-bottom:16px}
.cta-panel p{font-size:20px;margin-bottom:32px;opacity:0.9}
.reviews{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}
.review{background:${bg === '#F5F5F5' || bg === '#E8F5E9' ? '#FFFFFF' : '#1A1A1A'};border-radius:12px;padding:32px;border:1px solid ${accent}22}
.review p{font-size:16px;margin-bottom:16px;font-style:italic}
.review-author{font-weight:700;color:${accent}}
.faq-section{max-width:800px;margin:0 auto}
details{background:${bg === '#F5F5F5' || bg === '#E8F5E9' ? '#FFFFFF' : '#1A1A1A'};border-radius:8px;padding:20px;margin-bottom:12px;border:1px solid ${accent}22}
summary{font-weight:700;cursor:pointer;font-size:18px}
details p{margin-top:12px;opacity:0.8}
footer{background:#0A0A0A;padding:60px 0;border-top:1px solid ${accent}22}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px}
.footer-col h4{color:${accent};margin-bottom:16px;font-size:16px}
.footer-col a{display:block;color:${text};opacity:0.7;text-decoration:none;margin-bottom:8px;font-size:14px}
.footer-col a:hover{opacity:1}
.footer-bottom{text-align:center;margin-top:40px;padding-top:24px;border-top:1px solid #222;opacity:0.5;font-size:13px}
@media(max-width:768px){.nav-links{display:none}.hero h1{font-size:36px}.section-title{font-size:28px}.footer-grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<header><div class="container"><nav class="nav">
<div class="logo">${site.logo_url ? `<img src="${site.logo_url}" alt="${bizName}">` : ''}${bizName}</div>
<ul class="nav-links"><li><a href="#services">Services</a></li><li><a href="#about">About</a></li><li><a href="#reviews">Reviews</a></li><li><a href="#contact">Contact</a></li></ul>
<a href="tel:${phone.replace(/[^0-9]/g,'')}" class="nav-cta">Call ${phone}</a>
</nav></div></header>

<section class="hero"><div class="container"><div class="hero-content">
<h1>${content.hero_headline || cityName + "'s Premier Service"}<br><span>${content.hero_subtext ? '' : 'Built to Last.'}</span></h1>
<p>${content.hero_subtext || 'Professional service in ' + cityName}</p>
<div class="hero-buttons">
<a href="#contact" class="btn-primary">Get a Free Quote</a>
<a href="#services" class="btn-secondary">View Our Services</a>
</div>
<div class="hero-badges">
<span>✓ Licensed & Insured</span><span>✓ Free Estimates</span><span>✓ 20-Year Warranty</span><span>✓ 5-Star Rated</span>
</div>
</div></div></section>

<section id="services"><div class="container">
<h2 class="section-title">Our Services</h2>
<p class="section-sub">Professional solutions for ${cityName} and surrounding areas</p>
<div class="services-grid">${services}</div>
</div></section>

<section class="cta-panel"><div class="container">
<h2>Get Your Free Quote Today</h2>
<p>Serving ${cityName} and surrounding areas</p>
<a href="#contact" class="btn-primary">Call ${phone}</a>
</div></section>

<section id="reviews"><div class="container">
<h2 class="section-title">Customer Reviews</h2>
<p class="section-sub">What our ${cityName} customers say</p>
<div class="reviews">
${(content.reviews || []).map((r:any) => `<div class="review"><p>"${r.text}"</p><div class="review-author">${r.author}</div></div>`).join('')}
</div>
</div></section>

<section id="about"><div class="container">
<h2 class="section-title">About ${bizName}</h2>
<p class="section-sub" style="max-width:800px;margin:0 auto 40px">${content.about || 'Professional service company serving ' + cityName}</p>
</div></section>

<section id="contact"><div class="container">
<h2 class="section-title">Contact Us</h2>
<p class="section-sub">Call ${phone} or fill out the form below</p>
${faq}
</div></section>

<footer><div class="container">
<div class="footer-grid">
<div class="footer-col"><h4>${bizName}</h4><p style="opacity:0.7;font-size:14px">Professional service in ${cityName}</p></div>
<div class="footer-col"><h4>Services</h4>${(content.services||[]).map((s:any)=>`<a href="#services">${s.title}</a>`).join('')}</div>
<div class="footer-col"><h4>Company</h4><a href="#about">About</a><a href="#reviews">Reviews</a><a href="#contact">Contact</a></div>
<div class="footer-col"><h4>Contact</h4><a href="tel:${phone.replace(/[^0-9]/g,'')}">${phone}</a><a href="mailto:info@${bizName.toLowerCase().replace(/\s/g,'')}.com">Email Us</a></div>
</div>
<div class="footer-bottom">© ${new Date().getFullYear()} ${bizName}. All rights reserved. Licensed in ${cityName}.</div>
</div></footer>
</body>
</html>`;
}

export default async function(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const { mass_build_id, step } = body;

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });
    if (!mass_build_id) return Response.json({ error: 'mass_build_id required' }, { status: 400 });

    const svc = base44.asServiceRole;
    const project = await svc.entities.MassBuildProject.get(mass_build_id);
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

    // Get all pending sites for this project
    const sites = await svc.entities.MassBuildSite.filter({ mass_build_id: mass_build_id, status: 'pending' });
    const logs: string[] = [`[${new Date().toISOString()}] generateMassWebsites: ${sites.length} sites, step=${step || 'all'}`];

    await svc.entities.MassBuildProject.update(mass_build_id, { status: 'generating', current_step: step || 'logos', logs: [...(project.logs || []), ...logs] });

    const template = TEMPLATE_LIBRARY[project.template_id] || TEMPLATE_LIBRARY['epoxy-elite'];
    let generated = 0;

    // Process sites in parallel (batch of 3 to stay within limits)
    const batchSize = 3;
    for (let i = 0; i < sites.length; i += batchSize) {
      const batch = sites.slice(i, i + batchSize);
      await Promise.all(batch.map(async (site: any) => {
        try {
          await svc.entities.MassBuildSite.update(site.id, { status: 'generating', step: step || 'logo' });

          // Step 1: Generate logo
          let logoUrl = site.logo_url;
          if (!logoUrl) {
            const logoPrompt = `Professional minimalist logo for "${site.website_name}", a ${project.industry.replace(/_/g, ' ')} company in ${site.city}. Modern, clean, ${site.accent_color || project.accent_color} accent color on transparent or dark background. Vector style, high quality.`;
            try {
              const logoRes = await base44.integrations.Core.GenerateImage({ prompt: logoPrompt });
              logoUrl = (logoRes as any)?.url || '';
            } catch (e) { logs.push(`Logo gen failed for ${site.website_name}: ${(e as any)?.message}`); }
          }

          // Step 2: Generate content via LLM
          const contentPrompt = `Generate website content for a ${project.industry.replace(/_/g, ' ')} company named "${site.website_name}" in ${site.city}. Tone: ${site.tone || 'professional'}. Return JSON with: hero_headline, hero_subtext, about (2 paragraphs), services (array of {title, desc, icon} with 4-5 items), faq (array of {question, answer} with 4 items), reviews (array of {text, author} with 3 items), cta_text.`;
          let content: any = {};
          try {
            const contentRes = await base44.integrations.Core.InvokeLLM({
              prompt: contentPrompt,
              response_json_schema: {
                type: 'object',
                properties: {
                  hero_headline: { type: 'string' },
                  hero_subtext: { type: 'string' },
                  about: { type: 'string' },
                  services: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, desc: { type: 'string' }, icon: { type: 'string' } } } },
                  faq: { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, answer: { type: 'string' } } } },
                  reviews: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' }, author: { type: 'string' } } } },
                  cta_text: { type: 'string' }
                }
              },
              model: 'gemini_3_flash'
            });
            content = typeof contentRes === 'object' ? contentRes : {};
          } catch (e) { logs.push(`Content gen failed for ${site.website_name}: ${(e as any)?.message}`); }

          // Step 3: Build HTML from template
          const html = buildHtml(site, { industry: project.industry, default_colors: { background: project.background_color, accent: project.accent_color } }, content, template);

          // Step 4: Upload HTML as file
          let htmlUrl = '';
          try {
            const htmlBlob = new Blob([html], { type: 'text/html' });
            const htmlFile = new File([htmlBlob], 'index.html', { type: 'text/html' });
            const upRes = await base44.integrations.Core.UploadFile({ file: htmlFile });
            htmlUrl = (upRes as any)?.file_url || '';
          } catch (e) { logs.push(`HTML upload failed for ${site.website_name}: ${(e as any)?.message}`); }

          // Update the site record
          await svc.entities.MassBuildSite.update(site.id, {
            status: 'generated',
            step: 'review',
            logo_url: logoUrl,
            content,
            generated_html_url: htmlUrl,
            logs: [...(site.logs || []), `[${new Date().toISOString()}] Generated: logo=${!!logoUrl}, content=${!!content.services}, html=${html.length}chars`]
          });
          generated++;
        } catch (e) {
          await svc.entities.MassBuildSite.update(site.id, { status: 'failed', error: (e as any)?.message }).catch(() => {});
          logs.push(`Site ${site.website_name} failed: ${(e as any)?.message}`);
        }
      }));
    }

    await svc.entities.MassBuildProject.update(mass_build_id, {
      status: 'reviewing',
      generated_count: (project.generated_count || 0) + generated,
      logs: [...(project.logs || []), ...logs, `[${new Date().toISOString()}] Generation complete: ${generated}/${sites.length} sites`]
    });

    return Response.json({ ok: true, generated, total: sites.length });
  } catch (error) {
    console.error('generateMassWebsites error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}