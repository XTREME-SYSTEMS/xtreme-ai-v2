import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import { IMPLEMENTATION_PHASES, buildSpecPrompt } from "../../shared/autonomousEngine.ts";

// Autonomous Coding System — generates a detailed implementation spec for a phase
// using InvokeLLM, then generates the code/file contents. Logs progress to ImplementationPhase.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const { phase_id, plan_id } = body;
    if (!phase_id) return Response.json({ error: 'phase_id required' }, { status: 400 });

    const phase = await base44.asServiceRole.entities.ImplementationPhase.get(phase_id);
    if (!phase) return Response.json({ error: 'Phase not found' }, { status: 404 });

    await base44.asServiceRole.entities.ImplementationPhase.update(phase_id, {
      status: 'specifying', iteration: (phase.iteration || 0) + 1, started_at: new Date().toISOString()
    });

    // Step 1 — generate the detailed implementation spec via LLM
    const specPrompt = buildSpecPrompt(phase, true);
    const specRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: specPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          entities: { type: "array", items: { type: "object" } },
          functions: { type: "array", items: { type: "object" } },
          pages: { type: "array", items: { type: "object" } },
          integration_notes: { type: "string" },
          estimated_effort_hours: { type: "number" }
        }
      }
    });

    const spec = typeof specRes === 'string' ? specRes : JSON.stringify(specRes, null, 2);

    // Step 2 — generate the actual code/file contents from the spec
    const codePrompt = `Based on this implementation spec, generate the COMPLETE file contents for every entity schema, backend function entry.ts, and page JSX file. Output as a JSON object mapping file_path -> file_content (full ready-to-deploy code).\n\nSPEC:\n${spec.slice(0, 6000)}`;
    const codeRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: codePrompt,
      response_json_schema: {
        type: "object",
        properties: { files: { type: "object", additionalProperties: { type: "string" } } }
      }
    });
    const generatedCode = typeof codeRes === 'string' ? codeRes : JSON.stringify(codeRes, null, 2);

    await base44.asServiceRole.entities.ImplementationPhase.update(phase_id, {
      implementation_spec: spec,
      generated_code: generatedCode,
      status: 'generating'
    });

    return Response.json({
      ok: true,
      phase_id,
      iteration: (phase.iteration || 0) + 1,
      spec_length: spec.length,
      code_length: generatedCode.length,
      status: 'generating'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}