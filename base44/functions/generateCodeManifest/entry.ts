import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateCodeManifestSpec } from '../../shared/systemBuildGenerators.ts';
import { validateCodeManifestSpec } from '../../shared/systemBuildValidation.ts';

// generateCodeManifest — HTTP handler for the codegen step.
// Core logic lives in systemBuildGenerators.ts (shared with processAutoBuildStep).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { architecture, dataModel, uiSystem, productType, businessName } = body;

    if (!architecture) return Response.json({ error: 'architecture is required' }, { status: 400 });

    const result = await generateCodeManifestSpec(base44, { architecture, dataModel, uiSystem, productType, businessName });
    const validation = validateCodeManifestSpec(result);

    if (!validation.valid) {
      console.error("generateCodeManifest validation failed:", validation.errors);
      return Response.json({
        error: `Code manifest validation failed: ${validation.errors.join("; ")}`,
        validationErrors: validation.errors,
      }, { status: 422 });
    }

    return Response.json({ ok: true, data: result, warnings: validation.warnings });
  } catch (error) {
    console.error("generateCodeManifest error", error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}