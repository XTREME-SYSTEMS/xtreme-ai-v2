import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Regenerates the project image set for a client's website preview. Generates
// a fresh batch of photorealistic epoxy-project images so a client who likes
// the layout but not the photos can swap them without touching anything else.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { businessName, services, location, count } = body;
    const loc = location || "";
    const svc = (services && services.length) ? services.join(", ") : "epoxy flooring, polished concrete";
    const primary = svc.split(",")[0].trim();
    const n = Math.min(Math.max(Number(count) || 6, 1), 8);

    const prompts = [
      `Professional photo of a finished ${primary} project in a clean residential garage, glossy seamless floor, bright natural light, photorealistic, high detail`,
      `Commercial epoxy floor in a modern retail showroom, high-gloss reflective surface, photorealistic`,
      `Close-up of polished concrete floor with decorative color-flake finish, professional installation, photorealistic`,
      `Epoxy floor coating in a large warehouse, durable industrial seamless finish, clean, photorealistic`,
      `Decorative metallic epoxy floor in a residential entryway, luxurious 3D effect, photorealistic`,
      `Epoxy garage floor with color flakes, organized modern garage, photorealistic`,
      `Polished concrete in a modern restaurant interior, sleek reflective surface, photorealistic`,
      `Epoxy floor in a finished residential basement, bright seamless finish, photorealistic`,
    ];

    const images = [];
    for (let i = 0; i < n; i++) {
      try {
        const r = await base44.integrations.Core.GenerateImage({
          prompt: prompts[i % prompts.length] + (loc ? `, located in ${loc}` : ""),
        });
        if (r?.url) images.push(r.url);
      } catch (err) {
        console.error("image gen failed", err?.message || err);
      }
    }
    return Response.json({ ok: true, images });
  } catch (error) {
    console.error("regenerateWebsiteImages error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}