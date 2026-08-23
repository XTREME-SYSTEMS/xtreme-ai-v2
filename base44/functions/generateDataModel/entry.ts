import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateDataModelSpec } from '../../shared/systemBuildGenerators.ts';
import { validateDataModelSpec } from '../../shared/systemBuildValidation.ts';

// generateDataModel — HTTP handler for the data model step.
// Core logic lives in systemBuildGenerators.ts (shared with processAutoBuildStep).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { architecture, productType, businessName } = body;

    if (!architecture) return Response.json({ error: 'architecture is required' }, { status: 400 });

    const result = await generateDataModelSpec(base44, { architecture, productType, businessName });
    const validation = validateDataModelSpec(result);

    if (!validation.valid) {
      console.error("generateDataModel validation failed:", validation.errors);
      return Response.json({
        error: `Data model spec validation failed: ${validation.errors.join("; ")}`,
        validationErrors: validation.errors,
      }, { status: 422 });
    }

    return Response.json({ ok: true, data: result, warnings: validation.warnings });
  } catch (error) {
    console.error("generateDataModel error", error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}