import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Generates a matched before/after image pair for a local service business.
// Both images depict the SAME space/angle — one "before" (the problem/worn
// state) and one "after" (the completed, polished result) — so they work in
// an interactive slider component. Uses a vision-guided two-step generation:
// first the "after" (the hero result), then the "before" using the after as a
// composition reference so the angle/framing matches.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { industry, subIndustry, service, location, businessName } = body;
    const ind = industry || "local service business";
    const subInd = subIndustry || "";
    const svc = service || "";
    const loc = location || "";
    const biz = businessName || "this business";

    // 1) Build matched prompts — same room/angle, two states.
    const planRes = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a commercial photographer art-directing a before/after pair for a local service business website slider. Both photos must show the SAME exact space from the SAME angle — only the state changes.

BUSINESS: ${biz}
INDUSTRY: ${ind}${subInd ? ` (${subInd})` : ""}
SERVICE: ${svc || "their core service"}
LOCATION: ${loc || "n/a"}

Write TWO image prompts:
1. afterPrompt — the completed, polished result of the service in this space. Photorealistic, 8k, professional lighting, magazine quality, no text, no watermark, no visible faces.
2. beforePrompt — the SAME space and angle BEFORE the work: worn/damaged/unfinished/problem state. Same composition, lighting direction, and framing as the after, so they align in a slider. Photorealistic, 8k, no text, no watermark, no visible faces.

Each prompt is one self-contained sentence.

Return JSON: { "afterPrompt": string, "beforePrompt": string, "caption": string }`,
      model: "gemini_3_flash",
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          afterPrompt: { type: "string" },
          beforePrompt: { type: "string" },
          caption: { type: "string" },
        },
      },
    });

    const afterPrompt = (planRes && planRes.afterPrompt) || `Photorealistic completed ${svc || ind} result in a ${loc || "local"} home, 8k, professional lighting, no text`;
    const beforePrompt = (planRes && planRes.beforePrompt) || `Photorealistic worn damaged ${svc || ind} problem in the same ${loc || "local"} home before work, same angle, 8k, no text`;
    const caption = (planRes && planRes.caption) || `${svc || ind} before and after`;

    // 2) Generate the "after" first — it's the hero result.
    let afterUrl = "";
    try {
      const r = await base44.integrations.Core.GenerateImage({ prompt: afterPrompt });
      if (r?.url) afterUrl = r.url;
    } catch (err) {
      console.error("after image gen failed", err?.message || err);
    }

    // 3) Generate the "before" using the after as a composition reference so
    // the angle/framing matches for a clean slider.
    let beforeUrl = "";
    try {
      const r = await base44.integrations.Core.GenerateImage({
        prompt: beforePrompt,
        existing_image_urls: afterUrl ? [afterUrl] : undefined,
      });
      if (r?.url) beforeUrl = r.url;
    } catch (err) {
      console.error("before image gen failed", err?.message || err);
    }

    return Response.json({ ok: true, beforeUrl, afterUrl, caption, beforePrompt, afterPrompt });
  } catch (error) {
    console.error("generateBeforeAfter error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}