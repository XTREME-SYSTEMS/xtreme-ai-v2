# Autonomous System Hardening Roadmap

## Mission
Transform the AutoBuilder + Discovery pipeline into a fully autonomous, zero-error,
production-ready system that generates, validates, deploys, and monitors high-quality
digital products 24/7 with recursive self-healing until 100% validation pass rate.

## Current State (as of 2026-08-23)
- Discovery engine: Browserbase scrape → score → promote ✅
- AutoBuilder pipeline: profile → architecture → data model → UI system → codegen manifest → deploy config → review ✅
- Receipts for auditability ✅
- Recovery workflows (recoverStuckAutoBuilds, recursiveHardenSystem) ✅
- auto_advance toggle ✅
- Scheduled cron workflows ✅

## Critical Gaps
1. Codegen produces file manifests, NOT actual compilable code
2. No compile/lint/type-check gate between generation and deploy
3. No LLM-as-judge quality evaluation pass
4. No cross-step consistency validation (data model vs architecture, UI vs pages, etc.)
5. No post-deploy health verification (HTTP 200, SSL, sitemap, Lighthouse)
6. No visual regression testing (screenshot vs design spec)
7. No continuous self-healing loop that reads failures and regenerates with error context
8. No quality score aggregation / health dashboard
9. No governance tier enforcement (Green/Yellow/Red) in auto_advance
10. No cost tracking per build

---

## PHASE 1 — Validation Hardening (Foundation)

### 1.1 Strict JSON Schemas for Every Spec
- [ ] Define Zod schemas for: architecture, data_model, ui_system, code_manifest, deploy_config
- [ ] Each schema enforces required fields, types, enums, min/max lengths
- [ ] Validation runs BEFORE saving to AutoBuild record
- [ ] Validation errors returned as structured `validationErrors[]` to frontend

### 1.2 Cross-Step Consistency Validators
- [ ] Data model entities must cover all architecture.data_models
- [ ] UI system components must cover all architecture.pages
- [ ] Code manifest files must implement all architecture.features
- [ ] Deploy config must reference all code manifest entry points
- [ ] Validator lives in `base44/shared/systemBuildValidation.ts`

### 1.3 LLM-as-Judge Quality Evaluation
- [ ] After each generation, a second LLM call evaluates output on a rubric:
  - Completeness (0-100): all required sections present and detailed
  - Consistency (0-100): no contradictions between sections
  - Feasibility (0-100): technically buildable with stated stack
  - Quality (0-100): depth, specificity, production-readiness
- [ ] Composite score < 70 → auto-regenerate with judge feedback injected
- [ ] Max 3 regeneration attempts → dead-letter + operator alert
- [ ] Judge scores saved to Receipt for auditability

### 1.4 Validation-Aware Auto-Regeneration
- [ ] `useSystemBuildStep` hook extended: on validation failure, feed errors back to generator
- [ ] Backend functions accept `previous_errors` param and inject into LLM prompt
- [ ] Retry loop: generate → validate → if fail, regenerate with errors → repeat up to 3x

---

## PHASE 2 — Real Code Generation

### 2.1 Actual File Content Generation
- [ ] Extend `generateCodeManifest` to produce actual file contents (not just paths)
- [ ] Each file: { path, content, language, purpose }
- [ ] Generate: pages (.jsx), components (.jsx), hooks (.js), entities (.jsonc), functions (entry.ts), routes (App.jsx), styles (index.css), config (tailwind.config.js, package.json)
- [ ] Content derived from architecture + data_model + ui_system specs

### 2.2 Sandboxed Compile Gate
- [ ] After codegen, run files through a validation function:
  - JSX syntax check (babel parse)
  - Import resolution check (every import resolves to a generated file or npm package)
  - Entity schema validation (generated .jsonc files are valid JSON)
  - Route registration check (every page has a Route in App.jsx)
- [ ] Errors collected as `compileErrors[]`
- [ ] Auto-fix loop: feed compile errors back to codegen LLM → regenerate failing files → re-validate

### 2.3 Visual Screenshot Generation
- [ ] After deploy, use Browserbase to screenshot the live URL
- [ ] Compare against UI system design spec (color palette, layout patterns)
- [ ] Visual regression score saved to Receipt
- [ ] Score < threshold → trigger UI regeneration

---

## PHASE 3 — Self-Healing Loop

