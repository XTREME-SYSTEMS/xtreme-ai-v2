// processWebPack — ingests a WebPack design mockup image, uses vision AI to
// generate pixel-perfect HTML/CSS that reproduces the design exactly, then
// deploys it as a static site to Vercel via direct file upload (no build step).
// The result is a live website that looks exactly like the uploaded design.
//
// Admin-only.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

export default async function(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const { webpack_id } = body;

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    if (!webpack_id) return Response.json({ error: 'webpack_id required' }, { status: 400 });

    const svc = base44.asServiceRole;
    const pack = await svc.entities.WebPack.get(webpack_id);
    if (!pack) return Response.json({ error: 'WebPack not found' }, { status: 404 });

    const logs: string[] = [`[${new Date().toISOString()}] processWebPack started for "${pack.name}"`];

    // ── Phase 1: Vision AI generates pixel-perfect HTML from the design image ──
    await svc.entities.WebPack.update(webpack_id, { status: 'analyzing', error: null, logs: [...(pack.logs || []), ...logs] });
    logs.push(`[${new Date().toISOString()}] Sending design image to vision AI for pixel-perfect HTML generation...`);

    const prompt = `Recreate this website design mockup as a single, complete, production-quality HTML file with inline CSS. It must look EXACTLY like the image but function as a REAL desktop-optimized, PWA-ready website — not a static copy.

RULES:
1. Single HTML file, all CSS in <style>, no external CSS/JS. Minimal vanilla JS for nav toggle only.
2. EXACT colors, typography, layout, spacing, text — copy everything verbatim from the image.
3. HERO BACKGROUND: Use this EXACT URL as the hero's CSS background-image: "${pack.image_url}"
   Apply: background-image: linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)), url("${pack.image_url}");
   Hero MUST be min-height:100vh, background-size:cover, background-position:center, content vertically centered via flexbox.
4. For other images use these verified Unsplash URLs:
   Construction: https://images.unsplash.com/photo-1587582423116-ec07293f0395?w=1920&q=80
   Garage: https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80
5. Icons: inline SVG matching the design's style.
6. Nav: horizontal on desktop, logo left, links center, CTA right. Hamburger on mobile.

DESKTOP OPTIMIZATION (critical):
- max-width:1200px container centered for content sections. Hero spans full width/100vh.
- Sections: 80-120px vertical padding. No dead space, no gray where images should be.
- Multi-column grids on desktop (don't stack). Hover states on nav/buttons. scroll-behavior:smooth.

RESPONSIVE: Desktop 1024px+ full layout. Tablet 768-1023px fewer columns. Mobile <768px single column + hamburger.

PWA META (in <head>):
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#000000">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="manifest" href="manifest.json">
Plus <title>, <meta name="description">, Open Graph tags.

SEO: Semantic HTML5 (header/nav/main/section/footer), h1 for hero, h2 for sections, alt text on images, JSON-LD LocalBusiness schema.

Return ONLY raw HTML from <!DOCTYPE html> to </html>. No markdown fences, no explanations.`;

    const llmRes = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [pack.image_url],
      model: 'gemini_3_flash',
    });

    let html = typeof llmRes === 'string' ? llmRes : (llmRes as any)?.output || (llmRes as any)?.text || '';
    // Strip markdown code fences if the LLM wrapped the output
    html = String(html).replace(/^```html?\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    if (!html || (!html.toLowerCase().includes('<!doctype') && !html.toLowerCase().includes('<html'))) {
      throw new Error('Vision AI did not return valid HTML');
    }

    logs.push(`[${new Date().toISOString()}] Generated ${html.length} chars of pixel-perfect HTML`);

    // Upload the HTML as a file (entity fields can't hold large content)
    let html_file_url = '';
    try {
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const htmlFile = new File([htmlBlob], 'index.html', { type: 'text/html' });
      const upRes = await base44.integrations.Core.UploadFile({ file: htmlFile });
      html_file_url = (upRes as any)?.file_url || '';
      logs.push(`[${new Date().toISOString()}] Uploaded HTML to ${html_file_url}`);
    } catch (e) { logs.push(`[${new Date().toISOString()}] HTML file upload skipped: ${(e as any)?.message}`); }

    await svc.entities.WebPack.update(webpack_id, { status: 'generating', generated_html: html_file_url, logs: [...(pack.logs || []), ...logs] });

    // ── Phase 2: Deploy to Vercel as static HTML (direct upload, no build) ──
    logs.push(`[${new Date().toISOString()}] Deploying to Vercel as static site...`);
    await svc.entities.WebPack.update(webpack_id, { status: 'deploying', logs: [...(pack.logs || []), ...logs] });

    const vercelToken = Deno.env.get('VERCEL_TOKEN');
    const team = Deno.env.get('VERCEL_TEAM_ID');
    if (!vercelToken) throw new Error('VERCEL_TOKEN secret missing');
    const qs = team ? `?teamId=${team}` : '';
    const projectName = (pack.name || 'webpack').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 40);

    // Create or reuse the Vercel project
    let project: any;
    const createRes = await fetch(`https://api.vercel.com/v10/projects${qs}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: projectName }),
    });
    if (createRes.ok) project = await createRes.json();
    else if (createRes.status === 409) {
      const r = await fetch(`https://api.vercel.com/v9/projects/${projectName}${qs}`, { headers: { Authorization: `Bearer ${vercelToken}` } });
      if (!r.ok) throw new Error(`Vercel project lookup failed: ${r.status}`);
      project = await r.json();
    } else throw new Error(`Vercel create project failed: ${createRes.status} ${await createRes.text()}`);

    // Disable SSO protection so the site is publicly accessible
    try {
      await fetch(`https://api.vercel.com/v9/projects/${project.id}${qs}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssoProtection: null }),
      });
    } catch { /* best effort */ }

    // Build the public URL
    let baseUrl = `https://${projectName}.vercel.app`;
    if (team) {
      try {
        const teamRes = await fetch(`https://api.vercel.com/v2/teams/${team}`, { headers: { Authorization: `Bearer ${vercelToken}` } });
        if (teamRes.ok) { const t = await teamRes.json(); if (t.slug) baseUrl = `https://${projectName}-${t.slug}.vercel.app`; }
      } catch { /* fall back */ }
    }

    // Direct file upload — static HTML + PWA manifest + service worker
    function b64(s: string): string { return btoa(unescape(encodeURIComponent(String(s)))); }

    // Derive site name + theme color for PWA manifest
    const siteName = (pack.name || 'Web Pack').slice(0, 50);
    const themeColor = '#000000';
    const manifest = JSON.stringify({
      name: siteName,
      short_name: siteName.slice(0, 12),
      description: siteName,
      start_url: '/',
      display: 'standalone',
      background_color: themeColor,
      theme_color: themeColor,
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    });
    // Minimal service worker — offline caching for the static shell
    const sw = `const CACHE='webpack-v1';self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/'])));self.skipWaiting();});self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res;}).catch(()=>caches.match('/'))));});`;

    const fileList = [
      { file: 'index.html', data: b64(html), encoding: 'base64' },
      { file: 'manifest.json', data: b64(manifest), encoding: 'base64' },
      { file: 'sw.js', data: b64(sw), encoding: 'base64' },
    ];
    const deployRes = await fetch(`https://api.vercel.com/v13/deployments${qs}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: projectName, files: fileList, target: 'production', projectSettings: { framework: null } }),
    });
    if (!deployRes.ok) throw new Error(`Vercel deploy failed: ${deployRes.status} ${await deployRes.text()}`);
    const deployment = await deployRes.json();
    const vercelUrl = deployment.url ? `https://${deployment.url}` : baseUrl;

    logs.push(`[${new Date().toISOString()}] Deployed to ${vercelUrl}`);

    // ── Phase 3: Update the WebPack record ──
    await svc.entities.WebPack.update(webpack_id, {
      status: 'deployed',
      vercel_url: vercelUrl,
      vercel_project_id: project.id,
      error: null,
      logs: [...(pack.logs || []), ...logs],
    });

    // Record a receipt
    try {
      await svc.entities.Receipt.create({
        agent_or_workflow: 'processWebPack',
        action: 'process_webpack',
        entity_type: 'WebPack',
        entity_id: webpack_id,
        inputs: JSON.stringify({ webpack_id, name: pack.name }).slice(0, 1000),
        outputs: JSON.stringify({ vercel_url: vercelUrl, vercel_project_id: project.id }).slice(0, 1000),
        status: 'success',
        evidence: `Deployed web pack "${pack.name}" to ${vercelUrl}`,
      });
    } catch { /* non-fatal */ }

    return Response.json({
      ok: true,
      webpack_id,
      vercel_url: vercelUrl,
      vercel_project_id: project.id,
      logs,
    });
  } catch (error) {
    console.error('processWebPack error', error?.message || error);
    // Mark the WebPack as failed
    if (webpack_id) {
      try {
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.entities.WebPack.update(webpack_id, {
          status: 'failed',
          error: error?.message || 'Unknown error',
        }).catch(() => {});
      } catch { /* non-fatal */ }
    }
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}