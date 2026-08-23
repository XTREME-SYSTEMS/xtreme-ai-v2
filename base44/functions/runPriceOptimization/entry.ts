import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Weekly price-optimization runner. Calls the competitor platform analysis
// (same logic as analyzeCompetitorPlatforms) and persists a Receipt with the
// recommended products and pricing strategy so the team can review and adjust
// catalog prices to stay cheaper and better than competitors.
//
// Invoked by the "Weekly Price Optimization" workflow.

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const niche = body.niche || "local service businesses";

    const prompt = `You are a product strategy analyst. Research competitor marketing platforms, SaaS tools, and AI website builders for ${niche}. Use web search to find REAL competitor platforms with their actual pricing, features, and gaps.

Return a structured report:
1. platforms: Array of {name, url, pricing, keyFeatures, weaknesses} — real competitor platforms
2. pricingComparison: Array of {category, competitorAvgPrice, ourRecommendedPrice, savingsPercent} — pricing comparison by service category
3. recommendedProducts: Array of {name, description, price, category, competitorBenchmark, enhancement} — new products we should create that are better and cheaper
4. pricingStrategy: A paragraph recommending our pricing strategy to beat competitors

All prices in USD. Be specific with real competitor names and pricing.`;

    const res = await sr.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          platforms: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                url: { type: "string" },
                pricing: { type: "string" },
                keyFeatures: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
              },
            },
          },
          pricingComparison: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                competitorAvgPrice: { type: "string" },
                ourRecommendedPrice: { type: "string" },
                savingsPercent: { type: "string" },
              },
            },
          },
          recommendedProducts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                price: { type: "string" },
                category: { type: "string" },
                competitorBenchmark: { type: "string" },
                enhancement: { type: "string" },
              },
            },
          },
          pricingStrategy: { type: "string" },
        },
      },
    });

    // Persist a Receipt so the team can review the analysis in the dashboard
    const platforms = (res?.platforms || []).length;
    const recommendations = (res?.recommendedProducts || []).length;
    const summary = `Analyzed ${platforms} competitor platforms. ${recommendations} product recommendations. Strategy: ${(res?.pricingStrategy || "").slice(0, 200)}`;

    try {
      await sr.entities.Receipt.create({
        agent_or_workflow: "weekly_price_optimization",
        action: "analyze_competitor_platforms",
        entity_type: "PricingStrategy",
        status: "success",
        inputs: JSON.stringify({ niche }).slice(0, 500),
        outputs: JSON.stringify({
          platforms: platforms,
          recommendations: recommendations,
          pricingComparison: res?.pricingComparison || [],
          pricingStrategy: (res?.pricingStrategy || "").slice(0, 1000),
        }).slice(0, 4000),
        evidence: summary,
      });
    } catch (e) {
      console.error("runPriceOptimization: receipt save failed", e?.message || e);
    }

    return Response.json({
      ok: true,
      platformsAnalyzed: platforms,
      productRecommendations: recommendations,
      pricingStrategy: res?.pricingStrategy || "",
      recommendedProducts: res?.recommendedProducts || [],
      pricingComparison: res?.pricingComparison || [],
    });
  } catch (error) {
    console.error("runPriceOptimization error:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}