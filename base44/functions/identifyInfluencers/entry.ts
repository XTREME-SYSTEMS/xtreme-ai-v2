import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { llm, logReceipt, jsonBody, ok, fail } from "../../shared/capabilityHelpers.ts";

// AI Influencer Identification — finds relevant influencers in a niche
// for partnership opportunities. Ingested from: Upfluence, AspireIQ, Klear.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail("Unauthorized", 401);

    const { niche, industry, location, audience_size, platforms, budget } = await jsonBody(req);
    if (!niche && !industry) return fail("niche or industry required", 400);

    const prompt = `You are an influencer identification engine. Find relevant influencers for partnership opportunities.

Niche: ${niche || industry || "local service"}
Industry: ${industry || "local service"}
Location: ${location || "national"}
Target Audience Size: ${audience_size || "10K-100K followers"}
Platforms: ${JSON.stringify(platforms || ["instagram", "youtube", "tiktok", "twitter"])}
Budget: ${budget || "flexible"}

Based on your knowledge of the influencer landscape, identify 15-20 relevant influencers:

For each influencer, provide:
1. handle (their social handle)
2. platform (primary platform)
3. follower_count (estimated)
4. engagement_rate (estimated %)
5. niche_fit (0-100, how well they fit this niche)
6. audience_match (0-100, how well their audience matches our target)
7. content_style (summary of their content style)
8. estimated_cost (estimated partnership cost)
9. past_partnerships (known brand partnerships)
10. contact_method (how to reach them)
11. partnership_ideas (2-3 specific partnership ideas)
12. priority (high/medium/low)

Also provide:
- "influencer_tiers" — group influencers by tier (micro, macro, mega)
- "outreach_strategy" — recommended outreach approach
- "partnership_packages" — 3 partnership package ideas with deliverables and pricing
- "roi_projection" — estimated ROI from influencer partnerships
- "compliance_notes" — FTC disclosure requirements

Return JSON.`;

    const response = await llm(base44, prompt, {
      type: "object",
      properties: {
        influencers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              handle: { type: "string" },
              platform: { type: "string" },
              follower_count: { type: "string" },
              engagement_rate: { type: "string" },
              niche_fit: { type: "number" },
              audience_match: { type: "number" },
              content_style: { type: "string" },
              estimated_cost: { type: "string" },
              past_partnerships: { type: "array", items: { type: "string" } },
              contact_method: { type: "string" },
              partnership_ideas: { type: "array", items: { type: "string" } },
              priority: { type: "string" }
            }
          }
        },
        influencer_tiers: { type: "object", additionalProperties: true },
        outreach_strategy: { type: "string" },
        partnership_packages: { type: "array", items: { type: "object", additionalProperties: true } },
        roi_projection: { type: "string" },
        compliance_notes: { type: "array", items: { type: "string" } }
      }
    });

    const result = { niche, influencerResearch: response };
    await logReceipt(base44, "identifyInfluencers", "identify", "success", { niche, industry }, { influencers: response?.influencers?.length || 0 });
    return ok(result);
  } catch (error: any) {
    return fail(error.message || "Failed to identify influencers");
  }
}