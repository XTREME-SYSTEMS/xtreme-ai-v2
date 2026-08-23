import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { llm, logReceipt, jsonBody, ok, fail } from "../../shared/capabilityHelpers.ts";

// AI Marketing Mix Modeling — multi-touch attribution and channel ROI modeling.
// Ingested from: HubSpot, Google Analytics, Rockerbox.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail("Unauthorized", 401);

    const { channels, spend_data, conversion_data, time_period, business_name } = await jsonBody(req);
    if (!channels) return fail("channels required", 400);

    const prompt = `You are a marketing mix modeling and attribution engine. Analyze channel performance and ROI.

Business: ${business_name || "N/A"}
Time Period: ${time_period || "last 90 days"}
Channels: ${JSON.stringify(channels || ["seo", "ppc", "social", "email", "direct", "referral"])}
Spend Data: ${JSON.stringify(spend_data || {})}
Conversion Data: ${JSON.stringify(conversion_data || {})}

Provide:
1. "channel_analysis" — for each channel:
   - channel_name
   - spend (estimated spend)
   - conversions (attributed conversions)
   - cpa (cost per acquisition)
   - roas (return on ad spend)
   - contribution (percentage of total conversions)
   - efficiency_score (0-100)
   - trend (growing/declining/stable)
   - recommendation (increase/decrease/maintain)

2. "attribution_models" — compare different attribution models:
   - first_touch
   - last_touch
   - linear
   - time_decay
   - position_based
   - data_driven

3. "channel_synergies" — which channels work best together
4. "budget_optimization" — recommended budget reallocation for maximum ROI
5. "marginal_roi" — ROI of the next dollar spent on each channel
6. "saturation_analysis" — which channels are approaching saturation
7. "seasonal_patterns" — seasonal channel performance patterns
8. "recommendations" — 10 strategic recommendations

Return JSON.`;

    const response = await llm(base44, prompt, {
      type: "object",
      properties: {
        channel_analysis: {
          type: "array",
          items: {
            type: "object",
            properties: {
              channel_name: { type: "string" },
              spend: { type: "string" },
              conversions: { type: "number" },
              cpa: { type: "string" },
              roas: { type: "string" },
              contribution: { type: "string" },
              efficiency_score: { type: "number" },
              trend: { type: "string" },
              recommendation: { type: "string" }
            }
          }
        },
        attribution_models: { type: "object", additionalProperties: true },
        channel_synergies: { type: "array", items: { type: "string" } },
        budget_optimization: { type: "object", additionalProperties: true },
        marginal_roi: { type: "object", additionalProperties: true },
        saturation_analysis: { type: "array", items: { type: "string" } },
        seasonal_patterns: { type: "string" },
        recommendations: { type: "array", items: { type: "string" } }
      }
    });

    const result = { business_name, time_period, mixModel: response };
    await logReceipt(base44, "modelMarketingMix", "model", "success", { business_name, channels }, { channels: response?.channel_analysis?.length || 0 });
    return ok(result);
  } catch (error: any) {
    return fail(error.message || "Failed to model marketing mix");
  }
}