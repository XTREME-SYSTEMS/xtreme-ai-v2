// ============================================================
// systemBuildGenerators.ts — Shared generation logic for the
// system-build pipeline (architecture → data model → UI system →
// codegen → deploy). Extracted from the individual backend
// functions so both the HTTP handlers AND the processAutoBuildStep
// queue processor use the EXACT same logic — one source of truth.
//
// PHASE 1 HARDENING: Each generator now accepts `previousErrors`
// which gets injected into the LLM prompt for auto-regeneration.
// The `generateWithValidation` wrapper handles the full loop:
// generate → strict validate → LLM judge → if fail, regenerate
// with errors → repeat up to 3x.
// ============================================================

import {
  strictValidateArchitecture, strictValidateDataModel,
  strictValidateUiSystem, strictValidateCodeManifest, strictValidateDeployment,
} from "./systemBuildSchemas.ts";
import { judgeSpec, judgePassed, type JudgeScore } from "./llmJudge.ts";

// ── Auto-regeneration wrapper ────────────────────────────────────────────

export interface GenerationResult {
  data: any;
  validation: { valid: boolean; errors: string[]; warnings: string[]; score: number };
  judge: JudgeScore | null;
  attempts: number;
  regenerated: boolean;
}

export async function generateWithValidation(
  base44: any,
  generator: (base44: any, params: any) => Promise<any>,
  validator: (spec: any) => { valid: boolean; errors: string[]; warnings: string[]; score: number },
  params: any,
  specType: string,
  options?: { maxAttempts?: number; judgeThreshold?: number; context?: string }
): Promise<GenerationResult> {
  const maxAttempts = options?.maxAttempts ?? 3;
  const threshold = options?.judgeThreshold ?? 70;
  let lastErrors: string[] = [];
  let lastJudge: JudgeScore | null = null;
  let lastData: any = null;
  let lastValidation: any = { valid: false, errors: [], warnings: [], score: 0 };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Inject previous errors into params for regeneration
    const genParams = attempt > 1 && lastErrors.length > 0
      ? { ...params, previousErrors: lastErrors }
      : params;

    const data = await generator(base44, genParams);
    lastData = data;

    // Strict validation
    const validation = validator(data);
    lastValidation = validation;

    if (!validation.valid) {
      lastErrors = validation.errors;
      continue; // regenerate with errors
    }

    // LLM judge (skip on first attempt if validation is clean and we want to save credits)
    // Actually, always run the judge — it catches quality issues that schema validation misses
    try {
      const judge = await judgeSpec(base44, specType, data, options?.context);
      lastJudge = judge;

      if (!judgePassed(judge, threshold)) {
        lastErrors = [judge.feedback];
        continue; // regenerate with judge feedback
      }

      // Both validation and judge passed
      return { data, validation, judge, attempts: attempt, regenerated: attempt > 1 };
    } catch (judgeErr) {
      // If judge fails, accept the spec if validation passed (judge is best-effort)
      return { data, validation, judge: null, attempts: attempt, regenerated: attempt > 1 };
    }
  }

  // All attempts exhausted — return last result with errors
  return {
    data: lastData,
    validation: lastValidation,
    judge: lastJudge,
    attempts: maxAttempts,
    regenerated: maxAttempts > 1,
  };
}

// ── Architecture ───────────────────────────────────────────────────────

