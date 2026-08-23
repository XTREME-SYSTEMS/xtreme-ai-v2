import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

// applySystemOptimization — Applies a fix for a specific SystemOptimization
// finding. Calls the finding's action_endpoint with the action_payload, then
// updates the finding status based on the result.
//
// Retry-with-backoff: retries up to MAX_ATTEMPTS times before marking failed.
// Only marks as "failed" after all retries are exhausted. A failed finding
// can still be retried manually (the button stays available).
//
// Supports all action types: fix, heal, harden, optimize, enhance.

const MAX_ATTEMPTS = 3;
const BASE_DELAY_SEC = 3;

const sleep = (sec: number) => new Promise((r) => setTimeout(r, sec * 1000));

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { optimizationId } = body;

    if (!optimizationId) return Response.json({ error: 'optimizationId is required' }, { status: 400 });

    const finding = await base44.asServiceRole.entities.SystemOptimization.get(optimizationId);
    if (!finding) return Response.json({ error: 'Finding not found' }, { status: 404 });

    // Mark as fixing
    await base44.asServiceRole.entities.SystemOptimization.update(optimizationId, {
      status: 'fixing',
      logs: [...(finding.logs || []), `[${new Date().toISOString()}] Applying ${finding.recommended_action} via ${finding.action_endpoint} (up to ${MAX_ATTEMPTS} attempts)`],
    });

    const payload = finding.action_payload ? JSON.parse(finding.action_payload) : {};

    // ── Retry loop: try up to MAX_ATTEMPTS times with exponential backoff ──
    let result: any = null;
    let lastError: string | null = null;
    let success = false;
    const attemptLogs: string[] = [];

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      if (attempt > 1) await sleep(BASE_DELAY_SEC * Math.pow(2, attempt - 2));

      try {
        const res = await base44.asServiceRole.functions.invoke(finding.action_endpoint, payload);
        result = res?.data || res;

        // Check if the fix succeeded — be lenient: only treat as failed if explicitly failed
        const attemptSuccess = result?.ok !== false && result?.healed !== false && !result?.error;

        if (attemptSuccess) {
          success = true;
          attemptLogs.push(`[${new Date().toISOString()}] Attempt ${attempt}/${MAX_ATTEMPTS}: SUCCESS`);
          break;
        } else {
          // Endpoint returned a failure result — retry
          lastError = result?.message || result?.error || 'endpoint returned failure';
          attemptLogs.push(`[${new Date().toISOString()}] Attempt ${attempt}/${MAX_ATTEMPTS}: FAILED — ${lastError}`);
        }
      } catch (applyErr: any) {
        lastError = applyErr?.message || 'unknown';
        attemptLogs.push(`[${new Date().toISOString()}] Attempt ${attempt}/${MAX_ATTEMPTS}: ERROR — ${lastError}`);
      }
    }

    // Update the finding with final status
    await base44.asServiceRole.entities.SystemOptimization.update(optimizationId, {
      status: success ? 'resolved' : 'failed',
      resolved_at: success ? new Date().toISOString() : undefined,
      resolution: success
        ? `Fixed via ${finding.action_endpoint} (after up to ${MAX_ATTEMPTS} attempts)`
        : `Fix failed after ${MAX_ATTEMPTS} attempts — retry available`,
      logs: [...(finding.logs || []), ...attemptLogs],
    });

    // Record a Receipt
    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: 'applySystemOptimization',
        action: finding.recommended_action,
        entity_type: 'SystemOptimization',
        entity_id: optimizationId,
        inputs: JSON.stringify({ optimizationId, endpoint: finding.action_endpoint, attempts: MAX_ATTEMPTS }).slice(0, 4000),
        outputs: JSON.stringify({ success, result, lastError }).slice(0, 4000),
        status: success ? 'success' : 'failed',
        evidence: `Applied ${finding.recommended_action} for: ${finding.title} — ${success ? 'SUCCESS' : `FAILED after ${MAX_ATTEMPTS} attempts`}`,
      });
    } catch {}

    return Response.json({
      ok: success,
      optimizationId,
      action: finding.recommended_action,
      result,
      attempts: MAX_ATTEMPTS,
      message: success ? undefined : `Failed after ${MAX_ATTEMPTS} attempts: ${lastError}`,
    });
  } catch (error) {
    console.error('applySystemOptimization error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}