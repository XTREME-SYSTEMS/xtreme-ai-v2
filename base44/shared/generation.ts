// Shared server-side generation engine for the Lead Gen Near You Growth Factory.
// Invoked by the heartbeat dispatcher. Each runner: InvokeLLM -> persist -> enqueue next phase -> write receipt.
// Production locks enforced: never enqueues domain purchase, DNS, deploy, paid media, messaging, or payments.

function parseInput(job) {
  try { return JSON.parse(job.input_ref || "{}"); } catch { return {}; }
}

async function llm(base44, prompt, schema) {
  return await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    response_json_schema: schema,
    model: "gemini_3_flash",
  });
}

async function enqueue(base44, job_type, build_id, generator_id, input) {
  const sr = base44.asServiceRole;
  // Deterministic key: same job_type + build_id + generator_id + input signature
  // → same key. Prevents duplicate jobs when a runner retries or re-enqueues.
  const inputSig = JSON.stringify(input || {}).slice(0, 200);
  const idempotency_key = `${job_type}:${build_id || "auto"}:${generator_id || ""}:${inputSig}`;
  // Skip if an active job with this key already exists (queued or running).
  const existing = await sr.entities.GenerationJob.filter(
    { idempotency_key }, "-created_date", 5
  ).catch(() => []);
  const active = (existing || []).find(j => j.status === "queued" || j.status === "running");
  if (active) return active.id;
  const job = await sr.entities.GenerationJob.create({
    build_id: build_id || "auto",
    generator_id,
    job_type,
    idempotency_key,
    status: "queued",
    input_ref: JSON.stringify(input),
  });
  return job.id;
}

async function receipt(base44, action, entity_type, entity_id, status, inputs, outputs) {
  try {
    await base44.asServiceRole.entities.Receipt.create({
      agent_or_workflow: "growth_engine",
      action, entity_type, entity_id, status,
      inputs: JSON.stringify(inputs).slice(0, 2000),
      outputs: JSON.stringify(outputs).slice(0, 2000),
    });
  } catch { /* receipt failure must never break the flow */ }
}

async function runDiscover(job, base44) {
  const sr = base44.asServiceRole;
  const { industry, market, radius } = parseInput(job);
  const schema = {
    type: "object",
    properties: {
      prospects: { type: "array", items: { type: "object", properties: {
        name: { type: "string" }, category: { type: "string" }, address: { type: "string" },
        city: { type: "string" }, state: { type: "string" }, zip: { type: "string" },
        phone: { type: "string" }, website: { type: "string" },
        rating: { type: "number" }, review_count: { type: "number" },
      } } },
    },
  };
  const prompt = `You are the Business Scout agent for a lead-generation factory. Discover real, plausible businesses in the "${industry}" industry located in or near ${market}, within a ${radius || 25} mile radius. Return 8 to 12 distinct businesses with realistic names, addresses, phone formats, and websites (use realistic-looking domains; empty string if none). Use public-knowledge estimates for ratings and review counts. Do not fabricate personal data. Return JSON only.`;
  const res = await llm(base44, prompt, schema);
  const prospects = res.prospects || [];
  const ids = [];
  for (const p of prospects) {
    const rec = await sr.entities.BusinessProspect.create({
      name: p.name, category: p.category, address: p.address, city: p.city,
      state: p.state, zip: p.zip, phone: p.phone, website: p.website,
      rating: p.rating, review_count: p.review_count, status: "discovered",
    });
    ids.push(rec.id);
    await enqueue(base44, "audit", "auto", "presence_auditor", { prospect_id: rec.id });
  }
  await receipt(base44, "discover_businesses", "BusinessProspect", "", "success", { industry, market, radius }, { count: ids.length });
  return { discovered: ids.length };
}

