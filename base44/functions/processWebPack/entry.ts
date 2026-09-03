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

    const prompt = `You are a pixel-perfect senior frontend engineer. Analyze the provided design mockup image and generate a complete, self-contained HTML file with inline CSS that reproduces the design EXACTLY as shown — pixel-perfect.

Critical requirements:
1. Output a SINGLE complete HTML document. All CSS must be inline inside a <style> tag. No external files, no JavaScript frameworks.
2. Match the design PIXEL-PERFECT — extract and use the exact colors (hex), font sizes, font weights, spacing, padding, margins, border radii, shadows, and layout from the image.
3. Use CSS Grid and Flexbox for layout. Match the exact grid structure and alignment.
4. Make it fully responsive — use media queries so it looks great on mobile, tablet, and desktop while preserving the design's intent.
5. Use system fonts (system-ui, -apple-system, "Segoe UI", Roboto, sans-serif) unless the design clearly uses a specific recognizable font.
6. Include ALL text content exactly as shown in the design — headings, paragraphs, buttons, labels, navigation items, footer text. Do not paraphrase or skip anything.
7. For any images shown in the design, use high-quality placeholder images from Unsplash with relevant keywords (format: https://images.unsplash.com/photo-XXXXX?w=800&q=80). For icons, use inline SVG.
8. Include proper SEO meta tags: <title>, <meta name="description">, Open Graph tags, and viewport.
9. If the design has a navigation bar, make the nav links functional anchor links to sections on the same page.
10. If the design has buttons, style them exactly as shown and link them to relevant sections.

Return ONLY the raw HTML code. Start with <!DOCTYPE html> and end with </html>. Do NOT include any explanation, markdown formatting, or code fences around the output.`;

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

    // Direct file upload — static HTML, no build step needed
    function b64(s: string): string { return btoa(unescape(encodeURIComponent(String(s)))); }
    const fileList = [{ file: 'index.html', data: b64(html), encoding: 'base64' }];
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