import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { llm, logReceipt, jsonBody, ok, fail } from "../../shared/capabilityHelpers.ts";

// AI Internal Linking Engine — analyzes site pages and builds an
// optimized internal linking structure. Ingested from: Link Whisper, Surfer SEO.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail("Unauthorized", 401);

    const { pages, target_keywords, industry } = await jsonBody(req);
    if (!pages || !Array.isArray(pages)) return fail("pages array required", 400);

    const prompt = `You are an internal linking optimization engine. Analyze the following pages and build an optimal internal linking structure.

Industry: ${industry || "local service"}
Target Keywords: ${JSON.stringify(target_keywords || [])}

Pages:
${JSON.stringify(pages.slice(0, 100).map((p: any) => ({ url: p.url, title: p.title, content_summary: p.content_summary?.substring(0, 200), keywords: p.keywords })), null, 2)}

Provide:
1. "link_opportunities" — array of suggested internal links, each with:
   - source_page (URL of the page that should contain the link)
   - target_page (URL of the page being linked to)
   - anchor_text (recommended anchor text)
   - relevance_score (0-100)
   - reason (why this link makes sense)
2. "orphan_pages" — pages with no incoming internal links
3. "hub_pages" — pages that should serve as hub/content cluster centers
4. "link_depth_issues" — pages too deep in the site structure
5. "anchor_text_distribution" — analysis of current anchor text usage
6. "recommendations" — 5-10 strategic internal linking recommendations

Return JSON.`;

    const response = await llm(base44, prompt, {
      type: "object",
      properties: {
        link_opportunities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              source_page: { type: "string" },
              target_page: { type: "string" },
              anchor_text: { type: "string" },
              relevance_score: { type: "number" },
              reason: { type: "string" }
            }
          }
        },
        orphan_pages: { type: "array", items: { type: "string" } },
        hub_pages: { type: "array", items: { type: "string" } },
        link_depth_issues: { type: "array", items: { type: "string" } },
        anchor_text_distribution: { type: "string" },
        recommendations: { type: "array", items: { type: "string" } }
      }
    });

    const result = { industry, pageCount: pages.length, analysis: response };
    await logReceipt(base44, "buildInternalLinks", "analyze", "success", { industry, pageCount: pages.length }, { opportunities: response?.link_opportunities?.length || 0 });
    return ok(result);
  } catch (error: any) {
    return fail(error.message || "Failed to build internal links");
  }
}