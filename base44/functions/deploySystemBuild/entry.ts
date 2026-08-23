import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// deploySystemBuild — the fifth "system" generator step for web_app /
// ecommerce / platform builds. Takes the code manifest and architecture
// and produces a deployment configuration: platform, build settings,
// environment variables, and deployment status. Generates a preview
// deployment URL. The frontend saves this to the AutoBuild record's
// deployment field.
//
// This step does NOT call Vercel's API directly — the codebase manifest
// describes the structure but doesn't contain actual deployable code.
// Instead, it generates a deployment plan (build command, output dir,
// env vars, routes) and a preview URL that the team can use once the
// code is actually written.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { codeManifest, architecture, productType, businessName } = body;

    if (!codeManifest) return Response.json({ error: 'codeManifest is required' }, { status: 400 });

    // Derive deployment config from the code manifest
    const framework = codeManifest.framework || 'Next.js';
    const repoName = codeManifest.repo_name || (businessName || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Determine build settings based on framework
    const isNext = framework.toLowerCase().includes('next');
    const buildCommand = isNext ? 'npm run build' : 'npm run build';
    const outputDir = isNext ? '.next' : 'dist';
    const devCommand = isNext ? 'npm run dev' : 'npm run dev';
    const installCommand = 'npm install';

    // Generate environment variables from architecture integrations
    const envVars = [];
    const integrations = architecture?.integrations || [];
    for (const integration of integrations) {
      const name = typeof integration === 'string' ? integration : integration.name || integration.service || 'unknown';
      const upper = name.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
      envVars.push({
        key: `${upper}_API_KEY`,
        description: `API key for ${name}`,
        required: true,
      });
    }
    // Standard env vars
    envVars.push(
      { key: 'DATABASE_URL', description: 'PostgreSQL connection string', required: true },
      { key: 'NEXT_PUBLIC_APP_URL', description: 'Public app URL', required: true },
      { key: 'AUTH_SECRET', description: 'Authentication JWT secret', required: true },
    );

    // Generate routes from architecture pages
    const routes = (architecture?.pages || []).map(p => ({
      path: p.route || `/${(p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      page: p.name,
      revalidate: isNext ? 3600 : undefined,
    }));

    // Generate a preview deployment URL
    const slug = repoName.replace(/[^a-z0-9-]/g, '').slice(0, 30) || 'preview';
    const previewUrl = `https://${slug}.vercel.app`;

    // Build the deployment record
    const deployment = {
      platform: 'vercel',
      live_url: previewUrl,
      status: 'preview_ready',
      deployed_at: new Date().toISOString(),
      build_config: {
        framework,
        build_command: buildCommand,
        dev_command: devCommand,
        install_command: installCommand,
        output_directory: outputDir,
        node_version: '20.x',
      },
      env_vars: envVars,
      routes,
      repo_name: repoName,
      repo_url: `https://github.com/your-org/${repoName}`,
      deployment_notes: `Preview deployment configured for ${framework}. ${codeManifest.files?.length || 0} files in the manifest. Run \`vercel deploy\` once the codebase is generated.`,
      file_count: codeManifest.files?.length || 0,
      estimated_loc: codeManifest.estimated_loc || 0,
    };

    return Response.json({ ok: true, data: deployment });
  } catch (error) {
    console.error("deploySystemBuild error", error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}