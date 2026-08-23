import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { llm, logReceipt, jsonBody, ok, fail } from "../../shared/capabilityHelpers.ts";

// AI Keyword Clustering — groups keywords into topic clusters for
// content planning and topical authority. Ingested from: Surfer SEO, Keyword Insights.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail("Unauthorized", 401);

    const { keywords, industry, location, min_cluster_size, max_clusters } = await jsonBody(req);
    if (!keywords || !Array.isArray(keywords)) return fail("keywords array required", 400);

    const prompt = `You are a keyword clustering and topical authority engine. Group the following keywords into semantic topic clusters for content planning.

Industry: ${industry || "local service"}
Location: ${location || "N/A"}
Min Cluster Size: ${min_cluster_size || 3}
Max Clusters: ${max_clusters || 15}

Keywords:
${JSON.stringify(keywords.slice(0, 500), null, 2)}

Group keywords into topic clusters based on:
1. Semantic similarity (same search intent)
2. Search intent (informational, commercial, transactional, navigational)
3. Funnel stage (top, middle, bottom)
4. Local vs national intent

For each cluster, provide:
1. cluster_name (a descriptive name for the topic cluster)
2. pillar_keyword (the primary keyword for this cluster)
3. keywords (array of all keywords in this cluster)
4. search_intent (informational/commercial/transactional/navigational)
5. funnel_stage (top/middle/bottom)
6. difficulty (0-100, how hard to rank for this cluster)
7. priority (high/medium/low)
8. content_type (what type of content to create: pillar page, listicle, guide, service page, FAQ, comparison)
9. estimated_traffic (estimated total monthly search volume for this cluster)
10. internal_linking (which other clusters this should link to)

Also provide:
- "topical_authority_map" — how clusters relate to each other
- "content_gap_clusters" — clusters where we have no content yet
- "priority_order" — recommended order to create content

Return JSON.`;

    const response = await llm(base44, prompt, {
      type: "object",
      properties: {
        clusters: {
          type: "array",
          items: {
            type: "object",
            properties: {
              cluster_name: { type: "string" },
              pillar_keyword: { type: "string" },
              keywords: { type: "array", items: { type: "string" } },
              search_intent: { type: "string" },
              funnel_stage: { type: "string" },
              difficulty: { type: "number" },
              priority: { type: "string" },
              content_type: { type: "string" },
              estimated_traffic: { type: "string" },
              internal_linking: { type: "array", items: { type: "string" } }
            }
          }
        },
        topical_authority_map: { type: "string" },
        content_gap_clusters: { type: "array", items: { type: "string" } },
        priority_order: { type: "array", items: { type: "string" } }
      }
    });

    const result = { industry, keywordCount: keywords.length, clustering: response };
    await logReceipt(base44, "clusterKeywords", "cluster", "success", { industry, keywordCount: keywords.length }, { clusters: response?.clusters?.length || 0 });
    return ok(result);
  } catch (error: any) {
    return fail(error.message || "Failed to cluster keywords");
  }
}