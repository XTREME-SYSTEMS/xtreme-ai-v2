import { base44 } from "@/api/base44Client";

// Centralized AI generation + receipt logging for the Growth Factory.
// Every generation step calls InvokeLLM with a detailed prompt and a JSON schema,
// persists the structured result to the right entity, and writes a Receipt.

export async function generate(prompt, schema) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    response_json_schema: schema,
    model: "gemini_3_flash",
  });
  return res;
}

export async function logReceipt({ agent_or_workflow, action, entity_type, entity_id, status = "success", inputs, outputs, warnings }) {
  try {
    await base44.entities.Receipt.create({
      agent_or_workflow, action, entity_type, entity_id,
      status,
      inputs: inputs ? JSON.stringify(inputs).slice(0, 2000) : "",
      outputs: outputs ? JSON.stringify(outputs).slice(0, 2000) : "",
      warnings: warnings || "",
    });
  } catch (e) { /* receipt failure must never break the flow */ }
}

// ---- Generation steps ----

export async function discoverBusinesses(industry, market, radius) {
  const schema = {
    type: "object",
    properties: {
      prospects: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            category: { type: "string" },
            address: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            zip: { type: "string" },
            phone: { type: "string" },
            website: { type: "string" },
            rating: { type: "number" },
            review_count: { type: "number" },
          },
        },
      },
    },
  };
  const prompt = `You are the Business Scout agent for a lead-generation factory. Discover real, plausible businesses in the "${industry}" industry located in or near ${market}, within a ${radius} mile radius. Return 8 to 12 distinct businesses with realistic names, addresses, phone formats, and websites (use realistic-looking domains; mark website "" if none). Use public-knowledge estimates for ratings and review counts. Do not fabricate personal data. Return JSON only.`;
  const res = await generate(prompt, schema);
  return res.prospects || [];
}

export async function findCompetitors(prospect) {
  const schema = { type: "object", properties: { competitors: { type: "array", items: { type: "object", properties: { name: { type: "string" }, domain: { type: "string" }, location: { type: "string" }, reason_selected: { type: "string" } } } } } };
  const prompt = `You are the Competitor Analyst for "${prospect.name}" (${prospect.category || "local service"}, ${prospect.city || ""} ${prospect.state || ""}). Identify 5-8 meaningful competitors ranking for the same local intent — include their domain, location, and why they compete. Return JSON only.`;
  const res = await generate(prompt, schema);
  return res.competitors || [];
}

export async function buildIntent(prospect) {
  const schema = { type: "object", properties: { intents: { type: "array", items: { type: "object", properties: { intent_type: { type: "string" }, query_or_question: { type: "string" }, stage: { type: "string" }, commercial_value: { type: "number" }, priority: { type: "string" } } } } } };
  const prompt = `You are the Customer Intelligence Agent for "${prospect.name}" (${prospect.category || "local service"}, ${prospect.city || ""} ${prospect.state || ""}). Map 8-12 buyer intents across transactional, cost, local, comparison, question, visual, diagnostic, eligibility. For each: intent_type, query_or_question, stage (awareness/research/decision/action), commercial_value 0-100, priority. Return JSON only.`;
  const res = await generate(prompt, schema);
  return res.intents || [];
}

export async function buildCustomer(prospect) {
  const schema = {
    type: "object",
    properties: {
      primary_customer: { type: "string" }, secondary_customer: { type: "string" },
      problems: { type: "array", items: { type: "string" } }, triggers: { type: "array", items: { type: "string" } },
      objections: { type: "array", items: { type: "string" } }, questions: { type: "array", items: { type: "string" } },
      journey: { type: "array", items: { type: "string" } }, conversion_event: { type: "string" },
    },
  };
  const prompt = `You are the Customer Intelligence Agent for "${prospect.name}" (${prospect.category || "local service"}, ${prospect.city || ""} ${prospect.state || ""}). Model the target customer: primary + secondary customer, top problems, triggers, objections, questions, journey steps, and the conversion event. Return JSON only.`;
  const res = await generate(prompt, schema);
  return res;
}

export async function auditPresence(prospect) {
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
      weaknesses: { type: "array", items: { type: "string" } },
    },
  };
  const prompt = `You are the Presence Auditor agent. Audit the online presence of "${prospect.name}", a ${prospect.category || "local"} business in ${prospect.city || ""}, ${prospect.state || ""}. Website: ${prospect.website || "none"}. Score each dimension 0-100 (website, seo, local_seo, aeo, conversion, brand, reputation, social, technical, offer, lead_capture, overall). Identify the single biggest opportunity_gap and 3-6 concrete weaknesses (e.g. no estimator, thin content, weak mobile UX, missing structured data). Be realistic and constructive. Return JSON only.`;
  const res = await generate(prompt, schema);
  return res;
}

