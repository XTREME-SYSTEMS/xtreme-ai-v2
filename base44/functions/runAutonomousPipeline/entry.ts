import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

// runAutonomousPipeline — The autonomous orchestrator.
// Chains every pipeline step for a session in a single call:
//   1. Verify/run skip traces for all key onboarding answers
//   2. Lock the strategy (deterministic fallback if LLM credits exhausted)
//   3. Generate 3 versions of web packs internally (deterministic HTML — no LLM)
//   4. Auto-approve the best version
//   5. Create a DeployedSite record (ready for Vercel deploy)
//
// This makes the system FULLY AUTONOMOUS: from onboarding to deployment,
// no manual button clicks, no external ChatGPT, no integration credits needed.
// The only credit-dependent step is the actual Vercel deploy (uses VERCEL_TOKEN,
// not integration credits), which is triggered separately by deployAutoBuildSite.
//
// Admin-only. Returns a full step-by-step status report.

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { session_id, auto_deploy } = body;
    if (!session_id) return Response.json({ error: 'session_id is required.' }, { status: 400 });

    const svc = base44.asServiceRole;
    const logs: string[] = [`[${new Date().toISOString()}] Autonomous pipeline START for session ${session_id}`];
    const steps: any = {};

    // ─── STEP 1: Load session ─────────────────────────────
    const sessionPage = await svc.entities.OnboardingSession.filter({ session_id }, { limit: 1 });
    const session = (sessionPage.items || sessionPage)[0];
    if (!session) return Response.json({ error: 'Session not found.' }, { status: 404 });
    logs.push(`[1] Session loaded: ${session.project_name || 'Unnamed'} (status=${session.status})`);
    steps.session = { status: 'ok', project_name: session.project_name, current_status: session.status };

    const answers = session.answers || {};
    const getContext = () => answers;
    const traceKeys = ['business_name', 'owner_name', 'industry', 'location'];

    // ─── STEP 2: Verify/run skip traces ────────────────────
    logs.push(`[2] Checking skip traces...`);
    const existingTraces = await svc.entities.SkipTraceReport.filter({ session_id }, { sort: '-created_date', limit: 50 });
    const traceMap = new Map();
    for (const t of (existingTraces.items || [])) {
      if (!traceMap.has(t.question_key) || t.status === 'complete') traceMap.set(t.question_key, t);
    }

    let tracesComplete = 0;
    let tracesFailed = 0;
    for (const key of traceKeys) {
      const answer = answers[key]?.answer_text;
      if (!answer) continue;
      const existing = traceMap.get(key);
      if (existing && (existing.status === 'complete' || existing.status === 'failed')) {
        if (existing.status === 'complete') tracesComplete++;
        else tracesFailed++;
        continue;
      }
      // Need to run this trace — call skipTraceAnswer internally
      logs.push(`[2] Running trace for ${key}: "${answer.slice(0, 40)}"`);
      try {
        const traceRes = await base44.functions.invoke('skipTraceAnswer', {
          session_id, question_key: key, answer_text: answer, context: getContext(),
        });
        const report = traceRes?.data?.report || traceRes?.report;
        if (report?.status === 'complete') tracesComplete++;
        else tracesFailed++;
      } catch (e: any) {
        logs.push(`[2] Trace ${key} failed: ${e.message}`);
        tracesFailed++;
      }
    }
    logs.push(`[2] Traces: ${tracesComplete} complete, ${tracesFailed} failed`);
    steps.skip_trace = { status: tracesComplete > 0 ? 'ok' : 'failed', complete: tracesComplete, failed: tracesFailed };

    // ─── STEP 3: Lock strategy ────────────────────────────
    logs.push(`[3] Locking strategy...`);
    let strategy = null;
    if (session.locked_strategy_id) {
      try { strategy = await svc.entities.LockedStrategy.get(session.locked_strategy_id); } catch {}
    }
    if (!strategy || !session.locked_strategy_id) {
      try {
        const stratRes = await base44.functions.invoke('lockStrategy', { session_id });
        strategy = stratRes?.data?.strategy || stratRes?.strategy;
        logs.push(`[3] Strategy locked: ${strategy?.id || 'unknown'}`);
      } catch (e: any) {
        logs.push(`[3] Strategy lock failed: ${e.message}`);
        // Build deterministic strategy inline as ultimate fallback
        strategy = await buildDeterministicStrategyInline(svc, session, answers);
        logs.push(`[3] Deterministic strategy built inline: ${strategy?.id || 'unknown'}`);
      }
    } else {
      logs.push(`[3] Strategy already locked: ${strategy.id}`);
    }
    steps.strategy = { status: strategy ? 'ok' : 'failed', strategy_id: strategy?.id };

    // ─── STEP 4: Generate 3 web pack versions ─────────────
    logs.push(`[4] Generating 3 web pack versions...`);
    const groupId = `auto-${session_id}-${Date.now()}`;
    const packs = [];
    const designs = ['modern-dark', 'clean-light', 'bold-gradient'];
    for (let v = 0; v < 3; v++) {
      const html = generateDeterministicWebsite(session, answers, strategy, designs[v], v + 1);
      try {
        const pack = await svc.entities.GptPack.create({
          name: `${session.project_name || 'Business'} — Website v${v + 1}`,
          kind: 'web_pack',
          preview_html: html,
          brand_tokens: JSON.stringify({ design: designs[v], accent: '#0047FF' }),
          source: 'autonomous_pipeline',
          submitted_by_label: 'Autonomous Engine',
          session_id,
          user_email: session.user_email,
          version_number: v + 1,
          version_group_id: groupId,
          status: 'pending',
        });
        packs.push(pack);
        logs.push(`[4] Pack v${v + 1} created: ${pack.id} (${designs[v]})`);
      } catch (e: any) {
        logs.push(`[4] Pack v${v + 1} failed: ${e.message}`);
      }
    }
    steps.generate_packs = { status: packs.length > 0 ? 'ok' : 'failed', pack_ids: packs.map(p => p.id), count: packs.length };

    // ─── STEP 5: Auto-approve best version (v1) ───────────
    logs.push(`[5] Auto-approving best version...`);
    let approvedPack = null;
    if (packs.length > 0) {
      const best = packs[0]; // v1 = modern-dark (primary design)
      try {
        await svc.entities.GptPack.update(best.id, {
          status: 'approved',
          approved_by: 'autonomous@autobuilder',
          approved_at: new Date().toISOString(),
          review_notes: 'Auto-approved by autonomous pipeline',
        });
        approvedPack = best;
        logs.push(`[5] Approved pack: ${best.id}`);
      } catch (e: any) { logs.push(`[5] Approval failed: ${e.message}`); }
    }
    steps.approve = { status: approvedPack ? 'ok' : 'failed', pack_id: approvedPack?.id };

    // ─── STEP 6: Update session status ────────────────────
    logs.push(`[6] Updating session to pack_approved...`);
    try {
      await svc.entities.OnboardingSession.update(session.id, {
        status: 'pack_approved',
        approved_pack_id: approvedPack?.id || null,
      });
      logs.push(`[6] Session updated`);
    } catch (e: any) { logs.push(`[6] Session update failed: ${e.message}`); }
    steps.session_update = { status: 'ok' };

    // ─── STEP 7: Create DeployedSite record ──────────────
    logs.push(`[7] Creating DeployedSite record...`);
    let deployedSite = null;
    if (approvedPack) {
      try {
        deployedSite = await svc.entities.DeployedSite.create({
          pack_id: approvedPack.id,
          session_id,
          user_email: session.user_email,
          business_name: session.project_name || answers.business_name?.answer_text || 'Unknown',
          city: answers.location?.answer_text || '',
          niche: answers.industry?.answer_text || '',
          status: 'pending',
        });
        logs.push(`[7] DeployedSite created: ${deployedSite.id}`);
      } catch (e: any) { logs.push(`[7] DeployedSite creation failed: ${e.message}`); }
    }
    steps.deploy_record = { status: deployedSite ? 'ok' : 'failed', site_id: deployedSite?.id };

    // ─── STEP 8: Optional auto-deploy to Vercel ───────────
    if (auto_deploy && deployedSite) {
      logs.push(`[8] Auto-deploy requested — triggering deployAutoBuildSite...`);
      try {
        // Create a minimal AutoBuild record for the deploy function
        const autoBuild = await svc.entities.AutoBuild.create({
          business_name: session.project_name || answers.business_name?.answer_text || 'Unknown',
          industry: answers.industry?.answer_text || '',
          city: answers.location?.answer_text || '',
          status: 'deploying',
          current_step: 'deploy',
          architecture: { type: 'static_site', pages: ['index.html'] },
          profile: { phone: session.client_phone || '(555) 123-4567' },
          logs: [`Autonomous pipeline deploy for session ${session_id}`],
        });
        const deployRes = await base44.functions.invoke('deployAutoBuildSite', { autobuild_id: autoBuild.id });
        const liveUrl = deployRes?.data?.live_url || deployRes?.live_url;
        if (liveUrl) {
          await svc.entities.DeployedSite.update(deployedSite.id, {
            status: 'deployed',
            vercel_url: liveUrl,
            deployed_at: new Date().toISOString(),
          });
          await svc.entities.OnboardingSession.update(session.id, { status: 'deployed', deployed_site_id: deployedSite.id });
          logs.push(`[8] Deployed: ${liveUrl}`);
          steps.deploy = { status: 'ok', live_url: liveUrl };
        } else {
          logs.push(`[8] Deploy returned no URL`);
          steps.deploy = { status: 'failed', error: 'No URL returned' };
        }
      } catch (e: any) {
        logs.push(`[8] Deploy failed: ${e.message}`);
        steps.deploy = { status: 'failed', error: e.message };
      }
    } else {
      steps.deploy = { status: 'skipped', note: 'Set auto_deploy=true to deploy to Vercel' };
    }

    // ─── STEP 9: Sync to Supabase ──────────────────────────
    logs.push(`[9] Syncing to Supabase...`);
    try {
      const projectRef = await secrets.get('SUPABASE_PROJECT_REF');
      if (!projectRef) {
        logs.push(`[9] Supabase sync skipped: SUPABASE_PROJECT_REF not set`);
        steps.supabase_sync = { status: 'skipped', note: 'SUPABASE_PROJECT_REF not configured' };
      } else {
        const syncRes = await base44.functions.invoke('syncToSupabase', { mode: 'sync', project_ref: projectRef });
        const syncData = syncRes?.data || syncRes;
        if (syncData?.ok || syncData?.synced) {
          logs.push(`[9] Supabase sync complete: ${syncData.synced || syncData.records_synced || 'ok'}`);
          steps.supabase_sync = { status: 'ok' };
        } else {
          logs.push(`[9] Supabase sync skipped: ${syncData?.error || 'no data'}`);
          steps.supabase_sync = { status: 'skipped', note: syncData?.error || 'Not configured' };
        }
      }
    } catch (e: any) {
      logs.push(`[9] Supabase sync failed: ${e.message}`);
      steps.supabase_sync = { status: 'failed', error: e.message };
    }

    logs.push(`[${new Date().toISOString()}] Autonomous pipeline COMPLETE`);

    return Response.json({
      ok: true,
      session_id,
      steps,
      logs,
      summary: {
        skip_traces: `${tracesComplete} complete, ${tracesFailed} failed`,
        strategy_locked: !!strategy,
        packs_generated: packs.length,
        pack_approved: !!approvedPack,
        deployed: steps.deploy?.status === 'ok',
        live_url: steps.deploy?.live_url || null,
        supabase_synced: steps.supabase_sync?.status === 'ok',
      },
    });
  } catch (error: any) {
    console.error('runAutonomousPipeline error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ─── Deterministic strategy fallback (inline, no LLM) ───────
async function buildDeterministicStrategyInline(svc: any, session: any, answers: any) {
  const businessName = answers.business_name?.answer_text || session.project_name || 'Your Business';
  const industry = answers.industry?.answer_text || 'services';
  const location = answers.location?.answer_text || 'your area';
  const ownerName = answers.owner_name?.answer_text || '';

  const strategy = {
    strategy_summary: `${businessName} will dominate the ${industry} market in ${location} through a modern web presence and superior customer experience.`,
    positioning: `Premium ${industry} provider in ${location}, positioned as the modern, reliable alternative.`,
    target_market: `Property owners and businesses in ${location} seeking ${industry} services.`,
    competitive_advantage: 'Modern digital presence, streamlined booking, transparent pricing, superior service.',
    pricing_model: 'Competitive market pricing with tiered service packages.',
    growth_channels: ['SEO', 'Google Business Profile', 'Paid search', 'Social media', 'Referrals'],
    risk_factors: ['Seasonal demand', 'Economic sensitivity'],
    website_brief: `Build a modern website for ${businessName} in ${location}. Industry: ${industry}. Include hero, services, about, process, testimonials, FAQ, contact. Mobile-first, fast loading, clear CTAs.`,
  };

  return await svc.entities.LockedStrategy.create({
    session_id: session.session_id,
    user_email: session.user_email,
    ...strategy,
    approved: false,
    intelligence_summary: { competitor_count: 0, market_trend: 'active', key_findings: [] },
  });
}

// ─── Deterministic website HTML generator (3 designs) ──────
function generateDeterministicWebsite(session: any, answers: any, strategy: any, design: string, version: number): string {
  const bizName = answers.business_name?.answer_text || session.project_name || 'Your Business';
  const industry = answers.industry?.answer_text || 'Services';
  const location = answers.location?.answer_text || 'Your Area';
  const ownerName = answers.owner_name?.answer_text || '';
  const services = answers.services?.answer_text || `${industry} services`;
  const phone = session.client_phone || '(555) 123-4567';

  const themes: Record<string, any> = {
    'modern-dark': { bg: '#0a0a0a', card: '#141414', text: '#ffffff', accent: '#0047FF', muted: '#a0a0a0', border: '#222' },
    'clean-light': { bg: '#ffffff', card: '#f8f9fa', text: '#1a1a1a', accent: '#0047FF', muted: '#666', border: '#e0e0e0' },
    'bold-gradient': { bg: '#0f0f23', card: '#1a1a2e', text: '#ffffff', accent: '#0047FF', muted: '#8888aa', border: '#2a2a4a' },
  };
  const t = themes[design] || themes['modern-dark'];

  const serviceList = services.split(',').map((s: string) => s.trim()).filter(Boolean).slice(0, 6);
  const serviceCards = (serviceList.length > 0 ? serviceList : [`${industry} Service 1`, `${industry} Service 2`, `${industry} Service 3`, `${industry} Service 4`])
    .map((s: string) => `<div style="background:${t.card};border:1px solid ${t.border};border-radius:12px;padding:24px;text-align:center"><div style="font-size:32px;margin-bottom:12px;color:${t.accent}">★</div><h3 style="font-size:18px;margin-bottom:8px">${s}</h3></div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${bizName} | ${location} ${industry} Experts</title>
<meta name="description" content="${bizName} — premier ${industry} services in ${location}.">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:${t.bg};color:${t.text};line-height:1.6}
.container{max-width:1200px;margin:0 auto;padding:0 24px}
header{position:sticky;top:0;z-index:100;background:${t.bg}ee;backdrop-filter:blur(10px);border-bottom:1px solid ${t.border};padding:16px 0}
.nav{display:flex;align-items:center;justify-content:space-between}
.logo{font-weight:800;font-size:20px}
.nav-cta{background:${t.accent};color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px}
.hero{text-align:center;padding:100px 0}
.hero h1{font-size:48px;font-weight:800;margin-bottom:16px}
.hero h1 span{color:${t.accent}}
.hero p{font-size:20px;color:${t.muted};margin-bottom:32px;max-width:600px;margin-left:auto;margin-right:auto}
.btn{background:${t.accent};color:#fff;padding:16px 32px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block}
section{padding:80px 0}
.section-title{font-size:36px;font-weight:800;text-align:center;margin-bottom:48px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px}
.about{max-width:800px;margin:0 auto;text-align:center;color:${t.muted}}
.contact{text-align:center;padding:80px 0}
.contact a{color:${t.accent};font-size:24px;font-weight:700;text-decoration:none}
footer{border-top:1px solid ${t.border};padding:40px 0;text-align:center;color:${t.muted};font-size:14px}
@media(max-width:768px){.hero h1{font-size:32px}.section-title{font-size:28px}}
</style>
</head>
<body>
<header><div class="container"><div class="nav">
<div class="logo">${bizName}</div>
<a href="tel:${phone.replace(/[^0-9]/g,'')}" class="nav-cta">Call ${phone}</a>
</div></div></header>

<section class="hero"><div class="container">
<h1>${location}'s Premier <span>${industry}</span> Experts</h1>
<p>Professional ${industry} services in ${location} and surrounding areas. Licensed, insured, and trusted by the community.</p>
<a href="tel:${phone.replace(/[^0-9]/g,'')}" class="btn">Get a Free Quote</a>
</div></section>

<section><div class="container">
<h2 class="section-title">Our Services</h2>
<div class="grid">${serviceCards}</div>
</div></section>

<section><div class="container">
<h2 class="section-title">About ${bizName}</h2>
<p class="about">${strategy?.strategy_summary || `We are ${location}'s trusted ${industry} professionals.`} ${ownerName ? `Founded by ${ownerName}.` : ''} We pride ourselves on quality workmanship, transparent pricing, and exceptional customer service.</p>
</div></section>

<section class="contact"><div class="container">
<h2 class="section-title">Get In Touch</h2>
<p style="color:${t.muted};margin-bottom:24px">Call us today for a free consultation</p>
<a href="tel:${phone.replace(/[^0-9]/g,'')}">${phone}</a>
</div></section>

<footer><div class="container">© ${new Date().getFullYear()} ${bizName}. All rights reserved. Licensed in ${location}.</div></footer>
</body>
</html>`;
}