import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateArchitectureSpec } from '../../shared/systemBuildGenerators.ts';
import { validateArchitectureSpec } from '../../shared/systemBuildValidation.ts';

// generateSystemArchitecture — HTTP handler for the architecture step.
// Core logic lives in systemBuildGenerators.ts (shared with processAutoBuildStep).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { productType, businessName, industry, profile } = body;

    if (!productType) return Response.json({ error: 'productType is required' }, { status: 400 });

    const result = await generateArchitectureSpec(base44, { productType, businessName, industry, profile });
    const validation = validateArchitectureSpec(result);

    if (!validation.valid) {
      console.error("generateSystemArchitecture validation failed:", validation.errors);
      return Response.json({
        error: `Architecture spec validation failed: ${validation.errors.join("; ")}`,
        validationErrors: validation.errors,
      }, { status: 422 });
    }

    return Response.json({ ok: true, data: result, warnings: validation.warnings });
  } catch (error) {
    console.error("generateSystemArchitecture error", error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}