export async function generateArchitectureSpec(base44: any, params: {
  productType: string;
  businessName?: string;
  industry?: string;
  profile?: any;
}) {
  const { productType, businessName, industry, profile } = params;

  const typeLabels: Record<string, string> = {
    marketing_site: 'marketing website',
    web_app: 'web application / SaaS platform',
    ecommerce: 'e-commerce storefront',
    platform: 'multi-sided platform / marketplace',
  };
  const typeLabel = typeLabels[productType] || productType;

  const profileStr = profile
    ? JSON.stringify(profile).slice(0, 3000)
    : 'No profile data provided yet.';

  const errorContext = (params as any).previousErrors?.length
    ? `\n\nPREVIOUS ATTEMPT FAILED VALIDATION. Fix these errors:\n${(params as any).previousErrors.join('\n')}\n`
    : '';

  const prompt = `You are a senior software architect and product strategist with 15+ years of experience building production web applications. Design a complete, production-ready system architecture for a ${typeLabel}.

BUSINESS / PRODUCT: ${businessName || 'Not yet named'}
INDUSTRY / NICHE: ${industry || 'Not specified'}
PRODUCT TYPE: ${productType}
PROFILE DATA: ${profileStr}
${errorContext}
Produce a comprehensive architecture spec that a development team could execute immediately. Be specific and opinionated — recommend exact technologies, not vague categories. Consider scalability, security, developer experience, and time-to-market.

For a ${typeLabel}, make sure your architecture includes everything needed for a real, deployable product:
${productType === 'web_app' ? '- User authentication, role-based access, dashboards, CRUD operations, API design\n- Database schema with proper relationships\n- State management and data fetching strategy' : ''}
${productType === 'ecommerce' ? '- Product catalog, cart, checkout flow, payment processing (Stripe)\n- Order management, inventory, customer accounts\n- Product search, filtering, and category structure' : ''}
${productType === 'platform' ? '- Multi-role authentication (e.g. buyers/sellers, or providers/clients)\n- Listing creation, search, and matching\n- Transaction or booking flow, ratings/reviews\n- Notification system' : ''}

Return a detailed JSON architecture spec.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        concept: { type: "string", description: "One-sentence product concept" },
        summary: { type: "string", description: "Executive summary of the architecture, 3-5 sentences" },
        tech_stack: {
          type: "object",
          properties: {
            frontend: { type: "string" },
            backend: { type: "string" },
            database: { type: "string" },
            hosting: { type: "string" },
            auth: { type: "string" },
            payments: { type: "string" },
          },
        },
        pages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              route: { type: "string" },
              purpose: { type: "string" },
              auth: { type: "boolean" },
              components: { type: "array", items: { type: "string" } },
            },
          },
        },
        data_models: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              fields: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: { type: "string" },
                    required: { type: "boolean" },
                    description: { type: "string" },
                    references: { type: "string" },
                  },
                },
              },
            },
          },
        },
        features: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              priority: { type: "string" },
              complexity: { type: "string" },
            },
          },
        },
        integrations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              purpose: { type: "string" },
              type: { type: "string" },
            },
          },
        },
        user_flows: { type: "array", items: { type: "string" } },
        tech_decisions: { type: "array", items: { type: "string" } },
        estimated_effort: { type: "string" },
      },
    },
    model: "claude_sonnet_4_6",
  });

  return result;
}

// ── Data Model ─────────────────────────────────────────────────────────

export async function generateDataModelSpec(base44: any, params: {
  architecture: any;
  productType: string;
  businessName?: string;
}) {
  const { architecture, productType, businessName } = params;

  const typeLabels: Record<string, string> = {
    web_app: 'web application / SaaS platform',
    ecommerce: 'e-commerce storefront',
    platform: 'multi-sided platform / marketplace',
  };
  const typeLabel = typeLabels[productType] || productType;

  const dataModelsStr = architecture.data_models
    ? JSON.stringify(architecture.data_models).slice(0, 4000)
    : 'No data models in architecture spec — design appropriate entities from scratch.';

  const errorContext = (params as any).previousErrors?.length
    ? `\n\nPREVIOUS ATTEMPT FAILED VALIDATION. Fix these errors:\n${(params as any).previousErrors.join('\n')}\n`
    : '';

  const prompt = `You are a senior database architect and backend engineer with 15+ years of experience designing production data models. You are given a high-level system architecture for a ${typeLabel} and must refine its data models into complete, production-ready entity schemas.

PRODUCT: ${businessName || 'Not yet named'}
PRODUCT TYPE: ${productType}

HIGH-LEVEL DATA MODELS FROM ARCHITECTURE:
${dataModelsStr}
${errorContext}
Refine these into detailed entity schemas. For each entity, define every field with its exact type, validation rules, default values, and indexes. Define all relationships between entities. Generate realistic seed data (2-3 sample records per entity). Define the CRUD + custom API endpoints for each entity.

Be specific and exhaustive — a developer should be able to create the database tables and API routes directly from your output without any further design work.

Return a detailed JSON data model spec.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        entities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              timestamps: { type: "boolean" },
              fields: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: { type: "string" },
                    required: { type: "boolean" },
                    unique: { type: "boolean" },
                    default: { type: "string" },
                    validation: { type: "string" },
                    references: { type: "string" },
                    enum_values: { type: "array", items: { type: "string" } },
                    index: { type: "boolean" },
                  },
                },
              },
              indexes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    fields: { type: "array", items: { type: "string" } },
                    unique: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
        relationships: {
          type: "array",
          items: {
            type: "object",
            properties: {
              from: { type: "string" },
              to: { type: "string" },
              type: { type: "string" },
              foreign_key: { type: "string" },
              cascade: { type: "string" },
              description: { type: "string" },
            },
          },
        },
        seed_data: { type: "object", additionalProperties: true },
        api_endpoints: {
          type: "array",
          items: {
            type: "object",
            properties: {
              method: { type: "string" },
              path: { type: "string" },
              entity: { type: "string" },
              operation: { type: "string" },
              auth_required: { type: "boolean" },
              description: { type: "string" },
            },
          },
        },
      },
    },
    model: "claude_sonnet_4_6",
  });

  return result;
}

// ── UI System ──────────────────────────────────────────────────────────

