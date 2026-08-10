import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import { IMPLEMENTATION_PHASES } from "../../shared/autonomousEngine.ts";

// Autonomous Build Orchestrator — the heart of the self-driving loop.
// Picks the next pending/failed phase, runs: generate → validate → (reflect if <100) → repeat
// until the phase passes or hits max iterations. Called by the Autonomous Build Loop workflow.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    // Allow workflow (service-role) invocation — no user auth required when called from a workflow.
    const body = await req.json().catch(() => ({}));
    const { plan_id } = body;

    // Find or create the active plan
    let plan;
    if (plan_id) {
      plan = await base44.asServiceRole.entities.ImplementationPlan.get(plan_id);
    } else {
      const plans = await base44.asServiceRole.entities.ImplementationPlan.filter({ status: 'active' }, '-created_date', 1);
      plan = plans[0];
    }

    if (!plan) {
      // Bootstrap the plan + phases from the forensic audit
      plan = await base44.asServiceRole.entities.ImplementationPlan.create({
        name: "Faultline AI Integration — Autonomous Build",
        description: "Autonomous integration of the Faultline AI modules into the Lead Gen Near You site factory, driven by the self-reflecting coding engine.",
        source_system: "Faultline AI (fault-line5)",
        total_phases: IMPLEMENTATION_PHASES.length,
        completed_phases: 0,
        overall_score: 0,
        status: 'active',
        autonomous_mode: true,
        target_score: 100,
        max_iterations_per_phase: 5,
        started_at: new Date().toISOString()
      });

      for (let i = 0; i < IMPLEMENTATION_PHASES.length; i++) {
        const p = IMPLEMENTATION_PHASES[i];
        await base44.asServiceRole.entities.ImplementationPhase.create({
          plan_id: plan.id,
          phase_number: i + 1,
          title: p.title,
          module: p.module,
          objective: p.objective,
          deliverables: p.deliverables,
          entities_required: p.entities_required,
          functions_required: p.functions_required,
          pages_required: p.pages_required,
          status: 'pending',
          score: 0,
          iteration: 0,
          max_iterations: 5
        });
      }
    }

    // Find the next phase that isn't passed
    const phases = await base44.asServiceRole.entities.ImplementationPhase.filter({ plan_id: plan.id });
    const nextPhase = phases
      .filter((p) => p.status !== 'passed' && p.status !== 'blocked')
      .sort((a, b) => (a.phase_number || 0) - (b.phase_number || 0))[0];

    if (!nextPhase) {
      await base44.asServiceRole.entities.ImplementationPlan.update(plan.id, { status: 'complete', completed_at: new Date().toISOString() });
      return Response.json({ ok: true, message: 'All phases passed — plan complete', plan_id: plan.id });
    }

    // Check max iterations
    if ((nextPhase.iteration || 0) >= (nextPhase.max_iterations || 5) && nextPhase.status === 'failed') {
      await base44.asServiceRole.entities.ImplementationPhase.update(nextPhase.id, { status: 'blocked' });
      return Response.json({ ok: true, message: `Phase ${nextPhase.phase_number} blocked after max iterations`, phase_id: nextPhase.id });
    }

    // Step 1 — Generate spec + code
    await base44.asServiceRole.functions.invoke('autonomousCodeSystem', { phase_id: nextPhase.id, plan_id: plan.id });

    // Step 2 — Validate
    const valRes = await base44.asServiceRole.functions.invoke('validatePhase', { phase_id: nextPhase.id });
    const valData = valRes.data || valRes;
    const passed = valData.passed === true || valData.score >= 100;

    // Step 3 — If not passed, reflect and loop (up to 2 reflection passes per orchestrator call)
    let reflectionResult = null;
    if (!passed && (nextPhase.iteration || 0) < (nextPhase.max_iterations || 5)) {
      reflectionResult = await base44.asServiceRole.functions.invoke('sentinelReflect', { phase_id: nextPhase.id });
    }

    return Response.json({
      ok: true,
      plan_id: plan.id,
      phase: { id: nextPhase.id, number: nextPhase.phase_number, title: nextPhase.title },
      validation: { score: valData.score, passed },
      reflection: reflectionResult ? (reflectionResult.data || reflectionResult) : null,
      message: passed ? `Phase ${nextPhase.phase_number} passed at ${valData.score}/100` : `Phase ${nextPhase.phase_number} scored ${valData.score}/100 — reflection queued`
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}