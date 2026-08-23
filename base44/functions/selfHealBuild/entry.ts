import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';
import { classifyError } from '../../shared/errorClassifier.ts';

// selfHealBuild — Autonomous self-healing loop with retry-with-backoff.
// Examines a failed/stuck AutoBuild, classifies the error, and attempts
// recovery multiple times before escalating. Only escalates after all
// retries are exhausted within this invocation AND the alert's total
// retry_count exceeds MAX_TOTAL_RETRIES.
//
// Key design: every heal attempt retries up to MAX_HEAL_ATTEMPTS times
// with exponential backoff WITHIN a single invocation, so a single
// button press always tries its hardest before giving up.
//
// Called by:
// - The "Autonomous Build Loop" workflow on a schedule
// - The "Auto Heal Loop" workflow on entity update (status=failed)
// - Manually from the admin UI (SystemAlerts / SystemOptimization)

const MAX_HEAL_ATTEMPTS = 3;       // retries per invocation
const BASE_DELAY_SEC = 3;          // base backoff delay
const MAX_TOTAL_RETRIES = 15;      // cross-invocation cap before forced escalation

const sleep = (sec: number) => new Promise((r) => setTimeout(r, sec * 1000));

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { buildId, action, alertType, alertId } = body;

    if (!buildId && !alertType) return Response.json({ error: 'buildId is required' }, { status: 400 });

    // Fetch the alert if we have an alertId (to get live_url for post-deploy alerts)
    let alert: any = null;
    if (alertId) {
      try {
        alert = await base44.asServiceRole.entities.SystemAlert.get(alertId);
      } catch {}
    }

    // Fetch the build (graceful — post-deploy alerts may not have a real build)
    let build: any = null;
    if (buildId) {
      try {
        build = await base44.asServiceRole.entities.AutoBuild.get(buildId);
      } catch {}
    }

    // ── Post-deploy check failures: retry verification up to MAX_HEAL_ATTEMPTS ──
    if (alertType === 'post_deploy_check_failure') {
      const liveUrl = alert?.live_url || build?.deployment?.live_url;
      if (!liveUrl) {
        return Response.json({
          ok: false,
          action: 'escalate',
          message: 'No live URL to verify — cannot self-heal post-deploy check failure',
        }, { status: 400 });
      }

      let lastVerifyResult: any = null;
      let lastError: string | null = null;
      let allPassed = false;

      for (let attempt = 1; attempt <= MAX_HEAL_ATTEMPTS; attempt++) {
        if (attempt > 1) await sleep(BASE_DELAY_SEC * Math.pow(2, attempt - 2));

        try {
          const res = await base44.asServiceRole.functions.invoke('verifyDeployment', {
            liveUrl,
            buildId,
          });
          lastVerifyResult = res?.data || res;
          const checks = lastVerifyResult?.checks || [];
          allPassed = checks.length > 0 && checks.every((c: any) => c.passed);
          if (allPassed) break; // success — stop retrying
        } catch (verifyErr: any) {
          lastError = verifyErr?.message || 'unknown';
        }
      }

      const score = lastVerifyResult?.score ?? 0;
      const checks = lastVerifyResult?.checks || [];
      const totalRetries = (alert?.retry_count || 0) + MAX_HEAL_ATTEMPTS;

      // Update the alert
      if (alertId) {
        try {
          await base44.asServiceRole.entities.SystemAlert.update(alertId, {
            status: allPassed ? 'resolved' : (totalRetries >= MAX_TOTAL_RETRIES ? 'escalated' : 'open'),
            resolved_at: allPassed ? new Date().toISOString() : undefined,
            resolution: allPassed
              ? 'Self-healed: post-deploy verification passed on retry'
              : (totalRetries >= MAX_TOTAL_RETRIES ? 'Re-verification still failing after max retries — needs operator' : undefined),
            retry_count: totalRetries,
            context: `Re-verified at ${score}% — ${checks.filter((c: any) => c.passed).length}/${checks.length} checks passed (tried ${MAX_HEAL_ATTEMPTS}x this round, ${totalRetries}x total)`,
            logs: [...(alert?.logs || []), `[${new Date().toISOString()}] self-heal: re-verified deployment → ${score}% (${checks.filter((c: any) => c.passed).length}/${checks.length} passed) — ${allPassed ? 'HEALED' : 'still failing'} after ${MAX_HEAL_ATTEMPTS} attempts`],
          });
        } catch {}
      }

      try {
        await base44.asServiceRole.entities.Receipt.create({
          agent_or_workflow: 'selfHealBuild',
          action: 'self_heal_post_deploy',
          entity_type: 'AutoBuild',
          entity_id: buildId,
          inputs: JSON.stringify({ buildId, alertType, liveUrl, attempts: MAX_HEAL_ATTEMPTS }).slice(0, 4000),
          outputs: JSON.stringify({ score, passed: allPassed, totalRetries }).slice(0, 4000),
          status: allPassed ? 'success' : 'escalated',
          evidence: `Post-deploy re-verification after ${MAX_HEAL_ATTEMPTS} attempts: ${score}% — ${allPassed ? 'PASS' : 'STILL FAILING'}`,
        });
      } catch {}

      return Response.json({
        ok: allPassed,
        action: allPassed ? 'resolved' : (totalRetries >= MAX_TOTAL_RETRIES ? 'escalate' : 'retry'),
        healed: allPassed,
        message: allPassed
          ? `Post-deploy verification passed on retry (${score}%)`
          : `Re-verification still failing at ${score}% after ${MAX_HEAL_ATTEMPTS} attempts — ${totalRetries >= MAX_TOTAL_RETRIES ? 'escalated' : 'retry available'}`,
        buildId,
        score,
        checks,
      });
    }

    // ── Non-post-deploy: need a valid build to retry/regenerate ──
    if (!build) {
      return Response.json({
        ok: false,
        action: 'escalate',
        message: `Build ${buildId} not found — cannot self-heal without a build record`,
      }, { status: 404 });
    }

    const stepKey = build.current_step || 'unknown';
    const errorMsg = build.error || `Build stuck at step ${stepKey}`;
    const classified = classifyError(errorMsg);
    const totalRetries = (alert?.retry_count || 0) + MAX_HEAL_ATTEMPTS;

    // If we've exhausted all cross-invocation retries, escalate
    if (totalRetries >= MAX_TOTAL_RETRIES) {
      try {
        await base44.asServiceRole.entities.SystemAlert.create({
          alert_type: 'circuit_breaker_tripped',
          severity: 'critical',
          build_id: buildId,
          build_name: build.business_name,
          step: stepKey,
          message: `Max retries (${MAX_TOTAL_RETRIES}) exhausted for ${build.business_name} at step ${stepKey}`,
          error_class: classified.class,
          recommended_action: 'escalate',
          context: `Build has failed ${totalRetries} total times at step ${stepKey}. Last error: ${errorMsg}`,
          status: 'escalated',
        });
      } catch {}

      return Response.json({
        ok: false,
        action: 'escalate',
        message: `Max retries (${MAX_TOTAL_RETRIES}) exhausted — escalating to operator`,
        buildId,
        step: stepKey,
      });
    }

    // ── Retry loop: try up to MAX_HEAL_ATTEMPTS times with backoff ──
    let healed = false;
    let lastError: string | null = null;
    const attemptLogs: string[] = [];

    for (let attempt = 1; attempt <= MAX_HEAL_ATTEMPTS; attempt++) {
      if (attempt > 1) await sleep(BASE_DELAY_SEC * Math.pow(2, attempt - 2));

      const attemptLabel = `attempt ${attempt}/${MAX_HEAL_ATTEMPTS}`;
      attemptLogs.push(`[${new Date().toISOString()}] self-heal ${attemptLabel}: ${classified.class} → ${classified.recommendedAction}`);

      try {
        if (classified.recommendedAction === 'retry' || classified.recommendedAction === 'regenerate') {
          const invokePayload: any = {
            buildId,
            step: stepKey,
            action: 'execute',
          };
          if (classified.recommendedAction === 'regenerate') {
            invokePayload.previousErrors = [classified.context];
          }

          await base44.asServiceRole.functions.invoke('processAutoBuildStep', invokePayload);
          healed = true;
          attemptLogs.push(`[${new Date().toISOString()}] self-heal ${attemptLabel}: SUCCESS`);
          break; // success — stop retrying
        } else {
          // escalate-class error — don't retry
          lastError = `${classified.class} error requires operator intervention`;
          break;
        }
      } catch (retryErr: any) {
        lastError = retryErr?.message || 'unknown';
        attemptLogs.push(`[${new Date().toISOString()}] self-heal ${attemptLabel}: FAILED — ${lastError}`);
        // Re-classify the new error for the next attempt
      }
    }

    // Update the build with logs
    try {
      await base44.asServiceRole.entities.AutoBuild.update(buildId, {
        logs: [...(build.logs || []), ...attemptLogs],
        error: healed ? '' : (lastError || build.error),
      });
    } catch {}

    // Update the alert if we have one
    if (alertId) {
      try {
        await base44.asServiceRole.entities.SystemAlert.update(alertId, {
          status: healed ? 'resolved' : (totalRetries >= MAX_TOTAL_RETRIES ? 'escalated' : 'open'),
          resolved_at: healed ? new Date().toISOString() : undefined,
          resolution: healed
            ? `Self-healed: step ${stepKey} recovered after retry`
            : (totalRetries >= MAX_TOTAL_RETRIES ? `Failed after ${MAX_HEAL_ATTEMPTS} attempts — escalated` : undefined),
          retry_count: totalRetries,
          context: healed ? undefined : `Last error: ${lastError} (tried ${MAX_HEAL_ATTEMPTS}x this round, ${totalRetries}x total)`,
          logs: [...(alert?.logs || []), ...attemptLogs],
        });
      } catch {}
    }

    // If not healed and not yet at max retries, create/update an alert for visibility
    if (!healed && !alertId && totalRetries < MAX_TOTAL_RETRIES) {
      try {
        await base44.asServiceRole.entities.SystemAlert.create({
          alert_type: 'build_failure',
          severity: 'warning',
          build_id: buildId,
          build_name: build.business_name,
          step: stepKey,
          message: `Build ${build.business_name} failed at ${stepKey}: ${errorMsg}`,
          error_class: classified.class,
          recommended_action: classified.recommendedAction === 'escalate' ? 'escalate' : 'retry',
          context: `Last error: ${lastError} (tried ${MAX_HEAL_ATTEMPTS}x this round, ${totalRetries}x total)`,
          status: 'open',
          retry_count: totalRetries,
        });
      } catch {}
    }

    // Record a Receipt
    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: 'selfHealBuild',
        action: 'self_heal_attempt',
        entity_type: 'AutoBuild',
        entity_id: buildId,
        inputs: JSON.stringify({ buildId, step: stepKey, errorClass: classified.class, attempts: MAX_HEAL_ATTEMPTS }).slice(0, 4000),
        outputs: JSON.stringify({ healed, totalRetries, lastError }).slice(0, 4000),
        status: healed ? 'success' : 'escalated',
        evidence: healed
          ? `Healed step ${stepKey} after retry`
          : `Failed to heal after ${MAX_HEAL_ATTEMPTS} attempts (${totalRetries} total) — ${lastError}`,
      });
    } catch {}

    return Response.json({
      ok: healed,
      action: healed ? 'resolved' : (totalRetries >= MAX_TOTAL_RETRIES ? 'escalate' : 'retry'),
      healed,
      message: healed
        ? `Step ${stepKey} healed after retry`
        : `Failed after ${MAX_HEAL_ATTEMPTS} attempts — ${totalRetries >= MAX_TOTAL_RETRIES ? 'escalated' : 'retry available'} (${lastError})`,
      buildId,
      step: stepKey,
      totalRetries,
    });
  } catch (error) {
    console.error('selfHealBuild error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}