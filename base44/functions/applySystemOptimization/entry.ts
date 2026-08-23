import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

// applySystemOptimization — Applies a fix for a specific SystemOptimization
// finding. Calls the finding's action_endpoint with the action_payload, then
// updates the finding status based on the result.
//
// Supports all action types: fix, heal, harden, optimize, enhance.
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
      logs: [...(finding.logs || []), `[${new Date().toISOString()}] Applying ${finding.recommended_action} via ${finding.action_endpoint}`],
    });

    let result: any;
    try {
      const payload = finding.action_payload ? JSON.parse(finding.action_payload) : {};
      const res = await base44.asServiceRole.functions.invoke(finding.action_endpoint, payload);
      result = res?.data || res;
    } catch (applyErr: any) {
      // Fix failed — mark as failed but keep it re-tryable
      await base44.asServiceRole.entities.SystemOptimization.update(optimizationId, {
        status: 'failed',
        logs: [...(finding.logs || []), `[${new Date().toISOString()}] Fix FAILED: ${applyErr?.message || 'unknown'}`],
      });
      return Response.json({
        ok: false,
        optimizationId,
        error: applyErr?.message || 'Fix application failed',
      }, { status: 500 });
    }

    // Check if the fix succeeded — be lenient: only mark failed if explicitly failed
    const success = result?.ok !== false && result?.healed !== false && !result?.error;

    await base44.asServiceRole.entities.SystemOptimization.update(optimizationId, {
      status: success ? 'resolved' : 'failed',
      resolved_at: success ? new Date().toISOString() : undefined,
      resolution: success
        ? `Fixed via ${finding.action_endpoint}`
        : `Fix attempted but issue persists — retry available`,
      logs: [...(finding.logs || []), `[${new Date().toISOString()}] Fix ${success ? 'SUCCEEDED' : 'FAILED'}: ${JSON.stringify(result).slice(0, 500)}`],
    });

    // Record a Receipt
    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: 'applySystemOptimization',
        action: finding.recommended_action,
        entity_type: 'SystemOptimization',
        entity_id: optimizationId,
        inputs: JSON.stringify({ optimizationId, endpoint: finding.action_endpoint }).slice(0, 4000),
        outputs: JSON.stringify(result).slice(0, 4000),
        status: success ? 'success' : 'failed',
        evidence: `Applied ${finding.recommended_action} for: ${finding.title}`,
      });
    } catch {}

    return Response.json({
      ok: success,
      optimizationId,
      action: finding.recommended_action,
      result,
    });
  } catch (error) {
    console.error('applySystemOptimization error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}