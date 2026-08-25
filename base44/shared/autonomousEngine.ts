// Shared logic for the Autonomous Implementation Engine.
// Imported by autonomousCodeSystem, validatePhase, sentinelReflect,
// forensicAuditAndHarden, and computeSystemScore.

export function slugify(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// The master implementation plan — phases derived from the Faultline forensic audit.
// Each phase maps a high-value Faultline module into the Lead Gen Near You factory.
export const IMPLEMENTATION_PHASES = [
  {
    title: "Forensic Audit & System Health",
    module: "Forensic Audit",
    objective: "Deploy a deep audit pipeline that scores every deployed market site, logs findings with evidence, and generates repair plans.",
    deliverables: [
      "Audit, Finding, Evidence, RepairPlan, RepairTask, SystemHealthScore entities",
      "forensicAuditAndHarden backend function",
      "Audit dashboard with score breakdown and finding list",
      "Auto-heal workflow triggered on low scores"
    ],
    entities_required: ["Audit", "Finding", "Evidence", "RepairPlan", "RepairTask", "SystemHealthScore"],
    functions_required: ["forensicAuditAndHarden", "computeSystemScore"],
    pages_required: ["AuditBoard"]
  },
  {
    title: "Launch Pipeline Hardening",
    module: "Launch Pipeline",
    objective: "Upgrade provisionMarket into a multi-step pipeline: provision → validate → retry → finalize → assign domain, with a LaunchProject tracker.",
    deliverables: [
      "LaunchProject entity with full lifecycle status",
      "launchPipelineValidate / Retry / Finalize functions",
      "assignVercelDomain function",
      "Pipeline status board"
    ],
    entities_required: ["LaunchProject"],
    functions_required: ["launchPipelineValidate", "launchPipelineFinalize", "assignVercelDomain"],
    pages_required: ["LaunchPipelineBoard"]
  },
  {
    title: "Clone Engine",
    module: "Clone Engine",
    objective: "Clone competitor/benchmark sites for parity so generated sites beat top performers instead of starting from scratch.",
    deliverables: [
      "CloneQueue entity",
      "deepCloneTarget / deterministicClone functions",
      "Clone studio + gallery pages",
      "Heal-to-100 auto-repair loop"
    ],
    entities_required: ["CloneQueue"],
    functions_required: ["deepCloneTarget", "deterministicClone", "healAllClonesTo100"],
    pages_required: ["CloneStudio", "CloneGallery"]
  },
  {
    title: "Discovery Engine",
    module: "Discovery Engine",
    objective: "Find top performers, clone candidates, and industry opportunities per niche to feed the site factory.",
    deliverables: [
      "IndustryOpportunity, TopPerformer entities",
      "discoverCloneCandidates / discoverTopPerformers functions",
      "Discovery dashboard"
    ],
    entities_required: ["IndustryOpportunity", "TopPerformer"],
    functions_required: ["discoverCloneCandidates", "discoverTopPerformers", "searchTopWebsitesByIndustry"],
    pages_required: ["DiscoveryEngine"]
  },
  {
    title: "Tool Advisor & RAG Library",
    module: "Tool Advisor",
    objective: "Recommend tool stacks per industry and maintain a RAG prompt library for generation quality.",
    deliverables: [
      "ToolRecommendation, AiTool, PromptTemplate entities",
      "recommendToolStack function",
      "Prompt library management UI"
    ],
    entities_required: ["ToolRecommendation", "AiTool", "PromptTemplate"],
    functions_required: ["recommendToolStack"],
    pages_required: ["ToolAdvisor", "PromptLibrary"]
  },
  {
    title: "Monitoring & Re-scan Loop",
    module: "Monitoring",
    objective: "Continuously monitor deployed sites, re-scan on a schedule, and alert on regressions.",
    deliverables: [
      "MonitoringEvent entity",
      "monitoringOrchestrator / rescanMonitor functions",
      "Monitoring dashboard + alert workflow"
    ],
    entities_required: ["MonitoringEvent"],
    functions_required: ["monitoringOrchestrator", "rescanMonitor"],
    pages_required: ["MonitoringBoard"]
  },
  {
    title: "Client Success & Churn Scoring",
    module: "Client Success",
    objective: "Score client health, predict churn risk, and surface recommendations to account managers.",
    deliverables: [
      "ClientSuccessScore entity",
      "computeClientSuccess function",
      "Client health dashboard"
    ],
    entities_required: ["ClientSuccessScore"],
    functions_required: ["computeClientSuccess"],
    pages_required: ["ClientSuccessBoard"]
  },
  {
    title: "Automation Blueprints",
    module: "Automation Blueprints",
    objective: "Generate industry-specific automation blueprints with ROI estimates and implementation steps.",
    deliverables: [
      "AutomationBlueprint entity",
      "generateAutomationEnhancements function",
      "Blueprint library page"
    ],
    entities_required: ["AutomationBlueprint"],
    functions_required: ["generateAutomationEnhancements"],
    pages_required: ["BlueprintLibrary"]
  }
];

// The AI-Enhanced Marketing roadmap — 7 initiatives to turn the factory into a
// top-tier AI marketing platform. Seeded as a separate ImplementationPlan and
// driven to 100% by the same autonomous build loop.
export const AI_MARKETING_PHASES = [
  {
    title: "Programmatic SEO at Scale",
    module: "Programmatic SEO",
    objective: "Auto-generate hundreds of unique location x service pages per market, each with AI-written unique content, local business schema, and dynamic FAQ to maximize organic lead volume for local service businesses.",
    deliverables: [
      "ProgrammaticPage entity (market_id, service, city, slug, content, schema_json, status)",
      "generateProgrammaticPages backend function — bulk-generates city x service pages via InvokeLLM with unique content per page",
      "Programmatic SEO dashboard showing page counts per market and generation status",
      "Workflow to trigger generation when a Market is published"
    ],
    entities_required: ["ProgrammaticPage"],
    functions_required: ["generateProgrammaticPages"],
    pages_required: ["ProgrammaticSeo"]
  },
  {
    title: "AI Lead Scoring & Enrichment",
    module: "Lead Intelligence",
    objective: "Replace the static lead_score field with a real-time LLM scoring engine that scores incoming leads based on intent signals, firmographics, and behavior, then routes hot leads instantly.",
    deliverables: [
      "LeadScore entity (contact_id, score, intent_signals, firmographics, recommendation, scored_at)",
      "scoreLead backend function — LLM scoring with intent + firmographic enrichment",
      "Lead scoring dashboard with score distribution and hot-lead routing",
      "Workflow triggered on Contact create to auto-score new leads"
    ],
    entities_required: ["LeadScore"],
    functions_required: ["scoreLead"],
    pages_required: ["LeadIntelligence"]
  },
  {
    title: "Conversational AI Agent on Every Site",
    module: "Conversational AI",
    objective: "Deploy an in-app AI agent on each generated market site that engages visitors, answers questions, qualifies them, and books estimates 24/7 using the existing agent infrastructure.",
    deliverables: [
      "SiteAgent entity (market_id, agent_config, conversation_count, lead_count, status)",
      "deploySiteAgent backend function — configures a per-market conversational agent",
      "Conversational AI dashboard showing per-market agent performance",
      "Agent conversation widget component for embedded market sites"
    ],
    entities_required: ["SiteAgent"],
    functions_required: ["deploySiteAgent"],
    pages_required: ["ConversationalAi"]
  },
  {
    title: "Multi-Channel Orchestration",
    module: "Orchestration",
    objective: "Wire Gmail, Google Sheets, Google Calendar, and HubSpot connectors into automated nurture sequences (email -> follow-up -> meeting booking) triggered by lead score changes.",
    deliverables: [
      "NurtureSequence entity (contact_id, steps, current_step, status, channel)",
      "orchestrateNurture backend function — sends email, logs to sheets, books calendar via connectors",
      "Orchestration dashboard showing active sequences and channel metrics",
      "Workflow triggered on LeadScore update to start/advance nurture"
    ],
    entities_required: ["NurtureSequence"],
    functions_required: ["orchestrateNurture"],
    pages_required: ["OrchestrationBoard"]
  },
  {
    title: "Predictive Analytics",
    module: "Predictive AI",
    objective: "Churn prediction, LTV forecasting, and next-market-to-launch recommendations based on competitor density and search opportunity data already collected.",
    deliverables: [
      "Prediction entity (type, target_id, predicted_value, confidence, factors, created_at)",
      "runPredictions backend function — churn + LTV + next-market predictions via InvokeLLM",
      "Predictive analytics dashboard with churn risk, LTV, and market recommendations",
      "Nightly workflow to refresh predictions"
    ],
    entities_required: ["Prediction"],
    functions_required: ["runPredictions"],
    pages_required: ["PredictiveAnalytics"]
  },
  {
    title: "AI Creative Generation Pipeline",
    module: "Creative AI",
    objective: "Automated hero images, ad creative, and video generation per market using GenerateImage/GenerateVideo integrations, tied to brand colors and industry DNA.",
    deliverables: [
      "CreativeAsset entity (market_id, type, prompt, asset_url, status, used_in)",
      "generateCreativeAssets backend function — bulk hero images + ad creative + video per market",
      "Creative pipeline dashboard showing asset status and usage",
      "Workflow triggered on Market publish to generate creative pack"
    ],
    entities_required: ["CreativeAsset"],
    functions_required: ["generateCreativeAssets"],
    pages_required: ["CreativePipeline"]
  },
  {
    title: "Real-Time Personalization",
    module: "Personalization",
    objective: "Dynamic landing page content based on visitor source (Google Ads vs organic vs referral), location, and referral query to maximize conversion rates.",
    deliverables: [
      "PersonalizationRule entity (market_id, condition, content_variant, conversion_lift)",
      "personalizeContent backend function — returns variant based on visitor context",
      "Personalization dashboard showing variant performance and lift",
      "Edge widget component for market sites that fetches personalized content"
    ],
    entities_required: ["PersonalizationRule"],
    functions_required: ["personalizeContent"],
    pages_required: ["PersonalizationBoard"]
  }
];

// Validation criteria applied to every phase.
export const VALIDATION_CRITERIA = [
  { check: "completeness", description: "All declared deliverables, entities, functions, and pages are specified with field-level detail." },
  { check: "correctness", description: "Entity schemas are valid JSON, functions follow the Base44 handler pattern, pages export a default component." },
  { check: "integration", description: "The module wires into the existing app router, navigation, and shared provisioning/generation modules." },
  { check: "security", description: "Admin-only functions guard with role checks; no secrets in client code; RLS considered for sensitive entities." },
  { check: "performance", description: "Entity queries are paginated; no full-table scans; LLM calls are batched where possible." },
  { check: "autonomy", description: "The module can be triggered by a workflow without manual intervention and logs its own progress." }
];

export function buildSpecPrompt(phase, existingApp) {
  return `You are the autonomous coding engine for the "Lead Gen Near You" site factory (a Base44 app).
You are implementing Phase ${phase.phase_number}: "${phase.title}" from the Faultline AI integration plan.

MODULE: ${phase.module}
OBJECTIVE: ${phase.objective}

DELIVERABLES:
${(phase.deliverables || []).map((d) => "- " + d).join("\n")}

ENTITIES REQUIRED: ${(phase.entities_required || []).join(", ")}
FUNCTIONS REQUIRED: ${(phase.functions_required || []).join(", ")}
PAGES REQUIRED: ${(phase.pages_required || []).join(", ")}

EXISTING APP CONTEXT:
- Stack: React + Vite + Tailwind + shadcn/ui + Base44 SDK
- Existing entities: Market, ProvisioningRecord, GenerationJob, MarketSeo, MarketPricing, CompetitorInsight, SeoLaunchKit, Account, Contact, Deal, Activity, Campaign, Quote, EsignDocument, Invoice, Expense, AuditRequest
- Existing functions: provisionMarket, generateMarketAssets, generateSeoLaunchKit, generateContract, generateInvoice, esignPortal, sendEsignRequest, run-free-audit, generate-seo-page
- Brand: dark mode (black bg, white text), metallic gold (#FFEA00) accents

Produce a COMPLETE, DETAILED implementation spec for this phase. For each entity, list every field with its type. For each function, describe the handler logic step-by-step. For each page, describe the layout and data flow. Output as structured JSON with keys: entities (array of {name, fields}), functions (array of {name, logic}), pages (array of {name, layout}), integration_notes, estimated_effort_hours.`;
}

export function buildValidationPrompt(phase, spec) {
  return `You are the autonomous validation engine. Score the implementation spec below for Phase ${phase.phase_number}: "${phase.title}".

VALIDATION CRITERIA (score each 0-100):
${VALIDATION_CRITERIA.map((c) => `- ${c.check}: ${c.description}`).join("\n")}

PHASE OBJECTIVE: ${phase.objective}
DELIVERABLES: ${(phase.deliverables || []).join("; ")}

IMPLEMENTATION SPEC TO VALIDATE:
${spec}

Return JSON with: overall_score (0-100), completeness_score, correctness_score, integration_score, security_score, performance_score, autonomy_score, checks_passed, checks_total, failures (array of {check, severity, detail}), passed (boolean), summary, recommendation.`;
}

export function buildReflectionPrompt(phase, spec, validation) {
  return `You are the autonomous reflection engine. The validation for Phase ${phase.phase_number}: "${phase.title}" scored ${validation.overall_score}/100 and did NOT pass.

FAILURES:
${JSON.stringify(validation.failures, null, 2)}

CURRENT SPEC:
${spec.slice(0, 4000)}

Analyze WHY each failure occurred and propose concrete fixes. Return JSON with: root_causes (array), fix_strategy (string — the corrected approach), updated_spec_sections (object mapping deliverable -> corrected spec), and reflection_notes (string).`;
}

export function buildAuditPrompt(systemSnapshot) {
  return `You are the autonomous forensic auditor. Perform a deep audit of the Lead Gen Near You autonomous implementation system.

CURRENT SYSTEM SNAPSHOT:
${JSON.stringify(systemSnapshot, null, 2).slice(0, 6000)}

Audit across these dimensions (0-100 each):
- completeness: Are all planned phases specified and implemented?
- correctness: Are entity schemas valid and functions following the Base44 pattern?
- integration: Do modules wire into the router and shared modules?
- security: Are admin functions guarded and secrets handled?
- performance: Are queries paginated and LLM calls efficient?
- autonomy: Can the system run without manual intervention?

Return JSON with: overall_score, dimension scores, critical_findings (array), hardening_actions (array of {area, action, priority}), and recommendation.`;
}