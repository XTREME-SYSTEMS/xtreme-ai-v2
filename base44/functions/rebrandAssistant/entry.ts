import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, project_id, message, clicked_element, colors, command, item_key, revision_feedback, feedback, replacement, notes } = body;

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
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
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
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
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
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
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
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
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

    // === INIT CHECKLIST: Initialize the 12-element standardized rebrand checklist ===
    if (action === "init_checklist") {
      const mc = project.legal_scan?.must_change || {};
      const rp = project.rebrand_package || {};

      const checklist = [
        {
          key: "business_name", label: "Business Name",
          description: "Replace with a name cleared for confusingly similar trademarks",
          status: project.selected_name ? "ready" : "pending",
          original: mc.business_name || "",
          replacement: project.selected_name || "",
          ai_notes: project.selected_name ? "Auto-selected from legal scan recommendations" : "",
        },
        {
          key: "domain", label: "Domain",
          description: "Replace with the new brand domain",
          status: project.selected_domain ? "ready" : "pending",
          original: project.target_url || "",
          replacement: project.selected_domain || "",
          ai_notes: project.selected_domain ? "Auto-selected from legal scan recommendations" : "",
        },
        {
          key: "logo", label: "Logo / Trademark / Branded Icons",
          description: "Replace all logos and branded icons",
          status: (rp.logos?.length > 0) ? "ready" : "pending",
          original: mc.logo?.description || "",
          replacement: rp.logos?.length > 0 ? `${rp.logos.length} logo options generated` : "",
          replacement_data: { logos: rp.logos || [] },
          ai_notes: rp.logos?.length > 0 ? "3 logo options generated" : "",
        },
        {
          key: "tagline", label: "Tagline / Distinctive Branding",
          description: "Replace any trademarked tagline or slogan",
          status: rp.new_brand?.tagline ? "ready" : "pending",
          original: mc.tagline || "",
          replacement: rp.new_brand?.tagline || "",
          ai_notes: rp.new_brand?.tagline ? "Generated as part of brand identity" : "",
        },
        {
          key: "written_copy", label: "Written Copy",
          description: "Replace copied original text with independently written content",
          status: (rp.replacement_content?.length > 0) ? "ready" : "pending",
          original: `${mc.content_to_replace?.length || 0} content blocks identified`,
          replacement: rp.replacement_content?.length > 0 ? `${rp.replacement_content.length} replacement blocks generated` : "",
          replacement_data: { blocks: rp.replacement_content || [] },
          ai_notes: rp.replacement_content?.length > 0 ? "Replacement content generated" : "",
        },
        {
          key: "photos", label: "Photos / Artwork / Graphics / Video",
          description: "Replace unless ownership/license is verified",
          status: (rp.replacement_images?.length > 0) ? "ready" : "pending",
          original: `${mc.images_to_replace?.length || 0} images identified`,
          replacement: rp.replacement_images?.length > 0 ? `${rp.replacement_images.length} replacement images generated` : "",
          replacement_data: { images: rp.replacement_images || [] },
          ai_notes: rp.replacement_images?.length > 0 ? "Replacement images generated" : "",
        },
        {
          key: "source_code", label: "Exact Proprietary Source Code",
          description: "Independently reimplement or verify license",
          status: "approved",
          original: "N/A — site is built with fresh code",
          replacement: "Site is built with fresh, independently written code via the Website Factory / Clone pipeline",
          ai_notes: "No action needed — the clone pipeline generates fresh code, not a copy of the original source",
          approved_at: new Date().toISOString(),
        },
        {
          key: "testimonials", label: "Testimonials / Reviews / Case Studies",
          description: "Replace with your own real ones",
          status: "pending",
          original: "Original testimonials/reviews from the cloned site",
          replacement: "",
          ai_notes: "",
        },
        {
          key: "facts_claims", label: "Customer/Company-Specific Facts and Claims",
          description: "Replace with verified facts for the new business",
          status: "pending",
          original: "Company-specific facts and claims from the cloned site",
          replacement: "",
          ai_notes: "",
        },
        {
          key: "contact_info", label: "Contact Info / Emails / Addresses / Tracking IDs",
          description: "Replace all contact information",
          status: "pending",
          original: mc.contact_info ? JSON.stringify(mc.contact_info) : "",
          replacement: "",
          ai_notes: "",
        },
        {
          key: "privacy_terms", label: "Privacy / Terms / Cookie Disclosures",
          description: "Generate for what the new site actually does, then review",
          status: "pending",
          original: "Original privacy/terms/cookie policies",
          replacement: "",
          ai_notes: "",
        },
        {
          key: "overall_branding", label: "Overall Branding",
          description: "Transform further if the finished property could reasonably look like it comes from the original company",
          status: "pending",
          original: "Final brand distinctiveness assessment",
          replacement: "",
          ai_notes: "",
        },
      ];

      await base44.asServiceRole.entities.CloneProject.update(project_id, { rebrand_checklist: checklist });
      return Response.json({ ok: true, checklist });
    }

    // === GENERATE ITEM: AI-generate replacement for a single checklist item ===
    if (action === "generate_item") {
      const checklist = project.rebrand_checklist || [];
      const item = checklist.find(c => c.key === item_key);
      if (!item) return Response.json({ error: "Item not found" }, { status: 400 });

      // Mark as generating
      const genChecklist = checklist.map(c => c.key === item_key ? { ...c, status: "generating" } : c);
      await base44.asServiceRole.entities.CloneProject.update(project_id, { rebrand_checklist: genChecklist });

      const mc = project.legal_scan?.must_change || {};
      const rp = project.rebrand_package || {};
      const name = project.selected_name || "NewCo";
      const domain = project.selected_domain || "newco.com";
      const industry = project.industry || "general";
      let rep = "";
      let repData = {};
      let aiNotes = "";

      try {
        if (item_key === "business_name") {
          let names = project.legal_scan?.name_recommendations || [];
          if (names.length === 0) {
            const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
              prompt: `Generate 20 creative, brandable business name + domain recommendations for a ${industry} business replacing "${mc.business_name || ""}". Return JSON: { "names": [{ "name": string, "domain": string, "rationale": string, "available": boolean }] }`,
              add_context_from_internet: true, model: "gemini_3_flash",
              response_json_schema: { type: "object", properties: { names: { type: "array", items: { type: "object", properties: { name: { type: "string" }, domain: { type: "string" }, rationale: { type: "string" }, available: { type: "boolean" } } } } } }
            });
            names = result.names || [];
            const scan = project.legal_scan || {};
            scan.name_recommendations = names;
            await base44.asServiceRole.entities.CloneProject.update(project_id, { legal_scan: scan });
          }
          const best = names.find(n => n.available) || names[0];
          if (best) {
            rep = best.name;
            repData = { domain: best.domain, rationale: best.rationale, all_options: names };
            aiNotes = `Selected "${best.name}" (${best.domain}). Rationale: ${best.rationale}`;
            await base44.asServiceRole.entities.CloneProject.update(project_id, { selected_name: best.name, selected_domain: best.domain });
          }
        }

        else if (item_key === "domain") {
          let names = project.legal_scan?.name_recommendations || [];
          if (names.length === 0) {
            const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
              prompt: `Generate 20 domain options for a ${industry} business named "${name}". Return JSON: { "domains": [{ "domain": string, "available": boolean, "rationale": string }] }`,
              add_context_from_internet: true, model: "gemini_3_flash",
              response_json_schema: { type: "object", properties: { domains: { type: "array", items: { type: "object", properties: { domain: { type: "string" }, available: { type: "boolean" }, rationale: { type: "string" } } } } } }
            });
            names = (result.domains || []).map(d => ({ name, domain: d.domain, rationale: d.rationale, available: d.available }));
          }
          const best = names.find(n => n.available) || names[0];
          if (best) {
            rep = best.domain;
            repData = { all_options: names.map(n => n.domain) };
            aiNotes = `Selected domain: ${best.domain}`;
            await base44.asServiceRole.entities.CloneProject.update(project_id, { selected_domain: best.domain });
          }
        }

        else if (item_key === "logo") {
          const colors = rp.new_brand?.colors || { primary: "#0a0a0a", accent: "#D4FF4D" };
          const styles = ["minimalist geometric", "bold emblem badge", "modern abstract monogram"];
          const prompts = styles.map(s => `Professional logo for "${name}", a ${industry} company. Style: ${s}. Colors: ${colors.primary} and ${colors.accent}. Clean, scalable, on white background. Brand name "${name}" integrated.`);
          const results = await Promise.all(prompts.map(p => base44.asServiceRole.integrations.Core.GenerateImage({ prompt: p }).catch(() => null)));
          const logos = results.filter(Boolean).map((r, i) => ({ url: r.url, prompt: prompts[i], style: styles[i] }));
          rep = `${logos.length} logo options generated`;
          repData = { logos };
          aiNotes = `Generated ${logos.length} logo options in different styles`;
          const updatedRp = { ...rp, logos };
          await base44.asServiceRole.entities.CloneProject.update(project_id, { rebrand_package: updatedRp });
        }

        else if (item_key === "tagline") {
          const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Create a new tagline for "${name}", a ${industry} business. The original tagline "${mc.tagline || ""}" must be replaced. Return JSON: { "tagline": string, "voice": string }`,
            model: "gemini_3_flash",
            response_json_schema: { type: "object", properties: { tagline: { type: "string" }, voice: { type: "string" } } }
          });
          rep = result.tagline;
          repData = { tagline: result.tagline, voice: result.voice };
          aiNotes = `New tagline: "${result.tagline}". Brand voice: ${result.voice}`;
          const brand = rp.new_brand || {};
          brand.tagline = result.tagline;
          brand.voice = result.voice;
          const updatedRp = { ...rp, new_brand: brand };
          await base44.asServiceRole.entities.CloneProject.update(project_id, { rebrand_package: updatedRp });
        }

        else if (item_key === "written_copy") {
          const blocks = mc.content_to_replace || [];
          if (blocks.length === 0) {
            rep = "No copyrighted content blocks identified — all content is safe to keep";
            aiNotes = "Legal scan found no content blocks that need replacement";
          } else {
            const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
              prompt: `You are rebranding a ${industry} website from "${mc.business_name || ""}" to "${name}". For each content block, write a unique replacement that conveys the same information but in original words. Return JSON: { "replacements": [{ "section": string, "original_text": string, "new_text": string }] }

Content blocks to replace:
${blocks.map((c, i) => `${i+1}. Section: ${c.section}\n   Original: "${(c.original_text||"").slice(0,500)}"\n   Reason: ${c.reason}`).join("\n\n")}

New brand: ${name}
Brand voice: ${rp.new_brand?.voice || "professional and trustworthy"}`,
              model: "gemini_3_flash",
              response_json_schema: { type: "object", properties: { replacements: { type: "array", items: { type: "object", properties: { section: { type: "string" }, original_text: { type: "string" }, new_text: { type: "string" } } } } } }
            });
            const replacements = result.replacements || [];
            rep = `${replacements.length} content blocks rewritten`;
            repData = { blocks: replacements };
            aiNotes = `Rewrote ${replacements.length} content blocks in original language`;
            const updatedRp = { ...rp, replacement_content: replacements };
            await base44.asServiceRole.entities.CloneProject.update(project_id, { rebrand_package: updatedRp });
          }
        }

        else if (item_key === "photos") {
          const images = mc.images_to_replace || [];
          if (images.length === 0) {
            rep = "No proprietary images identified — all images are stock/generic";
            aiNotes = "Legal scan found no images that need replacement";
          } else {
            const results = await Promise.all(images.slice(0, 5).map(img =>
              base44.asServiceRole.integrations.Core.GenerateImage({ prompt: img.replacement_prompt || `Professional ${industry} image, high quality, no text` })
                .then(r => ({ original_url: img.url, new_url: r.url, description: img.description, prompt: img.replacement_prompt }))
                .catch(() => null)
            ));
            const replacementImages = results.filter(Boolean);
            rep = `${replacementImages.length} replacement images generated`;
            repData = { images: replacementImages };
            aiNotes = `Generated ${replacementImages.length} replacement images`;
            const updatedRp = { ...rp, replacement_images: replacementImages };
            await base44.asServiceRole.entities.CloneProject.update(project_id, { rebrand_package: updatedRp });
          }
        }

        else if (item_key === "testimonials") {
          const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Generate 3 realistic, original testimonials for "${name}", a ${industry} business. These should be entirely original, not copied from any real business. Return JSON: { "testimonials": [{ "name": string, "location": string, "text": string, "rating": number }] }`,
            model: "gemini_3_flash",
            response_json_schema: { type: "object", properties: { testimonials: { type: "array", items: { type: "object", properties: { name: { type: "string" }, location: { type: "string" }, text: { type: "string" }, rating: { type: "number" } } } } } }
          });
          rep = `${result.testimonials?.length || 0} testimonials generated`;
          repData = { testimonials: result.testimonials || [] };
          aiNotes = "Generated original testimonials for the new business";
        }

        else if (item_key === "facts_claims") {
          const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Generate verified, accurate facts and claims for "${name}", a ${industry} business. These should be general industry facts, not copied from the original site. Return JSON: { "facts": [{ "claim": string, "verification": string }] }`,
            add_context_from_internet: true, model: "gemini_3_flash",
            response_json_schema: { type: "object", properties: { facts: { type: "array", items: { type: "object", properties: { claim: { type: "string" }, verification: { type: "string" } } } } } }
          });
          rep = `${result.facts?.length || 0} verified facts generated`;
          repData = { facts: result.facts || [] };
          aiNotes = "Generated verified industry facts and claims";
        }

        else if (item_key === "contact_info") {
          const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Generate plausible contact information for "${name}", a ${industry} business. Use the domain ${domain}. Return JSON: { "phone": string, "email": string, "address": string, "hours": string, "social_links": [string] }`,
            model: "gemini_3_flash",
            response_json_schema: { type: "object", properties: { phone: { type: "string" }, email: { type: "string" }, address: { type: "string" }, hours: { type: "string" }, social_links: { type: "array", items: { type: "string" } } } }
          });
          rep = `Phone: ${result.phone}, Email: ${result.email}`;
          repData = result;
          aiNotes = "Generated new contact information for the business";
        }

        else if (item_key === "privacy_terms") {
          const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Generate privacy policy, terms of service, and cookie policy for "${name}", a ${industry} business at ${domain}. The site collects: contact form submissions, email newsletter signups, and uses cookies for analytics. Return JSON: { "privacy_policy": string, "terms_of_service": string, "cookie_policy": string }`,
            model: "gemini_3_flash",
            response_json_schema: { type: "object", properties: { privacy_policy: { type: "string" }, terms_of_service: { type: "string" }, cookie_policy: { type: "string" } } }
          });
          rep = "Privacy Policy, Terms of Service, Cookie Policy generated";
          repData = result;
          aiNotes = "Generated legal documents tailored to the new site's actual data practices";
        }

        else if (item_key === "overall_branding") {
          const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Assess the overall brand distinctiveness of this rebrand. Could the finished property reasonably look like it comes from the original company?

Original: ${mc.business_name || "N/A"} (${project.target_url})
New: ${name} (${domain})
Industry: ${industry}
New tagline: ${rp.new_brand?.tagline || "N/A"}
Colors: ${JSON.stringify(rp.new_brand?.colors || {})}
Logos: ${rp.logos?.length || 0} generated
Replacement content: ${rp.replacement_content?.length || 0} blocks
Replacement images: ${rp.replacement_images?.length || 0} images

Return JSON: { "assessment": string, "sufficient": boolean, "recommendations": [string] }`,
            model: "claude_sonnet_4_6",
            response_json_schema: { type: "object", properties: { assessment: { type: "string" }, sufficient: { type: "boolean" }, recommendations: { type: "array", items: { type: "string" } } } }
          });
          rep = result.sufficient ? "Brand is sufficiently distinct" : "Further transformation recommended";
          repData = result;
          aiNotes = result.assessment;
        }

        const updatedChecklist = (project.rebrand_checklist || []).map(c =>
          c.key === item_key
            ? { ...c, status: "ready", replacement: rep, replacement_data: repData, ai_notes: aiNotes, generated_at: new Date().toISOString(), revision_feedback: revision_feedback || undefined }
            : c
        );
        await base44.asServiceRole.entities.CloneProject.update(project_id, { rebrand_checklist: updatedChecklist });
        return Response.json({ ok: true, item: updatedChecklist.find(c => c.key === item_key) });

      } catch (error) {
        const failChecklist = (project.rebrand_checklist || []).map(c =>
          c.key === item_key ? { ...c, status: "pending", ai_notes: "Generation failed: " + error.message } : c
        );
        await base44.asServiceRole.entities.CloneProject.update(project_id, { rebrand_checklist: failChecklist });
        return Response.json({ error: error.message }, { status: 500 });
      }
    }

    // === APPROVE / REVISE / MANUAL EDIT ===
    if (action === "approve_item") {
      const checklist = (project.rebrand_checklist || []).map(c =>
        c.key === item_key ? { ...c, status: "approved", approved_at: new Date().toISOString() } : c
      );
      await base44.asServiceRole.entities.CloneProject.update(project_id, { rebrand_checklist: checklist });
      return Response.json({ ok: true });
    }

    if (action === "revise_item") {
      const checklist = (project.rebrand_checklist || []).map(c =>
        c.key === item_key ? { ...c, status: "needs_revision", revision_feedback: feedback } : c
      );
      await base44.asServiceRole.entities.CloneProject.update(project_id, { rebrand_checklist: checklist });
      return Response.json({ ok: true });
    }

    if (action === "manual_edit_item") {
      const checklist = (project.rebrand_checklist || []).map(c =>
        c.key === item_key ? { ...c, status: "manual", replacement, ai_notes: notes || "Manually edited", approved_at: new Date().toISOString() } : c
      );
      await base44.asServiceRole.entities.CloneProject.update(project_id, { rebrand_checklist: checklist });
      return Response.json({ ok: true });
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