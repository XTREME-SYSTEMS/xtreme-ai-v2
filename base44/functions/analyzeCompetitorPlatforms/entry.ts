import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Analyzes competitor marketing platforms, SaaS tools, and AI website builders
// that serve local service businesses. Uses InvokeLLM with web search to find
// real competitor systems, their pricing, features, advantages, and gaps —
// then recommends how we can build similar but better and cheaper products.
//
// This powers the product strategy: identify competitor systems → analyze
// their offerings → create enhanced alternatives at lower price points.
//
// Returns a structured competitor platform intelligence report.

const FALLBACK_REPORT = {
  platforms: [],
  pricingComparison: [],
  featureGaps: [],
  ourAdvantages: [],
  recommendedProducts: [],
  pricingStrategy: "Research unavailable — use standard pricing.",
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { niche, industry, focus } = body;

    const nicheContext = niche || industry || "local service businesses";
    const focusContext = focus || "AI website builders, local SEO platforms, and marketing automation tools";

    const prompt = `You are a product strategy analyst specializing in marketing technology and SaaS platforms for ${nicheContext}.

Use web search to find REAL competitor platforms, SaaS tools, and AI systems that serve this market. Focus on: ${focusContext}.

Research and find:
- AI website builders for contractors and local service businesses
- Local SEO platforms and citation builders
- Marketing automation tools for small businesses
- AI brand/logo generators
- Rank tracking and SEO tools
- Social media management platforms
- Lead generation systems
- Review management tools
- Google Business Profile management tools
- AI chatbot platforms for local businesses

For each competitor platform, find their REAL pricing, features, and positioning from their websites and review sites (G2, Capterra, TrustPilot, etc.).

Return a structured competitor platform intelligence report:

1. platforms: Array of {name, url, pricing, keyFeatures, targetMarket, advantages, weaknesses, reviewScore} — real competitor platforms with their actual pricing
2. pricingComparison: Array of {category, competitorAvgPrice, ourRecommendedPrice, savingsPercent} — pricing comparison by service category
3. featureGaps: Array of {competitor, missingFeature, opportunity} — features competitors lack that we can exploit
4. ourAdvantages: Array of strings — competitive advantages we have or should build
5. recommendedProducts: Array of {name, description, price, category, competitorBenchmark, enhancement} — new products we should create that are similar to competitors but better and cheaper
6. pricingStrategy: A paragraph recommending our pricing strategy to be cheaper and better than competitors

All prices in USD. Be specific with real competitor names and real pricing. If you can't find exact data, use the best available and note it.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
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
                targetMarket: { type: "string" },
                advantages: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                reviewScore: { type: "string" },
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
          featureGaps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                competitor: { type: "string" },
                missingFeature: { type: "string" },
                opportunity: { type: "string" },
              },
            },
          },
          ourAdvantages: { type: "array", items: { type: "string" } },
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

    return Response.json(res || FALLBACK_REPORT);
  } catch (error) {
    console.error("analyzeCompetitorPlatforms error:", error);
    return Response.json({ ...FALLBACK_REPORT, error: error.message });
  }
}