export async function findSearchOpportunities(prospect) {
  const schema = {
    type: "object",
    properties: {
      opportunities: {
        type: "array",
        items: {
          type: "object",
          properties: {
            query: { type: "string" },
            cluster: { type: "string" },
            intent: { type: "string" },
            demand_score: { type: "number" },
            commercial_score: { type: "number" },
            serp_weakness_score: { type: "number" },
            local_fit: { type: "number" },
            tool_opportunity: { type: "string" },
            overall_score: { type: "number" },
            evidence: { type: "string" },
          },
        },
      },
    },
  };
  const prompt = `You are the Search Opportunity Hunter (Page One Hunter) agent for "${prospect.name}" in ${prospect.city || ""}, ${prospect.state || ""} (${prospect.category || "local service"}). Identify 8-12 organic search opportunities where a generated website with an interactive tool could outperform current weak SERPs. Include transactional, cost, local, comparison, question, and visual intents. Score each 0-100. For each, name the recommended interactive tool (estimator, calculator, visualizer, comparison, quiz). Do NOT guarantee rankings. Return JSON only.`;
  const res = await generate(prompt, schema);
  return res.opportunities || [];
}

export async function generateDomains(prospect) {
  const schema = {
    type: "object",
    properties: {
      domains: {
        type: "array",
        items: {
          type: "object",
          properties: {
            domain: { type: "string" },
            pattern: { type: "string" },
            clarity: { type: "number" }, memorability: { type: "number" },
            intent_relevance: { type: "number" }, scalability: { type: "number" },
            collision_risk: { type: "string" }, score: { type: "number" },
          },
        },
      },
    },
  };
  const prompt = `You are the Domain Strategist agent for "${prospect.name}" in ${prospect.city || ""}, ${prospect.state || ""} (${prospect.category || "local service"}). Generate 10-14 candidate .com domain names using customer language, the industry, the city, cost/estimate/tool intent, and brandable patterns. Score clarity, memorability, intent_relevance, scalability 0-100 and overall score. Mark collision_risk low/medium/high. Do NOT purchase. Availability is UNKNOWN unless obviously registered. Return JSON only.`;
  const res = await generate(prompt, schema);
  return res.domains || [];
}

export async function throwTheBook(prospect) {
  const schema = {
    type: "object",
    properties: {
      tactics: {
        type: "array",
        items: {
          type: "object",
          properties: {
            family: { type: "string" }, name: { type: "string" },
            intent_score: { type: "number" }, economic_score: { type: "number" },
            business_fit: { type: "number" }, cost_score: { type: "number" },
            speed_score: { type: "number" }, feasibility_score: { type: "number" },
            story_score: { type: "number" }, risk_penalty: { type: "number" },
            total: { type: "number" }, rationale: { type: "string" },
            recommended_generator: { type: "string" },
          },
        },
      },
    },
  };
  const prompt = `You are the Throw The Book Agent. Load the COMPLETE marketing tactic library (old-school advertising, direct response, direct mail, local marketing, referrals, SEO, local SEO, AEO/GEO, content, PR, guerrilla, partnerships, events, video, social, paid media, email, SMS, phone, AI, automation, interactive websites, calculators, estimators, visualizers, sales enablement, promotions, offline, community, brand stunts, unconventional). For "${prospect.name}" (${prospect.category || "local service"}, ${prospect.city || ""} ${prospect.state || ""}), score the 12-16 MOST applicable tactics 0-100 across intent, economic, business_fit, cost, speed, feasibility, story, minus risk_penalty, into a total. Give a one-line rationale and recommended generator for each. Return JSON only.`;
  const res = await generate(prompt, schema);
  return res.tactics || [];
}

export async function inventConcepts(prospect) {
  const schema = {
    type: "object",
    properties: {
      concepts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" }, customer_problem: { type: "string" },
            intent: { type: "string" }, tool_type: { type: "string" },
            value_before_gate: { type: "string" }, lead_event: { type: "string" },
            seo_opportunity: { type: "string" }, aeo_opportunity: { type: "string" },
            build_complexity: { type: "string" }, score: { type: "number" },
          },
        },
      },
    },
  };
  const prompt = `You are the Concept Inventor agent for "${prospect.name}" (${prospect.category || "local service"}, ${prospect.city || ""} ${prospect.state || ""}). Invent 3-5 lead-generation microsite/tool concepts (e.g. instant quote estimator, visualizer, eligibility quiz, ROI calculator, comparison tool). Each must deliver value before gating, capture a lead event, and target a real SEO/AEO opportunity. Score 0-100. Return JSON only.`;
  const res = await generate(prompt, schema);
  return res.concepts || [];
}

function optionSchema(extra) {
  return {
    type: "object",
    properties: {
      options: {
        type: "array",
        items: {
          type: "object",
          properties: Object.assign({
            title: { type: "string" }, summary: { type: "string" },
            details: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "string" } } } },
            score: { type: "number" },
          }, extra),
        },
      },
    },
  };
}

