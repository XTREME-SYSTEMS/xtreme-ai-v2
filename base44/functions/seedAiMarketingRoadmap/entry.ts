import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import { AI_MARKETING_PHASES } from "../../shared/autonomousEngine.ts";

// Seed AI Marketing Roadmap — logs the 7-initiative AI-enhanced marketing roadmap
// as a new autonomous ImplementationPlan with 7 phases. The existing Autonomous
// Build Loop workflow then drives each phase to 100% with the validator checking
// everything that is installed.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    // Don't duplicate — check for an existing AI marketing plan
    const existing = await base44.asServiceRole.entities.ImplementationPlan.filter(
      { source_system: "AI Marketing Roadmap", status: 'active' }, '-created_date', 1
    );
    if (existing[0]) return Response.json({ ok: true, message: 'AI Marketing roadmap already seeded', plan_id: existing[0].id });

    const plan = await base44.asServiceRole.entities.ImplementationPlan.create({
      name: "AI-Enhanced Marketing Platform — Autonomous Build",
      description: "7 initiatives to turn the Lead Gen Near You factory into a top-tier AI-enhanced marketing platform: programmatic SEO, AI lead scoring, conversational agents, multi-channel orchestration, predictive analytics, AI creative pipeline, and real-time personalization.",
      source_system: "AI Marketing Roadmap",
      total_phases: AI_MARKETING_PHASES.length,
      completed_phases: 0,
      overall_score: 0,
      status: 'active',
      autonomous_mode: true,
      target_score: 100,
      max_iterations_per_phase: 5,
      started_at: new Date().toISOString()
    });

    const phaseIds = [];
    for (let i = 0; i < AI_MARKETING_PHASES.length; i++) {
      const p = AI_MARKETING_PHASES[i];
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
      message: `AI Marketing roadmap logged with ${phaseIds.length} phases. The autonomous build loop will now drive each to 100% with validation.`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}