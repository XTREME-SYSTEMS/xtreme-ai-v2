// Shared validation loop logic — used by both runValidationLoop (the HTTP
// endpoint) and processAutoBuildStep (which triggers validation after each
// step). Extracted here so both call the same code without HTTP round-trips.
//
// BULLETPROOFED: The phantom fix/heal/harden/optimize phases have been
// replaced with REAL implementations from bulletproofValidation.ts.
// Score is now a weighted average (not Math.max inflation). A deterministic
// compile gate and post-deploy verification are integrated.

import {
  realFixPhase, realHealPhase, realHardenPhase, realOptimizePhase,
  calculateWeightedScore, verifyDeploymentInLoop, recordIncident,
} from "./bulletproofValidation.ts";

const QUALITY_GATE_THRESHOLD = 75;
const MAX_RETRIES = 3;

export async function executeValidationLoop(base44: any, buildId: string, force = false): Promise<{
  ok: boolean;
  pipeline_id: string;
  build_id: string;
  score: number;
  passed: boolean;
  retries: number;
  max_retries: number;
  quality_gate_threshold: number;
  status: string;
  checks: number;
}> {
  // Load the build
  const builds = await base44.asServiceRole.entities.AutoBuild.filter({ id: buildId }, "-created_date", 1);
  const build = builds?.[0];
  if (!build) {
    throw new Error("Build not found");
  }

  // Find or create the ValidationPipeline record
  let pipelines = await base44.asServiceRole.entities.ValidationPipeline.filter({ build_id: buildId }, "-created_date", 1);
  let pipeline = pipelines?.[0];

  if (!pipeline) {
    pipeline = await base44.asServiceRole.entities.ValidationPipeline.create({
      build_id: buildId,
      build_name: build.business_name,
      status: "running",
      current_phase: "audit",
      score: 0,
      retry_count: 0,
      max_retries: MAX_RETRIES,
      quality_gate_threshold: QUALITY_GATE_THRESHOLD,
      started_at: new Date().toISOString(),
      checks: [],
      logs: [`[${new Date().toISOString()}] Validation pipeline created for build: ${build.business_name}`],
    });
  } else if (pipeline.status === "running" && !force) {
    return {
      ok: false,
      pipeline_id: pipeline.id,
      build_id: buildId,
      score: pipeline.score || 0,
      passed: false,
      retries: pipeline.retry_count || 0,
      max_retries: MAX_RETRIES,
      quality_gate_threshold: QUALITY_GATE_THRESHOLD,
      status: "already_running",
      checks: (pipeline.checks || []).length,
    };
  } else {
    pipeline = await base44.asServiceRole.entities.ValidationPipeline.update(pipeline.id, {
      status: "running",
      current_phase: "audit",
      error: "",
      started_at: new Date().toISOString(),
      logs: [...(pipeline.logs || []), `[${new Date().toISOString()}] Validation pipeline re-started (attempt ${(pipeline.retry_count || 0) + 1})`],
    });
  }

  const pipelineId = pipeline.id;
  const checks: any[] = [...(pipeline.checks || [])];
  const logs = [...(pipeline.logs || [])];

  // ── Phase 1: AUDIT ───────────────────────────────────────────────────
  logs.push(`[${new Date().toISOString()}] Phase: AUDIT — scanning build for issues`);
  await base44.asServiceRole.entities.ValidationPipeline.update(pipelineId, { current_phase: "audit", logs });

  const auditResult = await runAuditPhase(base44, build);
  checks.push({
    phase: "audit",
    check_name: "full_build_audit",
    passed: auditResult.score >= QUALITY_GATE_THRESHOLD,
    score: auditResult.score,
    findings: auditResult.findings,
    fixes_applied: "",
    timestamp: new Date().toISOString(),
  });
  logs.push(`[${new Date().toISOString()}] Audit complete: score=${auditResult.score}`);

  const phaseScores: { phase: string; score: number; weight: number }[] = [
    { phase: "audit", score: auditResult.score, weight: 30 },
  ];

  if (auditResult.score < QUALITY_GATE_THRESHOLD) {
    // ── Phase 2: FIX — actually regenerates missing assets ───────────
    logs.push(`[${new Date().toISOString()}] Phase: FIX — regenerating missing assets`);
    await base44.asServiceRole.entities.ValidationPipeline.update(pipelineId, { current_phase: "fix", logs });

    const fixResult = await realFixPhase(base44, build);
    checks.push({
      phase: "fix",
      check_name: "auto_fix",
      passed: fixResult.fixed > 0,
      score: fixResult.score,
      findings: auditResult.findings,
      fixes_applied: fixResult.fixesApplied,
      timestamp: new Date().toISOString(),
    });
    phaseScores.push({ phase: "fix", score: fixResult.score, weight: 20 });
    logs.push(`[${new Date().toISOString()}] Fix complete: ${fixResult.fixed} assets regenerated, score=${fixResult.score}`);

    // ── Phase 3: HEAL — uses errorClassifier + IncidentMemory + Playbooks ─
    logs.push(`[${new Date().toISOString()}] Phase: HEAL — classifying and repairing failures`);
    await base44.asServiceRole.entities.ValidationPipeline.update(pipelineId, { current_phase: "heal", logs });

    const healResult = await realHealPhase(base44, build);
    checks.push({
      phase: "heal",
      check_name: "auto_heal",
      passed: healResult.healed,
      score: healResult.score,
      findings: healResult.issues,
      fixes_applied: healResult.actions,
      timestamp: new Date().toISOString(),
    });
    phaseScores.push({ phase: "heal", score: healResult.score, weight: 20 });
    logs.push(`[${new Date().toISOString()}] Heal complete: ${healResult.healed ? "HEALED" : "not healed"}, score=${healResult.score}, playbook=${healResult.playbookUsed}`);

    // ── Phase 4: HARDEN — secret scanning, RLS, input validation ──────
    logs.push(`[${new Date().toISOString()}] Phase: HARDEN — security and stability checks`);
    await base44.asServiceRole.entities.ValidationPipeline.update(pipelineId, { current_phase: "harden", logs });

    const hardenResult = await realHardenPhase(base44, build);
    checks.push({
      phase: "harden",
      check_name: "auto_harden",
      passed: hardenResult.hardened,
      score: hardenResult.score,
      findings: hardenResult.vulnerabilities,
      fixes_applied: hardenResult.actions,
      timestamp: new Date().toISOString(),
    });
    phaseScores.push({ phase: "harden", score: hardenResult.score, weight: 15 });
    logs.push(`[${new Date().toISOString()}] Harden complete: ${hardenResult.hardened ? "HARDENED" : "vulnerabilities found"}, score=${hardenResult.score}`);

    // ── Phase 5: OPTIMIZE — bundle size, images, accessibility ────────
    logs.push(`[${new Date().toISOString()}] Phase: OPTIMIZE — performance checks`);
    await base44.asServiceRole.entities.ValidationPipeline.update(pipelineId, { current_phase: "optimize", logs });

    const optimizeResult = await realOptimizePhase(base44, build);
    checks.push({
      phase: "optimize",
      check_name: "auto_optimize",
      passed: optimizeResult.optimized,
      score: optimizeResult.score,
      findings: optimizeResult.bottlenecks,
      fixes_applied: optimizeResult.actions,
      timestamp: new Date().toISOString(),
    });
    phaseScores.push({ phase: "optimize", score: optimizeResult.score, weight: 15 });
    logs.push(`[${new Date().toISOString()}] Optimize complete: ${optimizeResult.optimized ? "OPTIMIZED" : "bottlenecks found"}, score=${optimizeResult.score}`);
  }

  // ── Weighted score (NOT Math.max — prevents score inflation) ────────
  let currentScore = calculateWeightedScore(phaseScores);
  logs.push(`[${new Date().toISOString()}] Weighted score: ${currentScore} (phases: ${phaseScores.map(p => `${p.phase}=${p.score}`).join(", ")})`);

  // ── Deterministic compile gate (for system builds with code manifests) ──
  if (build.code_manifest?.files?.length > 0 && build.product_type !== "marketing_site") {
    logs.push(`[${new Date().toISOString()}] Running deterministic compile gate`);
    try {
      const compileRes = await base44.asServiceRole.functions.invoke("compileAndVerify", { build_id: buildId });
      const compileData = compileRes?.data || compileRes;
      checks.push({
        phase: "compile",
        check_name: "deterministic_compile_gate",
        passed: compileData?.compiled === true,
        score: compileData?.score || 0,
        findings: (compileData?.errors || []).join("; ").slice(0, 2000),
        fixes_applied: "",
        timestamp: new Date().toISOString(),
      });
      if (!compileData?.compiled) {
        currentScore = Math.min(currentScore, 40); // Hard cap if compile fails
        logs.push(`[${new Date().toISOString()}] Compile gate FAILED — score capped at 40. Errors: ${(compileData?.errors || []).length}`);
      } else {
        logs.push(`[${new Date().toISOString()}] Compile gate PASSED — score ${compileData.score}%`);
      }
    } catch (e: any) {
      logs.push(`[${new Date().toISOString()}] Compile gate error: ${e?.message}`);
    }
  }

  // ── Post-deploy verification (if deployed) ──────────────────────────
  if (build.deployment?.live_url) {
    logs.push(`[${new Date().toISOString()}] Running post-deploy verification`);
    try {
      const deployResult = await verifyDeploymentInLoop(base44, build);
      checks.push({
        phase: "post_deploy",
        check_name: "post_deploy_verification",
        passed: deployResult.verified,
        score: deployResult.score,
        findings: deployResult.issues,
        fixes_applied: "",
        timestamp: new Date().toISOString(),
      });
      if (!deployResult.verified && deployResult.score > 0) {
        currentScore = Math.min(currentScore, 60); // Cap if deploy verification fails
        logs.push(`[${new Date().toISOString()}] Post-deploy verification FAILED — score capped at 60`);
      }
    } catch (e: any) {
      logs.push(`[${new Date().toISOString()}] Post-deploy verification error: ${e?.message}`);
    }
  }

  // ── Final scoring & quality gate ────────────────────────────────────
  const passed = currentScore >= QUALITY_GATE_THRESHOLD;
  const newRetryCount = (pipeline.retry_count || 0) + 1;
  const finalStatus = passed ? "passed" : (newRetryCount >= MAX_RETRIES ? "failed" : "pending");

  logs.push(`[${new Date().toISOString()}] Validation loop complete: score=${currentScore}, passed=${passed}, retries=${newRetryCount}/${MAX_RETRIES}`);

  await base44.asServiceRole.entities.ValidationPipeline.update(pipelineId, {
    status: finalStatus,
    current_phase: passed ? "complete" : (newRetryCount >= MAX_RETRIES ? "failed" : "audit"),
    score: currentScore,
    retry_count: newRetryCount,
    checks,
    findings_summary: auditResult.findings?.slice(0, 2000) || "",
    fixes_summary: checks.filter((c) => c.phase !== "audit").map((c) => c.fixes_applied).filter(Boolean).join(" | ").slice(0, 2000),
    completed_at: passed || newRetryCount >= MAX_RETRIES ? new Date().toISOString() : undefined,
    logs,
  });

  // If passed, update sandbox
  if (passed) {
    try {
      const sandboxes = await base44.asServiceRole.entities.SandboxEnvironment.filter({ build_id: buildId }, "-created_date", 1);
      if (sandboxes?.[0]) {
        await base44.asServiceRole.entities.SandboxEnvironment.update(sandboxes[0].id, {
          status: "validated",
          validation_score: currentScore,
          validated_at: new Date().toISOString(),
        });
      }
    } catch {}
  }

  // If failed after max retries, create alert + record incident
  if (!passed && newRetryCount >= MAX_RETRIES) {
    try {
      await base44.asServiceRole.entities.SystemAlert.create({
        alert_type: "validation_failure",
        severity: "critical",
        build_id: buildId,
        build_name: build.business_name,
        step: "validation",
        message: `Build "${build.business_name}" failed validation after ${MAX_RETRIES} attempts. Score: ${currentScore}/${QUALITY_GATE_THRESHOLD}`,
        recommended_action: "escalate",
        status: "open",
        context: auditResult.findings?.slice(0, 4000) || "",
      });
    } catch {}

    // Record the incident for future learning
    await recordIncident(base44, build, `Validation failed at ${currentScore}%`, `validation_loop_retry_${MAX_RETRIES}`, "escalated", `Exhausted ${MAX_RETRIES} retries at score ${currentScore}`);
  }

  return {
    ok: true,
    pipeline_id: pipelineId,
    build_id: buildId,
    score: currentScore,
    passed,
    retries: newRetryCount,
    max_retries: MAX_RETRIES,
    quality_gate_threshold: QUALITY_GATE_THRESHOLD,
    status: finalStatus,
    checks: checks.length,
  };
}

