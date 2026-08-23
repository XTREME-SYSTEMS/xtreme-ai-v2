import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { llm, logReceipt, jsonBody, ok, fail } from "../../shared/capabilityHelpers.ts";

// AI Page Speed Optimizer — analyzes Core Web Vitals and provides
// fix recommendations. Ingested from: Google PageSpeed, Cloudflare.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail("Unauthorized", 401);

    const { url, page_data, metrics } = await jsonBody(req);
    if (!url && !page_data) return fail("url or page_data required", 400);

    const prompt = `You are a Core Web Vitals and page speed optimization expert. Analyze the following page and provide specific fix recommendations.

URL: ${url || "N/A"}
Current Metrics: ${JSON.stringify(metrics || { lcp: "unknown", cls: "unknown", fid: "unknown", fcp: "unknown", ttfb: "unknown", speed_index: "unknown" })}
Page Data: ${JSON.stringify(page_data || {}).slice(0, 3000)}

Provide:
1. "performance_score" (0-100)
2. "core_web_vitals_assessment" — pass/fail for LCP, CLS, INP/FID, FCP, TTFB
3. "issues" — array of specific performance issues, each with:
   - metric (which CWV metric it affects)
   - issue (description)
   - severity (critical/high/medium/low)
   - estimated_impact (estimated improvement in ms or points)
4. "fixes" — array of specific code/config fixes, each with:
   - issue_ref (which issue this fixes)
   - fix_description (what to do)
   - fix_code (actual code snippet if applicable)
   - priority (critical/high/medium/low)
5. "quick_wins" — 3-5 changes with immediate impact
6. "estimated_improvement" — projected score after all fixes
7. "monitoring_recommendations" — what to track going forward

Return JSON.`;

    const response = await llm(base44, prompt, {
      type: "object",
      properties: {
        performance_score: { type: "number" },
        core_web_vitals_assessment: { type: "object", additionalProperties: true },
        issues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              metric: { type: "string" },
              issue: { type: "string" },
              severity: { type: "string" },
              estimated_impact: { type: "string" }
            }
          }
        },
        fixes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              issue_ref: { type: "string" },
              fix_description: { type: "string" },
              fix_code: { type: "string" },
              priority: { type: "string" }
            }
          }
        },
        quick_wins: { type: "array", items: { type: "string" } },
        estimated_improvement: { type: "number" },
        monitoring_recommendations: { type: "array", items: { type: "string" } }
      }
    });

    const result = { url, analysis: response };
    await logReceipt(base44, "optimizePageSpeed", "analyze", "success", { url }, { score: response?.performance_score });
    return ok(result);
  } catch (error: any) {
    return fail(error.message || "Failed to optimize page speed");
  }
}