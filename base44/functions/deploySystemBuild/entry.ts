import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateDeploymentSpec } from '../../shared/systemBuildGenerators.ts';
import { strictValidateDeployment } from '../../shared/systemBuildSchemas.ts';
import { validateDeploymentConsistency } from '../../shared/systemBuildValidation.ts';

// deploySystemBuild — HTTP handler for the deploy step.
// Phase 1 hardened: generate → strict validate → consistency check.
// Note: deployment spec is deterministic (no LLM), so no judge/regeneration needed.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { codeManifest, architecture, productType, businessName } = body;

    if (!codeManifest) return Response.json({ error: 'codeManifest is required' }, { status: 400 });

    const result = generateDeploymentSpec({ codeManifest, architecture, productType, businessName });
    const validation = strictValidateDeployment(result);

    if (!validation.valid) {
      return Response.json({
        error: `Deployment spec validation failed: ${validation.errors.join("; ")}`,
        validationErrors: validation.errors,
      }, { status: 422 });
    }

    const consistency = architecture
      ? validateDeploymentConsistency(result, architecture)
      : { valid: true, errors: [], warnings: [] };

    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: "deploySystemBuild",
        action: "generate_deployment_config",
        entity_type: "AutoBuild",
        inputs: JSON.stringify({ productType, businessName }).slice(0, 4000),
        outputs: JSON.stringify({ validationScore: validation.score, liveUrl: result.live_url }).slice(0, 4000),
        status: "success",
        evidence: `Deployment config generated: validation=${validation.score}, url=${result.live_url}`,
      });
    } catch {}

    return Response.json({
      ok: true,
      data: result,
      warnings: [...validation.warnings, ...consistency.warnings],
    });
  } catch (error) {
    console.error("deploySystemBuild error", error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}