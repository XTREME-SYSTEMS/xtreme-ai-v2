import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { llm, logReceipt, jsonBody, ok, fail } from "../../shared/capabilityHelpers.ts";

// AI Ad Creative Generator — generates ad copy + creative variations
// for Google Ads and Meta Ads from a business profile.
// Ingested from: Albert.ai, Predis.ai, Meta Ads, Google Ads.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail("Unauthorized", 401);

    const { business_name, industry, location, offer, platform, audience, tone } = await jsonBody(req);
    if (!business_name) return fail("business_name required", 400);

    const platforms = platform || ["google_search", "meta_facebook", "instagram"];
    const platformList = Array.isArray(platforms) ? platforms : [platforms];

    const prompt = `You are an expert digital advertising copywriter. Generate high-converting ad creatives for the following business:

Business: ${business_name}
Industry: ${industry || "local service"}
Location: ${location || "local"}
Offer: ${offer || "free consultation / quote"}
Target Audience: ${audience || "local homeowners and businesses"}
Tone: ${tone || "professional, trustworthy, urgent"}

Generate ad creatives for these platforms: ${platformList.join(", ")}

For each platform, provide:
1. 5 headline variations (within platform character limits)
2. 5 description/body variations
3. 3 call-to-action options
4. 3 creative image suggestions (visual descriptions for AI image generation)
5. Target keywords (for Google)
6. Audience targeting suggestions (for Meta)

Return JSON with a "platforms" array, each entry having: platform, headlines[], descriptions[], ctas[], image_suggestions[], keywords[], targeting{}}`;

    const response = await llm(base44, prompt, {
      type: "object",
      properties: {
        platforms: {
          type: "array",
          items: {
            type: "object",
            properties: {
              platform: { type: "string" },
              headlines: { type: "array", items: { type: "string" } },
              descriptions: { type: "array", items: { type: "string" } },
              ctas: { type: "array", items: { type: "string" } },
              image_suggestions: { type: "array", items: { type: "string" } },
              keywords: { type: "array", items: { type: "string" } },
              targeting: { type: "object" }
            }
          }
        }
      }
    });

    const result = { business_name, platformList, creatives: response };
    await logReceipt(base44, "generateAdCreative", "generate", "success", { business_name, platformList }, { platformCount: response?.platforms?.length || 0 });
    return ok(result);
  } catch (error: any) {
    return fail(error.message || "Failed to generate ad creatives");
  }
}