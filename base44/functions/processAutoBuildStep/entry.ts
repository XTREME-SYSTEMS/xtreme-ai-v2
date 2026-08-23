// Auto Builder step processor — executes a single pipeline step for an
// AutoBuild record. Called manually from the admin UI ("Run Step") and by
// the autonomous queue processor. Each step generates assets via LLM/image
// integrations, saves results to the AutoBuild entity, and advances the
// current_step if auto_advance is on.
//
// Steps mirror the client portal: profile → names → content → logo → brand →
// website → social → video → review.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const STEP_KEYS = ["profile", "names", "content", "logo", "brand", "website", "social", "video", "review", "complete"];

function log(build, msg) {
  const ts = new Date().toISOString();
  const entry = `[${ts}] ${msg}`;
  const logs = [...(build.logs || []), entry].slice(-100);
  return logs;
}

function nextStep(current) {
  const idx = STEP_KEYS.indexOf(current);
  if (idx < 0 || idx >= STEP_KEYS.length - 1) return "complete";
  return STEP_KEYS[idx + 1];
}

// ── Step executors ──────────────────────────────────────────────────────

async function runNames(base44, build) {
  const name = build.business_name || "";
  const industry = build.industry || "";
  const loc = build.profile?.primary_location || "";
  const prompt = `Generate 20 creative business name ideas for a ${industry || "local service"} business${loc ? ` in ${loc}` : ""}.` +
    `The current name is "${name}" — use it as inspiration but generate alternatives too.` +
    ` For each name, provide: name, domain (the .com version), rationale (why it works), and a viral_score (0-100).` +
    ` Return a JSON object with an "ideas" array of {name, domain, rationale, viral_score}.`;
  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        ideas: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              domain: { type: "string" },
              rationale: { type: "string" },
              viral_score: { type: "number" },
            },
          },
        },
      },
    },
  });
  return { name_options: res?.ideas || [] };
}

async function runContent(base44, build) {
  const name = build.business_name || "";
  const industry = build.industry || "";
  const loc = build.profile?.primary_location || "";
  const services = (build.profile?.services || []).join(", ");
  const prompt = `Write 10 different content tone templates for a ${industry} business named "${name}"${loc ? ` in ${loc}` : ""}.` +
    ` Services: ${services || "general services"}.` +
    ` Each template should have a distinct tone (professional, friendly, bold, luxury, playful, authoritative, community, expert, urgent, story-driven).` +
    ` For each template provide: id, tone, hero_headline, hero_subhead, about_paragraph, services_intro, faq (array of {q, a}).` +
    ` Return a JSON object with a "templates" array.`;
  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        templates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              tone: { type: "string" },
              hero_headline: { type: "string" },
              hero_subhead: { type: "string" },
              about_paragraph: { type: "string" },
              services_intro: { type: "string" },
              faq: { type: "array", items: { type: "object", properties: { q: { type: "string" }, a: { type: "string" } } } },
            },
          },
        },
      },
    },
  });
  return { content_templates: res?.templates || [] };
}

