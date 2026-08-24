import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';
import { generateAutoBuildApp } from '../../shared/autoBuildSiteGenerator.ts';
import { slugify, provisionGithub, provisionVercel } from '../../shared/provisioning.ts';

// deployAutoBuildSite — takes an AutoBuild record, generates a REAL React app
// from its specs (architecture, data_model, ui_system), pushes to GitHub, deploys
// to Vercel with deployment protection disabled, verifies the site is live, and
// returns the URL. This is the spec-driven deployment path that replaces the
// generic template generator.
//
// Admin-only.

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { autobuild_id } = body;
    if (!autobuild_id) return Response.json({ error: 'autobuild_id required' }, { status: 400 });

    const svc = base44.asServiceRole;
    const build = await svc.entities.AutoBuild.get(autobuild_id);
    if (!build) return Response.json({ error: 'AutoBuild not found' }, { status: 404 });

    const logs: string[] = [`[${new Date().toISOString()}] deployAutoBuildSite started for ${build.business_name}`];

    // Check that specs exist
    if (!build.architecture) {
      return Response.json({ error: 'AutoBuild has no architecture spec. Run the architecture step first.' }, { status: 400 });
    }

    // Phase 1: Generate the React app from specs
    logs.push(`[${new Date().toISOString()}] Generating React app from AutoBuild specs...`);
    const files = generateAutoBuildApp(build);
    logs.push(`[${new Date().toISOString()}] Generated ${Object.keys(files).length} files`);

    // Phase 2: Create or reuse a Market record for provisioning
    const slug = slugify(build.business_name);
    let market;
    const existingMarkets = await svc.entities.Market.filter({ slug }).catch(() => []);
    if (existingMarkets && existingMarkets.length > 0) {
      market = existingMarkets[0];
      logs.push(`[${new Date().toISOString()}] Reusing Market record: ${market.id}`);
    } else {
      market = await svc.entities.Market.create({
        city: 'National',
        state: 'US',
        slug,
        public_business_name: build.business_name,
        brand_name: build.business_name,
        phone: build.profile?.phone || '(555) 123-4567',
        industry: build.industry || '',
        status: 'provisioning',
      }).catch(() => null);
      if (market) logs.push(`[${new Date().toISOString()}] Created Market record: ${market.id}`);
    }

    // Phase 3: Check for existing provisioning record
    let record;
    const existingRecords = await svc.entities.ProvisioningRecord.filter({ market_id: market?.id || slug }).catch(() => []);
    if (existingRecords && existingRecords.length > 0) {
      record = existingRecords[0];
    }

    // Phase 4: Push to GitHub
    logs.push(`[${new Date().toISOString()}] Pushing to GitHub...`);
    let githubRepo = record?.github_repo || '';
    try {
      const gh = await provisionGithub(base44, market || { slug, city: 'National', state: 'US', public_business_name: build.business_name }, files, githubRepo || undefined);
      githubRepo = gh.repo;
      logs.push(`[${new Date().toISOString()}] GitHub: ${gh.repo}`);
    } catch (e: any) {
      logs.push(`[${new Date().toISOString()}] GitHub error: ${e.message}`);
      return Response.json({ error: `GitHub provisioning failed: ${e.message}`, logs }, { status: 500 });
    }

    // Phase 5: Deploy to Vercel (with deployment protection disabled)
    logs.push(`[${new Date().toISOString()}] Deploying to Vercel...`);
    let vercelUrl = '';
    let vercelProjectId = '';
    let deployMethod = '';
    try {
      const vercel = await provisionVercel(market || { slug, city: 'National', state: 'US' }, githubRepo, files);
      vercelUrl = vercel.url;
      vercelProjectId = vercel.project_id;
      deployMethod = vercel.deploy_method || 'unknown';
      logs.push(`[${new Date().toISOString()}] Vercel deployed: ${vercelUrl} (method: ${deployMethod})`);
    } catch (e: any) {
      logs.push(`[${new Date().toISOString()}] Vercel error: ${e.message}`);
      return Response.json({ error: `Vercel deployment failed: ${e.message}`, github_repo: githubRepo, logs }, { status: 500 });
    }

    // Phase 6: Update the AutoBuild record
    await svc.entities.AutoBuild.update(autobuild_id, {
      deployment: {
        platform: 'vercel',
        live_url: vercelUrl,
        status: 'deployed',
        deployed_at: new Date().toISOString(),
        github_repo: githubRepo,
        deploy_method: deployMethod,
      },
      status: 'complete',
      current_step: 'complete',
      logs: [...(build.logs || []), ...logs],
    });

    // Phase 7: Update Market record
    if (market) {
      await svc.entities.Market.update(market.id, {
        status: 'published',
        domain: vercelUrl.replace(/^https?:\/\//, ''),
      }).catch(() => {});
    }

    // Phase 8: Verify the deployment — poll until the Vercel build completes
    logs.push(`[${new Date().toISOString()}] Verifying deployment at ${vercelUrl}...`);
    let verified = false;
    const maxAttempts = 8;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, attempt === 1 ? 5000 : 10000));
      try {
        const checkRes = await fetch(vercelUrl, { signal: AbortSignal.timeout(15000), redirect: 'follow' });
        const text = await checkRes.text();
        const isVercelLogin = text.includes('Vercel') && text.includes('Authentication');
        const hasContent = text.length > 500 && !isVercelLogin;
        if (checkRes.ok && hasContent) {
          verified = true;
          logs.push(`[${new Date().toISOString()}] Verification: HTTP ${checkRes.status} ✓ (attempt ${attempt})`);
          break;
        }
        logs.push(`[${new Date().toISOString()}] Verification attempt ${attempt}: HTTP ${checkRes.status} ${isVercelLogin ? '(auth wall)' : '(building...)'}`);
      } catch (e: any) {
        logs.push(`[${new Date().toISOString()}] Verification attempt ${attempt} failed: ${e.message}`);
      }
    }

    // Record a receipt
    try {
      await svc.entities.Receipt.create({
        agent_or_workflow: 'deployAutoBuildSite',
        action: 'deploy_autobuild_site',
        entity_type: 'AutoBuild',
        entity_id: autobuild_id,
        inputs: JSON.stringify({ autobuild_id }).slice(0, 1000),
        outputs: JSON.stringify({ vercel_url: vercelUrl, github_repo: githubRepo, verified, deploy_method: deployMethod }).slice(0, 1000),
        status: verified ? 'success' : 'warning',
        evidence: `Deployed ${build.business_name} to ${vercelUrl}`,
      });
    } catch {}

    return Response.json({
      ok: true,
      autobuild_id,
      live_url: vercelUrl,
      github_repo: githubRepo,
      deploy_method: deployMethod,
      verified,
      files_generated: Object.keys(files).length,
      logs,
    });
  } catch (error) {
    console.error('deployAutoBuildSite error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}