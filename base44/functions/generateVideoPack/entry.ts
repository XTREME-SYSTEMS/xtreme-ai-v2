import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Video Generator: generates 10 video concept cards — each with a thumbnail
// image, a title, a short description, and a production script. The client can
// preview the concepts and generate the actual short video for any they like
// (actual video generation happens on-demand from the UI to control cost).
// Concepts use the client's onboarding, content, logo, brand, and website
// context to stay on-message.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { businessName, primaryLocation, services, contentTone, logoUrl } = body;

    const biz = businessName || "your epoxy business";
    const loc = primaryLocation || "";
    const svc = (services || []).join(", ") || "epoxy flooring";
    const tone = contentTone || "professional and trustworthy";
    const ref = logoUrl ? [logoUrl] : undefined;

    const CONCEPTS = [
      { id: "hero", title: "Brand Hero Video", desc: "A 15-second cinematic hero showing your best epoxy floor transformations with your logo.", prompt: `Cinematic 15-second hero video thumbnail for epoxy contractor "${biz}". Slow pan over a glossy finished epoxy floor, dramatic lighting, professional, high-end.` },
      { id: "before-after", title: "Before & After", desc: "A satisfying before-and-after garage floor transformation.", prompt: `Before and after epoxy garage floor transformation, split screen, professional photo, dramatic improvement.` },
      { id: "process", title: "The Process", desc: "Fast-paced time-lapse of an epoxy floor installation from prep to finish.", prompt: `Time-lapse of epoxy floor installation process: prep, mixing, pouring, spreading, curing. Professional contractor at work.` },
      { id: "testimonial", title: "Customer Story", desc: "A happy customer reacts to their new epoxy garage floor.", prompt: `A homeowner smiling and showing off their new glossy epoxy garage floor, professional, warm lighting.` },
      { id: "commercial", title: "Commercial Project", desc: "A large commercial warehouse floor being coated.", prompt: `A large commercial warehouse with a freshly coated epoxy floor, wide angle, professional, industrial.` },
      { id: "tips", title: "3 Quick Tips", desc: "Educational short: 3 things to know before getting epoxy floors.", prompt: `An epoxy contractor pointing at a finished floor with text overlay space, educational, professional.` },
      { id: "polished", title: "Polished Concrete", desc: "A polished concrete floor being ground and polished to a mirror finish.", prompt: `Polished concrete floor being ground and polished, sparkly mirror finish, professional equipment, close-up.` },
      { id: "decorative", title: "Decorative Flake", desc: "A decorative color-flake epoxy floor being installed in a residential garage.", prompt: `Decorative color-flake epoxy floor being installed in a residential garage, vibrant flakes being broadcast, professional.` },
      { id: "team", title: "Meet the Team", desc: "Your crew introduces the business and what makes you different.", prompt: `A team of epoxy contractors standing in front of a finished floor project, professional, confident, brand colors.` },
      { id: "promo", title: "Free Quote Promo", desc: "A punchy promotional video offering a free quote.", prompt: `A promotional video thumbnail for epoxy contractor "${biz}" offering a free quote, bold text space, finished floor background.` },
    ];

    // Generate 10 thumbnails in parallel.
    const imgResults = await Promise.allSettled(
      CONCEPTS.map(async (c) => {
        const r = await base44.integrations.Core.GenerateImage({
          prompt: c.prompt + (loc ? ` Located in ${loc}.` : ""),
          existing_image_urls: ref,
        });
        return { id: c.id, title: c.title, description: c.desc, thumbnailUrl: r.url };
      })
    );
    const concepts = imgResults.map((r) => r.value).filter(Boolean);

    // Generate scripts for each concept.
    const scriptRes = await base44.integrations.Core.InvokeLLM({
      prompt: `Write a short 15-30 second video script for each of these 10 video concepts for epoxy contractor "${biz}" in ${loc}. Services: ${svc}. Tone: ${tone}. Return one script per concept id.\n\nConcepts: ${JSON.stringify(concepts.map((c) => ({ id: c.id, title: c.title, description: c.description })))}`,
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