const LOGO_STYLES = [
  { id: "monogram", label: "Minimalist Monogram", prompt: (n, ind) => `A clean minimalist logo for a ${ind || "local service"} business named "${n}". Bold monogram from initials, simple geometric lines, lime-green accent. TRANSPARENT BACKGROUND, isolated logo, PNG alpha, vector, no border.` },
  { id: "industrial", label: "Bold Industrial", prompt: (n, ind) => `A bold industrial badge logo for ${ind || "service"} "${n}". Hexagonal emblem, strong geometric type, charcoal and orange. TRANSPARENT BACKGROUND, isolated, PNG alpha, vector, no border.` },
  { id: "geometric", label: "Geometric Abstract", prompt: (n, ind) => `A modern abstract geometric logo for ${ind || "service"} "${n}". Overlapping shapes, two-tone with lime accent. TRANSPARENT BACKGROUND, isolated, PNG alpha, vector, no border.` },
  { id: "emblem", label: "Classic Emblem", prompt: (n, ind) => `A classic circular emblem logo for ${ind || "service"} "${n}". Ring with business name, industry icon center, navy and silver. TRANSPARENT BACKGROUND, isolated, PNG alpha, vector, no border.` },
  { id: "wordmark", label: "Modern Wordmark", prompt: (n, ind) => `A modern wordmark logo for ${ind || "service"} "${n}". Business name in strong condensed sans-serif, lime-green underline. TRANSPARENT BACKGROUND, isolated, PNG alpha, vector, no border.` },
  { id: "stamp", label: "Embossed Seal", prompt: (n, ind) => `An embossed seal logo for ${ind || "service"} "${n}". Business name embossed in professional surface, monochrome with lime tint. TRANSPARENT BACKGROUND, isolated, PNG alpha, no border.` },
  { id: "neon", label: "Neon Glow", prompt: (n, ind) => `A neon-glow logo for ${ind || "service"} "${n}". Business name in glowing lime-green neon tube lettering. TRANSPARENT BACKGROUND, isolated, PNG alpha, no border.` },
  { id: "rustic", label: "Hand-drawn Rustic", prompt: (n, ind) => `A hand-drawn rustic logo for ${ind || "service"} "${n}". Sketched tools and icon with business name, earthy tones with lime accent. TRANSPARENT BACKGROUND, isolated, PNG alpha, illustration, no border.` },
  { id: "luxury", label: "Premium Luxury", prompt: (n, ind) => `A premium luxury logo for ${ind || "service"} "${n}". Business name in elegant serif, gold foil accent, black and gold. TRANSPARENT BACKGROUND, isolated, PNG alpha, vector, no border.` },
  { id: "gradient", label: "Vibrant Gradient", prompt: (n, ind) => `A vibrant gradient logo for ${ind || "service"} "${n}". Business name with blue-to-lime gradient fill, fluid modern shape. TRANSPARENT BACKGROUND, isolated, PNG alpha, vector, no border.` },
];

async function generateTransparentLogo(base44, prompt) {
  const r1 = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
  let url = r1?.url;
  if (!url) throw new Error("logo generation failed");
  try {
    const r2 = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt: "Remove the ENTIRE background from this logo image so only the logo artwork remains. Output as a PNG with a true transparent alpha channel. Preserve exact colors, shapes, and text. No border, card, shadow, or backdrop.",
      existing_image_urls: [url],
    });
    if (r2?.url) url = r2.url;
  } catch { /* keep original */ }
  return url;
}

async function runLogo(base44, build) {
  const name = build.business_name || "";
  const industry = build.industry || "";
  const results = await Promise.allSettled(
    LOGO_STYLES.map(async (s) => {
      const url = await generateTransparentLogo(base44, s.prompt(name, industry));
      return { id: s.id, label: s.label, url };
    })
  );
  const logo_options = results.map((r) => r.value).filter(Boolean);
  if (logo_options.length === 0) throw new Error("All logo generations failed");
  return { logo_options };
}

const BRAND_MOCKUPS = [
  { id: "business-card", label: "Business Card", prompt: (n, ind) => `A professional business card design for ${ind || "service"} "${n}". Front and back, modern clean layout, brand colors. Flat design on white background.` },
  { id: "brochure", label: "Tri-fold Brochure", prompt: (n, ind) => `A tri-fold brochure design for ${ind || "service"} "${n}". Professional layout with service descriptions, brand colors, clean typography. Flat design.` },
  { id: "flyer", label: "Marketing Flyer", prompt: (n, ind) => `A marketing flyer for ${ind || "service"} "${n}". Eye-catching headline, service bullets, call-to-action, brand colors. Flat design.` },
  { id: "tshirt", label: "Branded T-Shirt", prompt: (n, ind) => `A branded t-shirt mockup for ${ind || "service"} "${n}". Logo on chest, professional apparel, brand colors. Photorealistic.` },
  { id: "hat", label: "Embroidered Hat", prompt: (n, ind) => `An embroidered hat mockup for ${ind || "service"} "${n}". Logo embroidered on front, professional cap, brand colors. Photorealistic.` },
  { id: "van-wrap", label: "Vehicle Wrap", prompt: (n, ind) => `A vehicle van wrap design for ${ind || "service"} "${n}". Full van wrap with logo, services, phone number, brand colors. Photorealistic, side view.` },
  { id: "signage", label: "Storefront Signage", prompt: (n, ind) => `A storefront signage mockup for ${ind || "service"} "${n}". Illuminated channel letter sign with logo, professional building facade. Photorealistic.` },
  { id: "social-kit", label: "Social Media Kit", prompt: (n, ind) => `A social media profile template set for ${ind || "service"} "${n}". Profile picture, cover image, post template, brand colors. Clean modern design.` },
  { id: "uniform", label: "Work Uniform", prompt: (n, ind) => `A branded work uniform mockup for ${ind || "service"} "${n}". Polo shirt with embroidered logo, professional, brand colors. Photorealistic.` },
  { id: "app-mockup", label: "Mobile App Mockup", prompt: (n, ind) => `A mobile app mockup for ${ind || "service"} "${n}". App home screen with logo, service booking interface, brand colors. Clean modern UI.` },
];

