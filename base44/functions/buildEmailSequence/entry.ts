import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { llm, logReceipt, jsonBody, ok, fail } from "../../shared/capabilityHelpers.ts";

// AI Email Sequence Builder — generates automated email drip campaigns.
// Ingested from: Mailchimp, Klaviyo, HubSpot.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail("Unauthorized", 401);

    const { business_name, industry, sequence_type, audience, goal, num_emails, tone } = await jsonBody(req);
    if (!business_name) return fail("business_name required", 400);

    const count = num_emails || 5;
    const seqType = sequence_type || "nurture";

    const prompt = `You are an expert email marketing strategist. Build a ${count}-email ${seqType} sequence for:

Business: ${business_name}
Industry: ${industry || "local service"}
Audience: ${audience || "potential customers"}
Goal: ${goal || "convert prospects into paying customers"}
Tone: ${tone || "professional, friendly, value-driven"}

For each email in the sequence, provide:
1. email_number (1 to ${count})
2. subject_line (compelling, under 60 chars)
3. preview_text (under 100 chars)
4. body (full email body, 150-250 words, with personalization tokens like [First Name])
5. cta (clear call-to-action)
6. send_delay (when to send after previous email, e.g. "Day 0", "Day 2", "Day 5")
7. purpose (why this email exists in the sequence)

Return JSON with an "emails" array.`;

    const response = await llm(base44, prompt, {
      type: "object",
      properties: {
        emails: {
          type: "array",
          items: {
            type: "object",
            properties: {
              email_number: { type: "number" },
              subject_line: { type: "string" },
              preview_text: { type: "string" },
              body: { type: "string" },
              cta: { type: "string" },
              send_delay: { type: "string" },
              purpose: { type: "string" }
            }
          }
        }
      }
    });

    const result = { business_name, sequence_type: seqType, emailCount: count, sequence: response };
    await logReceipt(base44, "buildEmailSequence", "generate", "success", { business_name, seqType, count }, { emails: response?.emails?.length || 0 });
    return ok(result);
  } catch (error: any) {
    return fail(error.message || "Failed to build email sequence");
  }
}