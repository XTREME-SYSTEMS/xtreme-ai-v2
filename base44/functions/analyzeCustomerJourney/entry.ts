import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { llm, logReceipt, jsonBody, ok, fail } from "../../shared/capabilityHelpers.ts";

// AI Customer Journey Mapping — maps and analyzes customer journeys
// from first touch to conversion. Ingested from: HubSpot, Adobe Analytics.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail("Unauthorized", 401);

    const { business_name, industry, touchpoints, conversion_data, customer_segments } = await jsonBody(req);
    if (!business_name) return fail("business_name required", 400);

    const prompt = `You are a customer journey mapping engine. Map and analyze the customer journey from first touch to conversion.

Business: ${business_name}
Industry: ${industry || "local service"}
Touchpoints: ${JSON.stringify(touchpoints || ["google_search", "website_visit", "content_engagement", "form_fill", "phone_call", "email_signup", "consultation", "purchase"])}
Conversion Data: ${JSON.stringify(conversion_data || {})}
Customer Segments: ${JSON.stringify(customer_segments || ["new_visitor", "returning_visitor", "lead", "customer"])}

Provide:
1. "journey_stages" — array of journey stages, each with:
   - stage_name (Awareness, Consideration, Decision, Retention, Advocacy)
   - touchpoints (array of touchpoints in this stage)
   - customer_actions (what the customer does)
   - business_actions (what the business should do)
   - emotions (customer emotional state)
   - pain_points (friction in this stage)
   - opportunities (improvement opportunities)
2. "segment_journeys" — different journey paths by customer segment
3. "touchpoint_analysis" — each touchpoint with:
   - name
   - stage
   - conversion_rate
   - drop_off_rate
   - time_spent
   - optimization_score
4. "bottlenecks" — array of journey bottlenecks with fix recommendations
5. "quick_wins" — 3-5 quick journey improvements
6. "automation_opportunities" — where journeys can be automated
7. "personalization_opportunities" — where personalization can improve journeys
8. "measurement_plan" — KPIs to track for each stage

Return JSON.`;

    const response = await llm(base44, prompt, {
      type: "object",
      properties: {
        journey_stages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              stage_name: { type: "string" },
              touchpoints: { type: "array", items: { type: "string" } },
              customer_actions: { type: "array", items: { type: "string" } },
              business_actions: { type: "array", items: { type: "string" } },
              emotions: { type: "string" },
              pain_points: { type: "array", items: { type: "string" } },
              opportunities: { type: "array", items: { type: "string" } }
            }
          }
        },
        segment_journeys: { type: "object", additionalProperties: true },
        touchpoint_analysis: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              stage: { type: "string" },
              conversion_rate: { type: "string" },
              drop_off_rate: { type: "string" },
              time_spent: { type: "string" },
              optimization_score: { type: "number" }
            }
          }
        },
        bottlenecks: { type: "array", items: { type: "string" } },
        quick_wins: { type: "array", items: { type: "string" } },
        automation_opportunities: { type: "array", items: { type: "string" } },
        personalization_opportunities: { type: "array", items: { type: "string" } },
        measurement_plan: { type: "array", items: { type: "string" } }
      }
    });

    const result = { business_name, journey: response };
    await logReceipt(base44, "analyzeCustomerJourney", "analyze", "success", { business_name, industry }, { stages: response?.journey_stages?.length || 0 });
    return ok(result);
  } catch (error: any) {
    return fail(error.message || "Failed to analyze customer journey");
  }
}