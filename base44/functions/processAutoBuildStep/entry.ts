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
  generateVisionDoc, generateStrategyDoc,
} from "../../shared/visionStrategyGenerators.ts";
import {
  generateArchitectureSpec, generateDataModelSpec, generateUiSystemSpec,
  generateCodeManifestSpec, generateDeploymentSpec, generateWithValidation,
} from "../../shared/systemBuildGenerators.ts";
import {
  strictValidateArchitecture, strictValidateDataModel,
  strictValidateUiSystem, strictValidateCodeManifest, strictValidateDeployment,
} from "../../shared/systemBuildSchemas.ts";
import {
  validateDataModelConsistency, validateUiSystemConsistency,
  validateCodeManifestConsistency, validateDeploymentConsistency,
} from "../../shared/systemBuildValidation.ts";

// ── Step sequences ──────────────────────────────────────────────────────

const MARKETING_STEPS = ["profile", "vision", "strategy", "names", "content", "logo", "brand", "website", "social", "video", "review", "complete"];
const SYSTEM_STEPS = ["profile", "vision", "strategy", "architecture", "data_model", "ui_system", "codegen", "deploy", "system_review", "complete"];
const SYSTEM_PRODUCT_TYPES = ["web_app", "ecommerce", "platform"];

// Step key → UI route path. The UI pages add ROUTE PATHS to visited_steps
// (e.g., "/system-architecture"), not step keys (e.g., "architecture").
// The queue processor must use the same format so the timeline gates work.
const STEP_PATHS: Record<string, string> = {
  profile: "/business-profile",
  vision: "/vision",
  strategy: "/strategy",
  names: "/business-name-studio",
  content: "/content-generator",
  logo: "/logo-generator",
  brand: "/brand-generator",
  website: "/design-direction",
  social: "/social-media",
  video: "/video-generator",
  review: "/your-designs",
  architecture: "/system-architecture",
  data_model: "/data-model",
  ui_system: "/ui-system",
  codegen: "/codegen",
  deploy: "/deploy",
  system_review: "/system-review",
};

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
    // Vision & Strategy — feed into downstream generators so every asset
    // (content, logo, brand, website, social, video) is shaped by the
    // approved vision and strategy, not generated in a vacuum.
    vision: build.vision,
    strategy: build.strategy,
  };
}

// ── Vision & Strategy step executors ─────────────────────────────────────

async function runVision(base44: any, build: any) {
  const params = buildParams(build);
  const vision = await generateVisionDoc(base44, params);
  // Auto-approve in autonomous mode so the pipeline can proceed without
  // manual review. In manual mode, the admin must review and approve
  // on the Vision page before the gate unlocks.
  if (build.auto_advance) vision.approved = true;
  return { vision };
}

async function runStrategy(base44: any, build: any) {
  if (!build.vision) throw new Error("Vision document is required before generating strategy. Generate and approve the vision first.");
  const params = { ...buildParams(build), vision: build.vision };
  const strategy = await generateStrategyDoc(base44, params);
  if (build.auto_advance) strategy.approved = true;
  return { strategy };
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
  const result = await generateWithValidation(
    base44, generateArchitectureSpec, strictValidateArchitecture,
    { productType: build.product_type, businessName: build.business_name, industry: build.industry, profile: build.profile },
    "system architecture", { maxAttempts: 3, judgeThreshold: 70 }
  );
  if (!result.validation.valid)
    throw new Error(`Architecture validation failed after ${result.attempts} attempts: ${result.validation.errors.join("; ")}`);
  return { architecture: result.data };
}

async function runDataModel(base44: any, build: any) {
  if (!build.architecture) throw new Error("Architecture spec is required before generating the data model");
  const result = await generateWithValidation(
    base44, generateDataModelSpec, strictValidateDataModel,
    { architecture: build.architecture, productType: build.product_type, businessName: build.business_name },
    "data model", { maxAttempts: 3, judgeThreshold: 70 }
  );
  if (!result.validation.valid)
    throw new Error(`Data model validation failed after ${result.attempts} attempts: ${result.validation.errors.join("; ")}`);
  return { data_model: result.data };
}

async function runUiSystem(base44: any, build: any) {
  if (!build.architecture) throw new Error("Architecture spec is required before generating the UI system");
  const result = await generateWithValidation(
    base44, generateUiSystemSpec, strictValidateUiSystem,
    { architecture: build.architecture, productType: build.product_type, businessName: build.business_name },
    "UI design system", { maxAttempts: 3, judgeThreshold: 70 }
  );
  if (!result.validation.valid)
    throw new Error(`UI system validation failed after ${result.attempts} attempts: ${result.validation.errors.join("; ")}`);
  return { ui_system: result.data };
}

