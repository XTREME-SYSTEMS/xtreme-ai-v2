import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import { IMPLEMENTATION_PHASES } from "../../shared/autonomousEngine.ts";

// Autonomous Build Orchestrator — the heart of the self-driving loop.
// Advances EVERY active plan by one phase iteration per cycle: generate → validate → reflect.
// Called by the Autonomous Build Loop workflow (every 10 min).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { plan_id } = body;

    // Resolve which plan(s) to run this cycle.
    let plansToRun = [];
    if (plan_id) {
      const p = await base44.asServiceRole.entities.ImplementationPlan.get(plan_id);
      plansToRun = p ? [p] : [];
    } else {
      plansToRun = await base44.asServiceRole.entities.ImplementationPlan.filter({ status: 'active' }, '-created_date', 50);
      if (plansToRun.length === 0) {
        // Bootstrap the default Faultline plan if nothing exists.
        const plan = await bootstrapPlan(base44);
        plansToRun = [plan];
      }
    }

    const results = [];
    for (const plan of plansToRun) {
      try {
        const r = await runOnePlan(base44, plan);
        results.push(r);
      } catch (e) {
        results.push({ plan_id: plan.id, error: e.message });
      }
    }

    return Response.json({ ok: true, plans_run: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

async function bootstrapPlan(base44) {
  const plan = await base44.asServiceRole.entities.ImplementationPlan.create({
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
      plan_id: plan.id, phase_number: i + 1, title: p.title, module: p.module,
      objective: p.objective, deliverables: p.deliverables,
      entities_required: p.entities_required, functions_required: p.functions_required,
      pages_required: p.pages_required, status: 'pending', score: 0, iteration: 0, max_iterations: 5
    });
  }
  return plan;
}

async function runOnePlan(base44, plan) {
  const phases = await base44.asServiceRole.entities.ImplementationPhase.filter({ plan_id: plan.id });
  const nextPhase = phases
    .filter((p) => p.status !== 'passed' && p.status !== 'blocked')
    .sort((a, b) => (a.phase_number || 0) - (b.phase_number || 0))[0];

  if (!nextPhase) {
    await base44.asServiceRole.entities.ImplementationPlan.update(plan.id, { status: 'complete', completed_at: new Date().toISOString() });
    return { plan_id: plan.id, message: 'All phases passed — plan complete' };
  }

  // Block phases that exhausted their iterations.
  if ((nextPhase.iteration || 0) >= (nextPhase.max_iterations || 5) && nextPhase.status === 'failed') {
    await base44.asServiceRole.entities.ImplementationPhase.update(nextPhase.id, { status: 'blocked' });
    return { plan_id: plan.id, message: `Phase ${nextPhase.phase_number} blocked after max iterations`, phase_id: nextPhase.id };
  }

  // Step 1 — Generate spec + code
  await base44.asServiceRole.functions.invoke('autonomousCodeSystem', { phase_id: nextPhase.id, plan_id: plan.id });

  // Step 2 — Validate
  const valRes = await base44.asServiceRole.functions.invoke('validatePhase', { phase_id: nextPhase.id });
  const valData = valRes.data || valRes;
  const passed = valData.passed === true || valData.score >= 100;

  // Step 3 — Reflect if not passed
  let reflectionResult = null;
  if (!passed && (nextPhase.iteration || 0) < (nextPhase.max_iterations || 5)) {
    reflectionResult = await base44.asServiceRole.functions.invoke('sentinelReflect', { phase_id: nextPhase.id });
  }

  return {
    plan_id: plan.id,
    phase: { id: nextPhase.id, number: nextPhase.phase_number, title: nextPhase.title },
    validation: { score: valData.score, passed },
    reflection: reflectionResult ? (reflectionResult.data || reflectionResult) : null,
    message: passed ? `Phase ${nextPhase.phase_number} passed at ${valData.score}/100` : `Phase ${nextPhase.phase_number} scored ${valData.score}/100 — reflection queued`
  };
}