### 3.1 Error Classification Engine
- [ ] Classify every error: transient | structural | schema | logic | dependency | timeout
- [ ] transient → retry with exponential backoff (1s, 2s, 4s, 8s)
- [ ] structural → feed error + context back to LLM → regenerate → validate
- [ ] schema → validate against schema, inject field-level errors into prompt
- [ ] logic → run test suite, inject failing test output into prompt
- [ ] dependency → check connector status, retry or escalate
- [ ] timeout → split into smaller batches, retry

### 3.2 Continuous Recovery Workflow
- [ ] Workflow runs every 15 minutes
- [ ] Scans for: failed builds, stuck builds (>2h no progress), builds with validation errors
- [ ] For each: classify error → attempt fix → validate → if fixed, resume; if not, dead-letter
- [ ] Dead-letter queue: operator dashboard with error context, suggested fix, one-click retry
- [ ] Circuit breaker: if same error class fails 5x consecutively, pause pipeline + alert

### 3.3 Recursive Hardening
- [ ] `recursiveHardenSystem` extended to loop: harden → validate → score → if <100, harden again
- [ ] Max 10 recursion depth per build
- [ ] Each recursion logs what was hardened and the score delta
- [ ] Final score + recursion count saved to Receipt

---

## PHASE 4 — Post-Deploy Verification & Monitoring

### 4.1 Automated Health Checks
- [ ] After deploy, run within 60 seconds:
  - HTTP 200 check on live URL
  - SSL certificate valid
  - Sitemap.xml accessible
  - Robots.txt accessible
  - JSON-LD structured data present
  - Mobile responsive (viewport meta tag)
  - Lighthouse audit (performance, accessibility, SEO, best practices)
- [ ] All checks logged to Receipt with pass/fail + scores
- [ ] Any failure → trigger auto-fix or rollback

### 4.2 Quality Score Aggregation
- [ ] `SystemHealthScore` entity updated per build with:
  - Validation pass rate (0-100%)
  - Compile pass rate
  - Lighthouse scores (avg of 4 categories)
  - Visual regression score
  - Self-healing success rate
  - Overall composite score
- [ ] Dashboard widget: real-time pipeline health, success rate trends, cost per build

### 4.3 Alerting
- [ ] Alert on: stuck build >4h, quality score <70, 3+ consecutive failures, cost >$threshold
- [ ] Alerts via: in-app notification, email (SendEmail), operator dashboard
- [ ] Alert entity: `SystemAlert` (new) with severity, context, acknowledged flag

---

## PHASE 5 — Full 24/7 Autonomy

### 5.1 Governance Tier Enforcement
- [ ] Green (auto): spec generation, validation, codegen, preview deploy — no human
- [ ] Yellow (preview): production deploy, domain purchase — auto-approve after 1h timeout if no rejection
- [ ] Red (explicit): client-facing deploys, paid domains — require operator click
- [ ] Tier stored on AutoBuild record, checked by processAutoBuildStep before advancing

### 5.2 End-to-End Autonomous Loop
- [ ] Scheduled workflow: every 6 hours
  1. Run discovery (ideas + leads)
  2. Auto-promote top-scored ideas (score > 80) to AutoBuilder
  3. For each new build: run full pipeline with auto_advance
  4. Validate every step (Phase 1)
  5. Generate real code (Phase 2)
  6. Self-heal failures (Phase 3)
  7. Deploy to preview (Green tier)
  8. Run health checks (Phase 4)
  9. If all pass → promote to production (Yellow tier, auto-approve after 1h)
  10. Log everything to Receipts + SystemHealthScore

### 5.3 Proof of Autonomy
- [ ] Final validation run: execute the full pipeline on 3 test builds
- [ ] Capture screenshots at each step (Browserbase)
- [ ] Capture logs from every function invocation
- [ ] Produce a proof report: step-by-step screenshots + logs + validation scores
- [ ] Target: 100% pass rate on all validation levels across all 3 builds

---

## Success Criteria (Definition of Done)
1. ✅ Every generated spec passes strict JSON schema validation
2. ✅ Every spec passes cross-step consistency validation
3. ✅ Every spec passes LLM-as-judge with composite score ≥ 85
4. ✅ Generated code compiles with zero errors
5. ✅ All imports resolve
6. ✅ All routes registered
7. ✅ Post-deploy health checks: 100% pass
8. ✅ Lighthouse scores: performance ≥ 90, accessibility ≥ 90, SEO ≥ 95, best practices ≥ 90
9. ✅ Self-healing loop resolves 100% of injected failures within 3 retries
10. ✅ Proof report with screenshots + logs showing 100% validation pass rate