async function runBrand(base44, build) {
  const name = build.business_name || "";
  const industry = build.industry || "";
  const logoUrl = build.chosen_logo_url || (build.logo_options?.[0]?.url) || "";
  const results = await Promise.allSettled(
    BRAND_MOCKUPS.map(async (m) => {
      const prompt = logoUrl
        ? `Apply this logo to a ${m.label.toLowerCase()} for ${industry || "service"} "${name}". ${m.prompt(name, industry)} Use the provided logo.`
        : m.prompt(name, industry);
      const existing = logoUrl ? [logoUrl] : undefined;
      const r = await base44.asServiceRole.integrations.Core.GenerateImage({
        prompt,
        ...(existing ? { existing_image_urls: existing } : {}),
      });
      return { id: m.id, label: m.label, url: r?.url };
    })
  );
  const brand_packs = results.map((r) => r.value).filter(Boolean);
  if (brand_packs.length === 0) throw new Error("All brand mockup generations failed");
  return { brand_packs };
}

async function runWebsite(base44, build) {
  const name = build.business_name || "";
  const industry = build.industry || "";
  const loc = build.profile?.primary_location || "";
  const services = build.profile?.services || [];
  const tone = build.chosen_content_template || "";
  const prompt = `Write complete website copy for a ${industry} business named "${name}"${loc ? ` in ${loc}` : ""}.` +
    ` Services: ${services.join(", ") || "general services"}.` +
    ` Tone: ${tone || "professional"}.` +
    ` Provide: hero_headline, hero_subhead, about_paragraph, services (array of {title, description}), faq (array of {q, a}), cta_text.` +
    ` Return a JSON object.`;
  const contentRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        hero_headline: { type: "string" },
        hero_subhead: { type: "string" },
        about_paragraph: { type: "string" },
        services: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } } } },
        faq: { type: "array", items: { type: "object", properties: { q: { type: "string" }, a: { type: "string" } } } },
        cta_text: { type: "string" },
      },
    },
  });
  // Generate 3 project images
  const imgResults = await Promise.allSettled([
    base44.asServiceRole.integrations.Core.GenerateImage({ prompt: `Professional ${industry} project photo, before and after, high quality, real work, photorealistic, wide shot` }),
    base44.asServiceRole.integrations.Core.GenerateImage({ prompt: `${industry} team working on a project, professional, photorealistic, action shot` }),
    base44.asServiceRole.integrations.Core.GenerateImage({ prompt: `Completed ${industry} project, clean professional result, photorealistic, showcase quality` }),
  ]);
  const website_images = imgResults.map((r, i) => ({
    id: `img-${i}`,
    label: ["Project Showcase", "Team at Work", "Completed Work"][i],
    url: r.value?.url,
  })).filter((img) => img.url);
  return { website_content: contentRes, website_images };
}

