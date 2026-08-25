// Package Validated Build — promotes a validated AutoBuild to a ProductPackage.
// Called when a build passes the validation pipeline (score >= 75%).
// Creates a ProductPackage record with the full manifest, deployment config,
// and validation score. The sandbox is then marked for archival.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.43";

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
    const base44 = createClientFromRequest(req);

    let user: any = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (!user || (user.role !== "admin" && user.role !== "employee")) {
      return new Response(JSON.stringify({ error: "Admin or employee access required" }), { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const buildId = String(body.build_id || "");

    if (!buildId) {
      return new Response(JSON.stringify({ error: "build_id is required" }), { status: 400 });
    }

    // Load the build
    const builds = await base44.asServiceRole.entities.AutoBuild.filter({ id: buildId }, "-created_date", 1);
    const build = builds?.[0];
    if (!build) {
      return new Response(JSON.stringify({ error: "Build not found" }), { status: 404 });
    }

    // Check validation passed
    const pipelines = await base44.asServiceRole.entities.ValidationPipeline.filter({ build_id: buildId }, "-created_date", 1);
    const pipeline = pipelines?.[0];
    if (!pipeline || pipeline.status !== "passed") {
      return new Response(JSON.stringify({
        error: "Build has not passed validation. Run the validation loop first.",
        pipeline_status: pipeline?.status || "none",
        score: pipeline?.score || 0,
      }), { status: 400 });
    }

    // Check if a package already exists
    const existing = await base44.asServiceRole.entities.ProductPackage.filter({ build_id: buildId }, "-created_date", 1);
    if (existing?.[0]) {
      return new Response(JSON.stringify({
        ok: true,
        message: "Product package already exists for this build",
        package_id: existing[0].id,
        package: existing[0],
      }), { status: 200 });
    }

    // Get the sandbox environment
    const sandboxes = await base44.asServiceRole.entities.SandboxEnvironment.filter({ build_id: buildId }, "-created_date", 1);
    const sandbox = sandboxes?.[0];

    // Create the product package
    const pkg = await base44.asServiceRole.entities.ProductPackage.create({
      build_id: buildId,
      sandbox_id: sandbox?.id || "",
      validation_pipeline_id: pipeline.id,
      name: `${build.business_name} — ${build.product_type.replace("_", " ")}`,
      business_name: build.business_name,
      industry: build.industry || "",
      product_type: build.product_type,
      validation_score: pipeline.score,
      quality_gate_passed: true,
      manifest: build.code_manifest || {},
      deployment_config: build.deployment || {},
      preview_url: sandbox?.preview_url || "",
      status: "packaged",
      packaged_at: new Date().toISOString(),
      validation_summary: pipeline.fixes_summary || `Passed validation with score ${pipeline.score}`,
      tags: [build.industry, build.product_type, build.sub_industry].filter(Boolean),
      logs: [`[${new Date().toISOString()}] Product packaged from build ${buildId} with validation score ${pipeline.score}`],
    });

    // Update sandbox to validated/archived
    if (sandbox) {
      await base44.asServiceRole.entities.SandboxEnvironment.update(sandbox.id, {
        status: "validated",
        validation_score: pipeline.score,
        validated_at: new Date().toISOString(),
      });
    }

    // Update build status to complete
    await base44.asServiceRole.entities.AutoBuild.update(buildId, {
      status: "complete",
      current_step: "complete",
    });

    // Create Receipt
    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: "packageValidatedBuild",
        action: "package_build",
        entity_type: "AutoBuild",
        entity_id: buildId,
        inputs: JSON.stringify({ build_id: buildId }).slice(0, 4000),
        outputs: JSON.stringify({ package_id: pkg.id, name: pkg.name, score: pipeline.score }).slice(0, 4000),
        status: "success",
        evidence: `Build "${build.business_name}" packaged as product with validation score ${pipeline.score}`,
      });
    } catch {}

    return new Response(JSON.stringify({
      ok: true,
      package_id: pkg.id,
      name: pkg.name,
      validation_score: pipeline.score,
      status: "packaged",
    }), { status: 200 });

  } catch (e) {
    console.error("packageValidatedBuild error:", e);
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), { status: 500 });
  }
});