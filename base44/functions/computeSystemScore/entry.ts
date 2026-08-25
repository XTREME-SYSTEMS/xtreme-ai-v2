import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

// Compute System Score — aggregates the latest phase scores and validation results
// into a single SystemHealthScore. Lightweight (no LLM) — called by the dashboard.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { plan_id } = body;

    const plans = plan_id
      ? [await base44.asServiceRole.entities.ImplementationPlan.get(plan_id)]
      : await base44.asServiceRole.entities.ImplementationPlan.filter({}, '-created_date', 1);
    const plan = plans[0];
    if (!plan) return Response.json({ error: 'No plan found' }, { status: 404 });

    const phases = await base44.asServiceRole.entities.ImplementationPhase.filter({ plan_id: plan.id });
    const openTasks = await base44.asServiceRole.entities.RepairTask.filter({ plan_id: plan.id, status: 'open' });
    const passed = phases.filter((p) => p.status === 'passed');
    const avgScore = phases.length ? phases.reduce((s, p) => s + (p.score || 0), 0) / phases.length : 0;

    const health = {
      plan_id: plan.id,
      overall_score: Math.round(avgScore),
      phases_passed: passed.length,
      phases_total: phases.length,
      open_repair_tasks: openTasks.length,
      qa_pass_rate: phases.length ? Math.round((passed.length / phases.length) * 100) : 0,
      trend: avgScore >= (plan.overall_score || 0) ? 'improving' : 'declining',
      last_audited_at: new Date().toISOString()
    };

    await base44.asServiceRole.entities.SystemHealthScore.create(health);
    await base44.asServiceRole.entities.ImplementationPlan.update(plan.id, {
      overall_score: health.overall_score,
      completed_phases: passed.length,
      status: passed.length === phases.length && phases.length > 0 ? 'complete' : plan.status
    });

    return Response.json({ ok: true, ...health });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}