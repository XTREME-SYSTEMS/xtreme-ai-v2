import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { classifyError, CircuitBreaker } from '../../shared/errorClassifier.ts';

// selfHealBuild — Phase 3: Autonomous self-healing loop.
// Examines a failed/stuck AutoBuild, classifies the error, and attempts
// recovery (retry, regenerate with context, or escalate). Creates a
// SystemAlert when it can't self-heal.
//
// Called by:
// - The "Autonomous Build Loop" workflow on a schedule
// - The "Auto Heal Loop" workflow on entity update (status=failed)
// - Manually from the admin UI
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

    // Post-deploy check failures need re-verification, not step retry
    if (alertType === 'post_deploy_check_failure') {
      const liveUrl = alert?.live_url || build?.deployment?.live_url;
      if (!liveUrl) {
        return Response.json({
          ok: false,
          action: 'escalate',
          message: 'No live URL to verify — cannot self-heal post-deploy check failure',
        }, { status: 400 });
      }

      let verifyResult: any = null;
      try {
        const res = await base44.asServiceRole.functions.invoke('verifyDeployment', {
          liveUrl,
          buildId,
        });
        verifyResult = res?.data || res;
      } catch (verifyErr: any) {
        return Response.json({
          ok: false,
          action: 'escalate',
          message: `Re-verification failed: ${verifyErr?.message || 'unknown'}`,
        }, { status: 500 });
      }

      const score = verifyResult?.score ?? 0;
      const checks = verifyResult?.checks || [];
      const allPassed = checks.length > 0 && checks.every((c: any) => c.passed);

      // Update the alert
      if (alertId) {
        try {
          await base44.asServiceRole.entities.SystemAlert.update(alertId, {
            status: allPassed ? 'resolved' : 'escalated',
            resolved_at: new Date().toISOString(),
            resolution: allPassed ? 'Self-healed: post-deploy verification passed on retry' : 'Re-verification still failing — needs operator',
            retry_count: (alert?.retry_count || 0) + 1,
            context: `Re-verified at ${score}% — ${checks.filter((c: any) => c.passed).length}/${checks.length} checks passed`,
            logs: [...(alert?.logs || []), `[${new Date().toISOString()}] self-heal: re-verified deployment → ${score}% (${checks.filter((c: any) => c.passed).length}/${checks.length} passed)`],
          });
        } catch {}
      }

      try {
        await base44.asServiceRole.entities.Receipt.create({
          agent_or_workflow: 'selfHealBuild',
          action: 'self_heal_post_deploy',
          entity_type: 'AutoBuild',
          entity_id: buildId,
          inputs: JSON.stringify({ buildId, alertType, liveUrl }).slice(0, 4000),
          outputs: JSON.stringify({ score, passed: allPassed }).slice(0, 4000),
          status: allPassed ? 'success' : 'escalated',
          evidence: `Post-deploy re-verification: ${score}% — ${allPassed ? 'PASS' : 'STILL FAILING'}`,
        });
      } catch {}

      return Response.json({
        ok: allPassed,
        action: allPassed ? 'resolved' : 'escalate',
        healed: allPassed,
        message: allPassed
          ? `Post-deploy verification passed on retry (${score}%)`
          : `Re-verification still failing at ${score}% — escalated`,
        buildId,
        score,
        checks,
      });
    }

    // For non-post-deploy alerts, we need a valid build to retry/regenerate
    if (!build) {
      return Response.json({
        ok: false,
        action: 'escalate',
        message: `Build ${buildId} not found — cannot self-heal without a build record`,
      }, { status: 404 });
    }

    const breaker = new CircuitBreaker(5);
    const stepKey = build.current_step || 'unknown';
    const errorKey = `${buildId}:${stepKey}`;

    // If circuit breaker is already tripped, escalate
    if (breaker.isOpen(errorKey)) {
      try {
        await base44.asServiceRole.entities.SystemAlert.create({
          alert_type: 'circuit_breaker_tripped',
          severity: 'critical',
          build_id: buildId,
          build_name: build.business_name,
          step: stepKey,
          message: `Circuit breaker tripped for ${build.business_name} at step ${stepKey} — repeated failures`,
          error_class: 'structural',
          recommended_action: 'escalate',
          context: `Build has failed ${breaker['failureCounts']?.get(errorKey) || 5} times at step ${stepKey}`,
          status: 'escalated',
        });
      } catch {}

      return Response.json({
        ok: false,
        action: 'escalated',
        message: 'Circuit breaker tripped — escalating to operator',
        buildId,
        step: stepKey,
      });
    }

    // Classify the error
    const errorMsg = build.error || `Build stuck at step ${stepKey}`;
    const classified = classifyError(errorMsg);

    // Record the failure
    const tripped = breaker.recordFailure(errorKey);

    // Log the healing attempt
    const logs = [...(build.logs || []), `[${new Date().toISOString()}] self-heal: ${classified.class} → ${classified.recommendedAction} (attempt ${(build.logs || []).filter((l: string) => l.includes('self-heal')).length + 1})`];

    let result: any = { action: classified.recommendedAction, classified };

    if (classified.recommendedAction === 'retry') {
      // Transient error — wait and retry the step
      await new Promise((r) => setTimeout(r, classified.retryDelay * 1000));

      // Re-invoke the step processor
      try {
        await base44.asServiceRole.functions.invoke('processAutoBuildStep', {
          buildId,
          step: stepKey,
          action: 'execute',
        });
        breaker.recordSuccess(errorKey);
        result.healed = true;
        result.message = `Retried step ${stepKey} after ${classified.class} error`;
      } catch (retryErr: any) {
        result.healed = false;
        result.message = `Retry failed: ${retryErr?.message || 'unknown'}`;
      }
    } else if (classified.recommendedAction === 'regenerate') {
      // Structural/schema error — regenerate with error context injected
      try {
        await base44.asServiceRole.functions.invoke('processAutoBuildStep', {
          buildId,
          step: stepKey,
          action: 'execute',
          previousErrors: [classified.context],
        });
        breaker.recordSuccess(errorKey);
        result.healed = true;
        result.message = `Regenerated step ${stepKey} with error context`;
      } catch (regenErr: any) {
        result.healed = false;
        result.message = `Regeneration failed: ${regenErr?.message || 'unknown'}`;
      }
    } else {
      // Escalate
      try {
        await base44.asServiceRole.entities.SystemAlert.create({
          alert_type: 'build_failure',
          severity: 'critical',
          build_id: buildId,
          build_name: build.business_name,
          step: stepKey,
          message: `Build ${build.business_name} failed at ${stepKey}: ${errorMsg}`,
          error_class: classified.class,
          recommended_action: 'escalate',
          context: classified.context,
          status: 'escalated',
        });
      } catch {}

      result.healed = false;
      result.message = `Escalated: ${classified.class} error requires operator intervention`;
    }

    // Update the build with logs
    try {
      await base44.asServiceRole.entities.AutoBuild.update(buildId, {
        logs,
        error: result.healed ? '' : build.error,
      });
    } catch {}

    // Record a Receipt
    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: 'selfHealBuild',
        action: 'self_heal_attempt',
        entity_type: 'AutoBuild',
        entity_id: buildId,
        inputs: JSON.stringify({ buildId, step: stepKey, errorClass: classified.class }).slice(0, 4000),
        outputs: JSON.stringify({ action: result.action, healed: result.healed }).slice(0, 4000),
        status: result.healed ? 'success' : 'escalated',
        evidence: result.message,
      });
    } catch {}

    return Response.json({
      ok: true,
      ...result,
      buildId,
      step: stepKey,
    });
  } catch (error) {
    console.error('selfHealBuild error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}