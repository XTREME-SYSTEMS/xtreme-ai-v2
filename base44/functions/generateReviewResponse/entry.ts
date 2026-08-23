import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { llm, logReceipt, jsonBody, ok, fail } from "../../shared/capabilityHelpers.ts";

// AI Review Response Generator — generates professional replies to
// customer reviews (positive and negative). Ingested from: Birdeye, Reputation.com.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail("Unauthorized", 401);

    const { business_name, review_text, rating, platform, reviewer_name, industry, tone } = await jsonBody(req);
    if (!review_text) return fail("review_text required", 400);

    const prompt = `You are a reputation management expert. Write a professional, empathetic response to the following customer review.

Business: ${business_name || "N/A"}
Industry: ${industry || "local service"}
Platform: ${platform || "Google"}
Reviewer: ${reviewer_name || "Customer"}
Rating: ${rating || "unknown"}/5
Tone: ${tone || "professional, grateful, and authentic"}

Review:
${review_text}

Guidelines:
- For positive reviews: thank them, mention something specific from their review, invite them back
- For negative reviews: apologize sincerely, address their specific concern, offer to make it right offline, don't be defensive
- For neutral reviews: thank them, highlight a positive, address any concern, invite feedback
- Keep it 50-150 words
- Never argue or blame the customer
- Include a subtle CTA for negative reviews (contact us directly to resolve)

Provide 3 response variations:
1. "response_1" — standard professional response
2. "response_2" — warmer, more personal response
3. "response_3" — concise response

Also provide:
4. "sentiment" — positive/negative/neutral
5. "key_concerns" — array of specific concerns mentioned in the review
6. "escalation_needed" — boolean, whether this needs manager attention
7. "follow_up_action" — recommended internal follow-up action

Return JSON.`;

    const response = await llm(base44, prompt, {
      type: "object",
      properties: {
        response_1: { type: "string" },
        response_2: { type: "string" },
        response_3: { type: "string" },
        sentiment: { type: "string" },
        key_concerns: { type: "array", items: { type: "string" } },
        escalation_needed: { type: "boolean" },
        follow_up_action: { type: "string" }
      }
    });

    const result = { business_name, rating, reviewResponse: response };
    await logReceipt(base44, "generateReviewResponse", "generate", "success", { business_name, rating, platform }, { sentiment: response?.sentiment });
    return ok(result);
  } catch (error: any) {
    return fail(error.message || "Failed to generate review response");
  }
}