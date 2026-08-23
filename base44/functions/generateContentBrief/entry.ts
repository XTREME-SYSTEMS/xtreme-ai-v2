import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { llm, logReceipt, jsonBody, ok, fail } from "../../shared/capabilityHelpers.ts";

// AI Content Brief Generator — generates SEO-optimized content briefs
// for writers. Ingested from: Surfer SEO, Frase, MarketMuse.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail("Unauthorized", 401);

    const { keyword, industry, target_audience, word_count, content_type, competitors } = await jsonBody(req);
    if (!keyword) return fail("keyword required", 400);

    const prompt = `You are an SEO content brief generator. Create a comprehensive content brief for a writer to produce a high-ranking piece of content.

Target Keyword: ${keyword}
Industry: ${industry || "local service"}
Target Audience: ${target_audience || "potential customers"}
Word Count: ${word_count || 1500}
Content Type: ${content_type || "blog post"}
Top Competitors: ${JSON.stringify(competitors || [])}

Generate a complete content brief including:
1. "title" — SEO-optimized title (under 60 chars)
2. "meta_description" — under 160 chars
3. "target_word_count" — recommended word count
4. "content_structure" — full H1/H2/H3 outline with section descriptions
5. "key_points" — array of key points to cover in each section
6. "entities_to_include" — array of entities/topics that should be mentioned (for NLP/AEO)
7. "questions_to_answer" — array of questions the content should answer (for FAQ/AEO)
8. "internal_links" — array of suggested internal link anchors
9. "external_links" — array of suggested authoritative external sources to link to
10. "image_suggestions" — array of image descriptions for the content
11. "schema_markup" — recommended schema type (FAQ, HowTo, Article, etc.)
12. "aeo_optimization" — answer blocks to include for AI search engines
13. "semantic_keywords" — array of LSI/semantic keywords to include naturally
14. "search_intent" — the search intent this content satisfies
15. "funnel_stage" — top/middle/bottom
16. "cta" — recommended call-to-action
17. "writing_guidelines" — tone, style, and formatting guidelines

Return JSON.`;

    const response = await llm(base44, prompt, {
      type: "object",
      properties: {
        title: { type: "string" },
        meta_description: { type: "string" },
        target_word_count: { type: "number" },
        content_structure: { type: "array", items: { type: "object", additionalProperties: true } },
        key_points: { type: "array", items: { type: "string" } },
        entities_to_include: { type: "array", items: { type: "string" } },
        questions_to_answer: { type: "array", items: { type: "string" } },
        internal_links: { type: "array", items: { type: "string" } },
        external_links: { type: "array", items: { type: "string" } },
        image_suggestions: { type: "array", items: { type: "string" } },
        schema_markup: { type: "string" },
        aeo_optimization: { type: "array", items: { type: "string" } },
        semantic_keywords: { type: "array", items: { type: "string" } },
        search_intent: { type: "string" },
        funnel_stage: { type: "string" },
        cta: { type: "string" },
        writing_guidelines: { type: "string" }
      }
    });

    const result = { keyword, brief: response };
    await logReceipt(base44, "generateContentBrief", "generate", "success", { keyword, content_type }, { wordCount: response?.target_word_count });
    return ok(result);
  } catch (error: any) {
    return fail(error.message || "Failed to generate content brief");
  }
}