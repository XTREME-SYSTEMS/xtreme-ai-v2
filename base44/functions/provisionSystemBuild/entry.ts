// provisionSystemBuild — HTTP handler that autonomously provisions the
// full deployment stack (GitHub + Vercel + Supabase + Google Drive) and
// generates all system documentation at the end of a system build.
//
// Called from the admin UI ("Provision Build" button) and automatically
// by the processAutoBuildStep queue processor at the system_review step.
//
// Each service is provisioned independently — a failure in one does not
// block the others. Results are recorded on the AutoBuild deployment
// field and a Receipt is created for auditability.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { provisionSystemBuild } from "../../shared/systemBuildProvisioning.ts";

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
    if (!buildId) {
      return new Response(JSON.stringify({ error: "build_id is required" }), { status: 400 });
    }

    const { deployment, provisioned } = await provisionSystemBuild(base44, buildId);

    // Persist the deployment record on the AutoBuild
    await base44.asServiceRole.entities.AutoBuild.update(buildId, { deployment });

    return new Response(JSON.stringify({
      success: true,
      build_id: buildId,
      deployment,
      provisioned,
    }), { status: 200 });
  } catch (e) {
    console.error("provisionSystemBuild error:", e);
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), { status: 500 });
  }
});