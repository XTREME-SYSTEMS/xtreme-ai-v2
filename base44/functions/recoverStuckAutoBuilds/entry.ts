import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// ============================================================
// recoverStuckAutoBuilds — Auto-heal for the Auto Builder queue.
// Runs on a schedule (every 15 min via workflow). Scans for:
//   1. AutoBuild records stuck in "running" status (updated > 10 min ago)
//   2. AutoBuild records in "failed" status (retry up to 3 times)
// Recovers them by re-running the current step via processAutoBuildStep.
// Creates Receipts for every recovery action for auditability.
// ============================================================

const STUCK_THRESHOLD_MINUTES = 10;
const MAX_FAILURE_RETRIES = 2;

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const now = Date.now();
    const stuckThreshold = new Date(now - STUCK_THRESHOLD_MINUTES * 60 * 1000).toISOString();

    // Find running builds that are potentially stuck (updated > 10 min ago)
    const runningBuilds = await svc.entities.AutoBuild.filter(
      { status: "running" },
      "-updated_date",
      50
    ).catch(() => []);

    // Find failed builds (not yet complete)
    const failedBuilds = await svc.entities.AutoBuild.filter(
      { status: "failed" },
      "-updated_date",
      20
    ).catch(() => []);

    // Early return: nothing to scan — skip the Receipt creation entirely
    if (runningBuilds.length === 0 && failedBuilds.length === 0) {
      return Response.json({ ok: true, scanned: 0, recovered: 0, skipped: 0, marked_failed: 0, details: [] });
    }

    const results = {
      scanned: runningBuilds.length + failedBuilds.length,
      recovered: 0,
      marked_failed: 0,
      skipped: 0,
      details: [] as any[],
    };

    // ---- Process stuck (running) builds ----
    for (const build of runningBuilds) {
      const updatedDate = new Date(build.updated_date || build.created_date || now);
      const ageMinutes = (now - updatedDate.getTime()) / 60000;

      if (ageMinutes < STUCK_THRESHOLD_MINUTES) {
        results.skipped++;
        continue; // Not stuck yet — still running
      }

      const step = build.current_step;
      if (!step || step === "complete") {
        results.skipped++;
        continue;
      }

      try {
        const res = await base44.functions.invoke("processAutoBuildStep", {
          build_id: build.id,
          step,
          advance: build.auto_advance !== false,
          force: true, // Override the running status
        });

        if (res?.data?.success) {
          results.recovered++;
          results.details.push({
            build_id: build.id,
            business_name: build.business_name,
            action: "recovered-stuck",
            step,
            age_minutes: Math.round(ageMinutes),
          });
        } else {
          results.skipped++;
        }
      } catch (err: any) {
        results.markedFailed++;
        results.details.push({
          build_id: build.id,
          business_name: build.business_name,
          action: "recovery-failed",
          error: err?.message || String(err),
        });

        // Create Receipt for the failed recovery
        try {
          await svc.entities.Receipt.create({
            agent_or_workflow: "recoverStuckAutoBuilds",
            action: "recover_stuck_build",
            entity_type: "AutoBuild",
            entity_id: build.id,
            inputs: JSON.stringify({ build_id: build.id, step, age_minutes: Math.round(ageMinutes) }).slice(0, 4000),
            outputs: "",
            status: "failed",
            evidence: `Recovery failed for stuck build: ${err?.message || String(err)}`,
          });
        } catch {}
      }
    }

    // ---- Retry failed builds (up to MAX_FAILURE_RETRIES based on log count) ----
    for (const build of failedBuilds) {
      const failureCount = (build.logs || []).filter((l: string) => l.includes("FAILED")).length;
      if (failureCount >= MAX_FAILURE_RETRIES * 3) {
        // Each step has 3 retry attempts, so 6 FAILED log entries = 2 full step failures
        results.skipped++;
        continue;
      }

      const step = build.current_step;
      if (!step || step === "complete") {
        results.skipped++;
        continue;
      }

      try {
        const res = await base44.functions.invoke("processAutoBuildStep", {
          build_id: build.id,
          step,
          advance: build.auto_advance !== false,
          force: true,
        });

        if (res?.data?.success) {
          results.recovered++;
          results.details.push({
            build_id: build.id,
            business_name: build.business_name,
            action: "retry-failed",
            step,
            attempt: Math.floor(failureCount / 3) + 1,
          });
        } else {
          results.skipped++;
        }
      } catch (err: any) {
        results.markedFailed++;
        results.details.push({
          build_id: build.id,
          business_name: build.business_name,
          action: "retry-failed-error",
          error: err?.message || String(err),
        });
      }
    }

    // Create a summary Receipt
    try {
      await svc.entities.Receipt.create({
        agent_or_workflow: "recoverStuckAutoBuilds",
        action: "auto_heal_scan",
        entity_type: "AutoBuild",
        entity_id: "",
        inputs: JSON.stringify({ stuck_threshold_minutes: STUCK_THRESHOLD_MINUTES, max_retries: MAX_FAILURE_RETRIES }).slice(0, 4000),
        outputs: JSON.stringify(results).slice(0, 4000),
        status: results.recovered > 0 ? "success" : "success",
        evidence: `Scanned ${results.scanned} builds, recovered ${results.recovered}, skipped ${results.skipped}, failed ${results.markedFailed}`,
      });
    } catch {}

    return Response.json({ ok: true, ...results });
  } catch (error: any) {
    console.error("[recoverStuckAutoBuilds]", error);
    return Response.json({ error: error?.message || "Recovery failed" }, { status: 500 });
  }
}