async function runAudit(job, base44) {
  const sr = base44.asServiceRole;
  const { prospect_id } = parseInput(job);
  const prospect = await sr.entities.BusinessProspect.get(prospect_id);
  const schema = {
    type: "object",
    properties: {
      website_score: { type: "number" }, seo_score: { type: "number" },
      local_seo_score: { type: "number" }, aeo_score: { type: "number" },
      conversion_score: { type: "number" }, brand_score: { type: "number" },
      reputation_score: { type: "number" }, social_score: { type: "number" },
      technical_score: { type: "number" }, offer_score: { type: "number" },
      lead_capture_score: { type: "number" }, overall_score: { type: "number" },
      opportunity_gap: { type: "string" },
    },
  };
  const prompt = `You are the Presence Auditor agent. Audit the online presence of "${prospect.name}", a ${prospect.category || "local"} business in ${prospect.city || ""}, ${prospect.state || ""}. Website: ${prospect.website || "none"}. Score each dimension 0-100 (website, seo, local_seo, aeo, conversion, brand, reputation, social, technical, offer, lead_capture, overall). Identify the single biggest opportunity_gap. Be realistic and constructive. Return JSON only.`;
  const res = await llm(base44, prompt, schema);
  const audit = await sr.entities.PresenceAudit.create({
    business_id: prospect_id, status: "complete",
    website_score: res.website_score, seo_score: res.seo_score,
    local_seo_score: res.local_seo_score, aeo_score: res.aeo_score,
    conversion_score: res.conversion_score, brand_score: res.brand_score,
    reputation_score: res.reputation_score, social_score: res.social_score,
    technical_score: res.technical_score, offer_score: res.offer_score,
    lead_capture_score: res.lead_capture_score, overall_score: res.overall_score,
    opportunity_gap: res.opportunity_gap,
  });
  await sr.entities.BusinessProspect.update(prospect_id, { status: "audited" });
  await enqueue(base44, "opportunity", "auto", "opportunity_hunter", { prospect_id });
  await receipt(base44, "audit_presence", "PresenceAudit", audit.id, "success", { prospect_id }, { overall: res.overall_score });
  return { audit_id: audit.id, overall: res.overall_score };
}

async function runOpportunity(job, base44) {
  const sr = base44.asServiceRole;
  const { prospect_id } = parseInput(job);
  const prospect = await sr.entities.BusinessProspect.get(prospect_id);
  const schema = {
    type: "object",
    properties: {
      opportunities: { type: "array", items: { type: "object", properties: {
        query: { type: "string" }, cluster: { type: "string" }, intent: { type: "string" },
        demand_score: { type: "number" }, commercial_score: { type: "number" },
        serp_weakness_score: { type: "number" }, local_fit: { type: "number" },
        tool_opportunity: { type: "string" }, overall_score: { type: "number" }, evidence: { type: "string" },
      } } },
    },
  };
  const prompt = `You are the Search Opportunity Hunter (Page One Hunter) agent for "${prospect.name}" in ${prospect.city || ""}, ${prospect.state || ""} (${prospect.category || "local service"}). Identify 8-12 organic search opportunities where a generated website with an interactive tool could outperform current weak SERPs. Include transactional, cost, local, comparison, question, and visual intents. Score each 0-100. For each, name the recommended interactive tool. Do NOT guarantee rankings. Return JSON only.`;
  const res = await llm(base44, prompt, schema);
  const ops = res.opportunities || [];
  let count = 0;
  for (const o of ops) {
    await sr.entities.SearchOpportunity.create({
      business_id: prospect_id, query: o.query, cluster: o.cluster, intent: o.intent,
      demand_score: o.demand_score, commercial_score: o.commercial_score,
      serp_weakness_score: o.serp_weakness_score, local_fit: o.local_fit,
      tool_opportunity: o.tool_opportunity, overall_score: o.overall_score,
      evidence: o.evidence, status: "open",
    });
    count++;
  }
  await sr.entities.BusinessProspect.update(prospect_id, { status: "qualified" });
  await enqueue(base44, "concept", "auto", "concept_inventor", { prospect_id });
  await receipt(base44, "find_opportunities", "SearchOpportunity", "", "success", { prospect_id }, { count });
  return { opportunities: count };
}

