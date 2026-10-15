import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import { buildValidationPrompt } from "../../shared/autonomousEngine.ts";

// Validation System — validates a phase's implementation spec via LLM, scores it
// 0-100 across six dimensions, logs a ValidationResult, and updates the phase score.
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
    if (!phase.implementation_spec) return Response.json({ error: 'Phase has no spec — run autonomousCodeSystem first' }, { status: 400 });

    await base44.asServiceRole.entities.ImplementationPhase.update(phase_id, { status: 'validating' });

    const valRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildValidationPrompt(phase, phase.implementation_spec),
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
          checks_passed: { type: "number" },
          checks_total: { type: "number" },
          failures: { type: "array", items: { type: "object" } },
          passed: { type: "boolean" },
          summary: { type: "string" },
          recommendation: { type: "string" }
        }
      }
    });

    const v = typeof valRes === 'object' ? valRes : JSON.parse(valRes);
    const passed = v.passed === true || v.overall_score >= 75;

    await base44.asServiceRole.entities.ValidationResult.create({
      phase_id, plan_id: phase.plan_id, iteration: phase.iteration || 0,
      overall_score: v.overall_score || 0,
      completeness_score: v.completeness_score || 0,
      correctness_score: v.correctness_score || 0,
      integration_score: v.integration_score || 0,
      security_score: v.security_score || 0,
      performance_score: v.performance_score || 0,
      autonomy_score: v.autonomy_score || 0,
      checks_passed: v.checks_passed || 0,
      checks_total: v.checks_total || 6,
      failures: v.failures || [],
      passed,
      summary: v.summary || '',
      recommendation: v.recommendation || ''
    });

    await base44.asServiceRole.entities.ImplementationPhase.update(phase_id, {
      score: v.overall_score || 0,
      status: passed ? 'passed' : 'reflecting',
      validation_summary: v.summary || '',
      gaps: (v.failures || []).map((f) => `${f.check}: ${f.detail}`)
    });

    return Response.json({
      ok: true,
      phase_id,
      score: v.overall_score || 0,
      passed,
      checks_passed: v.checks_passed || 0,
      checks_total: v.checks_total || 6,
      failures: v.failures || []
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}