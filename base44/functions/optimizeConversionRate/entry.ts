import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { llm, logReceipt, jsonBody, ok, fail } from "../../shared/capabilityHelpers.ts";

// AI Conversion Rate Optimizer — analyzes a page/flow and provides
// CRO recommendations and A/B test suggestions.
// Ingested from: Optimizely, VWO, Unbounce.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail("Unauthorized", 401);

    const { page_url, page_content, industry, current_conversion_rate, traffic_volume, goal } = await jsonBody(req);
    if (!page_url && !page_content) return fail("page_url or page_content required", 400);

    const prompt = `You are an expert conversion rate optimization (CRO) specialist. Analyze the following page and provide actionable recommendations.

Page URL: ${page_url || "N/A"}
Industry: ${industry || "local service"}
Current Conversion Rate: ${current_conversion_rate || "unknown"}
Monthly Traffic: ${traffic_volume || "unknown"}
Primary Goal: ${goal || "lead capture / contact form submission"}

Page Content/Structure:
${page_content || "Analyze based on the URL and industry best practices."}

Provide:
1. overall_score (0-100, how well-optimized is this page)
2. top_issues (array of 5-10 specific issues hurting conversions)
3. recommendations (array of 8-15 specific, actionable recommendations with priority: critical/high/medium/low)
4. ab_test_ideas (array of 5 A/B test ideas with: test_name, hypothesis, expected_impact, control_variant, test_variant)
5. quick_wins (array of 3-5 changes that can be made immediately for quick conversion lifts)
6. estimated_lift (estimated conversion rate improvement if all recommendations are implemented)

Return JSON.`;

    const response = await llm(base44, prompt, {
      type: "object",
      properties: {
        overall_score: { type: "number" },
        top_issues: { type: "array", items: { type: "string" } },
        recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              issue: { type: "string" },
              recommendation: { type: "string" },
              priority: { type: "string" }
            }
          }
        },
        ab_test_ideas: {
          type: "array",
          items: {
            type: "object",
            properties: {
              test_name: { type: "string" },
              hypothesis: { type: "string" },
              expected_impact: { type: "string" },
              control_variant: { type: "string" },
              test_variant: { type: "string" }
            }
          }
        },
        quick_wins: { type: "array", items: { type: "string" } },
        estimated_lift: { type: "string" }
      }
    });

    const result = { page_url, analysis: response };
    await logReceipt(base44, "optimizeConversionRate", "analyze", "success", { page_url, industry }, { score: response?.overall_score });
    return ok(result);
  } catch (error: any) {
    return fail(error.message || "Failed to optimize conversion rate");
  }
}