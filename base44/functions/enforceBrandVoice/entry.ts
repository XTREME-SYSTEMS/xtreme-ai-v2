import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { llm, logReceipt, jsonBody, ok, fail } from "../../shared/capabilityHelpers.ts";

// AI Brand Voice Enforcer — checks content consistency against brand
// voice guidelines and suggests corrections.
// Ingested from: Writer.com, Grammarly, Jasper.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail("Unauthorized", 401);

    const { brand_voice, brand_guidelines, content, content_type } = await jsonBody(req);
    if (!content || !brand_voice) return fail("content and brand_voice required", 400);

    const prompt = `You are a brand voice consistency checker. Analyze the following content against the brand voice guidelines and identify inconsistencies.

Brand Voice: ${brand_voice}
Brand Guidelines: ${brand_guidelines || "Maintain consistent tone, terminology, and messaging across all content."}
Content Type: ${content_type || "marketing copy"}

Content to check:
${content}

Provide:
1. consistency_score (0-100)
2. issues (array of specific inconsistencies found, each with: location, issue, severity: high/medium/low)
3. corrections (array of suggested corrections, each with: original, corrected, reason)
4. tone_analysis (analysis of the content's tone vs the brand voice)
5. terminology_check (any off-brand terms used)
6. recommendations (3-5 recommendations for improving brand consistency)

Return JSON.`;

    const response = await llm(base44, prompt, {
      type: "object",
      properties: {
        consistency_score: { type: "number" },
        issues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              location: { type: "string" },
              issue: { type: "string" },
              severity: { type: "string" }
            }
          }
        },
        corrections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              original: { type: "string" },
              corrected: { type: "string" },
              reason: { type: "string" }
            }
          }
        },
        tone_analysis: { type: "string" },
        terminology_check: { type: "array", items: { type: "string" } },
        recommendations: { type: "array", items: { type: "string" } }
      }
    });

    const result = { content_type, analysis: response };
    await logReceipt(base44, "enforceBrandVoice", "check", "success", { content_type, contentLen: content.length }, { score: response?.consistency_score });
    return ok(result);
  } catch (error: any) {
    return fail(error.message || "Failed to enforce brand voice");
  }
}