import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// generateSystemArchitecture — the first "system" generator step for
// web_app / ecommerce / platform builds. Produces a complete, production-
// ready system architecture spec (tech stack, pages, data models, features,
// integrations, user flows) via InvokeLLM, parameterized by product type
// and business profile. The frontend saves this to the AutoBuild record
// and it becomes the blueprint for all downstream system steps
// (data model → UI system → codegen → deploy).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { productType, businessName, industry, profile } = body;

    if (!productType) return Response.json({ error: 'productType is required' }, { status: 400 });

    const typeLabels = {
      marketing_site: 'marketing website',
      web_app: 'web application / SaaS platform',
      ecommerce: 'e-commerce storefront',
      platform: 'multi-sided platform / marketplace',
    };
    const typeLabel = typeLabels[productType] || productType;

    const profileStr = profile
      ? JSON.stringify(profile).slice(0, 3000)
      : 'No profile data provided yet.';

    const prompt = `You are a senior software architect and product strategist with 15+ years of experience building production web applications. Design a complete, production-ready system architecture for a ${typeLabel}.

BUSINESS / PRODUCT: ${businessName || 'Not yet named'}
INDUSTRY / NICHE: ${industry || 'Not specified'}
PRODUCT TYPE: ${productType}
PROFILE DATA: ${profileStr}

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
              frontend: { type: "string", description: "e.g. React 18 + Vite + Tailwind CSS" },
              backend: { type: "string", description: "e.g. Base44 BaaS, Node.js/Express, Next.js API routes" },
              database: { type: "string", description: "e.g. PostgreSQL (Supabase), MongoDB" },
              hosting: { type: "string", description: "e.g. Vercel, Netlify" },
              auth: { type: "string", description: "e.g. Base44 Auth, Auth0, Supabase Auth" },
              payments: { type: "string", description: "Payment provider if applicable" }
            }
          },
          pages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                route: { type: "string", description: "URL path, e.g. /dashboard" },
                purpose: { type: "string" },
                auth: { type: "boolean", description: "Does this page require authentication?" },
                components: { type: "array", items: { type: "string" }, description: "Key UI components on this page" }
              }
            }
          },
          data_models: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Entity name, e.g. User, Order, Listing" },
                description: { type: "string" },
                fields: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string", description: "string, number, boolean, date, reference, array, object" },
                      required: { type: "boolean" },
                      description: { type: "string" },
                      references: { type: "string", description: "If type is reference, the entity it references" }
                    }
                  }
                }
              }
            }
          },
          features: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                priority: { type: "string", description: "must | should | could" },
                complexity: { type: "string", description: "low | medium | high" }
              }
            }
          },
          integrations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                purpose: { type: "string" },
                type: { type: "string", description: "payments | email | search | analytics | storage | auth | other" }
              }
            }
          },
          user_flows: {
            type: "array",
            items: { type: "string" },
            description: "Key user journeys, e.g. 'Sign up → verify email → complete profile → land on dashboard'"
          },
          tech_decisions: {
            type: "array",
            items: { type: "string" },
            description: "Key architectural decisions and the rationale behind each"
          },
          estimated_effort: { type: "string", description: "Rough effort estimate, e.g. '2-3 weeks for a 2-person team'" }
        }
      },
      model: "claude_sonnet_4_6",
    });

    return Response.json({ ok: true, data: result });
  } catch (error) {
    console.error("generateSystemArchitecture error", error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}