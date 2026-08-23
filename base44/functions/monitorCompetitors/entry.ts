import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { llm, logReceipt, jsonBody, ok, fail } from "../../shared/capabilityHelpers.ts";

// AI Competitor Monitoring — ongoing competitor tracking with change
// detection and alerts. Ingested from: Visualping, Semrush, SpyFu.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail("Unauthorized", 401);

    const { competitors, industry, our_domain, monitoring_points } = await jsonBody(req);
    if (!competitors || !Array.isArray(competitors)) return fail("competitors array required", 400);

    const prompt = `You are a competitor intelligence monitoring engine. Analyze the following competitors and provide a comprehensive monitoring report.

Our Domain: ${our_domain || "N/A"}
Industry: ${industry || "local service"}
Monitoring Points: ${JSON.stringify(monitoring_points || ["pricing", "services", "content", "seo", "social", "ads", "reviews"])}

Competitors:
${JSON.stringify(competitors.slice(0, 20), null, 2)}

For each competitor, provide:
1. domain
2. threat_level (high/medium/low — how much of a threat they are to us)
3. strengths (array of 3-5 competitive strengths)
4. weaknesses (array of 3-5 competitive weaknesses)
5. content_strategy (summary of their content approach)
6. seo_visibility (estimated SEO strength 0-100)
7. pricing_strategy (summary of their pricing approach)
8. social_presence (summary of their social media presence)
9. review_sentiment (positive/negative/neutral + summary)
10. recent_changes (array of detected changes since last monitoring)
11. opportunities (array of opportunities we can exploit)
12. recommended_actions (array of actions we should take)

Also provide:
- "competitive_landscape" — overall market analysis
- "our_position" — where we stand vs competitors
- "alerts" — array of high-priority alerts requiring immediate attention
- "strategic_recommendations" — 5-10 strategic recommendations

Return JSON.`;

    const response = await llm(base44, prompt, {
      type: "object",
      properties: {
        competitor_analyses: {
          type: "array",
          items: {
            type: "object",
            properties: {
              domain: { type: "string" },
              threat_level: { type: "string" },
              strengths: { type: "array", items: { type: "string" } },
              weaknesses: { type: "array", items: { type: "string" } },
              content_strategy: { type: "string" },
              seo_visibility: { type: "number" },
              pricing_strategy: { type: "string" },
              social_presence: { type: "string" },
              review_sentiment: { type: "string" },
              recent_changes: { type: "array", items: { type: "string" } },
              opportunities: { type: "array", items: { type: "string" } },
              recommended_actions: { type: "array", items: { type: "string" } }
            }
          }
        },
        competitive_landscape: { type: "string" },
        our_position: { type: "string" },
        alerts: { type: "array", items: { type: "string" } },
        strategic_recommendations: { type: "array", items: { type: "string" } }
      }
    });

    const result = { industry, our_domain, monitoring: response };
    await logReceipt(base44, "monitorCompetitors", "monitor", "success", { industry, competitorCount: competitors.length }, { alerts: response?.alerts?.length || 0 });
    return ok(result);
  } catch (error: any) {
    return fail(error.message || "Failed to monitor competitors");
  }
}