async function runConcept(job, base44) {
  const sr = base44.asServiceRole;
  const { prospect_id } = parseInput(job);
  const prospect = await sr.entities.BusinessProspect.get(prospect_id);
  const schema = {
    type: "object",
    properties: {
      concepts: { type: "array", items: { type: "object", properties: {
        name: { type: "string" }, customer_problem: { type: "string" }, intent: { type: "string" },
        tool_type: { type: "string" }, value_before_gate: { type: "string" }, lead_event: { type: "string" },
        seo_opportunity: { type: "string" }, aeo_opportunity: { type: "string" },
        build_complexity: { type: "string" }, score: { type: "number" },
      } } },
    },
  };
  const prompt = `You are the Concept Inventor agent for "${prospect.name}" (${prospect.category || "local service"}, ${prospect.city || ""} ${prospect.state || ""}). Invent 3-5 lead-generation microsite/tool concepts (e.g. instant quote estimator, visualizer, eligibility quiz, ROI calculator, comparison tool). Each must deliver value before gating, capture a lead event, and target a real SEO/AEO opportunity. Score 0-100. Return JSON only.`;
  const res = await llm(base44, prompt, schema);
  const concepts = res.concepts || [];
  let count = 0;
  for (const c of concepts) {
    await sr.entities.LeadGenConcept.create({
      business_id: prospect_id, name: c.name, customer_problem: c.customer_problem,
      intent: c.intent, tool_type: c.tool_type, value_before_gate: c.value_before_gate,
      lead_event: c.lead_event, seo_opportunity: c.seo_opportunity, aeo_opportunity: c.aeo_opportunity,
      build_complexity: c.build_complexity || "medium", score: c.score, status: "draft",
    });
    count++;
  }
  await enqueue(base44, "brand", "auto", "brand_strategist", { prospect_id });
  await receipt(base44, "invent_concepts", "LeadGenConcept", "", "success", { prospect_id }, { count });
  return { concepts: count };
}

async function runBrand(job, base44) {
  const sr = base44.asServiceRole;
  const { prospect_id } = parseInput(job);
  const prospect = await sr.entities.BusinessProspect.get(prospect_id);
  const schema = {
    type: "object",
    properties: {
      options: { type: "array", items: { type: "object", properties: {
        positioning: { type: "string" }, promise: { type: "string" }, tagline: { type: "string" },
        logo_direction: { type: "string" }, colors: { type: "string" }, typography: { type: "string" },
        imagery: { type: "string" }, voice: { type: "string" }, hero: { type: "string" }, score: { type: "number" },
      } } },
    },
  };
  const prompt = `You are the Brand Strategist agent for "${prospect.name}" (${prospect.category || "local service"}, ${prospect.city || ""} ${prospect.state || ""}). Produce EXACTLY THREE distinct brand packs. Each: positioning, promise, tagline, logo_direction, colors (hex palette), typography, imagery, voice, hero concept, score 0-100. Make them genuinely different directions. Return JSON only.`;
  const res = await llm(base44, prompt, schema);
  const options = (res.options || []).slice(0, 3);
  let top = null;
  for (let i = 0; i < options.length; i++) {
    const o = options[i];
    const rec = await sr.entities.BrandPack.create({
      business_id: prospect_id, option_number: i + 1,
      positioning: o.positioning, promise: o.promise, tagline: o.tagline,
      logo_direction: o.logo_direction, colors: o.colors, typography: o.typography,
      imagery: o.imagery, voice: o.voice, hero: o.hero, score: o.score, status: "draft",
    });
    if (!top || (o.score || 0) > (top.score || 0)) top = { id: rec.id, option_number: i + 1, score: o.score || 0 };
  }
  if (top) await sr.entities.BrandPack.update(top.id, { status: "approved" });
  await enqueue(base44, "website", "auto", "website_strategist", { prospect_id, brand_option: top ? top.option_number : 1 });
  await receipt(base44, "generate_brand_packs", "BrandPack", "", "success", { prospect_id }, { count: options.length, approved: top ? top.option_number : null });
  return { brand_packs: options.length, approved: top ? top.option_number : null };
}

