// Auto Builder step processor — executes a single pipeline step for an
// AutoBuild record using the EXACT same generation logic as the client
// portal (imported from autoBuildGenerators.ts — one source of truth).
//
// Steps mirror the client portal: profile → names → content → logo → brand →
// website → social → video → review.
//
// Called manually from the admin UI ("Run Step") and by the autonomous
// queue processor. Each step generates assets, saves results to the
// AutoBuild entity, and advances current_step if auto_advance is on.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import {
  generateNames, generateContent, generateLogos, generateBrandPacks,
  generateWebsite, generateSocial, generateVideo,
} from "../../shared/autoBuildGenerators.ts";

const STEP_KEYS = ["profile", "names", "content", "logo", "brand", "website", "social", "video", "review", "complete"];

function log(build: any, msg: string): string[] {
  const ts = new Date().toISOString();
  const entry = `[${ts}] ${msg}`;
  return [...(build.logs || []), entry].slice(-100);
}

function nextStep(current: string): string {
  const idx = STEP_KEYS.indexOf(current);
  if (idx < 0 || idx >= STEP_KEYS.length - 1) return "complete";
  return STEP_KEYS[idx + 1];
}

// Map AutoBuild record fields → generator params (same shape the client
// portal functions expect).
function buildParams(build: any): Record<string, any> {
  const p = build.profile || {};
  return {
    businessName: build.business_name,
    industry: build.industry,
    subIndustry: build.sub_industry,
    businessType: p.business_stage,
    primaryLocation: p.primary_location,
    serviceArea: p.radius,
    city: p.primary_location,
    state: "",
    services: p.services || [],
    differentiators: [],
    yearsInBusiness: p.years_in_business,
    phone: p.phone,
    email: p.email,
    website: p.website,
    logoUrl: build.chosen_logo_url || (build.logo_options?.[0]?.url),
    contentTone: build.chosen_content_template,
  };
}

// ── Step executors ──────────────────────────────────────────────────────

async function runNames(base44: any, build: any) {
  const suggestions = await generateNames(base44, buildParams(build));
  return { name_options: suggestions };
}

async function runContent(base44: any, build: any) {
  const result = await generateContent(base44, buildParams(build));
  return { content_templates: result };
}

async function runLogo(base44: any, build: any) {
  const logos = await generateLogos(base44, buildParams(build));
  return { logo_options: logos };
}

async function runBrand(base44: any, build: any) {
  const packs = await generateBrandPacks(base44, buildParams(build));
  return { brand_packs: packs };
}

async function runWebsite(base44: any, build: any) {
  const params = buildParams(build);
  const content = await generateWebsite(base44, params);
  // Generate 3 project images (client portal generates these separately;
  // no dedicated backend function, so we generate inline matching the
  // same photo style the portal uses).
  const { photoStyleSuffix, compileBrief } = await import("../../shared/generatorBrief.ts");
  const photo = photoStyleSuffix(compileBrief(params));
  const ind = params.industry || "local service business";
  const imgResults = await Promise.allSettled([
    base44.asServiceRole.integrations.Core.GenerateImage({ prompt: `Professional ${ind} project photo, before and after, high quality, real work, photorealistic, wide shot. ${photo}` }),
    base44.asServiceRole.integrations.Core.GenerateImage({ prompt: `${ind} team working on a project, professional, photorealistic, action shot. ${photo}` }),
    base44.asServiceRole.integrations.Core.GenerateImage({ prompt: `Completed ${ind} project, clean professional result, photorealistic, showcase quality. ${photo}` }),
  ]);
  const website_images = imgResults.map((r: any, i: number) => ({
    id: `img-${i}`,
    label: ["Project Showcase", "Team at Work", "Completed Work"][i],
    url: r.value?.url,
  })).filter((img: any) => img.url);
  return { website_content: content, website_images };
}

async function runSocial(base44: any, build: any) {
  const pack = await generateSocial(base44, buildParams(build));
  return { social_media_pack: pack };
}

async function runVideo(base44: any, build: any) {
  const concepts = await generateVideo(base44, buildParams(build));
  return { video_pack: { concepts } };
}

const STEP_EXECUTORS: Record<string, (base44: any, build: any) => Promise<Record<string, any>>> = {
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
    let user: any = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (!user || user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const buildId = String(body.build_id || "");
    const step = String(body.step || "");
    const advance = body.advance !== false;

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

      const visited = [...new Set([...(build.visited_steps || []), step])];
      logs = log({ logs } as any, `Step ${step} completed successfully`);
      const updateData: Record<string, unknown> = {
        ...stepResult,
        visited_steps: visited,
        logs,
        status: "paused",
      };

      if (advance && step !== "review") {
        const ns = nextStep(step);
        updateData.current_step = ns;
        logs = log({ logs } as any, `Advanced to step: ${ns}`);
        updateData.logs = logs;
        if (ns === "complete") updateData.status = "complete";
      }

      const updated = await base44.asServiceRole.entities.AutoBuild.update(buildId, updateData);

      return new Response(JSON.stringify({
        success: true,
        step,
        build: updated,
        advanced_to: updateData.current_step || build.current_step,
      }), { status: 200 });
    } catch (e) {
      const errMsg = String((e as any)?.message || e);
      logs = log({ logs } as any, `Step ${step} FAILED: ${errMsg}`);
      await base44.asServiceRole.entities.AutoBuild.update(buildId, {
        status: "failed",
        error: errMsg,
        logs,
      });
      return new Response(JSON.stringify({ success: false, error: errMsg, step }), { status: 500 });
    }
  } catch (e) {
    console.error("processAutoBuildStep error:", e);
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), { status: 500 });
  }
});