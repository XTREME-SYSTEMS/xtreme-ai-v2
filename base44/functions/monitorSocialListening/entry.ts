import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { llm, logReceipt, jsonBody, ok, fail } from "../../shared/capabilityHelpers.ts";

// AI Social Listening — monitors brand mentions across social platforms
// and provides sentiment analysis. Ingested from: Sprout Social, Brandwatch.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail("Unauthorized", 401);

    const { brand_name, keywords, platforms, industry, time_range } = await jsonBody(req);
    if (!brand_name && !keywords) return fail("brand_name or keywords required", 400);

    const prompt = `You are a social listening and brand monitoring engine. Analyze brand mentions and sentiment across platforms.

Brand: ${brand_name || "N/A"}
Monitoring Keywords: ${JSON.stringify(keywords || [brand_name])}
Platforms: ${JSON.stringify(platforms || ["twitter", "facebook", "instagram", "linkedin", "reddit", "youtube", "tiktok"])}
Industry: ${industry || "local service"}
Time Range: ${time_range || "last 30 days"}

Based on your knowledge of social media patterns, provide:
1. "mention_summary" — overview of brand mentions
2. "sentiment_analysis" — { positive: number, negative: number, neutral: number, overall: string }
3. "top_mentions" — array of notable mentions, each with:
   - platform
   - author (handle/name)
   - content (summary of what was said)
   - sentiment (positive/negative/neutral)
   - reach (estimated reach)
   - engagement (estimated engagement)
   - url (if known)
4. "trending_topics" — array of trending topics related to the brand
5. "competitor_mentions" — how competitors are being discussed
6. "influencer_mentions" — any influencer mentions detected
7. "crisis_alerts" — array of mentions that need immediate attention
8. "opportunities" — array of engagement opportunities
9. "platform_breakdown" — mention volume by platform
10. "recommendations" — 5-10 actionable recommendations for social engagement

Return JSON.`;

    const response = await llm(base44, prompt, {
      type: "object",
      properties: {
        mention_summary: { type: "string" },
        sentiment_analysis: { type: "object", additionalProperties: true },
        top_mentions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              platform: { type: "string" },
              author: { type: "string" },
              content: { type: "string" },
              sentiment: { type: "string" },
              reach: { type: "string" },
              engagement: { type: "string" },
              url: { type: "string" }
            }
          }
        },
        trending_topics: { type: "array", items: { type: "string" } },
        competitor_mentions: { type: "array", items: { type: "string" } },
        influencer_mentions: { type: "array", items: { type: "string" } },
        crisis_alerts: { type: "array", items: { type: "string" } },
        opportunities: { type: "array", items: { type: "string" } },
        platform_breakdown: { type: "object", additionalProperties: true },
        recommendations: { type: "array", items: { type: "string" } }
      }
    });

    const result = { brand_name, listening: response };
    await logReceipt(base44, "monitorSocialListening", "monitor", "success", { brand_name, platforms }, { alerts: response?.crisis_alerts?.length || 0 });
    return ok(result);
  } catch (error: any) {
    return fail(error.message || "Failed to monitor social listening");
  }
}