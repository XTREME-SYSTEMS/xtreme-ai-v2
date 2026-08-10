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
  await base44.asServiceRole.entities.GenerationJob.create({
    build_id: build_id || "auto",
    generator_id,
    job_type,
    idempotency_key: `${job_type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: "queued",
    input_ref: JSON.stringify(input),
  });
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
  await receipt(base44, "invent_concepts", "LeadGenConcept", "", "success", { prospect_id }, { count });
  return { concepts: count };
}

export async function dispatch(job, base44) {
  switch (job.job_type) {
    case "discover": return await runDiscover(job, base44);
    case "audit": return await runAudit(job, base44);
    case "opportunity": return await runOpportunity(job, base44);
    case "concept": return await runConcept(job, base44);
    default: throw new Error(`Unknown job_type: ${job.job_type}`);
  }
}