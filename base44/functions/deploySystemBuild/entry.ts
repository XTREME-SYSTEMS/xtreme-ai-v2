import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateDeploymentSpec } from '../../shared/systemBuildGenerators.ts';
import { validateDeploymentSpec } from '../../shared/systemBuildValidation.ts';

// deploySystemBuild — HTTP handler for the deploy step.
// Core logic lives in systemBuildGenerators.ts (shared with processAutoBuildStep).
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
    const validation = validateDeploymentSpec(result);

    if (!validation.valid) {
      console.error("deploySystemBuild validation failed:", validation.errors);
      return Response.json({
        error: `Deployment spec validation failed: ${validation.errors.join("; ")}`,
        validationErrors: validation.errors,
      }, { status: 422 });
    }

    return Response.json({ ok: true, data: result, warnings: validation.warnings });
  } catch (error) {
    console.error("deploySystemBuild error", error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}