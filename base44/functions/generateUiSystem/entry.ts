import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateUiSystemSpec } from '../../shared/systemBuildGenerators.ts';
import { validateUiSystemSpec } from '../../shared/systemBuildValidation.ts';

// generateUiSystem — HTTP handler for the UI system step.
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

    const result = await generateUiSystemSpec(base44, { architecture, productType, businessName });
    const validation = validateUiSystemSpec(result);

    if (!validation.valid) {
      console.error("generateUiSystem validation failed:", validation.errors);
      return Response.json({
        error: `UI system spec validation failed: ${validation.errors.join("; ")}`,
        validationErrors: validation.errors,
      }, { status: 422 });
    }

    return Response.json({ ok: true, data: result, warnings: validation.warnings });
  } catch (error) {
    console.error("generateUiSystem error", error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}