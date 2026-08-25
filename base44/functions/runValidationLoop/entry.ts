// runValidationLoop — HTTP endpoint wrapper for the shared validation loop.
// The core logic lives in base44/shared/validationLoop.ts so processAutoBuildStep
// can call it directly without an HTTP round-trip.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.43";
import { executeValidationLoop } from "../../shared/validationLoop.ts";

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
    const base44 = createClientFromRequest(req);

    // Admin or employee only
    let user: any = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (!user || (user.role !== "admin" && user.role !== "employee")) {
      return new Response(JSON.stringify({ error: "Admin or employee access required" }), { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const buildId = String(body.build_id || "");
    const force = body.force === true;

    if (!buildId) {
      return new Response(JSON.stringify({ error: "build_id is required" }), { status: 400 });
    }

    const result = await executeValidationLoop(base44, buildId, force);

    // Create Receipt
    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: "runValidationLoop",
        action: "validation_loop",
        entity_type: "AutoBuild",
        entity_id: buildId,
        inputs: JSON.stringify({ build_id: buildId, force }).slice(0, 4000),
        outputs: JSON.stringify(result).slice(0, 4000),
        status: result.passed ? "success" : (result.status === "failed" ? "failed" : "pending"),
        evidence: `Validation loop: score=${result.score}, passed=${result.passed}, retries=${result.retries}/${result.max_retries}`,
      });
    } catch {}

    return new Response(JSON.stringify(result), { status: 200 });

  } catch (e) {
    console.error("runValidationLoop error:", e);
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), { status: 500 });
  }
});