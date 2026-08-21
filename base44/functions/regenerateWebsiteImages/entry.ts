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
    } = body;

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