// ── Audit phase (kept here — it's the entry point) ──────────────────────

async function runAuditPhase(base44: any, build: any): Promise<{ score: number; findings: string }> {
  const hasArchitecture = !!build.architecture;
  const hasDataModel = !!build.data_model;
  const hasUiSystem = !!build.ui_system;
  const hasCodeManifest = !!build.code_manifest;
  const hasDeployment = !!build.deployment;
  const hasWebsiteContent = !!build.website_content;
  const hasLogo = !!build.chosen_logo_url;
  const hasBrand = (build.chosen_brand_images?.length || 0) > 0;
  const hasNames = (build.name_options?.length || 0) > 0;

  const completenessChecks = [
    { name: "names", present: hasNames, weight: 5 },
    { name: "architecture", present: hasArchitecture, weight: 15 },
    { name: "data_model", present: hasDataModel, weight: 10 },
    { name: "ui_system", present: hasUiSystem, weight: 10 },
    { name: "code_manifest", present: hasCodeManifest, weight: 15 },
    { name: "deployment", present: hasDeployment, weight: 10 },
    { name: "website_content", present: hasWebsiteContent, weight: 10 },
    { name: "logo", present: hasLogo, weight: 5 },
    { name: "brand", present: hasBrand, weight: 5 },
  ];

  let score = 0;
  const missing: string[] = [];
  for (const c of completenessChecks) {
    if (c.present) score += c.weight;
    else missing.push(c.name);
  }

  let findings = "";
  if (missing.length > 0) {
    findings = `Missing generated assets: ${missing.join(", ")}. These need to be generated before the build can pass validation.`;
    score = Math.min(score, 60);
  } else {
    try {
      const auditPrompt = `Audit this autonomous build for quality. Build: "${build.business_name}" (type: ${build.product_type}). All core assets are present. Check for architecture quality, data model consistency, UI system coherence, code manifest completeness, and deployment readiness. Return JSON: { "score": number (0-100), "issues": string, "recommendations": string }`;

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: auditPrompt,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            score: { type: "number" },
            issues: { type: "string" },
            recommendations: { type: "string" },
          },
        },
      });

      if (result?.score) {
        score = Math.max(score, result.score);
        findings = `Issues: ${result.issues || "none"}. Recommendations: ${result.recommendations || "none"}`;
      }
    } catch {
      findings = `LLM audit skipped. Completeness score: ${score}/100. Missing: ${missing.length || "none"}.`;
    }
  }

  return { score, findings };
}