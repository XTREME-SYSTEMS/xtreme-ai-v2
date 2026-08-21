import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Researches competitor pricing, retail/standard pricing, pricing models, and
// market intelligence for a user's specific industry, location, and service
// radius. Uses InvokeLLM with web context to scrape financial analytics sites,
// competitor websites, review platforms, and industry reports.
// Returns a structured financial intelligence report that powers pricing
// recommendations across all generators (website, proposals, packages, etc.).

const FALLBACK_REPORT = {
  competitorPricing: [],
  retailPricing: [],
  pricingModels: ["Hourly rate", "Project-based", "Per-square-foot"],
  marketInsights: ["Unable to fetch live market data. Please try again later."],
  recommendedPricing: "Research unavailable — use industry-standard pricing.",
  revenueOpportunities: [],
  competitiveAdvantages: [],
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { address, zip, radius, industry, subIndustry, businessType } = body;

    if (!industry) return Response.json({ error: "Industry is required" }, { status: 400 });

    const locationContext = [address, zip && `ZIP ${zip}`, radius && `serving a ${radius} radius`]
      .filter(Boolean).join(", ");
    const industryContext = subIndustry ? `${subIndustry} (${industry})` : industry;
    const typeContext = businessType ? ` ${businessType}` : "";

    const prompt = `You are a financial intelligence analyst specializing in local business markets. Research and analyze the pricing landscape for a${typeContext} ${industryContext} business located at ${locationContext || "an unspecified location"}.

Use web search to find REAL pricing data from:
- Competitor websites in this geographic area
- Industry pricing guides and reports (e.g., HomeAdvisor, Angi, Thumbtack, Yelp)
- Market research reports and trade publications
- Review platforms that show pricing
- Government/small-business pricing benchmarks
- Retail and wholesale pricing databases

Return a structured financial intelligence report:

1. competitorPricing: Array of {service, lowPrice, highPrice, averagePrice, source} — what competitors in this area charge for each common service
2. retailPricing: Array of {service, typicalPrice, premiumPrice, economyPrice} — standard market retail pricing tiers
3. pricingModels: Array of common pricing models for this industry (e.g., "hourly", "per square foot", "project-based", "subscription", "retainer")
4. marketInsights: Array of key insights about the local market — demand trends, saturation, growth opportunities, seasonal patterns
5. recommendedPricing: A paragraph recommending a pricing strategy for this specific business
6. revenueOpportunities: Array of potential revenue streams and upsell opportunities specific to this industry
7. competitiveAdvantages: Array of pricing-related competitive advantages to highlight in marketing

All prices in USD. Be specific to ${industryContext} and the ${zip || "local"} area. If you can't find exact local data, use regional/national averages and note the source.`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          competitorPricing: {
            type: "array",
            items: {
              type: "object",
              properties: {
                service: { type: "string" },
                lowPrice: { type: "string" },
                highPrice: { type: "string" },
                averagePrice: { type: "string" },
                source: { type: "string" },
              },
            },
          },
          retailPricing: {
            type: "array",
            items: {
              type: "object",
              properties: {
                service: { type: "string" },
                typicalPrice: { type: "string" },
                premiumPrice: { type: "string" },
                economyPrice: { type: "string" },
              },
            },
          },
          pricingModels: { type: "array", items: { type: "string" } },
          marketInsights: { type: "array", items: { type: "string" } },
          recommendedPricing: { type: "string" },
          revenueOpportunities: { type: "array", items: { type: "string" } },
          competitiveAdvantages: { type: "array", items: { type: "string" } },
        },
      },
    });

    return Response.json(res || FALLBACK_REPORT);
  } catch (error) {
    console.error("getFinancialIntelligence error:", error);
    return Response.json({ ...FALLBACK_REPORT, error: error.message });
  }
}