import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const logs = [];
    const log = (m) => { logs.push(m); };

    // Admin-only
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Admin only' }, { status: 403 });
      }
    } catch {}

    const svc = base44.asServiceRole;

    // ---- Resolve portfolio ----
    let portfolio;
    if (body.portfolio_id) {
      portfolio = await svc.entities.DomainPortfolio.get(body.portfolio_id);
    } else if (body.domain) {
      const existing = await svc.entities.DomainPortfolio.filter({ domain: body.domain });
      portfolio = existing[0];
    }
    if (!portfolio) {
      return Response.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const domain = portfolio.domain;
    const niche = portfolio.niche || body.niche || 'general';
    const engineId = portfolio.engine_id || '';
    const limit = body.limit || 15;

    log(`Prospecting backlinks for ${domain} (niche: ${niche}, target: ${limit} prospects)`);

    // ---- 1. Find backlink opportunities via LLM + web search ----
    log('Searching web for niche-relevant link opportunities...');
    let opportunities = [];
    try {
      const llmRes = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional link-building expert. Find ${limit} real, high-quality backlink opportunities for a ${niche} business website at ${domain}.

Search the web for:
1. Blogs about ${niche} that accept guest posts or have resource lists linking out
2. Resource pages that link to ${niche} businesses or contractors
3. Industry-specific directories for ${niche}
4. Sites that link to major ${niche} competitors (resource roundups, "best of" lists, supplier lists)
5. Local/regional business directories or chambers of commerce relevant to ${niche}

For each opportunity, return:
- target_domain: the site domain (e.g. example.com)
- target_url: the specific page where a link could be placed (or homepage if unknown)
- page_title: title of the page you found
- prospect_type: one of resource_page, guest_post, competitor_link, directory, niche_blog
- relevance_score: 0-100 how relevant to ${niche}
- domain_authority: estimated 0-100 based on site prominence
- contact_email: the best contact email if findable via search (or empty string)
- contact_name: editor/webmaster name if findable (or empty string)
- outreach_angle: a 1-sentence pitch angle for why they'd link to ${domain}

Only include REAL sites you found via web search — no fabricated domains. Return a JSON object with an "opportunities" array.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            opportunities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  target_domain: { type: 'string' },
                  target_url: { type: 'string' },
                  page_title: { type: 'string' },
                  prospect_type: { type: 'string' },
                  relevance_score: { type: 'number' },
                  domain_authority: { type: 'number' },
                  contact_email: { type: 'string' },
                  contact_name: { type: 'string' },
                  outreach_angle: { type: 'string' },
                },
              },
            },
          },
        },
      });
      opportunities = llmRes?.opportunities || [];
      log(`Found ${opportunities.length} backlink opportunities via web search`);
    } catch (e) {
      log(`Web search for prospects failed: ${e.message}`);
    }

    if (!opportunities.length) {
      return Response.json({ ok: true, portfolio_id: portfolio.id, domain, prospects_total: 0, prospects_created: 0, logs, error: 'No opportunities found' });
    }

    // ---- 2. Check existing to avoid duplicates ----
    const existing = await svc.entities.BacklinkProspect.filter({ portfolio_id: portfolio.id });
    const existingDomains = new Set(existing.map((p) => p.target_domain));
    log(`Existing prospects: ${existing.length}`);

    const newOpps = opportunities.filter((o) => o.target_domain && !existingDomains.has(o.target_domain));
    log(`New prospects to create: ${newOpps.length}`);

    if (!newOpps.length) {
      await svc.entities.DomainPortfolio.update(portfolio.id, {
        backlinks_count: existing.length,
        logs: [...(portfolio.logs || []), `Backlink prospecting: all ${existing.length} already tracked`].slice(-20),
      });
      return Response.json({ ok: true, portfolio_id: portfolio.id, domain, prospects_total: existing.length, prospects_created: 0, logs });
    }

    // ---- 3. Draft personalized outreach emails in a single batch ----
    log('Drafting compelling partnership outreach emails...');
    let outreachEmails = [];
    try {
      const draftRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Write compelling, personalized partnership outreach emails for ${domain} — an AI-powered autonomous marketing engine that scales local lead generation by automating site deployment, Google Search Console indexing, citation building, backlink outreach, and persistent SEO/AEO/AI optimization across a portfolio of high-value "near me" service domains.

Prospects to draft emails for:
${JSON.stringify(newOpps.map((o, i) => ({ index: i, target_domain: o.target_domain, target_url: o.target_url, angle: o.outreach_angle, contact_name: o.contact_name })), null, 2)}

Each email must follow this narrative arc:

1. HOOK (personal + specific): Open by mentioning something specific about THEIR site or page (based on target_url and angle) that caught your attention — a recent article, a resource page, their expertise in ${niche}. Show you actually read their work. Keep it genuine, not flattery.

2. THE ANNOUNCEMENT: Tell them what we're building — an AI-powered autonomous marketing engine that deploys and ranks local service websites at scale. In plain language, explain the system's capabilities:
   - Automated site deployment across dozens of niche "near me" domains
   - Real-time Google Search Console indexing and sitemap submission
   - Programmatic citation building across 30+ directories
   - AI-driven backlink prospecting and personalized outreach (what they're reading right now)
   - Live SERP rank tracking and autonomous content optimization
   - AEO/AI search optimization so sites get cited by ChatGPT, Perplexity, and Google AI Overviews
   Frame it as "we're proving that AI can autonomously take a local service domain from zero to page one — and we're doing it right now."

3. THE BENEFIT TO THEM: Why participating is worth their time:
   - Early access to a system that's genuinely changing how local SEO works
   - A high-quality, relevant backlink from a site in the ${niche} space (mutual value)
   - First look at the results data — they'll see real ranking progress, real traffic, real leads
   - Their audience gets pointed to a genuinely useful resource
   - No cost, no obligation — just a genuine partnership opportunity

4. THE PROOF OFFER: Offer to share live ranking data, traffic screenshots, and pipeline metrics so they can verify the system works before committing to anything. Say something like: "I'm happy to share live dashboards, ranking data, and traffic proof so you can see exactly what this system does before you decide."

5. THE PARTNERSHIP ASK: Frame the link/partnership as the beginning of a relationship, not a one-off transaction:
   - "We're building a network of forward-thinking site owners who want early access to AI-driven marketing tech"
   - "If this proves out the way we expect, we'd love to explore broader partnership opportunities — co-marketing, content collaborations, or early access to the platform itself"
   - End with a clear, low-friction ask: a link from their resource page, a guest post opportunity, or a quick chat

6. SIGN-OFF: Close as "The team at ${domain}" with a warm, confident tone.

FORMATTING RULES:
- Subject: compelling, curiosity-driven, under 60 characters, not spammy, no all-caps, no clickbait
- Body: 200-280 words (this is a real pitch, not a one-liner), friendly but professional, confident without hype
- Use the contact name if available ("Hi [name]"), else "Hi there"
- Use short paragraphs (2-3 sentences max) — no walls of text
- Do NOT use placeholders like [Your Name] — write the full email ready to send
- Do NOT mention "AI" more than twice — lead with the human partnership angle
- Make it feel like a genuine note from a builder, not a marketing blast

Return JSON with an "emails" array — one { subject, body } per prospect, in the same order as the prospects list.`,
        response_json_schema: {
          type: 'object',
          properties: {
            emails: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  subject: { type: 'string' },
                  body: { type: 'string' },
                },
              },
            },
          },
        },
      });
      outreachEmails = draftRes?.emails || [];
      log(`Drafted ${outreachEmails.length} outreach emails`);
    } catch (e) {
      log(`Batch outreach drafting failed: ${e.message}`);
    }

    // ---- 4. Create BacklinkProspect records ----
    const toCreate = newOpps.map((opp, i) => {
      const email = outreachEmails[i] || {};
      return {
        engine_id: engineId,
        portfolio_id: portfolio.id,
        target_domain: opp.target_domain,
        target_url: opp.target_url || '',
        page_title: opp.page_title || '',
        prospect_type: opp.prospect_type || 'niche_blog',
        relevance_score: opp.relevance_score || 0,
        domain_authority: opp.domain_authority || 0,
        contact_email: opp.contact_email || '',
        contact_name: opp.contact_name || '',
        outreach_status: email.subject ? 'drafted' : 'pending',
        outreach_subject: email.subject || '',
        outreach_body: email.body || '',
        notes: opp.outreach_angle || '',
      };
    });

    await base44.entities.BacklinkProspect.bulkCreate(toCreate);
    log(`Created ${toCreate.length} backlink prospects`);

    const totalCount = existing.length + toCreate.length;

    // ---- 5. Update portfolio ----
    await svc.entities.DomainPortfolio.update(portfolio.id, {
      backlinks_count: totalCount,
      logs: [...(portfolio.logs || []), `Backlink prospects built: ${totalCount} (${toCreate.length} new) — ${new Date().toISOString().slice(0, 16)}`].slice(-20),
    });

    log(`Done. ${totalCount} total backlink prospects tracked for ${domain}.`);

    return Response.json({
      ok: true,
      portfolio_id: portfolio.id,
      domain,
      niche,
      prospects_total: totalCount,
      prospects_created: toCreate.length,
      drafted: outreachEmails.length,
      logs,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}