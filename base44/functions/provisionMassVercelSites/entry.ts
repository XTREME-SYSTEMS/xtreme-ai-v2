// provisionMassVercelSites — deploys all approved MassBuildSite records
// in a batch to Vercel as static HTML sites. Each site gets its own Vercel
// project + production deployment. Returns a summary of deployed/failed counts.
//
// Admin-only.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

function b64(s: string): string { return btoa(unescape(encodeURIComponent(String(s)))); }

export default async function(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const { mass_build_id, site_ids } = body;

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });
    if (!mass_build_id) return Response.json({ error: 'mass_build_id required' }, { status: 400 });

    const svc = base44.asServiceRole;
    const project = await svc.entities.MassBuildProject.get(mass_build_id);
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

    // Get approved sites (or specific site_ids if provided)
    const query = site_ids?.length
      ? { mass_build_id, status: 'approved' }
      : { mass_build_id, status: 'approved' };
    let sites = await svc.entities.MassBuildSite.filter(query);
    if (site_ids?.length) sites = sites.filter((s: any) => site_ids.includes(s.id));

    const logs: string[] = [`[${new Date().toISOString()}] provisionMassVercelSites: ${sites.length} sites`];
    await svc.entities.MassBuildProject.update(mass_build_id, { status: 'deploying', logs: [...(project.logs || []), ...logs] });

    const vercelToken = Deno.env.get('VERCEL_TOKEN');
    const team = Deno.env.get('VERCEL_TEAM_ID');
    if (!vercelToken) return Response.json({ error: 'VERCEL_TOKEN missing' }, { status: 500 });
    const qs = team ? `?teamId=${team}` : '';

    let deployed = 0;
    let failed = 0;

    // Deploy in parallel batches of 5
    const batchSize = 5;
    for (let i = 0; i < sites.length; i += batchSize) {
      const batch = sites.slice(i, i + batchSize);
      await Promise.all(batch.map(async (site: any) => {
        try {
          if (!site.generated_html_url) throw new Error('No generated HTML');

          // Fetch the generated HTML
          const htmlRes = await fetch(site.generated_html_url);
          if (!htmlRes.ok) throw new Error(`Failed to fetch HTML: ${htmlRes.status}`);
          const html = await htmlRes.text();

          const projectName = site.website_name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 40) + '-' + site.city.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 20);

          // Create or reuse Vercel project
          let projectId = site.vercel_project_id;
          if (!projectId) {
            const createRes = await fetch(`https://api.vercel.com/v10/projects${qs}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: projectName }),
            });
            if (createRes.ok) { const p = await createRes.json(); projectId = p.id; }
            else if (createRes.status === 409) {
              const r = await fetch(`https://api.vercel.com/v9/projects/${projectName}${qs}`, { headers: { Authorization: `Bearer ${vercelToken}` } });
              if (r.ok) { const p = await r.json(); projectId = p.id; }
            }
          }

          // Disable SSO
          if (projectId) {
            await fetch(`https://api.vercel.com/v9/projects/${projectId}${qs}`, {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ ssoProtection: null }),
            }).catch(() => {});
          }

          // PWA manifest + service worker
          const siteName = site.website_name.slice(0, 50);
          const manifest = JSON.stringify({
            name: siteName, short_name: siteName.slice(0, 12), start_url: '/',
            display: 'standalone', background_color: site.background_color || '#000000',
            theme_color: site.background_color || '#000000',
            icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }]
          });
          const sw = `const CACHE='mass-v1';self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/'])));self.skipWaiting()});self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const c=res.clone();caches.open(CACHE).then(ca=>ca.put(e.request,c));return res}).catch(()=>caches.match('/'))))})`;

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
          if (!deployRes.ok) throw new Error(`Deploy failed: ${deployRes.status} ${await deployRes.text()}`);
          const deployment = await deployRes.json();
          const vercelUrl = deployment.url ? `https://${deployment.url}` : '';

          await svc.entities.MassBuildSite.update(site.id, {
            status: 'deployed',
            vercel_url: vercelUrl,
            vercel_project_id: projectId,
            logs: [...(site.logs || []), `[${new Date().toISOString()}] Deployed to ${vercelUrl}`]
          });
          deployed++;
        } catch (e) {
          await svc.entities.MassBuildSite.update(site.id, { status: 'failed', error: (e as any)?.message }).catch(() => {});
          logs.push(`Deploy failed for ${site.website_name}: ${(e as any)?.message}`);
          failed++;
        }
      }));
    }

    await svc.entities.MassBuildProject.update(mass_build_id, {
      status: 'complete',
      deployed_count: (project.deployed_count || 0) + deployed,
      logs: [...(project.logs || []), ...logs, `[${new Date().toISOString()}] Deploy complete: ${deployed} deployed, ${failed} failed`]
    });

    return Response.json({ ok: true, deployed, failed, total: sites.length });
  } catch (error) {
    console.error('provisionMassVercelSites error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}