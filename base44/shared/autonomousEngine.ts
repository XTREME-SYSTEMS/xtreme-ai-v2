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
- Brand: dark mode (black bg, white text), neon lime green (#D4FF4D) accents

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