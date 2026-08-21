import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Social Media Generator: generates 10 social media brand template images
// (profile avatar, cover/header, story templates, post templates, favicon,
// icon set, highlight covers) using the client's chosen logo as a reference,
// PLUS a 30-day content calendar of post captions with suggested platforms
// and optimal posting times. Everything stays on-brand with the approved logo.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { businessName, primaryLocation, services, logoUrl } = body;

    const biz = businessName || "your epoxy business";
    const loc = primaryLocation || "";
    const svc = (services || []).join(", ") || "epoxy flooring";
    const ref = logoUrl ? [logoUrl] : undefined;

    const TEMPLATES = [
      { id: "profile", label: "Profile Avatar", prompt: `A professional social media profile avatar for epoxy contractor "${biz}". Clean circular logo on a solid brand-colored background, centered, minimal, high quality.` },
      { id: "cover", label: "Cover / Header", prompt: `A wide social media cover banner for epoxy contractor "${biz}". Show a finished glossy epoxy floor with the business name overlaid, modern layout, professional.` },
      { id: "story", label: "Story Template", prompt: `A vertical Instagram story template for epoxy contractor "${biz}". Before-and-after epoxy floor transformation, bold text space, brand colors.` },
      { id: "post1", label: "Service Post", prompt: `A square Instagram post for epoxy contractor "${biz}" showcasing ${svc.split(",")[0]}. Professional finished floor photo with a clean text overlay area.` },
      { id: "post2", label: "Before/After Post", prompt: `A square social media post for epoxy contractor "${biz}" showing a before-and-after garage floor transformation, split layout, professional.` },
      { id: "post3", label: "Team Post", prompt: `A square social media post for epoxy contractor "${biz}" showing a contractor at work on an epoxy floor, professional, brand colors.` },
      { id: "favicon", label: "Favicon", prompt: `A simple favicon icon for epoxy contractor "${biz}". A single bold concrete/epoxy droplet mark, minimal, recognizable at small size, on a solid background.` },
      { id: "iconset", label: "Icon Set", prompt: `A set of 6 minimal line icons for epoxy contractor "${biz}" services: floor coating, polishing, repair, sealing, garage, commercial. Clean, consistent style, on white.` },
      { id: "highlight", label: "Highlight Cover", prompt: `A circular Instagram highlight cover for epoxy contractor "${biz}". A minimal epoxy-floor icon on a solid brand color, clean, consistent.` },
      { id: "promo", label: "Promo Post", prompt: `A square promotional social media post for epoxy contractor "${biz}". "Free Quote" offer, bold design, finished floor background, clear call-to-action.` },
    ];

    // Generate 10 template images in parallel.
    const imgResults = await Promise.allSettled(
      TEMPLATES.map(async (t) => {
        const r = await base44.integrations.Core.GenerateImage({
          prompt: t.prompt + (loc ? ` Located in ${loc}.` : ""),
          existing_image_urls: ref,
        });
        return { id: t.id, label: t.label, url: r.url };
      })
    );
    const templates = imgResults.map((r) => r.value).filter(Boolean);

    // Generate a 30-day content calendar.
    const calRes = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a 30-day social media content calendar for epoxy contractor "${biz}" in ${loc}. Services: ${svc}. Mix post types: before/after, tips, testimonials, behind-the-scenes, promotions, educational. Return exactly 30 posts, one per day, each with a day number (1-30), platform (Instagram, Facebook, or Google Business), a caption (2-3 sentences with hashtags), and a post type category.`,
      response_json_schema: {
        type: "object",
        properties: {
          posts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "number" },
                platform: { type: "string" },
                caption: { type: "string" },
                type: { type: "string" },
                bestTime: { type: "string" },
              },
            },
          },
        },
      },
    });

    return Response.json({ ok: true, data: { templates, posts: calRes?.posts || [], scheduleSummary: `30 days of content across Instagram, Facebook & Google Business.` } });
  } catch (error) {
    console.error("generateSocialMediaPack error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}