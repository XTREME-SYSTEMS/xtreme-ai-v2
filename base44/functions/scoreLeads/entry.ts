import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { llm, logReceipt, jsonBody, ok, fail } from "../../shared/capabilityHelpers.ts";

// AI Lead Scoring Engine — scores leads based on behavior, firmographics,
// and intent signals. Ingested from: Apollo, HubSpot, ZoomInfo, MadKudu.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail("Unauthorized", 401);

    const { leads, industry, scoring_model } = await jsonBody(req);
    if (!leads || !Array.isArray(leads)) return fail("leads array required", 400);

    const prompt = `You are an AI lead scoring engine. Score each lead on a 0-100 scale based on their likelihood to convert.

Industry: ${industry || "local service"}
Scoring Model: ${scoring_model || "default — behavior + firmographics + intent"}

Leads to score:
${JSON.stringify(leads.slice(0, 50), null, 2)}

For each lead, provide:
1. lead_id (from input)
2. score (0-100)
3. tier (hot / warm / cold)
4. confidence (0-100)
5. top_factors (array of 3-5 factors that influenced the score)
6. recommended_action (e.g. "call immediately", "nurture sequence", "disqualify")
7. estimated_value (estimated deal value if known)

Return JSON with a "scored_leads" array.`;

    const response = await llm(base44, prompt, {
      type: "object",
      properties: {
        scored_leads: {
          type: "array",
          items: {
            type: "object",
            properties: {
              lead_id: { type: "string" },
              score: { type: "number" },
              tier: { type: "string" },
              confidence: { type: "number" },
              top_factors: { type: "array", items: { type: "string" } },
              recommended_action: { type: "string" },
              estimated_value: { type: "string" }
            }
          }
        }
      }
    });

    const result = { industry, totalScored: response?.scored_leads?.length || 0, scored_leads: response?.scored_leads || [] };
    await logReceipt(base44, "scoreLeads", "score", "success", { industry, leadCount: leads.length }, { scored: response?.scored_leads?.length || 0 });
    return ok(result);
  } catch (error: any) {
    return fail(error.message || "Failed to score leads");
  }
}