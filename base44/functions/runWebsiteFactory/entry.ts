import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

// Website Factory Orchestrator — a top-down AI pipeline that builds an ultra-high-quality
// website from a single seed (business name + niche). Each step consumes the previous step's
// output: name → url → brand → [GATE 1: client approves brand] → logo → content → images →
// seo/aeo → [GATE 2: client approves final site] → complete.
//
// Actions:
//   start    — create project (if needed) and run name → url → brand, then open brand approval gate
//   continue — after brand approval, run logo → content → images → seo/aeo, then open final approval gate
//   finalize — after final approval, mark project complete
//
// Admin-only. Approvals are created as Approval records so the client dashboard handles sign-off.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }
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

    // ---- START: name → url → brand → brand approval gate ----
    if (action === "start") {
      await patch({ status: "running", error: null });

      // Step 1 — Website name generator
      const nameRes = await llm(
        `You are an elite brand-naming AI. Generate 5 premium, memorable, available-sounding website names for a business in the "${project.niche || "local services"}" niche. The seed business is "${project.business_name}". Target audience: ${project.audience || "general consumers"}. Names should be short, brandable, easy to spell, and convey trust + quality. Avoid generic keyword-stuffed names. Return the 5 names and pick the single best one.`,
        { type: "object", properties: { names: { type: "array", items: { type: "string" } }, best: { type: "string" } }, required: ["names", "best"] }
      );
      const website_name = nameRes.best || (nameRes.names || [])[0] || project.business_name;
      project = await patch({ website_name, name_options: nameRes.names || [], current_step: "url", logs: [...(project.logs || []), `Name generated: ${website_name}`] });
      log("name:", website_name);

      // Step 2 — URL / domain generator (uses the name)
      const urlRes = await llm(
        `You are a domain-strategy AI. Given the brand name "${website_name}" in the "${project.niche || "local services"}" niche, generate 5 available .com domain candidates (short, clean, no hyphens if possible). Also produce the recommended URL slug structure. Return the 5 domains and pick the best one.`,
        { type: "object", properties: { domains: { type: "array", items: { type: "string" } }, best: { type: "string" }, slug: { type: "string" } }, required: ["domains", "best"] }
      );
      const domain = urlRes.best || (urlRes.domains || [])[0] || `${website_name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`;
      project = await patch({ domain, domain_options: urlRes.domains || [], current_step: "brand", logs: [...(project.logs || []), `Domain generated: ${domain}`] });
      log("domain:", domain);

      // Step 3 — Brand generator (uses name + niche)
      const brandRes = await llm(
        `You are a world-class brand strategist. Build a complete, cohesive brand identity for "${website_name}" — a ${project.niche || "local service"} business targeting ${project.audience || "consumers"}. Domain: ${domain}. Define positioning, brand promise, tagline, a color palette (with hex values), typography pairing, brand voice, and a concrete logo design direction (describe the logo concept, style, and mood in enough detail for an image generator).`,
        { type: "object", properties: {
          positioning: { type: "string" }, promise: { type: "string" }, tagline: { type: "string" },
          colors: { type: "string" }, typography: { type: "string" }, voice: { type: "string" },
          logo_direction: { type: "string" }
        }, required: ["positioning", "tagline", "logo_direction"] }
      );
      project = await patch({ brand: brandRes, current_step: "brand_review", logs: [...(project.logs || []), "Brand identity generated"] });

      // GATE 1 — brand approval (client dashboard)
      const approval = await base44.asServiceRole.entities.Approval.create({
        entity_type: "WebsiteFactoryProject",
        entity_id: project.id,
        requested_action: `Approve brand direction for "${website_name}" — ${brandRes.tagline || ""}`,
        risk_level: "yellow",
        status: "pending",
        notes: `Brand pack ready for review. Positioning: ${(brandRes.positioning || "").slice(0, 120)}`
      });
      project = await patch({ status: "awaiting_approval", approval_id: approval.id, logs: [...(project.logs || []), `Brand approval gate opened (${approval.id})`] });

      return Response.json({ ok: true, project_id: project.id, gate: "brand_review", approval_id: approval.id, message: "Brand generated — awaiting client approval" });
    }

    // ---- CONTINUE: after brand approval → logo → content → images → seo/aeo → final gate ----
    if (action === "continue") {
      // Verify brand approval
      if (project.approval_id) {
        const ap = await base44.asServiceRole.entities.Approval.get(project.approval_id);
        if (!ap || ap.status !== "approved") {
          return Response.json({ error: "Brand approval is not approved yet", approval_status: ap?.status }, { status: 400 });
        }
      }
      await patch({ status: "running", current_step: "logo" });
      const brand = project.brand || {};
      const website_name = project.website_name || project.business_name;

      // Step 4 — Logo generator (uses brand.logo_direction)
      const logoPrompt = `${brand.logo_direction || `A clean, modern, professional logo for ${website_name}`}. Minimal, scalable vector style, on a solid dark background, premium branding.`;
      let logo_url = "";
      try {
        const logoRes = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt: logoPrompt });
        logo_url = (logoRes.data || logoRes).url || "";
      } catch (e) { log("logo gen failed", e.message); }
      project = await patch({ logo_url, logo_prompt: logoPrompt, current_step: "content", logs: [...(project.logs || []), `Logo generated`] });

      // Step 5 — Content generator (uses brand + niche)
      const contentRes = await llm(
        `You are an elite conversion-copywriter + SEO. Write the full website content for "${website_name}", a ${project.niche || "local service"} business. Brand voice: ${brand.voice || "confident, friendly, expert"}. Brand promise: ${brand.promise || ""}. Target audience: ${project.audience || "consumers"}. Produce a hero headline + subhead, an about section, 4-6 services with descriptions, 6 FAQ Q&As optimized for search and answer engines, and a primary CTA. Content must be unique, high-quality, and conversion-focused.`,
        { type: "object", properties: {
          hero_headline: { type: "string" }, hero_subhead: { type: "string" }, about: { type: "string" },
          services: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } } } },
          faq: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } } },
          cta: { type: "string" }
        }, required: ["hero_headline", "about", "services"] }
      );
      project = await patch({ content: contentRes, current_step: "images", logs: [...(project.logs || []), "Content generated"] });

      // Step 6 — Image generator (uses brand + content)
      const images = [];
      const heroPrompt = `A cinematic, high-end hero image for ${website_name}, a ${project.niche || "service"} business. ${brand.imagery || brand.positioning || ""}. Premium, professional photography style, wide aspect, dramatic lighting. No text overlay.`;
      try {
        const r1 = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt: heroPrompt });
        images.push({ type: "hero", url: (r1.data || r1).url || "", prompt: heroPrompt });
      } catch (e) { log("hero img failed", e.message); }
      const aboutPrompt = `An authentic, warm supporting image for the About section of ${website_name}. ${project.niche || "service"} context, real-world feel, professional. No text overlay.`;
      try {
        const r2 = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt: aboutPrompt });
        images.push({ type: "about", url: (r2.data || r2).url || "", prompt: aboutPrompt });
      } catch (e) { log("about img failed", e.message); }
      project = await patch({ images, current_step: "seo_aeo", logs: [...(project.logs || []), `${images.length} images generated`] });

      // Step 7 — SEO + AEO generator (uses content + brand)
      const seoRes = await llm(
        `You are a senior technical SEO + Answer Engine Optimization (AEO) specialist. For "${website_name}" (${project.niche || "service"}), domain ${project.domain}, produce: a meta title (≤60 chars), meta description (≤155 chars), canonical URL, a JSON-LD LocalBusiness + Service schema object, AND an AEO pack: a concise answer-summary paragraph optimized for AI answer engines (Perplexity/ChatGPT/Google AI Overviews), a Q&A Page schema object, and 5 citation-optimized FAQ entries (question + a direct, self-contained answer). Base everything on this content: ${JSON.stringify(contentRes).slice(0, 2500)}.`,
        { type: "object", properties: {
          meta_title: { type: "string" }, meta_description: { type: "string" }, canonical: { type: "string" },
          json_ld: { type: "object" },
          answer_summary: { type: "string" }, qa_schema: { type: "object" },
          citation_faq: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } } }
        }, required: ["meta_title", "meta_description", "answer_summary"] }
      );
      const seo = { meta_title: seoRes.meta_title, meta_description: seoRes.meta_description, canonical: seoRes.canonical, json_ld: seoRes.json_ld };
      const aeo = { answer_summary: seoRes.answer_summary, qa_schema: seoRes.qa_schema, citation_faq: seoRes.citation_faq || [] };
      project = await patch({ seo, aeo, current_step: "final_review", logs: [...(project.logs || []), "SEO + AEO pack generated"] });

      // GATE 2 — final site approval (client dashboard)
      const approval = await base44.asServiceRole.entities.Approval.create({
        entity_type: "WebsiteFactoryProject",
        entity_id: project.id,
        requested_action: `Approve final website for "${website_name}" — ${domain_label(project)}`,
        risk_level: "yellow",
        status: "pending",
        notes: `Full site assembled: logo, content, ${images.length} images, SEO + AEO pack. Ready to publish.`
      });
      project = await patch({ status: "awaiting_approval", final_approval_id: approval.id, logs: [...(project.logs || []), `Final approval gate opened (${approval.id})`] });

      return Response.json({ ok: true, project_id: project.id, gate: "final_review", approval_id: approval.id, message: "Site assembled — awaiting client approval" });
    }

    // ---- FINALIZE: after final approval ----
    if (action === "finalize") {
      if (project.final_approval_id) {
        const ap = await base44.asServiceRole.entities.Approval.get(project.final_approval_id);
        if (!ap || ap.status !== "approved") {
          return Response.json({ error: "Final approval is not approved yet", approval_status: ap?.status }, { status: 400 });
        }
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

function domain_label(p) {
  return p.domain || p.website_name || p.business_name || "";
}