async function runWebsite(job, base44) {
  const sr = base44.asServiceRole;
  const { prospect_id } = parseInput(job);
  const prospect = await sr.entities.BusinessProspect.get(prospect_id);
  const schema = {
    type: "object",
    properties: {
      options: { type: "array", items: { type: "object", properties: {
        homepage_concept: { type: "string" }, primary_tool: { type: "string" }, cta: { type: "string" },
        pages: { type: "array", items: { type: "string" } }, seo_architecture: { type: "string" },
        aeo_architecture: { type: "string" }, local_strategy: { type: "string" },
        visual_direction: { type: "string" }, lead_journey: { type: "string" }, score: { type: "number" },
      } } },
    },
  };
  const prompt = `You are the Website Strategist agent for "${prospect.name}" (${prospect.category || "local service"}, ${prospect.city || ""} ${prospect.state || ""}). Produce EXACTLY THREE distinct website/content systems. Each: homepage_concept, primary interactive tool, cta, pages (array), seo_architecture, aeo_architecture, local_strategy, visual_direction, lead_journey, score 0-100. Make them genuinely different. Return JSON only.`;
  const res = await llm(base44, prompt, schema);
  const options = (res.options || []).slice(0, 3);
  let top = null;
  for (let i = 0; i < options.length; i++) {
    const o = options[i];
    const rec = await sr.entities.WebsitePack.create({
      business_id: prospect_id, option_number: i + 1,
      homepage_concept: o.homepage_concept, primary_tool: o.primary_tool, cta: o.cta,
      pages: o.pages || [], seo_architecture: o.seo_architecture, aeo_architecture: o.aeo_architecture,
      local_strategy: o.local_strategy, visual_direction: o.visual_direction, lead_journey: o.lead_journey,
      score: o.score, status: "draft",
    });
    if (!top || (o.score || 0) > (top.score || 0)) top = { id: rec.id, option_number: i + 1, score: o.score || 0 };
  }
  if (top) await sr.entities.WebsitePack.update(top.id, { status: "approved" });
  await enqueue(base44, "marketing", "auto", "marketing_strategist", { prospect_id, brand_option: parseInput(job).brand_option, website_option: top ? top.option_number : 1 });
  await receipt(base44, "generate_website_packs", "WebsitePack", "", "success", { prospect_id }, { count: options.length, approved: top ? top.option_number : null });
  return { website_packs: options.length, approved: top ? top.option_number : null };
}

