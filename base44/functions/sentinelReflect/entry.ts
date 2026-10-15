import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import { buildReflectionPrompt } from "../../shared/autonomousEngine.ts";

// Self-Reflection System — when a phase fails validation, reflects on root causes,
// proposes a fix strategy, creates RepairTasks, and regenerates the spec for the next iteration.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const { phase_id } = body;
    if (!phase_id) return Response.json({ error: 'phase_id required' }, { status: 400 });

    const phase = await base44.asServiceRole.entities.ImplementationPhase.get(phase_id);
    if (!phase) return Response.json({ error: 'Phase not found' }, { status: 404 });

    // Pull the latest validation result for this phase
    const results = await base44.asServiceRole.entities.ValidationResult.filter({ phase_id }, '-created_date', 1);
    const lastVal = results[0];
    if (!lastVal) return Response.json({ error: 'No validation result found for phase' }, { status: 400 });

    await base44.asServiceRole.entities.ImplementationPhase.update(phase_id, { status: 'reflecting' });

    const reflectRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildReflectionPrompt(phase, phase.implementation_spec || '', lastVal),
      response_json_schema: {
        type: "object",
        properties: {
          root_causes: { type: "array", items: { type: "string" } },
          fix_strategy: { type: "string" },
          updated_spec_sections: { type: "object" },
          reflection_notes: { type: "string" }
        }
      }
    });

    const r = typeof reflectRes === 'object' ? reflectRes : JSON.parse(reflectRes);

    // Create repair tasks for each failure
    const repairTasks = [];
    for (const failure of (lastVal.failures || [])) {
      const task = await base44.asServiceRole.entities.RepairTask.create({
        phase_id, plan_id: phase.plan_id, validation_id: lastVal.id,
        area: failure.check || 'unknown',
        check_name: failure.check || 'unknown',
        description: failure.detail || '',
        fix_strategy: r.fix_strategy || '',
        severity: failure.severity || 'medium',
        status: 'open'
      });
      repairTasks.push(task.id);
    }

    // Merge the updated spec sections into the existing spec
    let updatedSpec = phase.implementation_spec || '';
    if (r.updated_spec_sections && Object.keys(r.updated_spec_sections).length > 0) {
      updatedSpec = updatedSpec + "\n\n--- REFLECTION UPDATE (iteration " + (phase.iteration || 0) + ") ---\n" +
        JSON.stringify(r.updated_spec_sections, null, 2);
    }

    await base44.asServiceRole.entities.ImplementationPhase.update(phase_id, {
      implementation_spec: updatedSpec,
      reflection_notes: r.reflection_notes || '',
      status: phase.iteration >= (phase.max_iterations || 5) ? 'failed' : 'pending'
    });

    return Response.json({
      ok: true,
      phase_id,
      root_causes: r.root_causes || [],
      fix_strategy: r.fix_strategy || '',
      repair_tasks_created: repairTasks.length,
      next_iteration: phase.iteration >= (phase.max_iterations || 5) ? null : phase.iteration + 1
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}