// ============================================================
// visionStrategyGenerators.ts — Vision & Strategy generation
// ------------------------------------------------------------
// The foundation of the entire build pipeline. Vision defines
// WHAT we're building and WHY. Strategy defines HOW we get there.
// These two documents are mandatory before any building begins —
// building without a vision or strategy is dangerous and leads
// to unfocused, wasteful work.
//
// Used by:
//   - generateVision backend function (client portal)
//   - generateStrategy backend function (client portal)
//   - processAutoBuildStep (AutoBuilder pipeline)
// ============================================================

// ── Vision Document Generation ──────────────────────────────────────────
// The vision answers: What are we building? Why does it matter?
// Who is it for? What does success look like?

export async function generateVisionDoc(base44: any, params: Record<string, any>): Promise<Record<string, any>> {
  const { businessName, industry, subIndustry, primaryLocation, services, productDescription, targetAudience, businessType } = params;

  const prompt = `You are a world-class vision strategist — think Simon Sinek meets YC partner. Create a comprehensive VISION document for this business/product.

BUSINESS/PRODUCT CONTEXT:
- Name: ${businessName || "(to be determined)"}
- Industry: ${industry || "general"}${subIndustry ? ` / ${subIndustry}` : ""}
- Location: ${primaryLocation || "N/A"}
- Services/Offerings: ${(services || []).join(", ") || "N/A"}
- Product Description: ${productDescription || "N/A"}
- Target Audience: ${targetAudience || "N/A"}
- Business Type: ${businessType || "local service business"}

Generate a VISION document with these exact fields. Be specific, inspiring, and actionable — not generic. This vision will guide every downstream decision (name, brand, website, content, SEO, deployment).

1. MISSION: One powerful sentence — what this business exists to do. Start with "To..."
2. PROBLEM: The specific, painful problem this solves. Be concrete — what's broken, missing, or poorly served today?
3. TARGET_AUDIENCE: Who exactly is this for? Be specific — not "everyone" but a clear persona with needs, pains, and buying behavior.
4. LONG_TERM_VISION: A vivid 3-5 year picture. What does this become? What's the big ambition? Paint the future.
5. SUCCESS_METRICS: 5-8 measurable indicators of success. Each should be specific and trackable (e.g. "100 paying clients in year 1", "Page 1 for 20 local keywords in 6 months").
6. CORE_VALUES: 4-6 guiding principles that shape every decision. Short phrases, not sentences.
7. VALUE_PROPOSITION: The single most compelling reason someone chooses this over alternatives. What's the unique angle?
8. MARKET_OPPORTUNITY: The market reality — size, growth, trends, gaps. Why now? Why this? Be honest about the opportunity and the window.

Return ONLY a JSON object with these exact keys: mission, problem, target_audience, long_term_vision, success_metrics (array of strings), core_values (array of strings), value_proposition, market_opportunity.`;

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        mission: { type: "string", description: "One-sentence mission statement starting with 'To...'" },
        problem: { type: "string", description: "The specific, painful problem this solves" },
        target_audience: { type: "string", description: "Who exactly this is for — specific persona" },
        long_term_vision: { type: "string", description: "A vivid 3-5 year picture of what this becomes" },
        success_metrics: { type: "array", items: { type: "string" }, description: "5-8 measurable success indicators" },
        core_values: { type: "array", items: { type: "string" }, description: "4-6 guiding principles" },
        value_proposition: { type: "string", description: "The unique reason someone chooses this" },
        market_opportunity: { type: "string", description: "Market size, growth, trends, gaps — why now" },
      },
      required: ["mission", "problem", "target_audience", "long_term_vision", "success_metrics", "core_values", "value_proposition", "market_opportunity"],
    },
  });

  return {
    ...res,
    approved: false,
    generated_at: new Date().toISOString(),
  };
}

// ── Strategy Document Generation ─────────────────────────────────────────
// The strategy answers: How do we get there? What's the plan?
// What are the risks? What do we need?

