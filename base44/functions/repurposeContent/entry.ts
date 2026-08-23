import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { llm, logReceipt, jsonBody, ok, fail } from "../../shared/capabilityHelpers.ts";

// AI Content Repurposing Engine — transforms content from one format
// into multiple other formats (blog → social → video → email → etc).
// Ingested from: Jasper, Writer.com.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail("Unauthorized", 401);

    const { source_content, source_type, target_formats, brand_voice, industry } = await jsonBody(req);
    if (!source_content) return fail("source_content required", 400);

    const targets = target_formats || ["social_posts", "email_newsletter", "video_script", "infographic_text", "podcast_outline"];

    const prompt = `You are an expert content repurposing engine. Transform the following ${source_type || "blog post"} into multiple formats while preserving the core message and value.

Source Content:
${source_content}

Brand Voice: ${brand_voice || "professional, informative, engaging"}
Industry: ${industry || "local service"}

Target Formats: ${targets.join(", ")}

For each target format, generate the repurposed content:
1. social_posts — 5 social media posts (each with platform, caption, hashtags)
2. email_newsletter — a full email newsletter (subject, preview, body, CTA)
3. video_script — a 60-90 second video script (scene descriptions + voiceover)
4. infographic_text — key stats and text points for an infographic
5. podcast_outline — a podcast episode outline with talking points
6. carousel — a LinkedIn/Instagram carousel (5-7 slides with text)
7. thread — a Twitter/X thread (5-10 tweets)

Only generate the formats requested. Return JSON with a "repurposed" object keyed by format name.`;

    const response = await llm(base44, prompt, {
      type: "object",
      additionalProperties: true
    });

    const result = { source_type, target_formats: targets, repurposed: response };
    await logReceipt(base44, "repurposeContent", "repurpose", "success", { source_type, targets }, { formats: Object.keys(response || {}).length });
    return ok(result);
  } catch (error: any) {
    return fail(error.message || "Failed to repurpose content");
  }
}