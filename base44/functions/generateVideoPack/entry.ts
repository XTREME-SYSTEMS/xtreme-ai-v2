import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { compileBrief, briefText, photoStyleSuffix } from "../../shared/generatorBrief.ts";

// Video Generator: generates 10 video concept cards — each with a thumbnail
// image, a title, a short description, and a production script. Industry-aware:
// uses the client's actual industry instead of hardcoded "epoxy contractor".
// Uses the best AI model for script generation.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const {
      businessName, primaryLocation, services, contentTone, logoUrl,
      industry, subIndustry, businessType,
    } = body;

    const biz = businessName || "your business";
    const ind = industry || "epoxy flooring contractor";
    const subInd = subIndustry || "";
    const loc = primaryLocation || "";
    const svc = (services || []).join(", ") || "professional services";
    const tone = contentTone || "professional and trustworthy";
    const ref = logoUrl ? [logoUrl] : undefined;

    // Compile the full onboarding brief so thumbnails + scripts reflect the
    // client's visual style, signature work, differentiators, and pain points.
    const brief = compileBrief(body);
    const briefBlock = briefText(brief);
    const photo = photoStyleSuffix(brief);

    const CONCEPTS = [
      { id: "hero", title: "Brand Hero Video", desc: `A cinematic hero showing your best ${ind} work with your logo.`, prompt: `Cinematic hero video thumbnail for ${ind} "${biz}". Slow pan over professional work, dramatic lighting, professional, high-end.` },
      { id: "before-after", title: "Before & After", desc: `A satisfying before-and-after ${ind} transformation.`, prompt: `Before and after ${ind} transformation, split screen, professional photo, dramatic improvement.` },
      { id: "process", title: "The Process", desc: `Fast-paced time-lapse of a ${ind} project from start to finish.`, prompt: `Time-lapse of ${ind} work process: prep, execution, finishing. Professional at work.` },
      { id: "testimonial", title: "Customer Story", desc: `A happy customer reacts to their new ${ind} project.`, prompt: `A homeowner smiling and showing off their new ${ind} project, professional, warm lighting.` },
      { id: "commercial", title: "Commercial Project", desc: `A large commercial ${ind} project in progress.`, prompt: `A large commercial ${ind} project, wide angle, professional, industrial.` },
      { id: "tips", title: "3 Quick Tips", desc: `Educational short: 3 things to know before hiring a ${ind}.`, prompt: `A ${ind} professional pointing at finished work with text overlay space, educational, professional.` },
      { id: "showcase", title: "Quality Showcase", desc: `A close-up showcase of the quality and detail of your ${ind} work.`, prompt: `Close-up showcase of professional ${ind} work quality, detailed, professional lighting.` },
      { id: "specialty", title: "Specialty Service", desc: `A specialty ${ind} service being performed.`, prompt: `A specialty ${ind} service being performed, professional, focused, brand colors.` },
      { id: "team", title: "Meet the Team", desc: `Your crew introduces the business and what makes you different.`, prompt: `A team of ${ind} professionals standing in front of a completed project, professional, confident, brand colors.` },
      { id: "promo", title: "Free Quote Promo", desc: `A punchy promotional video offering a free quote.`, prompt: `A promotional video thumbnail for ${ind} "${biz}" offering a free quote, bold text space, professional background.` },
    ];

    // Generate 10 thumbnails in parallel.
    const imgResults = await Promise.allSettled(
      CONCEPTS.map(async (c) => {
        const r = await base44.integrations.Core.GenerateImage({
          prompt: `${c.prompt}${loc ? ` Located in ${loc}.` : ""} ${photo}`,
          existing_image_urls: ref,
        });
        return { id: c.id, title: c.title, description: c.desc, thumbnailUrl: r.url };
      })
    );
    const concepts = imgResults.map((r) => r.value).filter(Boolean);

    // Generate scripts using the best AI model.
    const scriptRes = await base44.integrations.Core.InvokeLLM({
      prompt: `Write a compelling video script for each of these 10 video concepts for ${ind} "${biz}"${subInd ? ` (${subInd})` : ""} in ${loc}.

CLIENT BRIEF:
${briefBlock}

Services: ${svc}. Tone: ${tone}. Make every script specific to the ${ind} industry. Weave in the client's DIFFERENTIATORS and SIGNATURE WORK. Speak directly to the CUSTOMER PAIN POINTS. Match the BRAND PERSONALITY. Each script should be punchy, 15-30 seconds spoken, with a clear hook in the first 3 seconds and a strong call-to-action at the end. Return one script per concept id.

Concepts: ${JSON.stringify(concepts.map((c) => ({ id: c.id, title: c.title, description: c.description })))}`,
      model: "claude_opus_4_8",
      response_json_schema: {
        type: "object",
        properties: {
          scripts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                script: { type: "string" },
                videoPrompt: { type: "string" },
              },
            },
          },
        },
      },
    });

    const scripts = scriptRes?.scripts || [];
    const conceptsWithScripts = concepts.map((c) => {
      const s = scripts.find((x) => x.id === c.id) || {};
      return { ...c, script: s.script || "", videoPrompt: s.videoPrompt || c.prompt || "" };
    });

    return Response.json({ ok: true, data: { concepts: conceptsWithScripts } });
  } catch (error) {
    console.error("generateVideoPack error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}