async function runMarketing(job, base44) {
  const sr = base44.asServiceRole;
  const { prospect_id, brand_option, website_option } = parseInput(job);
  const prospect = await sr.entities.BusinessProspect.get(prospect_id);
  const schema = {
    type: "object",
    properties: {
      options: { type: "array", items: { type: "object", properties: {
        channels: { type: "array", items: { type: "string" } }, tactics: { type: "array", items: { type: "string" } },
        cost_level: { type: "string" }, speed: { type: "string" }, risk: { type: "string" },
        assets: { type: "array", items: { type: "string" } }, measurement: { type: "string" },
        kpis: { type: "array", items: { type: "string" } }, score: { type: "number" },
      } } },
    },
  };
  const prompt = `You are the Marketing Strategist agent for "${prospect.name}" (${prospect.category || "local service"}, ${prospect.city || ""} ${prospect.state || ""}). Produce EXACTLY THREE distinct marketing workflows. Each: channels (array), tactics (array), cost_level, speed, risk, assets (array), measurement, kpis (array), score 0-100. Span organic-first, paid-accelerated, and unconventional/community directions. Return JSON only.`;
  const res = await llm(base44, prompt, schema);
  const options = (res.options || []).slice(0, 3);
  let top = null;
  for (let i = 0; i < options.length; i++) {
    const o = options[i];
    const rec = await sr.entities.MarketingPack.create({
      business_id: prospect_id, option_number: i + 1,
      channels: o.channels || [], tactics: o.tactics || [], cost_level: o.cost_level || "low",
      speed: o.speed || "weeks", risk: o.risk || "low", assets: o.assets || [],
      measurement: o.measurement, kpis: o.kpis || [], score: o.score, status: "draft",
    });
    if (!top || (o.score || 0) > (top.score || 0)) top = { id: rec.id, option_number: i + 1, score: o.score || 0 };
  }
  if (top) await sr.entities.MarketingPack.update(top.id, { status: "approved" });
  await enqueue(base44, "build", "auto", "preview_factory", {
    prospect_id, brand_option: brand_option || 1, website_option: website_option || 1, marketing_option: top ? top.option_number : 1,
  });
  await receipt(base44, "generate_marketing_packs", "MarketingPack", "", "success", { prospect_id }, { count: options.length, approved: top ? top.option_number : null });
  return { marketing_packs: options.length, approved: top ? top.option_number : null };
}

async function runBuild(job, base44) {
  const sr = base44.asServiceRole;
  const { prospect_id, brand_option, website_option, marketing_option } = parseInput(job);
  const prospect = await sr.entities.BusinessProspect.get(prospect_id);
  const concepts = await sr.entities.LeadGenConcept.filter({ business_id: prospect_id }, "-score", 1);
  const concept = concepts[0];
  const build = await sr.entities.BuildProject.create({
    business_id: prospect_id, business_name: prospect.name,
    approved_brand_pack: brand_option, approved_website_pack: website_option,
    approved_marketing_pack: marketing_option, approved_concept: concept ? concept.name : "",
    generator_chain: ["business_scout", "presence_auditor", "opportunity_hunter", "concept_inventor", "brand_strategist", "website_strategist", "marketing_strategist", "preview_factory"],
    status: "building",
  });
  const schema = { type: "object", properties: { html: { type: "string" }, seo_notes: { type: "string" }, aeo_notes: { type: "string" } } };
  const prompt = `You are the Preview Website Factory. Generate a single self-contained, mobile-first, conversion-focused private preview homepage as one HTML string (inline CSS, no external scripts) for "${prospect.name}" (${prospect.category || "local service"}, ${prospect.city || ""} ${prospect.state || ""}). Concept: ${concept ? concept.name + " — " + (concept.customer_problem || "") : "n/a"}. Include hero, primary interactive lead tool placeholder, trust signals, FAQ, and a clear CTA. Keep it premium and industry-appropriate, not generic. Return JSON with html, seo_notes, aeo_notes.`;
  const res = await llm(base44, prompt, schema);
  const html = res.html || "";
  const previewUrl = "data:text/html;charset=utf-8," + encodeURIComponent(html).slice(0, 60000);
  await sr.entities.BuildProject.update(build.id, { preview_url: previewUrl, status: "built" });
  await enqueue(base44, "qa", "auto", "qa_sentinel", { prospect_id, build_id: build.id });
  await receipt(base44, "build_preview", "BuildProject", build.id, "success", { prospect_id }, { build_id: build.id });
  return { build_id: build.id };
}

