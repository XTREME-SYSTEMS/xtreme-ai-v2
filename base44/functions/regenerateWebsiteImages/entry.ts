import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Max-quality, industry-aware image generator. Compiles EVERYTHING the client
// told us in onboarding — industry, sub-industry, business type, location,
// services, differentiators, years in business, financial intelligence, and
// all dynamic industry answers — into a single rich brief, then asks the LLM
// to produce ultra-high-quality, specific image prompts tailored to that
// exact business. Each prompt is then sent to the image model.
//
// This replaces the old hardcoded epoxy-only prompt list so the generated
// gallery matches the client's actual trade, locale, and offering.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const {
      businessName, services, location, count,
      industry, subIndustry, businessType, differentiators,
      yearsInBusiness, financialIntelligence, industryAnswers,
      referenceImages,
    } = body;

    // ── Style-match mode ──────────────────────────────────────────────
    // When the client uploaded their own project photos, we analyze those
    // photos (vision LLM) to extract their style, subject matter, composition,
    // and quality principles, then generate NEW images that follow the same
    // principles — using the uploads as direct visual reference for the image
    // model. The result is a fresh, high-quality set that looks like the
    // client's real work without reusing the exact uploaded photos.
    const refs = Array.isArray(referenceImages) ? referenceImages.filter((u) => typeof u === "string" && u) : [];
    if (refs.length > 0) {
      return await generateStyleMatched(base44, refs, {
        businessName, services, location, count,
        industry, subIndustry, businessType, differentiators,
        yearsInBusiness, financialIntelligence, industryAnswers,
      });
    }

    const loc = location || "";
    const biz = businessName || "this business";
    const ind = industry || "local service business";
    const subInd = subIndustry || "";
    const bizType = businessType || "";
    const svc = (services && services.length) ? services.join(", ") : "";
    const diff = (differentiators && differentiators.length) ? differentiators.join("; ") : "";
    const yrs = yearsInBusiness || "";

    // Compile the full onboarding brief
    const briefParts = [
      `Business name: ${biz}`,
      `Industry: ${ind}${subInd ? ` (sub: ${subInd})` : ""}`,
      bizType ? `Business type: ${bizType}` : null,
      loc ? `Primary location / service area: ${loc}` : null,
      svc ? `Services offered: ${svc}` : null,
      diff ? `Differentiators / strengths: ${diff}` : null,
      yrs ? `Years in business: ${yrs}` : null,
    ].filter(Boolean);

    // Append financial intelligence
    if (financialIntelligence) {
      const fi = financialIntelligence;
      const fiParts = [];
      if (fi.competitorPricing?.length) fiParts.push(`Competitor pricing: ${fi.competitorPricing.map(c => `${c.name}: ${c.price || c.range || "N/A"}`).join("; ")}`);
      if (fi.averagePrice) fiParts.push(`Average market price: ${fi.averagePrice}`);
      if (fi.marketInsights) fiParts.push(`Market insights: ${fi.marketInsights}`);
      if (fiParts.length) briefParts.push(`FINANCIAL INTELLIGENCE:\n${fiParts.join("\n")}`);
    }

    // Append every dynamic industry answer the client gave
    if (industryAnswers && typeof industryAnswers === "object" && Object.keys(industryAnswers).length > 0) {
      const ans = Object.entries(industryAnswers)
        .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join("\n");
      briefParts.push(`CLIENT-SPECIFIC ONBOARDING ANSWERS:\n${ans}`);
    }

    const brief = briefParts.join("\n");
    const n = Math.min(Math.max(Number(count) || 6, 1), 8);

    // Ask the LLM to craft ultra-high-quality, specific image prompts from the
    // compiled brief. Each prompt must describe a real, photorealistic photo
    // of THIS business's actual work in THIS location — never generic stock.
    const prompt = `You are a master commercial photographer and art director. Below is the full onboarding brief for a real local business. Generate ${n} ultra-high-quality, photorealistic image prompts for a website gallery that showcases THIS business's actual work.

${brief}

Rules for every prompt:
- Each prompt must depict a REAL, photorealistic photo of work this exact business performs — the specific trade, materials, equipment, and results — NOT generic stock or unrelated scenes.
- Reference the real services and the real location/locale where natural (architecture, climate, setting typical of ${loc || "the area"}).
- Vary the shots: hero/wide shots, close-up detail, before-and-after style, interior and exterior, residential and commercial as fits the business type.
- Ultra-high quality: professional lighting, sharp focus, high dynamic range, 8k, magazine-grade commercial photography, no text, no watermark, no people's faces visible.
- Each prompt is a single self-contained sentence, ready to send to an image generator.

Return JSON: an array of ${n} strings, each a complete image prompt.`;

    let prompts: string[] = [];
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        model: "gemini_3_1_pro",
        response_json_schema: {
          type: "object",
          properties: {
            prompts: { type: "array", items: { type: "string" } },
          },
        },
      });
      prompts = (res && Array.isArray(res.prompts)) ? res.prompts.filter((p) => typeof p === "string" && p.trim()) : [];
    } catch (err) {
      console.error("prompt generation failed", err?.message || err);
    }

    // Fallback to a generic-but-industry-aware prompt set if the LLM call failed
    if (prompts.length === 0) {
      const primary = (svc.split(",")[0] || ind).trim();
      for (let i = 0; i < n; i++) {
        prompts.push(`Professional photorealistic photo of ${primary} work in ${loc || "a local setting"}, high quality, sharp focus, commercial photography, no text`);
      }
    }

    // Generate each image. Sequential to avoid rate limits; each takes ~5-10s.
    const images: string[] = [];
    for (let i = 0; i < n && i < prompts.length; i++) {
      try {
        const r = await base44.integrations.Core.GenerateImage({ prompt: prompts[i] });
        if (r?.url) images.push(r.url);
      } catch (err) {
        console.error("image gen failed", err?.message || err);
      }
    }

    return Response.json({ ok: true, images, prompts });
  } catch (error) {
    console.error("regenerateWebsiteImages error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}

// ── Style-match generation ────────────────────────────────────────────
// Analyzes the client's uploaded photos (vision) to extract the visual
// principles that define their work, then generates a fresh set of images
// that follow those same principles — using the uploads as direct visual
// reference for the image model.
async function generateStyleMatched(base44, refs, ctx) {
  const {
    businessName, services, location, count,
    industry, subIndustry, businessType, differentiators,
    yearsInBusiness, financialIntelligence, industryAnswers,
  } = ctx;

  const loc = location || "";
  const biz = businessName || "this business";
  const ind = industry || "local service business";
  const subInd = subIndustry || "";
  const bizType = businessType || "";
  const svc = (services && services.length) ? services.join(", ") : "";
  const diff = (differentiators && differentiators.length) ? differentiators.join("; ") : "";
  const yrs = yearsInBusiness || "";
  const n = Math.min(Math.max(Number(count) || 6, 1), 8);

  // 1) Vision analysis of the uploaded photos — extract the style principles.
  let styleBrief = "";
  let prompts: string[] = [];
  try {
    const analyzeRes = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a master commercial photographer and art director. Analyze the attached project photos from a real business and extract the visual principles that define them.

Business context:
- Business: ${biz}
- Industry: ${ind}${subInd ? ` (sub: ${subInd})` : ""}${bizType ? `\n- Business type: ${bizType}` : ""}
- Location: ${loc || "n/a"}
- Services: ${svc || "n/a"}
- Differentiators: ${diff || "n/a"}
- Years in business: ${yrs || "n/a"}

From the attached photos, extract:
1. subjectMatter — what work/results are actually shown (materials, equipment, settings, before/after, interior vs exterior, residential vs commercial)
2. composition — framing, angle, shot type (wide hero, close-up detail, mid-shot)
3. lighting — natural, bright, dramatic, soft, etc.
4. colorAndMood — palette, mood, cleanliness, polish level
5. qualityPrinciples — what makes these look professional (or what to elevate): sharpness, staging, clutter-free, etc.

Then write ${n} NEW ultra-high-quality image prompts that follow the SAME visual principles (same subject matter type, composition style, lighting, mood, and quality) but depict fresh scenes of this business's work in ${loc || "the local area"}. Each prompt must be a single self-contained sentence ready for an image generator, specifying photorealistic, 8k, professional commercial photography, no text, no watermark, no visible faces.

Return JSON: { "styleBrief": string, "prompts": string[${n}] }`,
      file_urls: refs.slice(0, 6),
      model: "gemini_3_1_pro",
      response_json_schema: {
        type: "object",
        properties: {
          styleBrief: { type: "string" },
          prompts: { type: "array", items: { type: "string" } },
        },
      },
    });
    styleBrief = (analyzeRes && typeof analyzeRes.styleBrief === "string") ? analyzeRes.styleBrief : "";
    prompts = (analyzeRes && Array.isArray(analyzeRes.prompts)) ? analyzeRes.prompts.filter((p) => typeof p === "string" && p.trim()) : [];
  } catch (err) {
    console.error("style analysis failed", err?.message || err);
  }

  // Fallback prompts if vision analysis failed — still industry-aware
  if (prompts.length === 0) {
    const primary = (svc.split(",")[0] || ind).trim();
    for (let i = 0; i < n; i++) {
      prompts.push(`Professional photorealistic photo of ${primary} work in ${loc || "a local setting"}, matching the client's uploaded project style, high quality, sharp focus, commercial photography, no text`);
    }
  }

  // 2) Generate each image using the uploaded photos as direct visual reference.
  // The image model uses existing_image_urls as style/subject reference, so
  // the new images follow the same principles as the uploads.
  const images: string[] = [];
  for (let i = 0; i < n && i < prompts.length; i++) {
    try {
      const r = await base44.integrations.Core.GenerateImage({
        prompt: prompts[i],
        existing_image_urls: refs.slice(0, 4),
      });
      if (r?.url) images.push(r.url);
    } catch (err) {
      console.error("style-matched image gen failed", err?.message || err);
    }
  }

  return Response.json({ ok: true, images, prompts, styleBrief });
}