export async function generateBrandPacks(prospect) {
  const extra = {
    positioning: { type: "string" }, promise: { type: "string" }, tagline: { type: "string" },
    logo_direction: { type: "string" }, colors: { type: "string" }, typography: { type: "string" },
    voice: { type: "string" }, hero: { type: "string" },
  };
  const prompt = `You are the Brand Strategist agent for "${prospect.name}" (${prospect.category || "local service"}, ${prospect.city || ""} ${prospect.state || ""}). Produce EXACTLY THREE distinct brand packs. Each: title, summary, positioning, promise, tagline, logo_direction, colors (hex palette), typography, voice, hero concept, and details array. Score each 0-100. Make them genuinely different directions. Return JSON only.`;
  const res = await generate(prompt, optionSchema(extra));
  return res.options || [];
}

export async function generateWebsitePacks(prospect) {
  const extra = {
    homepage_concept: { type: "string" }, primary_tool: { type: "string" },
    cta: { type: "string" }, pages: { type: "string" }, seo_architecture: { type: "string" },
    aeo_architecture: { type: "string" }, local_strategy: { type: "string" },
    visual_direction: { type: "string" }, lead_journey: { type: "string" },
  };
  const prompt = `You are the Website Strategist agent for "${prospect.name}" (${prospect.category || "local service"}, ${prospect.city || ""} ${prospect.state || ""}). Produce EXACTLY THREE distinct website/content systems. Each: title, summary, homepage_concept, primary interactive tool, cta, pages, seo_architecture, aeo_architecture, local_strategy, visual_direction, lead_journey, details array, score 0-100. Make them genuinely different. Return JSON only.`;
  const res = await generate(prompt, optionSchema(extra));
  return res.options || [];
}

export async function generateMarketingPacks(prospect) {
  const extra = {
    channels: { type: "string" }, tactics: { type: "string" }, cost_level: { type: "string" },
    speed: { type: "string" }, risk: { type: "string" }, measurement: { type: "string" }, kpis: { type: "string" },
  };
  const prompt = `You are the Marketing Strategist agent for "${prospect.name}" (${prospect.category || "local service"}, ${prospect.city || ""} ${prospect.state || ""}). Produce EXACTLY THREE distinct marketing workflows. Each: title, summary, channels, tactics, cost_level, speed, risk, measurement, kpis, details array, score 0-100. Span organic-first, paid-accelerated, and unconventional/community directions. Return JSON only.`;
  const res = await generate(prompt, optionSchema(extra));
  return res.options || [];
}

export async function buildPreview(build) {
  const schema = {
    type: "object",
    properties: {
      html: { type: "string" },
      seo_notes: { type: "string" },
      aeo_notes: { type: "string" },
    },
  };
  const prompt = `You are the Preview Website Factory. Generate a single self-contained, mobile-first, conversion-focused private preview homepage as one HTML string (inline CSS, no external scripts) for the approved build. Include hero, primary interactive lead tool placeholder, trust signals, FAQ, and a clear CTA. Keep it premium and industry-appropriate, not generic. Return JSON with html, seo_notes, aeo_notes.`;
  const res = await generate(prompt, schema);
  return res;
}

export async function runValidation(build) {
  const schema = {
    type: "object",
    properties: {
      visual_score: { type: "number" }, mobile_score: { type: "number" },
      conversion_score: { type: "number" }, lead_tool_score: { type: "number" },
      seo_score: { type: "number" }, aeo_score: { type: "number" },
      trust_score: { type: "number" }, performance_score: { type: "number" },
      accessibility_score: { type: "number" }, brand_score: { type: "number" },
      total_score: { type: "number" }, pass: { type: "boolean" },
      failures: { type: "array", items: { type: "string" } },
    },
  };
  const prompt = `You are the QA Sentinel. Score this preview build 0-100 across visual, mobile, conversion, lead_tool, seo, aeo, trust, performance, accessibility, brand. total_score is the average. pass=true only if total_score >= 80 and no score below 60. List specific failures. Return JSON only.`;
  const res = await generate(prompt, schema);
  return res;
}

export async function generateProposal(build) {
  const schema = {
    type: "object",
    properties: {
      audit_summary: { type: "string" },
      opportunity_summary: { type: "string" },
      offer_options: { type: "array", items: { type: "string" } },
    },
  };
  const prompt = `You are the Proposal Agent. Write a constructive prospect audit/proposal package for this build. audit_summary (current presence gaps), opportunity_summary (search + lead opportunities), and 3 offer_options (tiered engagement offers). Be honest and specific. Return JSON only.`;
  const res = await generate(prompt, schema);
  return res;
}

export const STATUS_COLORS = {
  discovered: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  enriched: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  audited: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  qualified: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  in_build: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  proposed: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  won: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  archived: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rejected: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  draft: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  queued: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  running: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  complete: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  failed: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  built: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  composed: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  validated: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  repairing: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  deployed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  open: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  escalated: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  mocked: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  connected: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  unavailable: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

export function scoreColor(s) {
  if (s == null) return "text-slate-500";
  if (s >= 80) return "text-emerald-400";
  if (s >= 60) return "text-amber-400";
  return "text-rose-400";
}