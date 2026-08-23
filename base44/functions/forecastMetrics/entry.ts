import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { llm, logReceipt, jsonBody, ok, fail } from "../../shared/capabilityHelpers.ts";

// AI Predictive Analytics — forecasts traffic, leads, and revenue
// based on historical data and market trends.
// Ingested from: HubSpot, Salesforce Einstein, Clari.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail("Unauthorized", 401);

    const { historical_data, forecast_horizon, metrics, industry, growth_assumptions } = await jsonBody(req);
    if (!historical_data) return fail("historical_data required", 400);

    const horizon = forecast_horizon || "6 months";
    const metricList = metrics || ["traffic", "leads", "revenue", "rankings"];

    const prompt = `You are a predictive analytics engine. Forecast the following metrics based on historical data and market trends.

Industry: ${industry || "local service"}
Forecast Horizon: ${horizon}
Metrics to Forecast: ${metricList.join(", ")}
Growth Assumptions: ${JSON.stringify(growth_assumptions || { content_velocity: "2x current", backlink_velocity: "steady", seasonality: "normal" })}

Historical Data:
${JSON.stringify(historical_data, null, 2).slice(0, 5000)}

For each metric, provide:
1. "forecast" — array of monthly forecasts, each with { month, value, confidence_low, confidence_high }
2. "trend" — overall trend (growing/declining/stable)
3. "growth_rate" — projected month-over-month growth rate
4. "key_drivers" — array of factors driving this forecast
5. "risks" — array of risks that could impact the forecast
6. "confidence_level" — 0-100

Also provide:
- "scenario_analysis" — { optimistic, realistic, pessimistic } forecasts
- "seasonal_adjustments" — any seasonal patterns detected
- "benchmark_comparison" — how these forecasts compare to industry benchmarks
- "recommendations" — 5-10 recommendations to improve the forecast
- "milestone_projections" — when key milestones will be hit

Return JSON.`;

    const response = await llm(base44, prompt, {
      type: "object",
      properties: {
        metric_forecasts: {
          type: "object",
          additionalProperties: {
            type: "object",
            properties: {
              forecast: { type: "array", items: { type: "object", additionalProperties: true } },
              trend: { type: "string" },
              growth_rate: { type: "string" },
              key_drivers: { type: "array", items: { type: "string" } },
              risks: { type: "array", items: { type: "string" } },
              confidence_level: { type: "number" }
            }
          }
        },
        scenario_analysis: { type: "object", additionalProperties: true },
        seasonal_adjustments: { type: "string" },
        benchmark_comparison: { type: "string" },
        recommendations: { type: "array", items: { type: "string" } },
        milestone_projections: { type: "array", items: { type: "string" } }
      }
    });

    const result = { horizon, metrics: metricList, forecast: response };
    await logReceipt(base44, "forecastMetrics", "forecast", "success", { horizon, metrics: metricList }, { metrics: Object.keys(response?.metric_forecasts || {}).length });
    return ok(result);
  } catch (error: any) {
    return fail(error.message || "Failed to forecast metrics");
  }
}