import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, project_id, message, clicked_element, colors, command } = body;

    if (!project_id) {
      return Response.json({ error: "project_id required" }, { status: 400 });
    }

    const project = await base44.asServiceRole.entities.CloneProject.get(project_id);
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    // === CHAT: AI conversation with full project context ===
    if (action === "chat") {
      const ctx = buildProjectContext(project);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are XtremeClone AI, an autonomous rebranding assistant with full read/write/execute access to a clone project. You can analyze the cloned site, identify issues, suggest changes, and execute updates to the rebrand package.

${ctx}

User message: ${message}

Respond conversationally and concisely. If the user wants to make a change that you can execute, include an action object. Available commands:
- update_colors: { primary: "#hex", accent: "#hex" }
- update_brand_name: { name: "new name" }
- update_content: { section: "section name", new_text: "replacement text" }
- add_service: { title: "title", description: "desc" }
- add_faq: { question: "q", answer: "a" }
- run_audit: {}

Only include actions when the user explicitly asks for a change. Otherwise, just respond with advice.`,
        response_json_schema: {
          type: "object",
          properties: {
            response: { type: "string" },
            actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  command: { type: "string" },
                  params: { type: "object", additionalProperties: true }
                }
              }
            }
          }
        }
      });
      return Response.json(result);
    }

    // === ANALYZE ELEMENT: Point-and-click element analysis ===
    if (action === "analyze_element") {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this element from a cloned website that the user clicked on with their mouse.

Project: ${project.selected_name || project.target_url}
Industry: ${project.industry || "unknown"}

CLICKED ELEMENT:
- Tag: ${clicked_element?.tag}
- Text: ${clicked_element?.text}
- Classes: ${clicked_element?.classes}
- HTML: ${clicked_element?.html}
- CSS Path: ${clicked_element?.path}

LEGAL SCAN MUST-CHANGE ITEMS:
${JSON.stringify(project.legal_scan?.must_change || {}, null, 2)}

Tell the user in plain English:
1. What this element is
2. Whether it needs to be changed (legal compliance / trademark / copyright)
3. What the replacement should be
4. Any SEO/AEO improvements for this element

Be concise and actionable.`,
        response_json_schema: {
          type: "object",
          properties: {
            description: { type: "string" },
            needs_change: { type: "boolean" },
            reason: { type: "string" },
            suggested_replacement: { type: "string" },
            seo_notes: { type: "string" }
          }
        }
      });
      return Response.json(result);
    }

    // === FORENSIC AUDIT: Deep audit with business owner summary ===
    if (action === "forensic_audit") {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Perform a deep forensic audit of this cloned website project. Write the business owner summary in plain English with no jargon.

PROJECT:
- Target URL: ${project.target_url}
- Industry: ${project.industry || "unknown"}
- Selected Name: ${project.selected_name || "not selected"}
- Selected Domain: ${project.selected_domain || "not selected"}
- Current Step: ${project.current_step}

SCRAPE:
- Title: ${project.scrape?.title || "N/A"}
- Meta: ${project.scrape?.meta_description || "N/A"}
- Structure: ${project.scrape?.structure_summary || "N/A"}

LEGAL SCAN:
${project.legal_scan?.single_page_summary || JSON.stringify(project.legal_scan, null, 2)}

REBRAND PACKAGE:
${JSON.stringify(project.rebrand_package?.new_brand, null, 2)}
- Logos: ${(project.rebrand_package?.logos || []).length}
- Replacement Images: ${(project.rebrand_package?.replacement_images || []).length}
- Replacement Content: ${(project.rebrand_package?.replacement_content || []).length}
- Services: ${(project.rebrand_package?.services || []).length}
- FAQ: ${(project.rebrand_package?.faq || []).length}

PROVISIONING:
${JSON.stringify(project.provisioning, null, 2)}

SEO/AEO GAPS:
${JSON.stringify(project.seo_aeo_gaps || [], null, 2)}

DOMAIN: ${project.domain_purchased ? "Purchased" : "Not purchased"} (${project.domain_purchase_status || "N/A"})

Create a comprehensive forensic audit. The business_owner_summary should tell the business owner everything they need to know in plain English — what state the project is in, what's been done, what remains, and whether it's ready to launch.`,
        model: "claude_sonnet_4_6",
        response_json_schema: {
          type: "object",
          properties: {
            business_owner_summary: { type: "string" },
            legal_compliance: { type: "string" },
            brand_assessment: { type: "string" },
            seo_aeo_readiness: { type: "string" },
            infrastructure_status: { type: "string" },
            monetization_opportunities: { type: "string" },
            risk_assessment: { type: "string" },
            must_change_pending: { type: "array", items: { type: "string" } },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  priority: { type: "string" },
                  action: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            overall_score: { type: "number" }
          }
        }
      });

      await base44.asServiceRole.entities.CloneProject.update(project_id, {
        validation_summary: result.business_owner_summary,
        validation_score: result.overall_score,
        logs: [...(project.logs || []), `[${new Date().toISOString()}] Forensic audit: ${result.overall_score}/100`]
      });

      return Response.json(result);
    }

    // === UPDATE COLORS: Real-time brand color update ===
    if (action === "update_colors") {
      const rp = project.rebrand_package || {};
      const brand = rp.new_brand || {};
      brand.colors = colors;
      rp.new_brand = brand;
      await base44.asServiceRole.entities.CloneProject.update(project_id, { rebrand_package: rp });
      return Response.json({ ok: true });
    }

    // === GENERATE NAMES: 20 fresh name+domain recommendations ===
    if (action === "generate_names") {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 20 creative, brandable business name + domain recommendations for a cloned ${project.industry || "service"} website.

Original site: ${project.target_url}
Industry: ${project.industry || "unknown"}
Original business name (must NOT be reused): ${project.legal_scan?.must_change?.business_name || "N/A"}

Generate 20 unique names with .com domains. Names should be:
- Memorable and brandable
- SEO-friendly (include industry keywords where natural)
- Legally distinct from the original
- Professional and trustworthy

For each, provide: name, domain, rationale (why this name works), available (true if domain looks available).`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            names: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  domain: { type: "string" },
                  rationale: { type: "string" },
                  available: { type: "boolean" }
                }
              }
            }
          }
        }
      });

      const scan = project.legal_scan || {};
      scan.name_recommendations = result.names;
      await base44.asServiceRole.entities.CloneProject.update(project_id, { legal_scan: scan });
      return Response.json(result);
    }

    // === EXECUTE: Apply AI-suggested changes ===
    if (action === "execute") {
      const { type, params } = command || {};
      const rp = project.rebrand_package || {};

      if (type === "update_colors") {
        const brand = rp.new_brand || {};
        brand.colors = { primary: params.primary, accent: params.accent };
        rp.new_brand = brand;
        await base44.asServiceRole.entities.CloneProject.update(project_id, { rebrand_package: rp });
        return Response.json({ ok: true, message: "Colors updated" });
      }
      if (type === "update_brand_name") {
        const brand = rp.new_brand || {};
        brand.name = params.name;
        rp.new_brand = brand;
        await base44.asServiceRole.entities.CloneProject.update(project_id, { rebrand_package: rp, selected_name: params.name });
        return Response.json({ ok: true, message: "Brand name updated" });
      }
      if (type === "update_content") {
        const content = rp.replacement_content || [];
        const existing = content.find(c => c.section === params.section);
        if (existing) existing.new_text = params.new_text;
        else content.push({ section: params.section, original_text: "", new_text: params.new_text });
        rp.replacement_content = content;
        await base44.asServiceRole.entities.CloneProject.update(project_id, { rebrand_package: rp });
        return Response.json({ ok: true, message: "Content updated" });
      }
      if (type === "add_service") {
        const services = rp.services || [];
        services.push({ title: params.title, description: params.description });
        rp.services = services;
        await base44.asServiceRole.entities.CloneProject.update(project_id, { rebrand_package: rp });
        return Response.json({ ok: true, message: "Service added" });
      }
      if (type === "add_faq") {
        const faq = rp.faq || [];
        faq.push({ question: params.question, answer: params.answer });
        rp.faq = faq;
        await base44.asServiceRole.entities.CloneProject.update(project_id, { rebrand_package: rp });
        return Response.json({ ok: true, message: "FAQ added" });
      }
      return Response.json({ error: "Unknown command type" }, { status: 400 });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[rebrandAssistant]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function buildProjectContext(project) {
  return `
PROJECT: ${project.selected_name || project.target_url}
Industry: ${project.industry || "unknown"}
Target URL: ${project.target_url}
Current Step: ${project.current_step}
Selected Domain: ${project.selected_domain || "not selected"}

SCRAPE DATA:
- Title: ${project.scrape?.title || "N/A"}
- Meta Description: ${project.scrape?.meta_description || "N/A"}
- Colors: ${JSON.stringify(project.scrape?.colors || [])}
- Structure: ${project.scrape?.structure_summary || "N/A"}

LEGAL SCAN:
- Risk Level: ${project.legal_scan?.risk_level || "N/A"}
- Executive Summary: ${project.legal_scan?.executive_summary || "N/A"}
- Must Change: ${JSON.stringify(project.legal_scan?.must_change || {})}
- Can Keep: ${JSON.stringify(project.legal_scan?.can_keep || {})}

REBRAND PACKAGE:
- New Brand: ${JSON.stringify(project.rebrand_package?.new_brand || {})}
- Hero Content: ${JSON.stringify(project.rebrand_package?.hero_content || {})}
- Services: ${JSON.stringify(project.rebrand_package?.services || [])}
- FAQ: ${JSON.stringify(project.rebrand_package?.faq || [])}

PROVISIONING:
- Vercel URL: ${project.provisioning?.vercel?.url || "not provisioned"}
- Domain Purchased: ${project.domain_purchased}

SEO/AEO GAPS: ${JSON.stringify(project.seo_aeo_gaps || [])}
VALIDATION SCORE: ${project.validation_score || 0}/100
`;
}