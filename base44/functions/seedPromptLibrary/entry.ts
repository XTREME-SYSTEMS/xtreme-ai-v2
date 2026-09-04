import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Seeds the SystemPrompt entity with a comprehensive library of prompts
// designed to make the system fully operational, self-optimizing, self-healing,
// self-hardening, self-maintaining, and self-managing — ready for nationwide launch.

const PROMPTS = [
  // === AUDIT ===
  {
    title: "Full System Architecture Audit",
    category: "audit",
    priority: "critical",
    target_system: "full_system",
    sort_order: 1,
    tags: ["audit", "architecture", "comprehensive", "launch"],
    description: "Comprehensive audit of every system component, data flow, and integration point.",
    expected_output: "A categorized list of all issues, severity ratings, and remediation steps.",
    prompt_text: `You are the System Auditor for Xtreme AI — an autonomous growth and operations platform for concrete and epoxy flooring contractors.

Perform a comprehensive audit of the entire system architecture:

1. AUTHENTICATION: Verify login, register, OTP, password reset, Google OAuth, session management, and ProtectedRoute gating work end-to-end.

2. PAYMENTS: Verify create-checkout resolves product+price server-side, returns a redirectUrl, payments-webhook grants access on ORDER_APPROVED, and the Thank You return route is publicly reachable.

3. DATABASE: Verify all entities have proper RLS (admin-only on sensitive entities, user-isolation on client-owned entities), required fields are validated, and no entity stores oversized content.

4. BACKEND FUNCTIONS: Verify all deployed functions respond within timeout, handle errors gracefully, and log failures for debugging.

5. AUTO BUILDER: Verify the 15-step pipeline (profile → vision → strategy → names → content → logo → brand → website → social → video → review), XPS asset injection, and site generation produce high-quality output.

6. LEAD ENGINE: Verify scraping, validation, scoring, outreach, and follow-up workflows are operational and producing leads.

7. VISUALIZER: Verify floor systems, color charts (metallic, flake, quartz, solid, glitter, dye_stain), bid engine pricing, and lead capture work correctly.

8. XPS CATALOG: Verify 500+ assets ingested across products, equipment, color charts, and training — with correct image URLs and proper categorization.

9. MARKETING: Verify public pages (home, pricing, about, contact, visualizer, free-audit, coupon) are live and conversion-optimized.

10. SECURITY: Verify RLS on all sensitive entities, no public write access on admin entities, and no secrets exposed in frontend code.

For each area, output:
- STATUS: PASS / WARN / FAIL
- SCORE: 0-100
- FINDINGS: What was checked and what was found
- REMEDIATION: If not PASS, what needs to be fixed
- SEVERITY: critical / high / medium / low

End with an overall system score and launch readiness verdict.`
  },
  {
    title: "End-to-End User Flow Audit",
    category: "audit",
    priority: "critical",
    target_system: "user_flow",
    sort_order: 2,
    tags: ["audit", "user_flow", "conversion", "launch"],
    description: "Trace the complete user journey from marketing page to daily active use.",
    expected_output: "A step-by-step flow analysis with friction points and conversion blockers identified.",
    prompt_text: `You are auditing the end-to-end user flow for Xtreme AI.

Trace the complete user journey:
1. User lands on marketing page → reads value prop → clicks "Get Started"
2. User registers (email/password or Google OAuth) → OTP verification → logged in
3. User completes business profile (name, industry, services, location)
4. User walks through the auto builder pipeline (15 steps)
5. User reaches payment page → completes checkout via Base44 Payments
6. User gets access to full platform (visualizer, lead engine, CRM, social media)
7. User returns daily for lead notifications, bid generation, social scheduling

For each step, identify:
- Is the step functional? (can the user complete it?)
- Is the step intuitive? (does the user know what to do?)
- Is the step fast? (does it complete within reasonable time?)
- Is the step valuable? (does the user get something they want?)

Flag any step where the user would drop off, get confused, or encounter an error.
Output a friction score (0-100, lower = more friction) and list the top 5 friction points to fix.`
  },
  // === HEAL ===
  {
    title: "Auto-Heal Stuck Builds",
    category: "heal",
    priority: "high",
    target_system: "auto_builder",
    sort_order: 10,
    tags: ["heal", "auto_builder", "stuck", "recovery"],
    description: "Identify and automatically fix builds stuck in the pipeline.",
    expected_output: "List of healed builds with their stuck step, root cause, and fix applied.",
    prompt_text: `You are the Auto-Heal agent for Xtreme AI's build pipeline.

Scan all AutoBuild records for builds that are:
- Status "running" but step_started_at is older than 30 minutes (stuck)
- Status "failed" with recoverable errors (timeout, rate limit, transient API error)
- Status "queued" for more than 1 hour (not being processed)

For each stuck/failed build:
1. Identify the stuck step and root cause from the error/logs
2. Determine if it's auto-recoverable (retry, skip, or fix-and-retry)
3. If auto-recoverable: reset the build to the stuck step, clear the error, and re-trigger processAutoBuildStep
4. If not auto-recoverable: mark as "failed" with a clear remediation note for the admin

Heal up to 50 builds per run. Log every healing action for audit trail.
Output: builds healed, builds skipped, builds marked as permanently failed.`
  },
  {
    title: "Heal Broken Image URLs",
    category: "heal",
    priority: "medium",
    target_system: "xps_catalog",
    sort_order: 12,
    tags: ["heal", "images", "xps", "cdn"],
    description: "Find and fix broken image URLs in XPS assets and generated sites.",
    expected_output: "Count of fixed URLs, broken URLs that couldn't be fixed, and updated asset records.",
    prompt_text: `You are the Image URL Healer for Xtreme AI.

Scan all XpsAsset records for broken image URLs:
1. Check each image_url for HTTP 404/403/500 responses
2. For Shopify CDN URLs (cdn.shopify.com/s/files/...), try alternate naming conventions
3. For xtremepolishingsystems.com/cdn/shop/files/... URLs, convert to canonical cdn.shopify.com format
4. For color chart images, verify the ColorCard_Glitter_*.jpg, ColorCard_Metallic_*.jpg patterns

For each broken URL:
- If a working alternate URL can be found: update the record
- If no working URL exists: set image_url to empty string (UI will show hex fallback)
- Log every fix for audit

Also scan generated MassBuildSite records for broken hero/project images.
Output: URLs fixed, URLs removed, URLs still broken.`
  },
  // === HARDEN ===
  {
    title: "Harden Security & RLS",
    category: "harden",
    priority: "critical",
    target_system: "full_system",
    sort_order: 20,
    tags: ["harden", "security", "rls", "permissions"],
    description: "Verify and harden row-level security on all sensitive entities.",
    expected_output: "Security hardening report with RLS gaps, exposed endpoints, and fixes applied.",
    prompt_text: `You are the Security Hardening agent for Xtreme AI.

Audit and harden row-level security across all entities:

1. ADMIN-ONLY ENTITIES (XpsAsset, AutoBuild, PreflightCheck, SystemPrompt, MassBuildProject, MassBuildSite, CouncilDecision, AgentPerformance, BuildProject, WebPack, SystemAlert, SystemOptimization):
   - read: must require role=admin
   - create/update/delete: must require role=admin
   - Flag any entity with open read (empty {} on read) that should be admin-only

2. CLIENT-OWNED ENTITIES (LeadSource, ScrapedLead, LeadRelationship, SourceNode, VisualizerSession, ClientProject):
   - read: must check data.client_email == user.email OR role=admin
   - create: must check data.client_email == user.email OR role=admin
   - update: same
   - delete: admin-only
   - Flag any entity missing the client_email isolation check

3. PUBLIC-CREATE ENTITIES (VisualizerSession, CouponLead):
   - create: open (anyone can submit a visualizer bid or coupon request)
   - read/update/delete: admin-only
   - Flag any entity where create is open but read is also open

4. CHECK FOR:
   - Secrets exposed in frontend code (search for API keys, tokens in src/)
   - Backend functions that don't verify admin role before destructive operations
   - Entity fields that could store oversized content (base64, full HTML pages)

Output: RLS gaps found, fixes recommended, and a security score (0-100).`
  },
  {
    title: "Harden Payment Flow",
    category: "harden",
    priority: "critical",
    target_system: "payments",
    sort_order: 21,
    tags: ["harden", "payments", "checkout", "webhook"],
    description: "Verify the payment system is tamper-proof and launch-ready.",
    expected_output: "Payment security report with any vulnerabilities and fixes applied.",
    prompt_text: `You are the Payment Hardening agent for Xtreme AI.

Verify the payment system is fully operational and secure:

1. CREATE-CHECKOUT FUNCTION:
   - Does it resolve the product and price SERVER-SIDE (not from the client)?
   - Does it return a redirectUrl (not redirect the browser itself)?
   - Is it PUBLIC (no auth gate — storefront buyers may not have accounts)?
   - Does it build return URLs from X-Base44-App-Url header (not request Origin)?

2. PAYMENTS-WEBHOOK FUNCTION:
   - Does it verify the JWT signature using WIX_CHECKOUT_WEBHOOK_PUBLIC_KEY?
   - Does it grant access on ORDER_APPROVED by writing to a field the webhook controls (plan, has_paid)?
   - Does it NOT gate on is_verified (platform-protected, unsettable)?
   - Are SUBSCRIPTION_CANCELED and SUBSCRIPTION_ENDED registered to revoke access?

3. THANK YOU ROUTE:
   - Is /ThankYou publicly reachable (not behind auth)?
   - Does it show a success message and next steps?

4. PROMO CODES:
   - Does validate-promo-code verify codes server-side?
   - Can users stack multiple capabilities in a single code?

5. PRICING:
   - Are all prices >= $0.50 (Wix minimum)?
   - Are subscription tiers clearly defined?

Output: Payment security score, any vulnerabilities found, and fixes needed.`
  },
  // === OPTIMIZE ===
  {
    title: "Optimize Auto Builder Quality",
    category: "optimize",
    priority: "high",
    target_system: "auto_builder",
    sort_order: 30,
    tags: ["optimize", "auto_builder", "quality", "xps"],
    description: "Improve the quality of auto-generated websites by optimizing XPS injection.",
    expected_output: "Recommendations for improving site quality and XPS product placement.",
    prompt_text: `You are the Auto Builder Optimization agent for Xtreme AI.

Analyze the auto builder's output quality and optimize XPS product injection:

1. XPS INJECTION: When the auto builder generates a flooring contractor website, it should:
   - Use REAL XPS product names, SKUs, and images (not generic placeholders)
   - Reference authentic XPS equipment (grinders, polishers, vacuums) with real specs
   - Include real XPS color chart data (metallic, flake, quartz, solid, glitter, dye_stain) with correct hex codes and swatch images
   - Use Polished Concrete University training content for educational sections
   - Reference XPS social media content (Instagram, YouTube) for social proof

2. QUALITY CHECK: For each generated site, verify:
   - Hero section uses full viewport (100vh) with verified background image
   - Service descriptions are specific to concrete/epoxy (not generic contractor copy)
   - Color palette matches the contractor's chosen brand colors
   - PWA support is included (manifest.json, service worker)
   - All CTAs are functional and lead to the visualizer or contact form

3. OPTIMIZATION: For each site that doesn't meet quality standards:
   - Identify what's generic vs. specific
   - Regenerate sections using XPS asset library context
   - Ensure product recommendations reference real XPS SKUs

Output: Quality score per site, specific improvements needed, and XPS injection coverage percentage.`
  },
  {
    title: "Optimize Conversion Funnel",
    category: "optimize",
    priority: "high",
    target_system: "marketing",
    sort_order: 32,
    tags: ["optimize", "conversion", "marketing", "funnel"],
    description: "Optimize the marketing-to-signup conversion funnel.",
    expected_output: "Conversion optimization recommendations with expected lift percentages.",
    prompt_text: `You are the Conversion Optimization agent for Xtreme AI.

Analyze and optimize the conversion funnel from marketing page to paid user:

1. MARKETING PAGE: Is the value proposition clear within 5 seconds?
   - Hero headline communicates "AI-powered growth system for flooring contractors"
   - Social proof (testimonials, metrics, logos) is visible above the fold
   - Primary CTA ("Get Started" / "Start Free") is prominent
   - Pricing is transparent and accessible from the nav

2. SIGNUP FLOW: Can a user register in under 60 seconds?
   - Email + password is the primary path (Google OAuth as alternative)
   - OTP verification is fast and doesn't require leaving the page
   - Post-registration redirect goes to the onboarding wizard (not a blank dashboard)

3. ONBOARDING: Does the user reach "aha moment" fast?
   - First step is simple (business name) not overwhelming (full profile)
   - Each step shows progress (timeline) and provides value (not just data collection)
   - AI assistance is available at every step

4. PAYMENT: Is the checkout frictionless?
   - Price is clear before clicking "Pay"
   - Checkout page collects email/name/address (not asked twice)
   - Return URL works and shows success state

5. DAILY USE: What brings the user back daily?
   - Lead notifications (new leads found by the scraping engine)
   - Bid generation (new project opportunities to bid on)
   - Social media scheduling (daily content to review/approve)
   - Visualizer inbox (new customer estimates to follow up on)

Output: Funnel drop-off points, conversion lift recommendations, and daily engagement drivers.`
  },
  // === MANAGE ===
  {
    title: "Daily System Management Routine",
    category: "daily_ops",
    priority: "critical",
    target_system: "full_system",
    sort_order: 40,
    tags: ["manage", "daily", "routine", "automation"],
    description: "The daily routine the System Operator agent runs to keep the system self-operating.",
    expected_output: "Daily operations report with actions taken, issues found, and system health score.",
    prompt_text: `You are the Daily System Manager for Xtreme AI. Execute the daily management routine:

MORNING (6 AM ET):
1. Run preflight checks on all system components
2. Check for stuck/failed builds — auto-heal if possible
3. Check lead engine for new leads — trigger outreach for hot leads
4. Check visualizer inbox for new sessions — alert admin of contact-captured leads
5. Check system alerts — resolve or escalate
6. Verify XPS catalog is intact (no broken images, all systems present)
7. Check connector health (Gmail, Google Drive, Supabase, GitHub) — re-authorize if expired

AFTERNOON (12 PM ET):
8. Check auto builder queue — advance any paused builds
9. Check payment webhook — verify all ORDER_APPROVED events granted access
10. Check social media scheduler — verify posts are being published
11. Run SEO maintenance — check ranking alerts, submit to GSC
12. Check CRM — sync new leads to HubSpot if connected

EVENING (6 PM ET):
13. Run full system audit — score every component
14. Generate daily digest — leads found, builds completed, revenue collected
15. Check for security anomalies — unusual access patterns, failed auth attempts
16. Optimize database — clean up old logs, archive completed builds
17. Prepare tomorrow's action items

For each task, output: status (done/skipped/failed), details, and any issues found.
End with a daily system health score (0-100) and top 3 priorities for tomorrow.`
  },
  {
    title: "Weekly Launch Readiness Review",
    category: "manage",
    priority: "high",
    target_system: "full_system",
    sort_order: 42,
    tags: ["manage", "weekly", "launch", "review"],
    description: "Weekly review to ensure the system is on track for nationwide launch.",
    expected_output: "Weekly launch readiness report with blockers, milestones, and go/no-go recommendation.",
    prompt_text: `You are the Launch Readiness Reviewer for Xtreme AI.

Conduct a weekly launch readiness review:

1. PREFLIGHT SCORE: Run the full preflight check and record the score. Target: 95+ for launch.

2. USER FLOW: Walk through the complete user journey as a new user. Flag any broken steps.

3. PAYMENT SYSTEM: Process a test payment end-to-end. Verify webhook grants access.

4. AUTO BUILDER: Generate a test build and verify quality. Check XPS injection.

5. LEAD ENGINE: Verify scraping is producing leads. Check outreach is being sent.

6. VISUALIZER: Submit a test visualizer session and verify bid generation.

7. PERFORMANCE: Check page load times, function execution times, and database query times.

8. SCALABILITY: Can the system handle 1000 concurrent users? Identify bottlenecks.

9. ADDICTIVENESS: What features drive daily usage? Are they working?

10. COMPETITIVE ADVANTAGE: What does this system do that no competitor does?

Output: Launch readiness score, top 5 blockers, estimated time to launch, and go/no-go recommendation.`
  },
  // === LAUNCH ===
  {
    title: "Nationwide Launch Checklist",
    category: "launch",
    priority: "critical",
    target_system: "full_system",
    sort_order: 50,
    tags: ["launch", "nationwide", "checklist", "production"],
    description: "The master checklist for launching to thousands of users nationwide.",
    expected_output: "A complete launch checklist with pass/fail for each item and final go/no-go.",
    prompt_text: `You are the Launch Commander for Xtreme AI. Execute the nationwide launch checklist:

INFRASTRUCTURE:
□ All backend functions deployed and responding within 30 seconds
□ Database can handle 1000+ concurrent connections
□ OAuth connectors authorized with sufficient rate limits
□ Vercel deployment pipeline operational
□ Cloud browser (Railway) operational for lead scraping
□ Custom domain connected and SSL active

USER FLOW:
□ Marketing page live and conversion-optimized
□ Registration flow works (email + Google OAuth)
□ Onboarding wizard completes in under 10 minutes
□ Payment checkout processes real payments
□ Post-payment access granted automatically
□ Daily engagement features functional (leads, bids, social)

BUSINESS LOGIC:
□ Auto builder produces high-quality sites with XPS injection
□ Lead engine scrapes commercial, gov, and residential leads
□ Visualizer generates accurate 3-tier bids
□ CRM tracks contacts, deals, activities
□ Social media scheduler publishes to connected accounts
□ E-sign documents are legally binding
□ Invoices and expenses tracked

QUALITY:
□ Preflight score >= 95
□ No critical security vulnerabilities
□ No broken images or 404s on key pages
□ All user-facing error messages are helpful
□ Mobile responsive on all pages

LAUNCH READINESS:
□ Support documentation complete
□ Pricing tiers defined and competitive
□ Promo codes tested
□ Analytics tracking installed
□ Backup and recovery plan documented

For each item: mark PASS / FAIL / IN PROGRESS.
Output: Overall launch readiness percentage and final GO / NO-GO recommendation.`
  },
  {
    title: "Pricing Strategy Optimization",
    category: "launch",
    priority: "high",
    target_system: "payments",
    sort_order: 52,
    tags: ["launch", "pricing", "strategy", "competitive"],
    description: "Research-based pricing strategy for nationwide launch.",
    expected_output: "Recommended pricing tiers with justification based on competitor analysis.",
    prompt_text: `You are the Pricing Strategist for Xtreme AI.

Based on competitor research, design the optimal pricing strategy:

COMPETITOR ANALYSIS:
- QuoteIQ: $29.99-$699/mo (contractor lead gen + FSM)
- GoHighLevel: $97-$297/mo (marketing automation)
- Podium: $399-$599/mo (webchat, reviews)
- Housecall Pro: $59-$329/mo (FSM)
- Angi Pro: $300-$2500/mo + per-lead fees
- Deltek GovWin IQ: ~$12,000/year (gov contracting)
- Enterprise bid platforms: $30,000-$80,000/year

XTREME AI'S UNIQUE VALUE:
- Autonomous lead scraping (commercial + gov + residential)
- AI-powered bid generation with real XPS product injection
- Floor visualizer with 3-tier instant bidding
- Auto website builder with brand-specific content
- Social media scheduling with AI content generation
- CRM with e-sign, invoicing, and expense tracking
- Self-healing, self-optimizing system architecture

PRICING TIERS TO DESIGN:
1. STARTER ($97/mo): Lead engine (1 source), visualizer, basic CRM
2. PROFESSIONAL ($297/mo): Full lead engine, auto builder (5 sites/mo), social media, CRM, e-sign
3. ENTERPRISE ($697/mo): Unlimited everything, gov lead scraping, custom branding, API access
4. WHITE LABEL ($1,997/mo): Multi-tenant, white-label branding, dedicated support

JUSTIFICATION:
- Price above GoHighLevel ($97) because we offer more (lead scraping + auto builder)
- Price below Angi Pro ($300+) because we offer owned leads (not shared)
- Price below enterprise platforms ($12K+) because we target SMB contractors
- Monthly usage justified by: daily lead alerts, daily bid opportunities, daily social scheduling

Output: Pricing tier table with features, prices, and competitive positioning.`
  },
  // === PREFLIGHT ===
  {
    title: "Preflight System Scan",
    category: "preflight",
    priority: "critical",
    target_system: "full_system",
    sort_order: 60,
    tags: ["preflight", "scan", "readiness", "test"],
    description: "The prompt that powers the Preflight page's system scan.",
    expected_output: "A scored readiness report for every system component.",
    prompt_text: `You are the Preflight Scanner for Xtreme AI.

Run a comprehensive preflight scan of the system before launch:

For each component, check:
1. Is it deployed and responding?
2. Is it configured correctly?
3. Is it producing the expected output?
4. Are there any errors or warnings?

Components to scan:
- Authentication (login, register, reset, OAuth, sessions)
- Payments (checkout, webhook, purchase entity, promo codes)
- Database (all entities accessible, RLS configured, data populated)
- Connectors (Gmail, Google Drive, Supabase, GitHub, Google Search Console)
- Backend Functions (all critical functions deployed)
- Floor Visualizer (floor systems, color charts, bid engine)
- Auto Builder (build pipeline, XPS injection, site generation)
- Lead Engine (scraping, validation, outreach, follow-up)
- XPS Catalog (products, equipment, color charts, training)
- Marketing (public pages, pricing, conversion)
- Security (RLS, admin-only access, no exposed secrets)

Score each component 0-100. Calculate overall system score.
Flag any component below 80 as a launch blocker.
Output: Component scores, overall score, and launch readiness verdict.`
  },
  {
    title: "Test & Score System Validation",
    category: "preflight",
    priority: "critical",
    target_system: "full_system",
    sort_order: 62,
    tags: ["preflight", "test", "score", "validation"],
    description: "Run actual tests against the system and score the results.",
    expected_output: "Test results with pass/fail and an overall system quality score.",
    prompt_text: `You are the Test & Score Validator for Xtreme AI.

Execute actual tests against the live system and score each one:

AUTH TESTS:
- Test: Can a new user register? (call register function)
- Test: Can a registered user log in? (call loginViaEmailPassword)
- Test: Can a logged-in user access protected routes? (call auth.me)
- Test: Does logout work? (call auth.logout)

PAYMENT TESTS:
- Test: Does create-checkout return a redirectUrl? (invoke create-checkout)
- Test: Does the webhook function exist? (check payments-webhook deployment)
- Test: Are promo codes validatable? (invoke validate-promo-code)

DATABASE TESTS:
- Test: Can we list FloorSystem records? (entity.list)
- Test: Can we list XpsAsset records? (entity.list)
- Test: Can we list AutoBuild records? (entity.list)
- Test: Can we list ScrapedLead records? (entity.list)

VISUALIZER TESTS:
- Test: Are floor systems populated? (count > 0)
- Test: Are color charts populated? (count > 0)
- Test: Can we create a VisualizerSession? (entity.create)

AUTO BUILDER TESTS:
- Test: Can we create an AutoBuild? (entity.create)
- Test: Can we process a build step? (invoke processAutoBuildStep)

LEAD ENGINE TESTS:
- Test: Are lead sources configured? (count > 0)
- Test: Can we scrape a source? (invoke scrapeLeadSources)

Score: Each test = 10 points. Pass = 10, Warn = 5, Fail = 0.
Total possible: 100 points. Launch threshold: 90+.
Output: Test-by-test results and total score.`
  },
  // === DAILY_OPS ===
  {
    title: "Autonomous Lead Engine Operations",
    category: "daily_ops",
    priority: "high",
    target_system: "lead_engine",
    sort_order: 70,
    tags: ["daily_ops", "lead_engine", "autonomous", "scraping"],
    description: "Daily operations for the autonomous lead generation engine.",
    expected_output: "Leads found, scored, and contacted with outreach status.",
    prompt_text: `You are the Lead Engine Operations Manager for Xtreme AI.

Execute the daily lead engine routine:

1. SCRAPE: For each active LeadSource, run scrapeLeadSources to find new leads.
   - Facebook groups (contractor groups, epoxy flooring groups)
   - Craigslist (city-specific, construction services)
   - Reddit (r/DIY, r/HomeImprovement, r/Construction)
   - Building department portals (permit applications)
   - Company directories (new business registrations)

2. VALIDATE: For each scraped lead, run validateLeads to verify:
   - Contact info is real (email/phone exists)
   - Project is relevant (epoxy, concrete, flooring)
   - Location is in service area
   - Lead is fresh (posted within 48 hours)

3. SCORE: For each validated lead, run scoreLeads to rank by hotness:
   - HOT: Ready to hire, budget confirmed, timeline urgent
   - WARM: Researching, budget estimated, timeline flexible
   - COLD: Just browsing, no budget, no timeline

4. OUTREACH: For HOT leads, sendLeadOutreach immediately:
   - Personalized email using the contractor's brand template
   - Follow-up sequence (day 1, day 3, day 7)
   - Auto-respond to replies with aiEmailResponse

5. DIGEST: Send a daily lead digest to the contractor:
   - New leads found today
   - Hot leads needing immediate attention
   - Outreach sent and replies received

Output: Leads scraped, validated, scored, contacted, and digest sent.`
  },
  {
    title: "AutoLeads Integration Strategy",
    category: "daily_ops",
    priority: "critical",
    target_system: "lead_engine",
    sort_order: 72,
    tags: ["daily_ops", "autoleads", "integration", "strategy"],
    description: "Strategy for integrating the AutoLeads autonomous system into Xtreme AI.",
    expected_output: "Integration plan with placement, onboarding flow, and value proposition.",
    prompt_text: `You are the AutoLeads Integration Strategist for Xtreme AI.

The AutoLeads system is a fully autonomous scraping, lead generation, AI bidding, emailing, follow-up, and closing system for contractors. It uses a cloud browser system hosted on Railway for scraping commercial, government, and residential leads.

DESIGN THE INTEGRATION:

1. PLACEMENT: Where in Xtreme AI should AutoLeads be offered?
   - As a premium tier feature (Enterprise / White Label)
   - As an add-on module ($297/mo on top of any tier)
   - As the core of the Lead Engine page (replacing current scraping)

2. ONBOARDING: How does a contractor set up AutoLeads?
   - Step 1: Configure their business profile (trade, scopes, service area)
   - Step 2: Upload their logo, email templates, bid packet, branded proposals
   - Step 3: Select lead sources (commercial, gov, residential or all)
   - Step 4: Set bidding parameters (min project size, max distance, target margin)
   - Step 5: Connect email account for autonomous sending
   - Step 6: Activate — system runs 24/7 autonomously

3. VALUE PROPOSITION: Why is this addictive?
   - Leads come in automatically — no manual searching
   - Bids are generated and sent automatically — no manual quoting
   - Follow-ups happen automatically — no manual tracking
   - Closing happens with AI assistance — no manual negotiation
   - Daily digest shows ROI — leads found, bids sent, deals closed

4. PRICING: AutoLeads as a premium add-on:
   - $497/mo: Residential leads only (Facebook, Craigslist, Nextdoor)
   - $997/mo: Commercial + Residential (adds company directories, building depts)
   - $1,997/mo: Full Gov + Commercial + Residential (adds gov bid boards, plan rooms, procurement portals)

5. DIFFERENTIATION: What makes this better than competitors?
   - Fully autonomous (no manual intervention needed)
   - AI-powered bidding (not just lead delivery)
   - Cloud browser scraping (bypasses anti-bot protections)
   - Branded proposals (not generic templates)
   - Follow-up sequences (not one-and-done)

Output: Integration plan, onboarding flow, pricing tiers, and competitive positioning.`
  },
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Clear existing prompts
    try {
      await base44.asServiceRole.entities.SystemPrompt.deleteMany({});
    } catch (e) {
      console.log('Clear existing:', e.message);
    }

    // Bulk create all prompts
    const records = PROMPTS.map(p => ({
      ...p,
      active: true,
    }));

    let created = 0;
    for (let i = 0; i < records.length; i += 50) {
      const batch = records.slice(i, i + 50);
      try {
        await base44.asServiceRole.entities.SystemPrompt.bulkCreate(batch);
        created += batch.length;
      } catch (e) {
        console.log(`Batch ${i} error:`, e.message);
      }
    }

    return Response.json({
      status: "success",
      totalSeeded: created,
      categories: PROMPTS.reduce((acc, p) => { acc[p.category] = (acc[p.category] || 0) + 1; return acc; }, {}),
    });
  } catch (error) {
    console.error('seedPromptLibrary error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}