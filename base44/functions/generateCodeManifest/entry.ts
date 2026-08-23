import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// generateCodeManifest — the fourth "system" generator step for web_app /
// ecommerce / platform builds. Takes the architecture, data model, and UI
// system specs and produces a codebase manifest: the list of files, their
// paths, categories, key implementation notes, dependencies, and build steps.
// The frontend saves this to the AutoBuild record's code_manifest field.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { architecture, dataModel, uiSystem, productType, businessName } = body;

    if (!architecture) return Response.json({ error: 'architecture is required' }, { status: 400 });

    const typeLabels = {
      web_app: 'web application / SaaS platform',
      ecommerce: 'e-commerce storefront',
      platform: 'multi-sided platform / marketplace',
    };
    const typeLabel = typeLabels[productType] || productType;

    // Summarize the inputs for the LLM
    const pagesStr = architecture.pages
      ? architecture.pages.map(p => `${p.name} (${p.route})`).join(', ')
      : 'Not specified';
    const featuresStr = architecture.features
      ? architecture.features.map(f => f.name).join(', ')
      : 'Not specified';
    const entitiesStr = dataModel?.entities
      ? dataModel.entities.map(e => e.name).join(', ')
      : 'Not specified';
    const componentsStr = uiSystem?.components
      ? uiSystem.components.map(c => c.name).join(', ')
      : 'Not specified';
    const techStackStr = architecture.tech_stack
      ? Object.entries(architecture.tech_stack).map(([k, v]) => `${k}: ${v}`).join('\n')
      : 'Not specified';

    const prompt = `You are a senior software architect and full-stack engineer with 15+ years of experience building production web applications. Generate a complete codebase manifest for a ${typeLabel}.

PRODUCT: ${businessName || 'Not yet named'}
PRODUCT TYPE: ${productType}

TECH STACK:
${techStackStr}

PAGES:
${pagesStr}

KEY FEATURES:
${featuresStr}

DATA ENTITIES:
${entitiesStr}

UI COMPONENTS:
${componentsStr}

Generate a comprehensive file manifest that a development team could use to build this product. List every file that should exist in the repository — config files, pages, components, hooks, utilities, API routes, styles, tests, and docs. For each file, provide its path, category, a description of what it does, and key implementation notes (the critical code structure or logic that goes in it).

Be thorough and specific. Include:
- Project config (package.json, tsconfig, vite/next config, tailwind config, env files)
- All pages from the architecture spec
- All UI components from the design system
- API routes / backend functions for the data entities
- Custom hooks for data fetching and business logic
- Utility libraries (auth, validation, formatting)
- Test files
- Documentation (README, API docs)

Return a detailed JSON codebase manifest.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          framework: { type: "string", description: "Primary framework, e.g. Next.js 14 (App Router), React + Vite" },
          repo_name: { type: "string", description: "Suggested repo name in kebab-case" },
          files: {
            type: "array",
            description: "Complete list of files in the codebase",
            items: {
              type: "object",
              properties: {
                path: { type: "string", description: "File path relative to repo root, e.g. src/pages/Dashboard.tsx" },
                category: { type: "string", description: "config | page | component | hook | lib | api | style | test | doc | entity" },
                description: { type: "string", description: "What this file does" },
                key_content: { type: "string", description: "Critical code structure, imports, or logic to implement" },
                depends_on: {
                  type: "array",
                  items: { type: "string" },
                  description: "Other file paths this file imports from"
                }
              }
            }
          },
          build_steps: {
            type: "array",
            items: { type: "string" },
            description: "Ordered build steps from project init to deployment"
          },
          estimated_loc: { type: "number", description: "Estimated total lines of code across all files" }
        }
      },
      model: "claude_sonnet_4_6",
    });

    return Response.json({ ok: true, data: result });
  } catch (error) {
    console.error("generateCodeManifest error", error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}