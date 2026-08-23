import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { llm, logReceipt, jsonBody, ok, fail } from "../../shared/capabilityHelpers.ts";

// AI Citation Tracking — tracks brand citations in AI answer engines
// (ChatGPT, Perplexity, Gemini, Copilot, Claude).
// Ingested from: Ayzeo, Otterly, Goodie AI.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail("Unauthorized", 401);

    const { brand_name, domain, industry, queries, competitors } = await jsonBody(req);
    if (!brand_name) return fail("brand_name required", 400);

    const queryList = queries || [
      `best ${industry || "local service"} near me`,
      `top ${industry || "local service"} companies`,
      `${brand_name} reviews`,
      `who are the leading ${industry || "service"} providers`,
      `${industry || "service"} cost calculator`,
    ];

    const prompt = `You are an AI answer engine citation tracker. Analyze how the following brand is cited across AI search engines.

Brand: ${brand_name}
Domain: ${domain || "N/A"}
Industry: ${industry || "local service"}
Competitors: ${JSON.stringify(competitors || [])}

Test Queries (these are the types of questions users ask AI engines):
${JSON.stringify(queryList, null, 2)}

Based on your knowledge of how AI answer engines (ChatGPT, Perplexity, Gemini, Copilot, Claude) generate responses, provide:

1. "citation_analysis" — for each AI engine, provide:
   - engine_name (ChatGPT, Perplexity, Gemini, Copilot, Claude)
   - brand_mentioned (boolean — is the brand likely to be mentioned)
   - citation_likelihood (0-100)
   - competitor_mentions (which competitors are more likely to be cited)
   - content_gaps (what content is missing that would earn citations)
   - recommended_actions (how to improve citation likelihood)

2. "answer_block_opportunities" — for each query, provide:
   - query
   - current_citation_status (cited/not_cited/competitor_cited)
   - recommended_answer_block (a 40-60 word answer block optimized for AI citation)
   - schema_recommendation (what schema to add)
   - content_location (where to publish this answer block)

3. "entity_optimization" — how to optimize the brand as an entity AI engines recognize:
   - entity_properties (what properties to establish)
   - knowledge_graph_signals (signals that build entity recognition)
   - wikipedia_worthiness (is the brand notable enough for Wikipedia)
   - schema_recommendations (what schema to implement)

4. "aeo_score" — 0-100 overall AEO visibility score
5. "competitor_aeo_comparison" — how competitors rank in AEO
6. "improvement_roadmap" — prioritized steps to improve AI citations

Return JSON.`;

    const response = await llm(base44, prompt, {
      type: "object",
      properties: {
        citation_analysis: {
          type: "array",
          items: {
            type: "object",
            properties: {
              engine_name: { type: "string" },
              brand_mentioned: { type: "boolean" },
              citation_likelihood: { type: "number" },
              competitor_mentions: { type: "array", items: { type: "string" } },
              content_gaps: { type: "array", items: { type: "string" } },
              recommended_actions: { type: "array", items: { type: "string" } }
            }
          }
        },
        answer_block_opportunities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              query: { type: "string" },
              current_citation_status: { type: "string" },
              recommended_answer_block: { type: "string" },
              schema_recommendation: { type: "string" },
              content_location: { type: "string" }
            }
          }
        },
        entity_optimization: {
          type: "object",
          properties: {
            entity_properties: { type: "array", items: { type: "string" } },
            knowledge_graph_signals: { type: "array", items: { type: "string" } },
            wikipedia_worthiness: { type: "string" },
            schema_recommendations: { type: "array", items: { type: "string" } }
          }
        },
        aeo_score: { type: "number" },
        competitor_aeo_comparison: { type: "string" },
        improvement_roadmap: { type: "array", items: { type: "string" } }
      }
    });

    const result = { brand_name, domain, aeoTracking: response };
    await logReceipt(base44, "trackAiCitations", "track", "success", { brand_name, domain }, { aeoScore: response?.aeo_score });
    return ok(result);
  } catch (error: any) {
    return fail(error.message || "Failed to track AI citations");
  }
}