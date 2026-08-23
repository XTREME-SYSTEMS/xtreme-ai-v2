import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateArchitectureSpec, generateWithValidation } from '../../shared/systemBuildGenerators.ts';
import { strictValidateArchitecture } from '../../shared/systemBuildSchemas.ts';

// generateSystemArchitecture — HTTP handler for the architecture step.
// Phase 1 hardened: generate → strict validate → LLM judge → auto-regen up to 3x.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { productType, businessName, industry, profile } = body;

    if (!productType) return Response.json({ error: 'productType is required' }, { status: 400 });

    const result = await generateWithValidation(
      base44,
      generateArchitectureSpec,
      strictValidateArchitecture,
      { productType, businessName, industry, profile },
      "system architecture",
      { maxAttempts: 3, judgeThreshold: 70 }
    );

    if (!result.validation.valid) {
      return Response.json({
        error: `Architecture spec validation failed after ${result.attempts} attempts: ${result.validation.errors.join("; ")}`,
        validationErrors: result.validation.errors,
        judge: result.judge,
        attempts: result.attempts,
      }, { status: 422 });
    }

    // Log receipt for auditability
    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: "generateSystemArchitecture",
        action: "generate_architecture",
        entity_type: "AutoBuild",
        inputs: JSON.stringify({ productType, businessName, attempts: result.attempts }).slice(0, 4000),
        outputs: JSON.stringify({ validationScore: result.validation.score, judgeScore: result.judge?.overall }).slice(0, 4000),
        status: "success",
        evidence: `Architecture generated: validation=${result.validation.score}, judge=${result.judge?.overall || "N/A"}, attempts=${result.attempts}`,
      });
    } catch {}

    return Response.json({
      ok: true,
      data: result.data,
      warnings: result.validation.warnings,
      judge: result.judge,
      attempts: result.attempts,
      regenerated: result.regenerated,
    });
  } catch (error) {
    console.error("generateSystemArchitecture error", error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}