async function runCodegen(base44: any, build: any) {
  if (!build.architecture) throw new Error("Architecture spec is required before generating the code manifest");
  const result = await generateWithValidation(
    base44, generateCodeManifestSpec, strictValidateCodeManifest,
    { architecture: build.architecture, dataModel: build.data_model, uiSystem: build.ui_system, productType: build.product_type, businessName: build.business_name },
    "code manifest", { maxAttempts: 3, judgeThreshold: 70 }
  );
  if (!result.validation.valid)
    throw new Error(`Code manifest validation failed after ${result.attempts} attempts: ${result.validation.errors.join("; ")}`);
  return { code_manifest: result.data };
}

async function runDeploy(base44: any, build: any) {
  if (!build.code_manifest) throw new Error("Code manifest is required before configuring deployment");
  const spec = generateDeploymentSpec({
    codeManifest: build.code_manifest,
    architecture: build.architecture,
    productType: build.product_type,
    businessName: build.business_name,
  });
  const v = strictValidateDeployment(spec);
  if (!v.valid) throw new Error(`Deployment validation failed: ${v.errors.join("; ")}`);
  return { deployment: spec };
}

// ── Executor registry ───────────────────────────────────────────────────

const STEP_EXECUTORS: Record<string, (base44: any, build: any) => Promise<Record<string, any>>> = {
  // Marketing
  profile: async () => ({}),
  vision: runVision,
  strategy: runStrategy,
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
  // system_review — the final step. Autonomously provisions the full
  // deployment stack (GitHub + Vercel + Supabase + Drive) and generates
  // all system documentation (README, architecture, data model, API, UI
  // system, deployment, setup instructions, user guide) so the user gets
  // every deliverable. See systemBuildProvisioning.ts.
  system_review: async (base44: any, build: any) => {
    const { provisionSystemBuild } = await import("../../shared/systemBuildProvisioning.ts");
    const { deployment } = await provisionSystemBuild(base44, build.id);
    return { deployment };
  },
};