async function runSocial(base44, build) {
  const name = build.business_name || "";
  const industry = build.industry || "";
  const prompt = `Create a 30-day social media content calendar for a ${industry} business named "${name}".` +
    ` For each day provide: day, platform (facebook/instagram/linkedin), post_type (photo/reel/story/text), caption, hashtags (array), best_post_time.` +
    ` Also include 5 social template descriptions (profile, cover, story, post, reel-cover).` +
    ` Return a JSON object with "calendar" array and "templates" array.`;
  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        calendar: {
          type: "array",
          items: {
            type: "object",
            properties: {
              day: { type: "number" },
              platform: { type: "string" },
              post_type: { type: "string" },
              caption: { type: "string" },
              hashtags: { type: "array", items: { type: "string" } },
              best_post_time: { type: "string" },
            },
          },
        },
        templates: { type: "array", items: { type: "object", properties: { id: { type: "string" }, label: { type: "string" }, description: { type: "string" } } } },
      },
    },
  });
  return { social_media_pack: res };
}

async function runVideo(base44, build) {
  const name = build.business_name || "";
  const industry = build.industry || "";
  const prompt = `Generate 10 video concepts for a ${industry} business named "${name}".` +
    ` For each concept provide: id, title, style (hero/service/testimonial/explainer/promo), duration_seconds, description, script_outline, visual_notes.` +
    ` Return a JSON object with "concepts" array.`;
  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        concepts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              style: { type: "string" },
              duration_seconds: { type: "number" },
              description: { type: "string" },
              script_outline: { type: "string" },
              visual_notes: { type: "string" },
            },
          },
        },
      },
    },
  });
  return { video_pack: res };
}

const STEP_EXECUTORS = {
  profile: async () => ({}),
  names: runNames,
  content: runContent,
  logo: runLogo,
  brand: runBrand,
  website: runWebsite,
  social: runSocial,
  video: runVideo,
  review: async () => ({}),
};

// ── Main handler ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
    const base44 = createClientFromRequest(req);

    // Admin-only
    let user = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (!user || user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const buildId = String(body.build_id || "");
    const step = String(body.step || "");
    const advance = body.advance !== false; // default true

    if (!buildId || !step) {
      return new Response(JSON.stringify({ error: "build_id and step are required" }), { status: 400 });
    }
    if (!STEP_EXECUTORS[step]) {
      return new Response(JSON.stringify({ error: `Unknown step: ${step}` }), { status: 400 });
    }

    // Load the build
    const builds = await base44.asServiceRole.entities.AutoBuild.filter({ id: buildId }, "-created_date", 1);
    const build = builds?.[0];
    if (!build) {
      return new Response(JSON.stringify({ error: "Build not found" }), { status: 404 });
    }

    // Mark running
    let logs = log(build, `Starting step: ${step}`);
    await base44.asServiceRole.entities.AutoBuild.update(buildId, {
      status: "running",
      error: "",
      logs,
    });

    try {
      const executor = STEP_EXECUTORS[step];
      const stepResult = await executor(base44, build);

      // Save results + mark step visited
      const visited = [...new Set([...(build.visited_steps || []), step])];
      logs = log({ logs }, `Step ${step} completed successfully`);
      const updateData: Record<string, unknown> = {
        ...stepResult,
        visited_steps: visited,
        logs,
        status: "paused",
      };

      // Advance to next step if requested
      if (advance && step !== "review") {
        const ns = nextStep(step);
        updateData.current_step = ns;
        logs = log({ logs }, `Advanced to step: ${ns}`);
        updateData.logs = logs;
        if (ns === "complete") {
          updateData.status = "complete";
        }
      }

      const updated = await base44.asServiceRole.entities.AutoBuild.update(buildId, updateData);

      return new Response(JSON.stringify({
        success: true,
        step,
        build: updated,
        advanced_to: updateData.current_step || build.current_step,
      }), { status: 200 });
    } catch (e) {
      const errMsg = String(e?.message || e);
      logs = log({ logs }, `Step ${step} FAILED: ${errMsg}`);
      await base44.asServiceRole.entities.AutoBuild.update(buildId, {
        status: "failed",
        error: errMsg,
        logs,
      });
      return new Response(JSON.stringify({ success: false, error: errMsg, step }), { status: 500 });
    }
  } catch (e) {
    console.error("processAutoBuildStep error:", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500 });
  }
});