export async function generateUiSystemSpec(base44: any, params: {
  architecture: any;
  productType: string;
  businessName?: string;
}) {
  const { architecture, productType, businessName } = params;

  const typeLabels: Record<string, string> = {
    web_app: 'web application / SaaS platform',
    ecommerce: 'e-commerce storefront',
    platform: 'multi-sided platform / marketplace',
  };
  const typeLabel = typeLabels[productType] || productType;

  const pagesStr = architecture.pages
    ? architecture.pages.map((p: any) => `${p.name} (${p.route}): ${p.purpose}`).join('\n')
    : 'No pages defined';
  const featuresStr = architecture.features
    ? architecture.features.map((f: any) => f.name).join(', ')
    : 'No features defined';

  const errorContext = (params as any).previousErrors?.length
    ? `\n\nPREVIOUS ATTEMPT FAILED VALIDATION. Fix these errors:\n${(params as any).previousErrors.join('\n')}\n`
    : '';

  const prompt = `You are a senior UI/UX designer and design system architect with 15+ years of experience building production design systems for web applications. Design a complete, production-ready UI design system for a ${typeLabel}.

PRODUCT: ${businessName || 'Not yet named'}
PRODUCT TYPE: ${productType}

PAGES TO DESIGN FOR:
${pagesStr}

KEY FEATURES:
${featuresStr}
${errorContext}
Design a comprehensive design system that a frontend developer could implement immediately. Be specific and opinionated — recommend exact colors (hex values), font families, font sizes, spacing values, and component specs. The design should be modern, accessible (WCAG AA), and appropriate for the product type.

${productType === 'web_app' ? 'Include dashboard components, data tables, forms, modals, and navigation patterns.' : ''}
${productType === 'ecommerce' ? 'Include product cards, cart components, checkout flow elements, category filters, and product gallery layouts.' : ''}
${productType === 'platform' ? 'Include listing cards, search/filter bars, user profile components, messaging UI, and rating/review elements.' : ''}

Return a detailed JSON design system spec.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        color_palette: {
          type: "object",
          properties: {
            primary: { type: "string" },
            primary_foreground: { type: "string" },
            secondary: { type: "string" },
            accent: { type: "string" },
            background: { type: "string" },
            surface: { type: "string" },
            text: { type: "string" },
            text_muted: { type: "string" },
            border: { type: "string" },
            success: { type: "string" },
            warning: { type: "string" },
            error: { type: "string" },
            info: { type: "string" },
          },
        },
        typography: {
          type: "object",
          properties: {
            font_heading: { type: "string" },
            font_body: { type: "string" },
            font_mono: { type: "string" },
            scale: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  size: { type: "string" },
                  weight: { type: "string" },
                  line_height: { type: "string" },
                  usage: { type: "string" },
                },
              },
            },
          },
        },
        spacing: {
          type: "object",
          properties: {
            unit: { type: "string" },
            scale: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "string" },
                },
              },
            },
          },
        },
        components: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              category: { type: "string" },
              props: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: { type: "string" },
                    default: { type: "string" },
                    description: { type: "string" },
                  },
                },
              },
              variants: { type: "array", items: { type: "string" } },
              usage_notes: { type: "string" },
            },
          },
        },
        layout_patterns: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              usage: { type: "string" },
            },
          },
        },
        responsive: {
          type: "object",
          properties: {
            breakpoints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  min_width: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
            strategy: { type: "string" },
          },
        },
        theme_tokens: { type: "object", additionalProperties: true },
        design_principles: { type: "array", items: { type: "string" } },
      },
    },
    model: "claude_sonnet_4_6",
  });

  return result;
}

// ── Code Manifest ──────────────────────────────────────────────────────

export async function generateCodeManifestSpec(base44: any, params: {
  architecture: any;
  dataModel?: any;
  uiSystem?: any;
  productType: string;
  businessName?: string;
}) {
  const { architecture, dataModel, uiSystem, productType, businessName } = params;

  const typeLabels: Record<string, string> = {
    web_app: 'web application / SaaS platform',
    ecommerce: 'e-commerce storefront',
    platform: 'multi-sided platform / marketplace',
  };
  const typeLabel = typeLabels[productType] || productType;

  const pagesStr = architecture.pages
    ? architecture.pages.map((p: any) => `${p.name} (${p.route})`).join(', ')
    : 'Not specified';
  const featuresStr = architecture.features
    ? architecture.features.map((f: any) => f.name).join(', ')
    : 'Not specified';
  const entitiesStr = dataModel?.entities
    ? dataModel.entities.map((e: any) => e.name).join(', ')
    : 'Not specified';
  const componentsStr = uiSystem?.components
    ? uiSystem.components.map((c: any) => c.name).join(', ')
    : 'Not specified';
  const techStackStr = architecture.tech_stack
    ? Object.entries(architecture.tech_stack).map(([k, v]) => `${k}: ${v}`).join('\n')
    : 'Not specified';

  const errorContext = (params as any).previousErrors?.length
    ? `\n\nPREVIOUS ATTEMPT FAILED VALIDATION. Fix these errors:\n${(params as any).previousErrors.join('\n')}\n`
    : '';

  const prompt = `You are a senior software architect and full-stack engineer with 15+ years of experience building production web applications. Generate a complete codebase with ACTUAL FILE CONTENTS for a ${typeLabel}.

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
${errorContext}
Generate the actual codebase files. For each file, provide:
- path: the file path (e.g. src/pages/Dashboard.jsx, base44/entities/Task.jsonc)
- category: config, page, component, hook, entity, function, style, route, test, doc, util, api, lib
- language: jsx, ts, js, jsonc, css, json, md
- purpose: what this file does
- content: THE ACTUAL FILE CONTENT — real, compilable code. Not notes or descriptions. Write the full implementation.

CRITICAL: The 'content' field must contain ACTUAL CODE that a developer could copy into a file and run. For JSX files, write real React components. For JSONC files, write real JSON schemas. For config files, write real configurations. Do NOT write placeholders or descriptions — write the actual code.

Include these essential files ONLY (keep total under 8 files):
- src/App.jsx (router with all routes registered)
- The 2-3 most important pages as real .jsx files
- 1-2 key UI components
- package.json with real dependencies
- tailwind.config.js

Keep each file's content focused and production-quality. Write COMPLETE implementations for each file. Do NOT generate more than 8 files.

Return a detailed JSON codebase manifest.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      required: ["framework", "repo_name", "files", "build_steps", "estimated_loc"],
      properties: {
        framework: { type: "string" },
        repo_name: { type: "string" },
        files: {
          type: "array",
          items: {
            type: "object",
            required: ["path", "category", "description", "content", "language"],
            properties: {
              path: { type: "string" },
              category: { type: "string" },
              description: { type: "string" },
              content: { type: "string", description: "The actual file content — real, compilable code" },
              language: { type: "string", description: "jsx, ts, js, jsonc, css, json, md" },
              key_content: { type: "string", description: "Legacy field — use 'content' instead" },
            },
          },
        },
        build_steps: { type: "array", items: { type: "string" } },
        estimated_loc: { type: "number" },
      },
    },
    model: "claude_sonnet_4_6",
  });

  return result;
}

