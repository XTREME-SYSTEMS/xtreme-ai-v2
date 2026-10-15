// Generates 10 complete business strategies for a chosen category/topic.
// Each strategy includes: name, description, financial outlook, system
// strategy, marketing strategy, system architecture, key documents, and
// 4 scores (profitability, viral, marketability, capability) + overall.
// Also maps to the existing strategy schema fields so it can be saved
// directly to the project. Uses InvokeLLM with web search (gemini_3_flash)
// for fast, market-aware strategy generation.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const topic = String(body.topic || "").trim();
    const vision = String(body.vision || "").trim();
    const discoveryOption = String(body.discoveryOption || "").trim();

    if (!topic) {
      return Response.json({ error: "topic is required" }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const context = [
      `Category/Topic: "${topic}"`,
      vision ? `User's vision: "${vision}"` : "",
      discoveryOption ? `Chosen angle: "${discoveryOption}"` : "",
    ].filter(Boolean).join("\n");

    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${context}

Generate 10 distinct business strategies for a digital product in this space. Each must be genuinely different. Strategy #1 = best overall.

For EACH strategy provide ALL fields as JSON:
- name: 3-6 word strategy name
- description: 2 sentences — what it builds and why
- financial_outlook: 2-3 sentences — revenue, margins, CAC, LTV
- system_strategy: 2-3 sentences — tech stack, AI usage, integrations
- marketing_strategy: 2-3 sentences — GTM, channels, viral tactics
- system_architecture: 2-3 sentences — key pages, data models, features
- key_documents: array of 3-5 document names needed
- profitability_score: 0-100
- viral_score: 0-100
- marketability_score: 0-100
- capability_score: 0-100
- overall_score: 0-100 (profitability 30%, viral 20%, marketability 25%, capability 25%)
- competitive_positioning: 1 sentence
- go_to_market: 1 sentence
- revenue_model: e.g. "Subscription", "Freemium", "Marketplace"
- pricing_strategy: 1 sentence
- acquisition_channels: array of 3-5 channels
- roadmap: array of 3 objects with phase, timeline, goals (array), key_initiatives (array)
- risks: array of 2-3 objects with risk, severity ("high"/"medium"/"low"), mitigation
- resources: 1 sentence
- differentiation: 1 sentence
- partnerships: 1 sentence
- target_audience: 1 sentence
- long_term_vision: 1 sentence
- success_metrics: array of 4-6 metrics
- core_values: array of 3-5 values
- value_proposition: 1 sentence
- market_opportunity: 1 sentence
- monetization_model: 2-3 sentences — MRR model with 3 pricing tiers (specific USD price points), projected monthly revenue at scale, and why clients pay monthly
- lead_generation_architecture: 2-3 sentences — funnel stages, lead magnets/free tools, lead capture + management workflow
- seo_aeo_roadmap: 2-3 sentences — target keywords, ranking timeline to page 1, content cadence, AEO strategy for AI answer engines
- social_media_automation: 2-3 sentences — content pillars, posting cadence per platform, AI-generated content types, autonomous backend flow
- funnel_system: 2-3 sentences — top/middle/bottom funnel stages, conversion actions, optimization approach
- autonomous_enhancement_plan: 2-3 sentences — what the AI team continuously optimizes (SEO, AEO, content, conversions, rank) to justify monthly billing
- retention_strategy: 2-3 sentences — ongoing value delivery, performance reporting, new features, why clients keep paying

Keep each field concise. Return JSON with "strategies" array sorted by overall_score descending.`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          strategies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                financial_outlook: { type: "string" },
                system_strategy: { type: "string" },
                marketing_strategy: { type: "string" },
                system_architecture: { type: "string" },
                key_documents: { type: "array", items: { type: "string" } },
                profitability_score: { type: "number" },
                viral_score: { type: "number" },
                marketability_score: { type: "number" },
                capability_score: { type: "number" },
                overall_score: { type: "number" },
                competitive_positioning: { type: "string" },
                go_to_market: { type: "string" },
                revenue_model: { type: "string" },
                pricing_strategy: { type: "string" },
                acquisition_channels: { type: "array", items: { type: "string" } },
                roadmap: { type: "array", items: { type: "object" } },
                risks: { type: "array", items: { type: "object" } },
                resources: { type: "string" },
                differentiation: { type: "string" },
                partnerships: { type: "string" },
                target_audience: { type: "string" },
                long_term_vision: { type: "string" },
                success_metrics: { type: "array", items: { type: "string" } },
                core_values: { type: "array", items: { type: "string" } },
                value_proposition: { type: "string" },
                market_opportunity: { type: "string" },
                monetization_model: { type: "string" },
                lead_generation_architecture: { type: "string" },
                seo_aeo_roadmap: { type: "string" },
                social_media_automation: { type: "string" },
                funnel_system: { type: "string" },
                autonomous_enhancement_plan: { type: "string" },
                retention_strategy: { type: "string" },
              },
            },
          },
        },
      },
    });

    const strategies = (llmRes as any)?.strategies || [];
    strategies.sort((a: any, b: any) => (b.overall_score || 0) - (a.overall_score || 0));

    return Response.json({ topic, strategies });
  } catch (error) {
    console.error("generateStrategyOptions error:", error);
    return Response.json({ error: (error as any)?.message || "Strategy generation failed" }, { status: 500 });
  }
}