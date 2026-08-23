import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// generateDataModel — the second "system" generator step for web_app /
// ecommerce / platform builds. Takes the architecture spec (specifically
// architecture.data_models) and refines it into detailed, production-ready
// entity schemas with field-level validation, indexes, relationships,
// seed data, and API endpoints. The frontend saves this to the AutoBuild
// record's data_model field.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { architecture, productType, businessName } = body;

    if (!architecture) return Response.json({ error: 'architecture is required' }, { status: 400 });

    const typeLabels = {
      web_app: 'web application / SaaS platform',
      ecommerce: 'e-commerce storefront',
      platform: 'multi-sided platform / marketplace',
    };
    const typeLabel = typeLabels[productType] || productType;

    const dataModelsStr = architecture.data_models
      ? JSON.stringify(architecture.data_models).slice(0, 4000)
      : 'No data models in architecture spec — design appropriate entities from scratch.';

    const prompt = `You are a senior database architect and backend engineer with 15+ years of experience designing production data models. You are given a high-level system architecture for a ${typeLabel} and must refine its data models into complete, production-ready entity schemas.

PRODUCT: ${businessName || 'Not yet named'}
PRODUCT TYPE: ${productType}

HIGH-LEVEL DATA MODELS FROM ARCHITECTURE:
${dataModelsStr}

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
            description: "Complete entity schemas",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Entity name, PascalCase (e.g. User, Order, Listing)" },
                description: { type: "string", description: "What this entity represents" },
                timestamps: { type: "boolean", description: "Whether to include created_at/updated_at fields" },
                fields: {
                  type: "array",
                  description: "All fields in this entity",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Field name, snake_case" },
                      type: { type: "string", description: "string | number | boolean | date | reference | array | object | enum" },
                      required: { type: "boolean" },
                      unique: { type: "boolean", description: "Whether this field must be unique across all records" },
                      default: { type: "string", description: "Default value (as a string)" },
                      validation: { type: "string", description: "Validation rule, e.g. 'min:1 max:255', 'email', 'url', 'min:0'" },
                      references: { type: "string", description: "If type is reference, the entity it references" },
                      enum_values: {
                        type: "array",
                        items: { type: "string" },
                        description: "If type is enum, the allowed values"
                      },
                      index: { type: "boolean", description: "Whether to create a database index on this field" }
                    }
                  }
                },
                indexes: {
                  type: "array",
                  description: "Composite indexes (beyond single-field indexes above)",
                  items: {
                    type: "object",
                    properties: {
                      fields: { type: "array", items: { type: "string" } },
                      unique: { type: "boolean" }
                    }
                  }
                }
              }
            }
          },
          relationships: {
            type: "array",
            description: "All relationships between entities",
            items: {
              type: "object",
              properties: {
                from: { type: "string", description: "Source entity" },
                to: { type: "string", description: "Target entity" },
                type: { type: "string", description: "one-to-one | one-to-many | many-to-many" },
                foreign_key: { type: "string", description: "The field that holds the reference" },
                cascade: { type: "string", description: "cascade | set-null | restrict" },
                description: { type: "string" }
              }
            }
          },
          seed_data: {
            type: "object",
            description: "Sample records for each entity (2-3 per entity)",
            additionalProperties: true
          },
          api_endpoints: {
            type: "array",
            description: "CRUD + custom API endpoints",
            items: {
              type: "object",
              properties: {
                method: { type: "string", description: "GET | POST | PUT | PATCH | DELETE" },
                path: { type: "string", description: "API path, e.g. /api/orders" },
                entity: { type: "string", description: "Entity this endpoint operates on" },
                operation: { type: "string", description: "list | get | create | update | delete | custom" },
                auth_required: { type: "boolean" },
                description: { type: "string" }
              }
            }
          }
        }
      },
      model: "claude_sonnet_4_6",
    });

    return Response.json({ ok: true, data: result });
  } catch (error) {
    console.error("generateDataModel error", error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}