// ── Deployment ─────────────────────────────────────────────────────────

export function generateDeploymentSpec(params: {
  codeManifest: any;
  architecture?: any;
  productType: string;
  businessName?: string;
}) {
  const { codeManifest, architecture, businessName } = params;

  const framework = codeManifest.framework || 'Next.js';
  const repoName = codeManifest.repo_name || (businessName || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const isNext = framework.toLowerCase().includes('next');
  const buildCommand = 'npm run build';
  const outputDir = isNext ? '.next' : 'dist';
  const devCommand = 'npm run dev';
  const installCommand = 'npm install';

  const envVars: any[] = [];
  const integrations = architecture?.integrations || [];
  for (const integration of integrations) {
    const name = typeof integration === 'string' ? integration : integration.name || integration.service || 'unknown';
    const upper = name.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
    envVars.push({
      key: `${upper}_API_KEY`,
      description: `API key for ${name}`,
      required: true,
    });
  }
  envVars.push(
    { key: 'DATABASE_URL', description: 'PostgreSQL connection string', required: true },
    { key: 'NEXT_PUBLIC_APP_URL', description: 'Public app URL', required: true },
    { key: 'AUTH_SECRET', description: 'Authentication JWT secret', required: true },
  );

  const routes = (architecture?.pages || []).map((p: any) => ({
    path: p.route || `/${(p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    page: p.name,
    revalidate: isNext ? 3600 : undefined,
  }));

  const slug = repoName.replace(/[^a-z0-9-]/g, '').slice(0, 30) || 'preview';
  const previewUrl = `https://${slug}.vercel.app`;

  return {
    platform: 'vercel',
    live_url: previewUrl,
    status: 'preview_ready',
    deployed_at: new Date().toISOString(),
    build_config: {
      framework,
      build_command: buildCommand,
      dev_command: devCommand,
      install_command: installCommand,
      output_directory: outputDir,
      node_version: '20.x',
    },
    env_vars: envVars,
    routes,
    repo_name: repoName,
    repo_url: `https://github.com/your-org/${repoName}`,
    deployment_notes: `Preview deployment configured for ${framework}. ${codeManifest.files?.length || 0} files in the manifest. Run \`vercel deploy\` once the codebase is generated.`,
    file_count: codeManifest.files?.length || 0,
    estimated_loc: codeManifest.estimated_loc || 0,
  };
}