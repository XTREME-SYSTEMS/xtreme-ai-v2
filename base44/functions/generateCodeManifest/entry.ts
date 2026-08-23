import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateCodeManifestSpec, generateWithValidation } from '../../shared/systemBuildGenerators.ts';
import { strictValidateCodeManifest } from '../../shared/systemBuildSchemas.ts';
import { validateCodeManifestConsistency } from '../../shared/systemBuildValidation.ts';
import { validateCompilation } from '../../shared/compileValidator.ts';

// generateCodeManifest — HTTP handler for the codegen step.
// Phase 1 hardened: generate → strict validate → consistency check → LLM judge → auto-regen.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { architecture, dataModel, uiSystem, productType, businessName } = body;

    if (!architecture) return Response.json({ error: 'architecture is required' }, { status: 400 });

    const result = await generateWithValidation(
      base44,
      generateCodeManifestSpec,
      strictValidateCodeManifest,
      { architecture, dataModel, uiSystem, productType, businessName },
      "code manifest",
      { maxAttempts: 3, judgeThreshold: 70 }
    );

    if (!result.validation.valid) {
      return Response.json({
        error: `Code manifest validation failed after ${result.attempts} attempts: ${result.validation.errors.join("; ")}`,
        validationErrors: result.validation.errors,
        judge: result.judge,
        attempts: result.attempts,
      }, { status: 422 });
    }

    const consistency = validateCodeManifestConsistency(result.data, architecture);

    // Phase 2: Compile validation — check generated code for compilability
    const compile = validateCompilation(result.data);

    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: "generateCodeManifest",
        action: "generate_code_manifest",
        entity_type: "AutoBuild",
        inputs: JSON.stringify({ productType, businessName, attempts: result.attempts }).slice(0, 4000),
        outputs: JSON.stringify({ validationScore: result.validation.score, judgeScore: result.judge?.overall, fileCount: result.data.files?.length, compileErrors: compile.errors.length, compileWarnings: compile.warnings.length }).slice(0, 4000),
        status: compile.valid ? "success" : "escalated",
        evidence: `Code manifest generated: validation=${result.validation.score}, judge=${result.judge?.overall || "N/A"}, files=${result.data.files?.length || 0}, compile=${compile.valid ? "PASS" : `${compile.errors.length} errors`}, attempts=${result.attempts}`,
      });
    } catch {}

    return Response.json({
      ok: true,
      data: result.data,
      warnings: [...result.validation.warnings, ...consistency.warnings, ...compile.warnings],
      compileErrors: compile.errors,
      compileValid: compile.valid,
      judge: result.judge,
      attempts: result.attempts,
      regenerated: result.regenerated,
    });
  } catch (error) {
    console.error("generateCodeManifest error", error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}