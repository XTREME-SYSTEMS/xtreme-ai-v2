import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// lockStrategy — Generates and locks the strategy from onboarding answers +
// skip-trace intelligence. Once locked, this IS the strategy — no branching.
// It produces a website_brief that GPT uses to generate the mockup.
//
// Uses InvokeLLM to synthesize the strategy. NOTE: InvokeLLM requires
// integration credits. If credits are exhausted, falls back to a
// deterministic strategy assembled from the skip-trace data.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { session_id } = body;

    if (!session_id) return Response.json({ error: 'Missing session_id' }, { status: 400 });

    // Fetch all skip-trace reports for this session — admins see all traces
    const traceQuery = user.role === 'admin' ? { session_id, status: 'complete' } : { session_id, user_email: user.email, status: 'complete' };
    const tracesResult = await base44.entities.SkipTraceReport.filter(traceQuery, { sort: 'created_date', limit: 50 });
    const traces = tracesResult.items || tracesResult || [];

    // Fetch the session — admins can lock any session, regular users only their own
    const sessionQuery = user.role === 'admin' ? { session_id } : { session_id, user_email: user.email };
    const session = await base44.entities.OnboardingSession.filter(sessionQuery, { limit: 1 });
    const sessionRecord = (session.items || session)[0];
    if (!sessionRecord) return Response.json({ error: 'Session not found' }, { status: 404 });

    // Aggregate intelligence from all traces
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
      if (t.confidence_score > 70) keyFindings.push(t.question_key + ': high-confidence intelligence gathered');
    }

    // Dedupe competitors
    const seenComp = new Set();
    const dedupedComps = allCompetitors.filter(function(c) {
      var k = (c.name || '').toLowerCase();
      if (seenComp.has(k) || !k) return false;
      seenComp.add(k); return true;
    }).slice(0, 15);

    // Try LLM-based strategy synthesis (needs credits)
    let strategy = null;
    try {
      const prompt = buildStrategyPrompt(businessName, ownerName, industry, location, website, dedupedComps, keyFindings, sessionRecord.answers);
      const llmRes = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            strategy_summary: { type: 'string' },
            positioning: { type: 'string' },
            target_market: { type: 'string' },
            competitive_advantage: { type: 'string' },
            pricing_model: { type: 'string' },
            growth_channels: { type: 'array', items: { type: 'string' } },
            risk_factors: { type: 'array', items: { type: 'string' } },
            website_brief: { type: 'string' },
          },
        },
      });
      strategy = typeof llmRes === 'string' ? JSON.parse(llmRes) : llmRes;
    } catch (llmError) {
      // Credits exhausted or LLM failed — fall back to deterministic strategy
      console.error('LLM failed, using deterministic fallback:', llmError.message);
      strategy = buildDeterministicStrategy(businessName, ownerName, industry, location, website, dedupedComps, keyFindings);
    }

    // Create the locked strategy record
    const lockedStrategy = await base44.entities.LockedStrategy.create({
      session_id: session_id,
      user_email: user.email,
      strategy_summary: strategy.strategy_summary,
      positioning: strategy.positioning,
      target_market: strategy.target_market,
      competitive_advantage: strategy.competitive_advantage,
      pricing_model: strategy.pricing_model,
      growth_channels: strategy.growth_channels || [],
      risk_factors: strategy.risk_factors || [],
      website_brief: strategy.website_brief,
      approved: false,
      intelligence_summary: {
        competitor_count: dedupedComps.length,
        market_trend: industry ? industry + ' market active in ' + (location || 'target area') : 'Market analysis pending',
        key_findings: keyFindings,
      },
    });

    // Update session status
    await base44.entities.OnboardingSession.update(sessionRecord.id, {
      status: 'strategy_locked',
      locked_strategy_id: lockedStrategy.id,
    });

    return Response.json({ ok: true, strategy_id: lockedStrategy.id, strategy: lockedStrategy });
  } catch (error) {
    console.error('lockStrategy error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function buildStrategyPrompt(businessName, ownerName, industry, location, website, competitors, keyFindings, answers) {
  var compList = competitors.map(function(c) { return '- ' + c.name + ' (' + c.url + ')'; }).join('\n') || 'No competitors found yet';
  var answerStr = 'No answers yet';
  if (answers) {
    answerStr = Object.entries(answers).map(function(entry) {
      return entry[0] + ': ' + (entry[1].answer_text || 'N/A');
    }).join('\n');
  }

  return [
    'You are a master business strategist. Based on the following onboarding answers and background intelligence, create a locked strategy for this business.',
    '',
    'BUSINESS: ' + (businessName || 'TBD'),
    'OWNER: ' + (ownerName || 'TBD'),
    'INDUSTRY: ' + (industry || 'TBD'),
    'LOCATION: ' + (location || 'TBD'),
    'WEBSITE: ' + (website || 'None yet'),
    '',
    'ONBOARDING ANSWERS:',
    answerStr,
    '',
    'COMPETITORS FOUND (skip-trace):',
    compList,
    '',
    'KEY INTELLIGENCE FINDINGS:',
    keyFindings.join('\n') || 'Initial intelligence gathered',
    '',
    'Create a comprehensive strategy. The website_brief is the most important field — it is what GPT will use to generate the website mockup. Make it detailed and specific to this business, industry, and location.',
  ].join('\n');
}

function buildDeterministicStrategy(businessName, ownerName, industry, location, website, competitors, keyFindings) {
  var compNames = competitors.slice(0, 5).map(function(c) { return c.name; }).join(', ');
  var hasComps = competitors.length > 0;

  var summary = (businessName || 'Your business') + ' will dominate the ' + (industry || 'local') +
    ' market in ' + (location || 'your area') + ' by leveraging a modern web presence, targeted SEO, and superior customer experience.';
  if (hasComps) summary += ' Key competitors include ' + compNames + '.';
  else summary += ' Limited competition detected — first-mover advantage available.';

  var positioning = 'Premium ' + (industry || 'service') + ' provider in ' + (location || 'your area') +
    ', positioned as the modern, reliable alternative to ' + (compNames || 'legacy competitors') + '.';

  var targetMarket = 'Property owners and businesses in ' + (location || 'your service area') +
    ' seeking ' + (industry || 'professional services') +
    '. Primary demographic: 25-65 age range, homeowners and commercial property managers.';

  var advantage = 'Modern digital presence, streamlined booking process, transparent pricing, and superior customer service.';
  if (hasComps) advantage += ' Differentiated from ' + compNames + ' through technology and customer experience.';
  else advantage += ' No significant digital competition detected.';

  var pricing = 'Competitive market pricing with tiered service packages (Essential, Recommended, Premier). Transparent online quoting.';

  var channels = ['SEO (local + organic)', 'Google Business Profile', 'Paid search (Google Ads)', 'Social media presence', 'Referral program', 'Directory listings'];

  var risks = [];
  if (hasComps) risks.push('Established competitors: ' + compNames);
  else risks.push('Low competitive risk');
  risks.push('Seasonal demand fluctuations');
  risks.push('Economic sensitivity of target market');

  // Build the website brief as an array of lines, then join
  var briefLines = [
    'Build a modern, conversion-optimized website for ' + (businessName || 'a ' + (industry || 'local') + ' business') + ' in ' + (location || 'the target area') + '.',
    '',
    'INDUSTRY: ' + (industry || 'General services'),
    'LOCATION: ' + (location || 'United States'),
    '',
    'PAGES NEEDED:',
    '1. Hero — Bold headline, clear value proposition, primary CTA ("Get Free Quote" or "Book Now")',
    '2. Services — Detailed service offerings with pricing tiers',
    '3. About — Company story' + (ownerName ? ', featuring ' + ownerName + ' as founder' : '') + '',
    '4. Process — How it works (3-5 steps)',
    '5. Testimonials — Social proof (use placeholder testimonials)',
    '6. Service Area — ' + (location || 'Coverage area') + ' with cities served',
    '7. FAQ — Common questions',
    '8. Contact — Form, phone, email, map',
    '',
    'DESIGN: Clean, modern, mobile-first. Trust-building elements. Fast loading. Clear CTAs throughout.',
    'TONE: Professional, trustworthy, approachable. Local expertise emphasized.',
    'SEO: Optimize for "' + (industry || 'services') + ' ' + (location || 'near me') + '" and related keywords.',
    '',
  ];
  if (hasComps) {
    briefLines.push('COMPETITIVE CONTEXT: Differentiate from ' + compNames + '. Highlight superior technology, transparency, and customer service.');
  } else {
    briefLines.push('MARKET OPPORTUNITY: Limited digital competition — establish dominant online presence.');
  }

  return {
    strategy_summary: summary,
    positioning: positioning,
    target_market: targetMarket,
    competitive_advantage: advantage,
    pricing_model: pricing,
    growth_channels: channels,
    risk_factors: risks,
    website_brief: briefLines.join('\n'),
  };
}