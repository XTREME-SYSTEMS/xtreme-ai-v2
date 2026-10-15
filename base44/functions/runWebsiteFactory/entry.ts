import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

// Website Factory Orchestrator — top-down AI pipeline driven by the Template + Prompt Libraries.
// name → url → brand → [GATE 1] → logo → content → images → seo/aeo → [GATE 2] → complete.
// Each step pulls an ultra-quality prompt from PromptLibrary (niche-specific if available,
// else general) and a niche-matched template from TemplateLibrary, injecting template design
// direction + section guidance into the brand/content/image steps.
//
// Actions: start | continue | finalize. Admin-only. Approvals route to the client dashboard.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const { action, project_id, business_name, niche, audience } = body || {};
    const log = (...a) => console.log("[website-factory]", ...a);

    let project;
    if (action === "start") {
      if (project_id) {
        project = await base44.asServiceRole.entities.WebsiteFactoryProject.get(project_id);
      } else {
        if (!business_name) return Response.json({ error: "business_name required to start" }, { status: 400 });
        project = await base44.asServiceRole.entities.WebsiteFactoryProject.create({
          business_name, niche: niche || "", audience: audience || "",
          current_step: "name", status: "running", logs: ["Project created"]
        });
      }
    } else {
      if (!project_id) return Response.json({ error: "project_id required" }, { status: 400 });
      project = await base44.asServiceRole.entities.WebsiteFactoryProject.get(project_id);
    }
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

    const patch = (data) => base44.asServiceRole.entities.WebsiteFactoryProject.update(project.id, data);
    const llm = (prompt, schema) => base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt, response_json_schema: schema, model: "claude_sonnet_4_6"
    }).then((r) => r.data || r);

    // ---- Library loaders ----
    const loadTemplate = async (niche) => {
      const all = await base44.asServiceRole.entities.TemplateLibrary.filter({ status: "active" });
      const match = all.find((t) => (t.niche || "").toLowerCase() === (niche || "").toLowerCase());
      return match || all.find((t) => (t.niche || "") === "general") || all[0] || null;
    };
    const loadPrompt = async (step, niche) => {
      // Prefer niche-specific active prompt, fall back to general.
      let p = (await base44.asServiceRole.entities.PromptLibrary.filter({ step, status: "active", niche }, null, 1))[0];
      if (!p) p = (await base44.asServiceRole.entities.PromptLibrary.filter({ step, status: "active", niche: "general" }, null, 1))[0];
      return p || null;
    };
    const interpolate = (text, vars) => (text || "").replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");

    // ---- START: name → url → brand → brand approval gate ----
    if (action === "start") {
      await patch({ status: "running", error: null });
      const template = await loadTemplate(project.niche);
      const promptIds = {};
      const ctx = { business_name: project.business_name, niche: project.niche, audience: project.audience };

      // Step 1 — Website name
      const namePrompt = await loadPrompt("name", project.niche);
      promptIds.name = namePrompt?.id;
      const nameRes = await llm(interpolate(namePrompt?.prompt_text || FALLBACK.name, ctx), {
        type: "object", properties: { names: { type: "array", items: { type: "string" } }, best: { type: "string" } }, required: ["names", "best"]
      });
      let website_name = nameRes.best || (nameRes.names || [])[0] || project.business_name;
      // Models sometimes append rationale to `best` — keep only the name token.
      if (website_name.length > 28 && / — | – | - | —|:/.test(website_name)) {
        website_name = website_name.split(/ — | – | — | - |:/)[0].trim();
      }
      website_name = website_name || (nameRes.names || [])[0] || project.business_name;
      project = await patch({ website_name, name_options: nameRes.names || [], current_step: "url", template_id: template?.id, template_name: template?.name, prompt_ids: promptIds, logs: [...(project.logs || []), `Name: ${website_name}` + (template ? ` · template: ${template.name}` : "")] });
      log("name:", website_name);

      // Step 2 — URL / domain
      const urlPrompt = await loadPrompt("url", project.niche);
      promptIds.url = urlPrompt?.id;
      const urlRes = await llm(interpolate(urlPrompt?.prompt_text || FALLBACK.url, { ...ctx, website_name }), {
        type: "object", properties: { domains: { type: "array", items: { type: "string" } }, best: { type: "string" }, slug: { type: "string" } }, required: ["domains", "best"]
      });
      const domain = urlRes.best || (urlRes.domains || [])[0] || `${website_name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`;
      project = await patch({ domain, domain_options: urlRes.domains || [], current_step: "brand", prompt_ids: promptIds, logs: [...(project.logs || []), `Domain: ${domain}`] });

      // Step 3 — Brand (inject template design direction)
      const brandPrompt = await loadPrompt("brand", project.niche);
      promptIds.brand = brandPrompt?.id;
      const templateDesign = template ? `Colors: ${template.design_direction?.colors || ""}. Typography: ${template.design_direction?.typography || ""}. Imagery: ${template.design_direction?.imagery || ""}. Layout: ${template.layout_style || ""}.` : "";
      const brandRes = await llm(interpolate(brandPrompt?.prompt_text || FALLBACK.brand, { ...ctx, website_name, domain, template_design: templateDesign }), {
        type: "object", properties: { positioning: { type: "string" }, promise: { type: "string" }, tagline: { type: "string" }, colors: { type: "string" }, typography: { type: "string" }, voice: { type: "string" }, logo_direction: { type: "string" } }, required: ["positioning", "tagline", "logo_direction"]
      });
      project = await patch({ brand: brandRes, current_step: "brand_review", prompt_ids: promptIds, logs: [...(project.logs || []), "Brand identity generated"] });

      // GATE 1 — brand approval
      const approval = await base44.asServiceRole.entities.Approval.create({
        entity_type: "WebsiteFactoryProject", entity_id: project.id,
        requested_action: `Approve brand direction for "${website_name}" — ${brandRes.tagline || ""}`,
        risk_level: "yellow", status: "pending",
        notes: `Template: ${template?.name || "none"}. Positioning: ${(brandRes.positioning || "").slice(0, 120)}`
      });
      project = await patch({ status: "awaiting_approval", approval_id: approval.id, logs: [...(project.logs || []), `Brand gate opened`] });
      return Response.json({ ok: true, project_id: project.id, gate: "brand_review", approval_id: approval.id, template: template?.name, message: "Brand generated — awaiting client approval" });
    }

    // ---- CONTINUE: logo → content → images → seo/aeo → final gate ----
    if (action === "continue") {
      if (project.approval_id) {
        const ap = await base44.asServiceRole.entities.Approval.get(project.approval_id);
        if (!ap || ap.status !== "approved") return Response.json({ error: "Brand approval not approved yet", approval_status: ap?.status }, { status: 400 });
      }
      await patch({ status: "running", current_step: "logo" });
      const brand = project.brand || {};
      const website_name = project.website_name || project.business_name;
      const template = project.template_id ? await base44.asServiceRole.entities.TemplateLibrary.get(project.template_id) : null;
      const promptIds = project.prompt_ids || {};
      const ctx = { business_name: project.business_name, niche: project.niche, audience: project.audience, website_name, domain: project.domain };

      // Step 4 — Logo
      const logoPrompt = await loadPrompt("logo", project.niche);
      promptIds.logo = logoPrompt?.id;
      const logoPromptText = interpolate(logoPrompt?.prompt_text || FALLBACK.logo, { ...ctx, logo_direction: brand.logo_direction || `A clean modern logo for ${website_name}` });
      let logo_url = "";
      try { const r = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt: logoPromptText }); logo_url = (r.data || r).url || ""; } catch (e) { log("logo gen failed", e.message); }
      project = await patch({ logo_url, logo_prompt: logoPromptText, current_step: "content", prompt_ids: promptIds, logs: [...(project.logs || []), "Logo generated"] });

      // Step 5 — Content (inject template section guidance)
      const contentPrompt = await loadPrompt("content", project.niche);
      promptIds.content = contentPrompt?.id;
      const templateSections = template ? template.sections?.map((s) => `${s.name}: ${s.guidance || s.purpose || ""}`).join(" | ") : "";
      const contentRes = await llm(interpolate(contentPrompt?.prompt_text || FALLBACK.content, { ...ctx, voice: brand.voice || "", promise: brand.promise || "", template_sections: templateSections }), {
        type: "object", properties: { hero_headline: { type: "string" }, hero_subhead: { type: "string" }, about: { type: "string" }, services: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } } } }, faq: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } } }, cta: { type: "string" } }, required: ["hero_headline", "about", "services"]
      });
      project = await patch({ content: contentRes, current_step: "images", prompt_ids: promptIds, logs: [...(project.logs || []), "Content generated"] });

      // Step 6 — Images (hero + about)
      const imgPrompt = await loadPrompt("images", project.niche);
      promptIds.images = imgPrompt?.id;
      const imagery = template?.design_direction?.imagery || brand.positioning || "";
      const images = [];
      const heroPromptText = interpolate(imgPrompt?.prompt_text || FALLBACK.images, { ...ctx, imagery });
      try { const r1 = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt: heroPromptText }); images.push({ type: "hero", url: (r1.data || r1).url || "", prompt: heroPromptText }); } catch (e) { log("hero img failed", e.message); }
      const aboutPromptText = `An authentic, warm supporting image for the About section of ${website_name}. ${project.niche || "service"} context, real-world feel, professional, medium-format. No text overlay.`;
      try { const r2 = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt: aboutPromptText }); images.push({ type: "about", url: (r2.data || r2).url || "", prompt: aboutPromptText }); } catch (e) { log("about img failed", e.message); }
      project = await patch({ images, current_step: "seo_aeo", prompt_ids: promptIds, logs: [...(project.logs || []), `${images.length} images generated`] });

      // Step 7 — SEO + AEO
      const seoPrompt = await loadPrompt("seo_aeo", project.niche);
      promptIds.seo_aeo = seoPrompt?.id;
      const seoRes = await llm(interpolate(seoPrompt?.prompt_text || FALLBACK.seo_aeo, { ...ctx, content: JSON.stringify(contentRes).slice(0, 2500) }), {
        type: "object", properties: { meta_title: { type: "string" }, meta_description: { type: "string" }, canonical: { type: "string" }, json_ld: { type: "object" }, answer_summary: { type: "string" }, qa_schema: { type: "object" }, citation_faq: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } } } }, required: ["meta_title", "meta_description", "answer_summary"]
      });
      const seo = { meta_title: seoRes.meta_title, meta_description: seoRes.meta_description, canonical: seoRes.canonical, json_ld: seoRes.json_ld };
      const aeo = { answer_summary: seoRes.answer_summary, qa_schema: seoRes.qa_schema, citation_faq: seoRes.citation_faq || [] };
      project = await patch({ seo, aeo, current_step: "final_review", prompt_ids: promptIds, logs: [...(project.logs || []), "SEO + AEO pack generated"] });

      // GATE 2 — final approval
      const approval = await base44.asServiceRole.entities.Approval.create({
        entity_type: "WebsiteFactoryProject", entity_id: project.id,
        requested_action: `Approve final website for "${website_name}" — ${project.domain || ""}`,
        risk_level: "yellow", status: "pending",
        notes: `Full site assembled via template "${template?.name || "none"}". Logo + content + ${images.length} images + SEO/AEO ready.`
      });
      project = await patch({ status: "awaiting_approval", final_approval_id: approval.id, prompt_ids: promptIds, logs: [...(project.logs || []), `Final gate opened`] });
      return Response.json({ ok: true, project_id: project.id, gate: "final_review", approval_id: approval.id, message: "Site assembled — awaiting client approval" });
    }

    // ---- FINALIZE ----
    if (action === "finalize") {
      if (project.final_approval_id) {
        const ap = await base44.asServiceRole.entities.Approval.get(project.final_approval_id);
        if (!ap || ap.status !== "approved") return Response.json({ error: "Final approval not approved yet", approval_status: ap?.status }, { status: 400 });
      }
      project = await patch({ status: "complete", current_step: "complete", logs: [...(project.logs || []), "Project complete"] });
      return Response.json({ ok: true, project_id: project.id, message: "Website factory project complete" });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[website-factory] error", error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

const FALLBACK = {
  name: `Generate 5 premium brandable website names for a {{niche}} business ("{{business_name}}") for {{audience}}. Return JSON {names:[],best:""}.`,
  url: `Generate 5 premium .com domains for "{{website_name}}" ({{niche}}). Return JSON {domains:[],best:"",slug:""}.`,
  brand: `Build a premium brand identity for "{{website_name}}" ({{niche}}) for {{audience}}. Domain {{domain}}. Template direction: {{template_design}}. Return JSON {positioning,promise,tagline,colors,typography,voice,logo_direction}.`,
  logo: `{{logo_direction}} Premium minimal vector logo, dark background, no text effects.`,
  content: `Write full website content for "{{website_name}}" ({{niche}}). Voice: {{voice}}. Promise: {{promise}}. Sections: {{template_sections}}. Return JSON {hero_headline,hero_subhead,about,services:[{title,description}],faq:[{question,answer}],cta}.`,
  images: `Cinematic hero image for "{{website_name}}" ({{niche}}). {{imagery}} Medium-format, dramatic lighting, 16:9, no text.`,
  seo_aeo: `SEO + AEO for "{{website_name}}" ({{domain}}). Content: {{content}}. Return JSON {meta_title,meta_description,canonical,json_ld,answer_summary,qa_schema,citation_faq:[{question,answer}]}.`
};