async function runQA(job, base44) {
  const sr = base44.asServiceRole;
  const { prospect_id, build_id } = parseInput(job);
  const schema = {
    type: "object",
    properties: {
      visual_score: { type: "number" }, mobile_score: { type: "number" }, conversion_score: { type: "number" },
      lead_tool_score: { type: "number" }, seo_score: { type: "number" }, aeo_score: { type: "number" },
      trust_score: { type: "number" }, performance_score: { type: "number" }, accessibility_score: { type: "number" },
      brand_score: { type: "number" }, total_score: { type: "number" }, pass: { type: "boolean" },
      failures: { type: "array", items: { type: "string" } },
    },
  };
  const prompt = `You are the QA Sentinel. Score this preview build 0-100 across visual, mobile, conversion, lead_tool, seo, aeo, trust, performance, accessibility, brand. total_score is the average. pass=true only if total_score >= 80 and no score below 60. List specific failures. Return JSON only.`;
  const res = await llm(base44, prompt, schema);
  const validation = await sr.entities.ValidationRun.create({
    build_id, visual_score: res.visual_score, mobile_score: res.mobile_score,
    conversion_score: res.conversion_score, lead_tool_score: res.lead_tool_score,
    seo_score: res.seo_score, aeo_score: res.aeo_score, trust_score: res.trust_score,
    performance_score: res.performance_score, accessibility_score: res.accessibility_score,
    brand_score: res.brand_score, total_score: res.total_score, pass: res.pass === true, failures: res.failures || [],
  });
  const passed = res.pass === true;
  await sr.entities.BuildProject.update(build_id, { status: passed ? "validated" : "repairing" });
  if (!passed) {
    await sr.entities.RepairJob.create({
      validation_id: validation.id, build_id, failure_type: "qa_below_threshold",
      target_layer: "preview", status: "open", notes: (res.failures || []).join("; ").slice(0, 500),
    });
  }
  await enqueue(base44, "proposal", "auto", "proposal_agent", { prospect_id, build_id });
  await receipt(base44, "run_validation", "ValidationRun", validation.id, "success", { build_id }, { pass: passed, total: res.total_score });
  return { validation_id: validation.id, pass: passed, total: res.total_score };
}

async function runProposal(job, base44) {
  const sr = base44.asServiceRole;
  const { prospect_id, build_id } = parseInput(job);
  const prospect = await sr.entities.BusinessProspect.get(prospect_id);
  const schema = {
    type: "object",
    properties: {
      audit_summary: { type: "string" }, opportunity_summary: { type: "string" },
      offer_options: { type: "array", items: { type: "string" } },
    },
  };
  const prompt = `You are the Proposal Agent. Write a constructive prospect audit/proposal package for "${prospect.name}" (${prospect.category || "local service"}, ${prospect.city || ""} ${prospect.state || ""}). audit_summary (current presence gaps), opportunity_summary (search + lead opportunities), and 3 offer_options (tiered engagement offers). Be honest and specific. Return JSON only.`;
  const res = await llm(base44, prompt, schema);
  const proposal = await sr.entities.ProposalPackage.create({
    business_id: prospect_id, build_id, audit_summary: res.audit_summary,
    opportunity_summary: res.opportunity_summary, offer_options: res.offer_options || [], status: "draft",
  });
  await sr.entities.BusinessProspect.update(prospect_id, { status: "proposed" });
  await receipt(base44, "generate_proposal", "ProposalPackage", proposal.id, "success", { prospect_id, build_id }, { proposal_id: proposal.id });
  // STOP — await operator approval before any external action (send, deploy, domain purchase, paid media). Governance: RED tier.
  return { proposal_id: proposal.id };
}

export async function dispatch(job, base44) {
  switch (job.job_type) {
    case "discover": return await runDiscover(job, base44);
    case "audit": return await runAudit(job, base44);
    case "opportunity": return await runOpportunity(job, base44);
    case "concept": return await runConcept(job, base44);
    case "brand": return await runBrand(job, base44);
    case "website": return await runWebsite(job, base44);
    case "marketing": return await runMarketing(job, base44);
    case "build": return await runBuild(job, base44);
    case "qa": return await runQA(job, base44);
    case "proposal": return await runProposal(job, base44);
    default: throw new Error(`Unknown job_type: ${job.job_type}`);
  }
}