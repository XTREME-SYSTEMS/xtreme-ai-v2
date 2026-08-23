import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateDataModelSpec, generateWithValidation } from '../../shared/systemBuildGenerators.ts';
import { strictValidateDataModel } from '../../shared/systemBuildSchemas.ts';
import { validateDataModelConsistency } from '../../shared/systemBuildValidation.ts';

// generateDataModel — HTTP handler for the data model step.
// Phase 1 hardened: generate → strict validate → consistency check → LLM judge → auto-regen.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { architecture, productType, businessName } = body;

    if (!architecture) return Response.json({ error: 'architecture is required' }, { status: 400 });

    const result = await generateWithValidation(
      base44,
      generateDataModelSpec,
      strictValidateDataModel,
      { architecture, productType, businessName },
      "data model",
      { maxAttempts: 3, judgeThreshold: 70 }
    );

    if (!result.validation.valid) {
      return Response.json({
        error: `Data model spec validation failed after ${result.attempts} attempts: ${result.validation.errors.join("; ")}`,
        validationErrors: result.validation.errors,
        judge: result.judge,
        attempts: result.attempts,
      }, { status: 422 });
    }

    // Cross-step consistency check
    const consistency = validateDataModelConsistency(result.data, architecture);

    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: "generateDataModel",
        action: "generate_data_model",
        entity_type: "AutoBuild",
        inputs: JSON.stringify({ productType, businessName, attempts: result.attempts }).slice(0, 4000),
        outputs: JSON.stringify({ validationScore: result.validation.score, judgeScore: result.judge?.overall, consistencyWarnings: consistency.warnings.length }).slice(0, 4000),
        status: "success",
        evidence: `Data model generated: validation=${result.validation.score}, judge=${result.judge?.overall || "N/A"}, attempts=${result.attempts}`,
      });
    } catch {}

    return Response.json({
      ok: true,
      data: result.data,
      warnings: [...result.validation.warnings, ...consistency.warnings],
      judge: result.judge,
      attempts: result.attempts,
      regenerated: result.regenerated,
    });
  } catch (error) {
    console.error("generateDataModel error", error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}