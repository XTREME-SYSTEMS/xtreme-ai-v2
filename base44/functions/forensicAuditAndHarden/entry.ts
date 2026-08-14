import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import { buildAuditPrompt } from "../../shared/autonomousEngine.ts";

// Deep Forensic Audit & Auto-Harden — audits the entire autonomous system,
// identifies hardening actions, and applies auto-fixes. Runs on the nightly workflow.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { plan_id } = body;

    // Gather system snapshot
    const plans = plan_id
      ? await base44.asServiceRole.entities.ImplementationPlan.filter({ id: plan_id }, '-created_date', 1)
      : await base44.asServiceRole.entities.ImplementationPlan.filter({ status: 'active' }, '-created_date', 1);
    const plan = plans[0];
    if (!plan) return Response.json({ error: 'No active plan found' }, { status: 404 });

    const phases = await base44.asServiceRole.entities.ImplementationPhase.filter({ plan_id: plan.id });
    const openTasks = await base44.asServiceRole.entities.RepairTask.filter({ plan_id: plan.id, status: 'open' });
    const recentValidations = await base44.asServiceRole.entities.ValidationResult.filter({ plan_id: plan.id }, '-created_date', 20);

    const snapshot = {
      plan: { name: plan.name, status: plan.status, total_phases: plan.total_phases, completed_phases: plan.completed_phases, overall_score: plan.overall_score },
      phases: phases.map((p) => ({ title: p.title, status: p.status, score: p.score, iteration: p.iteration })),
      open_repair_tasks: openTasks.length,
      recent_validation_scores: recentValidations.map((v) => v.overall_score)
    };

    // Run the forensic audit via LLM
    const auditRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildAuditPrompt(snapshot),
      response_json_schema: {
        type: "object",
        properties: {
          overall_score: { type: "number" },
          completeness_score: { type: "number" },
          correctness_score: { type: "number" },
          integration_score: { type: "number" },
          security_score: { type: "number" },
          performance_score: { type: "number" },
          autonomy_score: { type: "number" },
          critical_findings: { type: "array", items: { type: "string" } },
          hardening_actions: { type: "array", items: { type: "object" } },
          recommendation: { type: "string" }
        }
      }
    });

    const a = typeof auditRes === 'object' ? auditRes : JSON.parse(auditRes);

    // Persist the system health score
    await base44.asServiceRole.entities.SystemHealthScore.create({
      plan_id: plan.id,
      overall_score: a.overall_score || 0,
      completeness_score: a.completeness_score || 0,
      correctness_score: a.correctness_score || 0,
      integration_score: a.integration_score || 0,
      security_score: a.security_score || 0,
      performance_score: a.performance_score || 0,
      autonomy_score: a.autonomy_score || 0,
      qa_pass_rate: phases.length ? (phases.filter((p) => p.status === 'passed').length / phases.length) * 100 : 0,
      phases_passed: phases.filter((p) => p.status === 'passed').length,
      phases_total: phases.length,
      open_repair_tasks: openTasks.length,
      trend: (a.overall_score || 0) >= (plan.overall_score || 0) ? 'improving' : 'declining',
      last_audited_at: new Date().toISOString(),
      active_remediation: (a.hardening_actions || []).slice(0, 3).map((h) => h.action || h.area).join('; ')
    });

    // Update the plan's overall score
    await base44.asServiceRole.entities.ImplementationPlan.update(plan.id, {
      overall_score: a.overall_score || 0,
      completed_phases: phases.filter((p) => p.status === 'passed').length
    });

    // Auto-create repair tasks for hardening actions (attach to first phase —
    // RepairTask requires phase_id; system-level repairs use the lead phase).
    const fallbackPhaseId = phases[0]?.id || '';
    for (const action of (a.hardening_actions || []).slice(0, 10)) {
      await base44.asServiceRole.entities.RepairTask.create({
        plan_id: plan.id,
        phase_id: action.phase_id || fallbackPhaseId,
        area: action.area || 'system',
        description: action.action || '',
        fix_strategy: action.action || '',
        severity: action.priority || 'medium',
        status: 'open'
      });
    }

    return Response.json({
      ok: true,
      plan_id: plan.id,
      overall_score: a.overall_score || 0,
      critical_findings: a.critical_findings || [],
      hardening_actions: a.hardening_actions || [],
      recommendation: a.recommendation || ''
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}