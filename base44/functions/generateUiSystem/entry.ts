import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// generateUiSystem — the third "system" generator step for web_app /
// ecommerce / platform builds. Takes the architecture spec (pages, features,
// product type) and produces a complete UI design system: color palette,
// typography scale, spacing system, component library, layout patterns,
// responsive breakpoints, and theme tokens. The frontend saves this to
// the AutoBuild record's ui_system field.
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

    const pagesStr = architecture.pages
      ? architecture.pages.map(p => `${p.name} (${p.route}): ${p.purpose}`).join('\n')
      : 'No pages defined';
    const featuresStr = architecture.features
      ? architecture.features.map(f => f.name).join(', ')
      : 'No features defined';

    const prompt = `You are a senior UI/UX designer and design system architect with 15+ years of experience building production design systems for web applications. Design a complete, production-ready UI design system for a ${typeLabel}.

PRODUCT: ${businessName || 'Not yet named'}
PRODUCT TYPE: ${productType}

PAGES TO DESIGN FOR:
${pagesStr}

KEY FEATURES:
${featuresStr}

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
            description: "Complete color palette with hex values",
            properties: {
              primary: { type: "string", description: "Primary brand color (hex)" },
              primary_foreground: { type: "string", description: "Text color on primary (hex)" },
              secondary: { type: "string", description: "Secondary color (hex)" },
              accent: { type: "string", description: "Accent / highlight color (hex)" },
              background: { type: "string", description: "Page background (hex)" },
              surface: { type: "string", description: "Card / elevated surface (hex)" },
              text: { type: "string", description: "Primary text (hex)" },
              text_muted: { type: "string", description: "Secondary / muted text (hex)" },
              border: { type: "string", description: "Border color (hex)" },
              success: { type: "string", description: "Success state color (hex)" },
              warning: { type: "string", description: "Warning state color (hex)" },
              error: { type: "string", description: "Error state color (hex)" },
              info: { type: "string", description: "Info state color (hex)" }
            }
          },
          typography: {
            type: "object",
            description: "Typography system",
            properties: {
              font_heading: { type: "string", description: "Heading font family" },
              font_body: { type: "string", description: "Body font family" },
              font_mono: { type: "string", description: "Monospace font family" },
              scale: {
                type: "array",
                description: "Type scale (from smallest to largest)",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "e.g. xs, sm, base, lg, xl, 2xl, 3xl, 4xl" },
                    size: { type: "string", description: "e.g. 0.75rem, 0.875rem, 1rem" },
                    weight: { type: "string", description: "e.g. 400, 500, 600, 700" },
                    line_height: { type: "string", description: "e.g. 1.25, 1.5" },
                    usage: { type: "string", description: "Where this size is used" }
                  }
                }
              }
            }
          },
          spacing: {
            type: "object",
            description: "Spacing system",
            properties: {
              unit: { type: "string", description: "Base spacing unit, e.g. 0.25rem (4px)" },
              scale: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "e.g. xs, sm, md, lg, xl, 2xl" },
                    value: { type: "string", description: "e.g. 0.25rem, 0.5rem, 1rem" }
                  }
                }
              }
            }
          },
          components: {
            type: "array",
            description: "Component library specs",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Component name, PascalCase" },
                description: { type: "string", description: "What it does" },
                category: { type: "string", description: "form | layout | feedback | navigation | data-display | overlay" },
                props: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string", description: "Type, e.g. string, boolean, ReactNode" },
                      default: { type: "string", description: "Default value" },
                      description: { type: "string" }
                    }
                  }
                },
                variants: { type: "array", items: { type: "string" }, description: "e.g. primary, secondary, ghost, destructive" },
                usage_notes: { type: "string" }
              }
            }
          },
          layout_patterns: {
            type: "array",
            description: "Reusable layout patterns",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "e.g. SidebarLayout, CardGrid, SplitScreen" },
                description: { type: "string" },
                usage: { type: "string", description: "When to use this pattern" }
              }
            }
          },
          responsive: {
            type: "object",
            description: "Responsive breakpoint system",
            properties: {
              breakpoints: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "e.g. sm, md, lg, xl" },
                    min_width: { type: "string", description: "e.g. 640px, 768px, 1024px" },
                    description: { type: "string" }
                  }
                }
              },
              strategy: { type: "string", description: "Mobile-first or desktop-first approach" }
            }
          },
          theme_tokens: {
            type: "object",
            description: "CSS custom property tokens for light and dark themes (keys: light, dark, each mapping token names to values)",
            additionalProperties: true
          },
          design_principles: {
            type: "array",
            items: { type: "string" },
            description: "Guiding design principles for this product"
          }
        }
      },
      model: "claude_sonnet_4_6",
    });

    return Response.json({ ok: true, data: result });
  } catch (error) {
    console.error("generateUiSystem error", error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}