export async function generateStrategyDoc(base44: any, params: Record<string, any>): Promise<Record<string, any>> {
  const { businessName, industry, subIndustry, primaryLocation, services, vision, productDescription, targetAudience, businessType } = params;

  if (!vision) throw new Error("Vision document is required before generating strategy. Generate and approve the vision first.");

  const prompt = `You are a world-class strategy consultant — think McKinsey meets YC startup school. Create a comprehensive STRATEGY document for this business/product, building directly on the approved vision.

BUSINESS/PRODUCT CONTEXT:
- Name: ${businessName || "(to be determined)"}
- Industry: ${industry || "general"}${subIndustry ? ` / ${subIndustry}` : ""}
- Location: ${primaryLocation || "N/A"}
- Services/Offerings: ${(services || []).join(", ") || "N/A"}
- Product Description: ${productDescription || "N/A"}
- Target Audience: ${targetAudience || "N/A"}
- Business Type: ${businessType || "local service business"}

APPROVED VISION:
- Mission: ${vision.mission || "N/A"}
- Problem: ${vision.problem || "N/A"}
- Target Audience: ${vision.target_audience || "N/A"}
- Value Proposition: ${vision.value_proposition || "N/A"}
- Success Metrics: ${(vision.success_metrics || []).join("; ") || "N/A"}
- Market Opportunity: ${vision.market_opportunity || "N/A"}

Generate a STRATEGY document with these exact fields. Be specific, practical, and actionable — not generic corporate speak. This strategy will drive every execution decision (pricing, channels, content, SEO, deployment roadmap).

1. COMPETITIVE_POSITIONING: How this positions against existing alternatives. Who are the competitors/substitutes? What's the wedge? Be specific about the positioning angle.
2. GO_TO_MARKET: The concrete GTM plan — how to get the first 100 customers/users. What channels, what tactics, what's the sequence?
3. REVENUE_MODEL: How money is made. Be specific — subscription, one-time, marketplace take rate, service fees, etc. Include the unit economics if possible.
4. PRICING_STRATEGY: Specific pricing approach — pricing tiers, anchor pricing, value-based vs cost-plus, introductory offers. Include actual price points if possible.
5. ACQUISITION_CHANNELS: 5-8 specific channels for reaching the target audience, ranked by expected ROI. Each should be a concrete channel (e.g. "Local SEO + Google Business Profile", "Direct outreach to GCs", "Instagram before/after content").
6. ROADMAP: 3 phases (Phase 1: Foundation 0-3 months, Phase 2: Growth 3-9 months, Phase 3: Scale 9-18 months). For each phase: timeline, 3-5 goals, 3-5 key initiatives.
7. RISKS: 4-6 key risks. For each: the risk, its severity (high/medium/low), and a specific mitigation strategy.
8. RESOURCES: What's needed to execute — team, tools, budget, technology, partnerships. Be concrete.
9. DIFFERENTIATION: The durable competitive moat. What makes this hard to copy? Why can't a well-funded competitor just replicate this?
10. PARTNERSHIPS: Key partnerships or integrations that accelerate execution. Be specific about who and why.

Return ONLY a JSON object with these exact keys: competitive_positioning, go_to_market, revenue_model, pricing_strategy, acquisition_channels (array of strings), roadmap (array of objects with phase, timeline, goals array, key_initiatives array), risks (array of objects with risk, severity, mitigation), resources, differentiation, partnerships.`;

  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        competitive_positioning: { type: "string" },
        go_to_market: { type: "string" },
        revenue_model: { type: "string" },
        pricing_strategy: { type: "string" },
        acquisition_channels: { type: "array", items: { type: "string" } },
        roadmap: {
          type: "array",
          items: {
            type: "object",
            properties: {
              phase: { type: "string" },
              timeline: { type: "string" },
              goals: { type: "array", items: { type: "string" } },
              key_initiatives: { type: "array", items: { type: "string" } },
            },
          },
        },
        risks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              risk: { type: "string" },
              severity: { type: "string", enum: ["high", "medium", "low"] },
              mitigation: { type: "string" },
            },
          },
        },
        resources: { type: "string" },
        differentiation: { type: "string" },
        partnerships: { type: "string" },
      },
      required: ["competitive_positioning", "go_to_market", "revenue_model", "pricing_strategy", "acquisition_channels", "roadmap", "risks", "resources", "differentiation", "partnerships"],
    },
  });

  return {
    ...res,
    approved: false,
    generated_at: new Date().toISOString(),
  };
}