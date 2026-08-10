import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import { IMPLEMENTATION_PHASES } from "../../shared/autonomousEngine.ts";

// Seed Implementation Plan — creates the master plan and all phases from the forensic audit.
// Call once from the dashboard to initialize the autonomous system.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    // Don't duplicate — check for an existing active plan
    const existing = await base44.asServiceRole.entities.ImplementationPlan.filter({ status: 'active' }, '-created_date', 1);
    if (existing[0]) return Response.json({ ok: true, message: 'Active plan already exists', plan_id: existing[0].id });

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

    const phaseIds = [];
    for (let i = 0; i < IMPLEMENTATION_PHASES.length; i++) {
      const p = IMPLEMENTATION_PHASES[i];
      const phase = await base44.asServiceRole.entities.ImplementationPhase.create({
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
      phaseIds.push(phase.id);
    }

    return Response.json({
      ok: true,
      plan_id: plan.id,
      phases_created: phaseIds.length,
      phase_ids: phaseIds,
      message: `Plan seeded with ${phaseIds.length} phases from the Faultline forensic audit.`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}