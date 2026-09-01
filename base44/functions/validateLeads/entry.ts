// validateLeads — The Validator agent's quality gate. For each new
// ScrapedLead (review_status = 'pending'), runs AI spam detection +
// intent tier classification, then sets review_status (auto_approved /
// flagged / rejected), intent_tier, validation_notes, and adjusted
// intent_score. Idempotent — only processes pending leads.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { DIRECT_KEYWORDS, INDIRECT_KEYWORDS, INTENT_TIER_GUIDE } from '../../shared/leadKeywords.ts';

const SPAM_SIGNALS = [
  'job posting', 'hiring', 'we are hiring', 'now hiring',
  'mlm', 'opportunity', 'business opportunity', 'franchise',
  'spam', 'click here', 'buy now', 'limited time offer',
  'affiliate', 'discount code', 'promo code',
];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    let user;
    try { user = await base44.auth.me(); } catch {}
    const svc = base44.asServiceRole;
    const { client_email, max_leads = 50, lead_id, triggered_by = 'manual' } = body;

    // Fetch pending leads to validate
    let leads = [];
    if (lead_id) {
      const l = await svc.entities.ScrapedLead.get(lead_id);
      leads = l ? [l] : [];
    } else {
      const query = { review_status: 'pending' } as any;
      if (client_email) query.client_email = client_email;
      leads = await svc.entities.ScrapedLead.filter(query, '-scraped_at', max_leads);
    }

    if (!leads.length) {
      return Response.json({ ok: true, validated: 0, message: 'No pending leads to validate.' });
    }

    const results = { validated: 0, auto_approved: 0, flagged: 0, rejected: 0 };
    const updates = [];

    for (const lead of leads) {
      try {
        // Quick spam signal check (pre-AI filter)
        const text = `${lead.title || ''} ${lead.description || ''}`.toLowerCase();
        const spamHit = SPAM_SIGNALS.find(s => text.includes(s));
        if (spamHit && lead.lead_type === 'service_request') {
          // Likely spam — reject without AI cost
          await svc.entities.ScrapedLead.update(lead.id, {
            review_status: 'rejected',
            intent_tier: 'signal',
            validation_notes: `Auto-rejected: spam signal "${spamHit}" detected.`,
            intent_score: 0,
          });
          results.rejected++;
          results.validated++;
          continue;
        }

        // AI classification — spam detection + intent tier
        const prompt = `You are a lead validation AI for a concrete/epoxy flooring contractor. Classify this lead.

LEAD:
- Title: ${lead.title}
- Description: ${(lead.description || '').slice(0, 1500)}
- Type: ${lead.lead_type}
- Source: ${lead.source_name} (${lead.source_type})
- Location: ${lead.location || 'unknown'}
- Contact: ${lead.contact_email || lead.contact_phone || 'none'}
- Matched keywords: ${(lead.matched_keywords || []).join(', ')}

${INTENT_TIER_GUIDE}

Classify:
1. intent_tier: one of [very_hot, hot, warm, partner, project, property, signal]
2. is_spam: true if this is a bot post, business advertisement, job posting, MLM, or unrelated content
3. confidence: 0-100 (how confident you are in the classification)
4. intent_score: 0-100 (buying intent, adjusted from initial estimate)
5. reasoning: one sentence explaining your classification

Return JSON: {"intent_tier": "...", "is_spam": false, "confidence": 85, "intent_score": 90, "reasoning": "..."}`;

        const llmRes = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              intent_tier: { type: 'string', enum: ['very_hot', 'hot', 'warm', 'partner', 'project', 'property', 'signal'] },
              is_spam: { type: 'boolean' },
              confidence: { type: 'number' },
              intent_score: { type: 'number' },
              reasoning: { type: 'string' },
            },
          },
        });

        const tier = llmRes?.intent_tier || 'warm';
        const isSpam = llmRes?.is_spam || false;
        const confidence = llmRes?.confidence || 50;
        const score = llmRes?.intent_score ?? lead.intent_score ?? 50;
        const reasoning = llmRes?.reasoning || 'No reasoning provided.';

        let reviewStatus = 'auto_approved';
        if (isSpam) reviewStatus = 'rejected';
        else if (confidence < 70) reviewStatus = 'flagged';

        await svc.entities.ScrapedLead.update(lead.id, {
          intent_tier: tier,
          review_status: reviewStatus,
          validation_notes: reasoning,
          intent_score: score,
        });

        if (reviewStatus === 'auto_approved') results.auto_approved++;
        else if (reviewStatus === 'flagged') results.flagged++;
        else if (reviewStatus === 'rejected') results.rejected++;
        results.validated++;
        updates.push({ id: lead.id, tier, reviewStatus, confidence });
      } catch (leadErr) {
        console.log(`Failed to validate lead ${lead.id}: ${leadErr?.message || leadErr}`);
      }
    }

    return Response.json({ ok: true, ...results, updates: updates.slice(0, 20) });
  } catch (error) {
    console.error('validateLeads error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}