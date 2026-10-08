import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// generatePipelineSummary — Step 4 of the deterministic pipeline.
// Aggregates onboarding answers + all skip-trace reports + locked strategy
// into a single structured text summary that can be shared with ChatGPT.
// ChatGPT uses this summary to produce 3 versions of each brand asset.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to generate a summary.' }, { status: 401 });

    const body = await req.json();
    const { session_id } = body;
    if (!session_id) return Response.json({ error: 'session_id is required.' }, { status: 400 });

    const session = await base44.entities.OnboardingSession.get(session_id);
    if (!session) return Response.json({ error: 'Session not found.' }, { status: 404 });
    if (session.user_email !== user.email && user.role !== 'admin') return Response.json({ error: 'Access denied.' }, { status: 403 });

    // Fetch all skip-trace reports for this session
    const tracePage = await base44.entities.SkipTraceReport.filter(
      { session_id }, { sort: '-created_date', limit: 50 }
    );
    const traces = tracePage.items || [];

    // Fetch locked strategy if it exists
    let strategy = null;
    if (session.locked_strategy_id) {
      try { strategy = await base44.entities.LockedStrategy.get(session.locked_strategy_id); } catch {}
    }

    // Build the summary
    const a = session.answers || {};
    const getAns = (key) => a[key]?.answer_text || 'Not provided';

    const businessTypeLabel = { new: 'New Business', ai_enhancement: 'AI Enhancement of Current Business', rebrand: 'Rebrand of Existing Business' };
    const sections = [];

    sections.push('=== CLIENT ONBOARDING SUMMARY ===\n');
    sections.push(`Business Type: ${businessTypeLabel[session.business_type] || 'Not specified'}\n`);
    sections.push(`Client Name: ${getAns('owner_name')}`);
    sections.push(`Client Email: ${session.user_email}`);
    if (session.client_phone) sections.push(`Client Phone: ${session.client_phone}`);
    if (session.client_address) sections.push(`Client Address: ${session.client_address}`);
    sections.push('');

    sections.push('=== BUSINESS INFORMATION ===\n');
    sections.push(`Business Name: ${getAns('business_name')}`);
    sections.push(`Industry: ${getAns('industry')}`);
    sections.push(`Location: ${getAns('location')}`);
    sections.push(`Services Offered: ${getAns('services')}`);
    sections.push(`Target Audience: ${getAns('target_audience')}`);
    sections.push(`Competitive Advantage: ${getAns('competitive_advantage')}`);
    sections.push(`Budget: ${getAns('budget')}`);
    sections.push('');

    // Aggregate skip-trace intelligence
    if (traces.length > 0) {
      sections.push('=== SKIP TRACE INTELLIGENCE ===\n');
      const allCompetitors = new Map();
      const allSocial = new Map();
      const allSources = new Set();
      for (const trace of traces) {
        if (trace.competitors) for (const c of trace.competitors) { if (c.name) allCompetitors.set(c.name, c); }
        if (trace.social_profiles) for (const s of trace.social_profiles) { allSocial.set(s.url, s); }
        if (trace.sources) for (const src of trace.sources) allSources.add(src);
      }
      if (allCompetitors.size > 0) {
        sections.push('Competitors Found:');
        for (const [name, c] of allCompetitors) {
          sections.push(`  - ${name}${c.url ? ` (${c.url})` : ''}${c.note ? ` — ${c.note.slice(0, 120)}` : ''}`);
        }
        sections.push('');
      }
      if (allSocial.size > 0) {
        sections.push('Social Media Profiles Found:');
        for (const [url, s] of allSocial) {
          sections.push(`  - ${s.platform}: ${url}`);
        }
        sections.push('');
      }
      if (allSources.size > 0) {
        sections.push(`Research Sources (${allSources.size} total):`);
        for (const src of [...allSources].slice(0, 15)) sections.push(`  - ${src}`);
        sections.push('');
      }
      // Market data from industry traces
      const industryTrace = traces.find(t => t.question_key === 'industry');
      if (industryTrace?.market_data) {
        const md = industryTrace.market_data;
        sections.push('Market Data:');
        if (md.market_size) sections.push(`  Market Size: ${md.market_size}`);
        if (md.trend) sections.push(`  Trend: ${md.trend}`);
        if (md.avg_pricing) sections.push(`  Average Pricing: ${md.avg_pricing}`);
        if (md.demand_signals?.length) sections.push(`  Demand Signals: ${md.demand_signals.join(', ')}`);
        sections.push('');
      }
    }

    // Locked strategy
    if (strategy) {
      sections.push('=== LOCKED STRATEGY ===\n');
      if (strategy.strategy_summary) sections.push(`Summary: ${strategy.strategy_summary}`);
      if (strategy.positioning) sections.push(`Positioning: ${strategy.positioning}`);
      if (strategy.target_market) sections.push(`Target Market: ${strategy.target_market}`);
      if (strategy.competitive_advantage) sections.push(`Competitive Advantage: ${strategy.competitive_advantage}`);
      if (strategy.pricing_model) sections.push(`Pricing Model: ${strategy.pricing_model}`);
      if (strategy.growth_channels?.length) sections.push(`Growth Channels: ${strategy.growth_channels.join(', ')}`);
      sections.push('');
    }

    // Instructions for GPT
    sections.push('=== GENERATION INSTRUCTIONS ===\n');
    sections.push('Using the information above, generate 3 distinct versions of EACH of the following brand assets:');
    sections.push('1. Website (web_pack) — 3 different design directions');
    sections.push('2. Logo (logo_pack) — 3 different logo concepts');
    sections.push('3. Brand Pack (brand_pack) — 3 different brand token sets (colors, fonts, style)');
    sections.push('4. Marketing Pack (marketing_pack) — 3 different marketing copy sets');
    sections.push('');
    sections.push('For each asset, POST to the sync endpoint with:');
    sections.push('- sync_token: your PACK_SYNC_TOKEN');
    sections.push(`- session_id: "${session_id}"`);
    sections.push(`- user_email: "${session.user_email}"`);
    sections.push('- version_number: 1, 2, or 3');
    sections.push('- version_group_id: a unique ID grouping the 3 versions of each asset type');
    sections.push('- kind: web_pack, logo_pack, brand_pack, or marketing_pack');
    sections.push('- name: a descriptive name including the version number');
    sections.push('- preview_html: the full HTML for review');
    sections.push('');
    sections.push('Endpoint: POST https://autobuilder.base44.app/functions/ingestPack');

    const summary = sections.join('\n');
    return Response.json({ ok: true, session_id, summary, trace_count: traces.length, has_strategy: !!strategy });
  } catch (error) {
    console.error('generatePipelineSummary error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}