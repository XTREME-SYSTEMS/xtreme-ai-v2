import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// syncSkipTraceToPipeline — Automatic background sync.
// Triggered by a workflow whenever a SkipTraceReport transitions to "complete".
// Aggregates ALL completed traces for that session and pushes the intelligence
// directly into the pipeline database (OnboardingSession + draft LockedStrategy),
// so the pipeline always reflects the latest skip-trace findings with zero
// manual input.
//
// Uses asServiceRole because the workflow trigger carries no user token.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const sessionId = body.session_id;

    if (!sessionId) return Response.json({ error: 'Missing session_id' }, { status: 400 });

    // Fetch all completed traces for this session (service role — no user context)
    const tracePage = await base44.asServiceRole.entities.SkipTraceReport.filter(
      { session_id: sessionId, status: 'complete' },
      { sort: 'created_date', limit: 50 }
    );
    const traces = tracePage.items || tracePage || [];

    if (traces.length === 0) {
      return Response.json({ ok: true, synced: 0, message: 'No completed traces yet' });
    }

    // Fetch the session
    const sessionPage = await base44.asServiceRole.entities.OnboardingSession.filter(
      { session_id: sessionId },
      { limit: 1 }
    );
    const session = (sessionPage.items || sessionPage)[0];
    if (!session) return Response.json({ error: 'Session not found' }, { status: 404 });

    // ── Aggregate intelligence from all traces ──────────────────────────
    const allCompetitors = [];
    const allSources = [];
    const allSocial = [];
    const keyFindings = [];
    let businessName = '';
    let ownerName = '';
    let industry = '';
    let location = '';
    let website = '';

    for (const t of traces) {
      if (t.competitors) allCompetitors.push(...t.competitors);
      if (t.sources) allSources.push(...t.sources);
      if (t.social_profiles) allSocial.push(...t.social_profiles);
      if (t.business_name) businessName = t.business_name;
      if (t.owner_name) ownerName = t.owner_name;
      if (t.industry) industry = t.industry;
      if (t.location) location = t.location;
      if (t.website) website = t.website;
      if (t.confidence_score > 70) keyFindings.push(t.question_key + ': high-confidence intelligence (' + t.confidence_score + '%)');
    }

    // Dedupe competitors
    const seenComp = new Set();
    const dedupedComps = allCompetitors.filter(function(c) {
      var k = (c.name || '').toLowerCase();
      if (seenComp.has(k) || !k) return false;
      seenComp.add(k);
      return true;
    }).slice(0, 15);

    // Dedupe social profiles
    const seenSocial = new Set();
    const dedupedSocial = allSocial.filter(function(s) {
      if (seenSocial.has(s.url)) return false;
      seenSocial.add(s.url);
      return true;
    }).slice(0, 10);

    const dedupedSources = [...new Set(allSources)].slice(0, 25);

    const intelligenceSummary = {
      competitor_count: dedupedComps.length,
      market_trend: industry ? industry + ' market active in ' + (location || 'target area') : 'Market analysis pending',
      key_findings: keyFindings,
      social_profiles: dedupedSocial,
      sources: dedupedSources,
      last_synced_at: new Date().toISOString(),
      trace_count: traces.length,
    };

    // ── Push into OnboardingSession ─────────────────────────────────────
    // Enrich the answers objects with skip-trace findings so the pipeline
    // has the latest intelligence without manual entry.
    const enrichedAnswers = { ...(session.answers || {}) };
    if (businessName && !enrichedAnswers.business_name?.answer_text) {
      enrichedAnswers.business_name = { ...(enrichedAnswers.business_name || {}), answer_text: businessName, enriched: true };
    }
    if (ownerName && !enrichedAnswers.owner_name?.answer_text) {
      enrichedAnswers.owner_name = { ...(enrichedAnswers.owner_name || {}), answer_text: ownerName, enriched: true };
    }
    if (industry && !enrichedAnswers.industry?.answer_text) {
      enrichedAnswers.industry = { ...(enrichedAnswers.industry || {}), answer_text: industry, enriched: true };
    }
    if (location && !enrichedAnswers.location?.answer_text) {
      enrichedAnswers.location = { ...(enrichedAnswers.location || {}), answer_text: location, enriched: true };
    }

    // Update the session with enriched data — advance status if still onboarding
    const sessionUpdate = {
      answers: enrichedAnswers,
    };
    // Only advance status if traces are done and session hasn't been locked yet
    if (session.status === 'onboarding' && traces.length >= 3) {
      sessionUpdate.status = 'strategy_locked';
    }

    await base44.asServiceRole.entities.OnboardingSession.update(session.id, sessionUpdate);

    // ── Create or update draft LockedStrategy ──────────────────────────
    // Check if a draft (unapproved) strategy already exists for this session
    const existingPage = await base44.asServiceRole.entities.LockedStrategy.filter(
      { session_id: sessionId, approved: false },
      { sort: '-created_date', limit: 1 }
    );
    const existingDraft = (existingPage.items || existingPage)[0];

    const strategyFields = {
      intelligence_summary: intelligenceSummary,
      competitive_advantage: dedupedComps.length > 0
        ? 'Differentiated from ' + dedupedComps.slice(0, 5).map(function(c) { return c.name; }).join(', ') + ' through modern digital presence and superior customer experience.'
        : 'Limited digital competition detected — first-mover advantage available.',
      target_market: 'Property owners and businesses in ' + (location || 'your service area') + ' seeking ' + (industry || 'professional services') + '.',
    };

    if (existingDraft) {
      // Update the existing draft with fresh intelligence
      await base44.asServiceRole.entities.LockedStrategy.update(existingDraft.id, strategyFields);
    } else {
      // Create a new draft strategy pre-populated with skip-trace intelligence
      await base44.asServiceRole.entities.LockedStrategy.create({
        session_id: sessionId,
        user_email: session.user_email,
        strategy_summary: (businessName || 'Your business') + ' — draft strategy auto-synced from ' + traces.length + ' skip-trace report(s). Review and lock to proceed.',
        positioning: 'Premium ' + (industry || 'service') + ' provider in ' + (location || 'your area') + '.',
        ...strategyFields,
        growth_channels: ['SEO (local + organic)', 'Google Business Profile', 'Paid search', 'Social media', 'Referrals'],
        risk_factors: dedupedComps.length > 0 ? ['Established competitors: ' + dedupedComps.slice(0, 3).map(function(c) { return c.name; }).join(', ')] : ['Low competitive risk'],
        website_brief: 'Build a modern website for ' + (businessName || 'a ' + (industry || 'local') + ' business') + ' in ' + (location || 'the target area') + '. Auto-generated draft — refine after review.',
        approved: false,
      });
    }

    return Response.json({
      ok: true,
      synced: traces.length,
      session_id: sessionId,
      competitors: dedupedComps.length,
      social_profiles: dedupedSocial.length,
      session_status: sessionUpdate.status || session.status,
    });
  } catch (error) {
    console.error('syncSkipTraceToPipeline error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}