// ── Main handler ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
    const base44 = createClientFromRequest(req);

    // Admin or employee
    let user: any = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (!user || (user.role !== "admin" && user.role !== "employee")) {
      return new Response(JSON.stringify({ error: "Admin or employee access required" }), { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const buildId = String(body.build_id || "");
    const step = String(body.step || "");
    const advance = body.advance !== false;
    const skipValidation = body.skip_validation === true;

    if (!buildId || !step) {
      return new Response(JSON.stringify({ error: "build_id and step are required" }), { status: 400 });
    }
    if (!STEP_EXECUTORS[step]) {
      return new Response(JSON.stringify({ error: `Unknown step: ${step}` }), { status: 400 });
    }

    // Load the build
    let builds = await base44.asServiceRole.entities.AutoBuild.filter({ id: buildId }, "-created_date", 1);
    let build = builds?.[0];
    if (!build) {
      return new Response(JSON.stringify({ error: "Build not found" }), { status: 404 });
    }

    // Idempotency: don't start if already running (unless force=true)
    if (build.status === "running" && !body.force) {
      return new Response(JSON.stringify({
        error: "Build is already running a step. Pass force=true to override.",
        build_id: buildId,
        current_step: build.current_step,
      }), { status: 409 });
    }

    // Mark running
    let logs = log(build, `Starting step: ${step}`);
    await base44.asServiceRole.entities.AutoBuild.update(buildId, {
      status: "running",
      error: "",
      step_started_at: new Date().toISOString(),
      logs,
    });

    // Retry with exponential backoff (3 attempts)
    const maxRetries = 3;
    let lastError = "";
    let stepResult: Record<string, any> | null = null;

    for (let attemptNum = 1; attemptNum <= maxRetries; attemptNum++) {
      try {
        const executor = STEP_EXECUTORS[step];
        stepResult = await executor(base44, build);
        break; // success
      } catch (e) {
        lastError = String((e as any)?.message || e);
        logs = log({ logs } as any, `Step ${step} attempt ${attemptNum}/${maxRetries} failed: ${lastError}`);
        await base44.asServiceRole.entities.AutoBuild.update(buildId, { logs });
        if (attemptNum < maxRetries) {
          // Exponential backoff: 2s, 4s
          await new Promise((r) => setTimeout(r, 2000 * attemptNum));
          // Reload build for fresh state on retry
          const freshBuilds = await base44.asServiceRole.entities.AutoBuild.filter({ id: buildId }, "-created_date", 1);
          if (freshBuilds?.[0]) build = freshBuilds[0] as any;
        }
      }
    }

    if (!stepResult) {
      // All retries exhausted — mark failed and create Receipt
      logs = log({ logs } as any, `Step ${step} FAILED after ${maxRetries} attempts: ${lastError}`);
      await base44.asServiceRole.entities.AutoBuild.update(buildId, {
        status: "failed",
        error: lastError,
        logs,
      });
      try {
        await base44.asServiceRole.entities.Receipt.create({
          agent_or_workflow: "processAutoBuildStep",
          action: `step_${step}`,
          entity_type: "AutoBuild",
          entity_id: buildId,
          inputs: JSON.stringify({ step, build_id: buildId, attempts: maxRetries }).slice(0, 4000),
          outputs: "",
          status: "failed",
          evidence: `Step ${step} failed after ${maxRetries} attempts: ${lastError}`,
        });
      } catch {}
      return new Response(JSON.stringify({ success: false, error: lastError, step, attempts: maxRetries }), { status: 500 });
    }

    // Success — save results, mark step path as visited, advance
    const stepPath = STEP_PATHS[step] || `/${step}`;
    const visited = [...new Set([...(build.visited_steps || []), stepPath])];
    logs = log({ logs } as any, `Step ${step} completed successfully`);
    const updateData: Record<string, unknown> = {
      ...stepResult,
      visited_steps: visited,
      logs,
      status: "paused",
    };

    // system_review now does real work (autonomous provisioning + docs), so
    // it advances to "complete" like any other step. The marketing "review"
    // step stays a manual gate — the admin approves the final package there.
    if (advance && step !== "review") {
      const ns = nextStep(step, build.product_type);
      updateData.current_step = ns;
      logs = log({ logs } as any, `Advanced to step: ${ns}`);
      updateData.logs = logs;
      if (ns === "complete") updateData.status = "complete";
    }

    const updated = await base44.asServiceRole.entities.AutoBuild.update(buildId, updateData);

    // Create Receipt for auditability
    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: "processAutoBuildStep",
        action: `step_${step}`,
        entity_type: "AutoBuild",
        entity_id: buildId,
        inputs: JSON.stringify({ step, build_id: buildId, advance }).slice(0, 4000),
        outputs: JSON.stringify({ fields: Object.keys(stepResult) }).slice(0, 4000),
        status: "success",
        evidence: `Step ${step} completed. Fields written: ${Object.keys(stepResult).join(", ")}`,
      });
    } catch {}

    // ── Trigger validation loop after meaningful steps ────────────────
    // After each generation step completes, run the validation loop so the
    // build is continuously audited → fixed → healed → hardened → optimized.
    // Skipped for empty steps (profile, review, system_review) and when
    // the caller passes skip_validation=true.
    const VALIDATABLE_STEPS = ["vision", "strategy", "names", "content", "logo", "brand", "website", "social", "video", "architecture", "data_model", "ui_system", "codegen", "deploy"];
    let validationResult: Record<string, any> | null = null;
    if (!skipValidation && VALIDATABLE_STEPS.includes(step)) {
      try {
        logs = log({ logs } as any, `Triggering validation loop for step: ${step}`);
        await base44.asServiceRole.entities.AutoBuild.update(buildId, { logs });

        // Call the shared validation logic directly (no HTTP round-trip)
        const { executeValidationLoop } = await import("../../shared/validationLoop.ts");
        validationResult = await executeValidationLoop(base44, buildId, false);
        logs = log({ logs } as any, `Validation complete: score=${validationResult?.score}, passed=${validationResult?.passed}`);
        await base44.asServiceRole.entities.AutoBuild.update(buildId, { logs });
      } catch (valErr) {
        // Validation failure is non-blocking — the step still succeeded
        logs = log({ logs } as any, `Validation skipped (error): ${String((valErr as any)?.message || valErr)}`);
        await base44.asServiceRole.entities.AutoBuild.update(buildId, { logs });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      step,
      build: updated,
      advanced_to: updateData.current_step || build.current_step,
      validation: validationResult,
    }), { status: 200 });
  } catch (e) {
    console.error("processAutoBuildStep error:", e);
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), { status: 500 });
  }
});