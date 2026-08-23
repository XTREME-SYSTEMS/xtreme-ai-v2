// Auto Builder step processor — executes a single pipeline step for an
// AutoBuild record. Supports BOTH marketing and system-build pipelines.
//
// Marketing:  profile → names → content → logo → brand → website → social → video → review
// System:     profile → architecture → data_model → ui_system → codegen → deploy → system_review
//
// Called manually from the admin UI ("Run Step") and by the autonomous
// queue processor. Each step generates assets, saves results to the
// AutoBuild entity, and advances current_step if auto_advance is on.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import {
  generateNames, generateContent, generateLogos, generateBrandPacks,
  generateWebsite, generateSocial, generateVideo,
} from "../../shared/autoBuildGenerators.ts";
import {
  generateArchitectureSpec, generateDataModelSpec, generateUiSystemSpec,
  generateCodeManifestSpec, generateDeploymentSpec,
} from "../../shared/systemBuildGenerators.ts";
import {
  validateArchitectureSpec, validateDataModelSpec, validateUiSystemSpec,
  validateCodeManifestSpec, validateDeploymentSpec,
} from "../../shared/systemBuildValidation.ts";

// ── Step sequences ──────────────────────────────────────────────────────

const MARKETING_STEPS = ["profile", "names", "content", "logo", "brand", "website", "social", "video", "review", "complete"];
const SYSTEM_STEPS = ["profile", "architecture", "data_model", "ui_system", "codegen", "deploy", "system_review", "complete"];
const SYSTEM_PRODUCT_TYPES = ["web_app", "ecommerce", "platform"];

function getStepSequence(productType: string): string[] {
  return SYSTEM_PRODUCT_TYPES.includes(productType) ? SYSTEM_STEPS : MARKETING_STEPS;
}

function log(build: any, msg: string): string[] {
  const ts = new Date().toISOString();
  const entry = `[${ts}] ${msg}`;
  return [...(build.logs || []), entry].slice(-100);
}

function nextStep(current: string, productType: string): string {
  const steps = getStepSequence(productType);
  const idx = steps.indexOf(current);
  if (idx < 0 || idx >= steps.length - 1) return "complete";
  return steps[idx + 1];
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

// ── Marketing step executors ────────────────────────────────────────────

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

// ── System-build step executors ─────────────────────────────────────────

async function runArchitecture(base44: any, build: any) {
  const spec = await generateArchitectureSpec(base44, {
    productType: build.product_type,
    businessName: build.business_name,
    industry: build.industry,
    profile: build.profile,
  });
  const v = validateArchitectureSpec(spec);
  if (!v.valid) throw new Error(`Architecture validation failed: ${v.errors.join("; ")}`);
  return { architecture: spec };
}

async function runDataModel(base44: any, build: any) {
  if (!build.architecture) throw new Error("Architecture spec is required before generating the data model");
  const spec = await generateDataModelSpec(base44, {
    architecture: build.architecture,
    productType: build.product_type,
    businessName: build.business_name,
  });
  const v = validateDataModelSpec(spec);
  if (!v.valid) throw new Error(`Data model validation failed: ${v.errors.join("; ")}`);
  return { data_model: spec };
}

async function runUiSystem(base44: any, build: any) {
  if (!build.architecture) throw new Error("Architecture spec is required before generating the UI system");
  const spec = await generateUiSystemSpec(base44, {
    architecture: build.architecture,
    productType: build.product_type,
    businessName: build.business_name,
  });
  const v = validateUiSystemSpec(spec);
  if (!v.valid) throw new Error(`UI system validation failed: ${v.errors.join("; ")}`);
  return { ui_system: spec };
}

async function runCodegen(base44: any, build: any) {
  if (!build.architecture) throw new Error("Architecture spec is required before generating the code manifest");
  const spec = await generateCodeManifestSpec(base44, {
    architecture: build.architecture,
    dataModel: build.data_model,
    uiSystem: build.ui_system,
    productType: build.product_type,
    businessName: build.business_name,
  });
  const v = validateCodeManifestSpec(spec);
  if (!v.valid) throw new Error(`Code manifest validation failed: ${v.errors.join("; ")}`);
  return { code_manifest: spec };
}

async function runDeploy(base44: any, build: any) {
  if (!build.code_manifest) throw new Error("Code manifest is required before configuring deployment");
  const spec = generateDeploymentSpec({
    codeManifest: build.code_manifest,
    architecture: build.architecture,
    productType: build.product_type,
    businessName: build.business_name,
  });
  const v = validateDeploymentSpec(spec);
  if (!v.valid) throw new Error(`Deployment validation failed: ${v.errors.join("; ")}`);
  return { deployment: spec };
}

// ── Executor registry ───────────────────────────────────────────────────

const STEP_EXECUTORS: Record<string, (base44: any, build: any) => Promise<Record<string, any>>> = {
  // Marketing
  profile: async () => ({}),
  names: runNames,
  content: runContent,
  logo: runLogo,
  brand: runBrand,
  website: runWebsite,
  social: runSocial,
  video: runVideo,
  review: async () => ({}),
  // System-build
  architecture: runArchitecture,
  data_model: runDataModel,
  ui_system: runUiSystem,
  codegen: runCodegen,
  deploy: runDeploy,
  system_review: async () => ({}),
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

      if (advance && step !== "review" && step !== "system_review") {
        const ns = nextStep(step, build.product_type);
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