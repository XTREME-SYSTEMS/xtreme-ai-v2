# Lead Engine — End-to-End Audit & Build Plan

**Date:** 2026-09-01
**Scope:** Autonomous lead discovery + outreach system (residential + commercial demand intelligence)
**Status:** Audited against legacy Autoleads + VisionCortex 13-agent council architecture

---

## 1. Current State (What Exists)

### Entities
- `LeadSource` — configurable scraping source (FB group, Craigslist, Reddit, building dept, company directory, Google Maps, Yelp, custom). RLS-isolated by `client_email`.
- `ScrapedLead` — discovered lead. Types: `service_request` (homeowner), `company` (business to outreach), `permit_project` (building permit). Statuses: new → outreach_sent → follow_up_1/2/3 → responded/won/bounced/unsubscribed.

### Backend Functions
- `scrapeLeadSources` — cloud browser scrape → AI extraction → dedupe → save
- `sendLeadOutreach` — Gmail cold email + 3-step follow-ups + 10% coupon
- `scoreLeads` — exists but not wired to lead engine
- `discoverBusinessLeads` — exists (commercial side), separate pipeline

### Shared Modules
- `cloudBrowserScrape.ts` — v3.0 engine client (FIXED, tested, working)
- `browserbaseScrape.ts` — legacy Browserbase client (still present)

### Workflows
- `Daily Lead Engine.jsonc` — runs 9am ET, scrapes → initial outreach → follow-ups

### UI
- `LeadEngine.jsx` — stats, leads/sources tabs, add-source dialog, scrape/outreach buttons

### Connectors (authorized)
- gmail (send + mailbox webhook support)
- hubspot (authorized, NOT used by lead engine)
- google_search_console, googledrive, supabase, github

### Secrets
- ENGINE_URL, ENGINE_API_KEY (cloud browser — working)
- BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID (legacy)
- VERCEL_TOKEN, VERCEL_TEAM_ID
- SUPABASE_ORG_ID, SUPABASE_ACCESS_TOKEN
- WIX_CHECKOUT_* (payments)

---

## 2. Critical Gaps (15 Found)

| # | Gap | Impact | Fix |
|---|-----|--------|-----|
| 1 | **No intent tier classification** — all leads treated the same | Partners get homeowner outreach; HOT leads sit in queue | Add `intent_tier` field: HOT / VERY_HOT / WARM / PARTNER / PROJECT / PROPERTY / SIGNAL. Validator agent classifies. |
| 2 | **Thin keyword vocabulary** — direct terms only ("epoxy flooring") | Misses indirect intent ("my garage floor is ugly", "looking for someone to do my driveway") | Expand to 80+ keywords including indirect/phrasal intent. Store in shared module. |
| 3 | **No seeded source library** — 1 manual Craigslist source | System finds almost nothing | Seed 20+ sources: FB groups (DFW, Austin, Houston), Craigslist cities, Reddit r/HomeImprovement, building dept portals, company directories. |
| 4 | **No lead validation / spam detection** | Spam, bots, ads, job postings hit outreach | Validator agent: spam check, duplicate detection, evidence verification, intent classification. |
| 5 | **No review queue for flagged leads** | No human-in-the-loop safety | Add `review_status` field (auto_approved / flagged / approved / rejected). UI review queue. |
| 6 | **No recursive source discovery** | Sources only grow manually | Scout agent: discovers new FB groups, forums, directories from existing lead content + web search. |
| 7 | **No morning digest / 5am briefing** | No executive briefing | Analyst agent + workflow: 5am ET digest email + in-app briefing. HOT/VERY_HOT → immediate outreach; PROJECT/PROPERTY → nurture. |
| 8 | **No reply monitoring** | Leads stay "outreach_sent" forever | Wire Gmail mailbox webhook → workflow → function that marks leads "responded". |
| 9 | **No agent orchestration** — chief_architect is generic | No autonomous operation, no executive assistant | Build 5 specialized agents (see §3). |
| 10 | **Service-request leads are dead ends** | Craigslist anonymizes contacts; homeowner leads wasted | For service_request leads without contact: capture screenshot + location, route to client's local Facebook group for organic reply + save for market intelligence. |
| 11 | **No CRM sync** — HubSpot authorized, unused | Leads don't reach client's pipeline | Sync validated leads to HubSpot contacts/deals via connector. |
| 12 | **No performance tracking / source quality scoring** | No self-improvement loop | Analyst agent: tracks conversion by source, promotes/demotes keywords, scores source quality, feeds back to Scout. |
| 13 | **Workflow runs 9am, not 5am** | Wrong delivery time | Change cron to `0 5 * * *` (5am ET). |
| 14 | **No screenshot evidence captured** | No proof of where lead was found | Enable screenshot in scrapePage, store `screenshot_url` on ScrapedLead. |
| 15 | **No cookie auth** — scrapePageWithCookies exists, unused | FB groups requiring login fail | Wire `auth_cookies` field on LeadSource → scrapePageWithCookies. Add UI to paste cookies. |

---

## 3. Agent Team Design (5 Agents)

Adapted from VisionCortex 13-agent council. 10 agents is over-engineering for a 5-stage pipeline. The other 5 "agents" from a 10-agent design are functions/workflows.

### The 5 Agents

#### 1. ORCHESTRATOR — The Executive Assistant
- **Role:** Your interface. Full access. Chat UI on Lead Engine page. Runs the pipeline, answers "what's hot today?", pauses outreach, adds sources, escalates to you.
- **Personality:** Direct, concise, executive-assistant tone. Surfaces what matters, hides what doesn't.
- **Tools:** Full CRUD on LeadSource + ScrapedLead. Invoke scrapeLeadSources, sendLeadOutreach, validateLeads, sendLeadDigest. Gmail connector (read replies). 
- **Chat UI:** Embedded in LeadEngine.jsx — collapsible chat panel.
- **Escalation:** To you (operator) when confidence < 70 or flagged leads need review.

#### 2. SCOUT — The Source Discoverer
- **Role:** Recursive source discovery. Finds new FB groups, forums, directories, building dept portals. Expands the source library autonomously.
- **Personality:** Relentlessly curious, pattern-seeking. "Here are 5 new sources I found, ranked by likely yield."
- **Tools:** Read LeadSource, create LeadSource. InvokeLLM (web search for new sources). Cloud browser (verify sources are real).
- **Trigger:** Weekly + on-demand from ORCHESTRATOR.
- **Output:** New LeadSource records (active=false until validated).

#### 3. VALIDATOR — The Quality Gate
- **Role:** Lead quality gate. Detects spam/dupes, verifies evidence, classifies intent tier, flags for review.
- **Personality:** Blunt, evidence-obsessed. "This is a bot. This is a real homeowner. This is a contractor prospect."
- **Tools:** Read + update ScrapedLead. InvokeLLM (spam detection, intent classification).
- **Trigger:** After every scrape (workflow step).
- **Output:** Updates `intent_tier`, `review_status`, `validation_notes` on ScrapedLead.
- **Confidence gate:** ≥ 70 → auto_approved. < 70 → flagged for review.

#### 4. DIPLOMAT — The Outreach Strategist
- **Role:** Writes personalized emails by tier, manages follow-up cadence, adapts tone from replies.
- **Personality:** Warm, persuasive, adaptive. Different voice for HOT homeowner vs. PARTNER contractor vs. PROJECT commercial.
- **Tools:** Read ScrapedLead, update ScrapedLead. Gmail connector (send). InvokeLLM (personalized email generation).
- **Trigger:** Daily workflow + on-demand from ORCHESTRATOR.
- **Output:** Sends outreach, updates status, schedules follow-ups.
- **Tier routing:**
  - HOT / VERY_HOT → immediate personalized outreach (same day)
  - WARM → standard outreach + 3 follow-ups
  - PARTNER → partnership-style outreach (subcontractor angle)
  - PROJECT / PROPERTY → long-term nurture sequence (monthly)

#### 5. ANALYST — The Performance + Self-Improvement Engine
- **Role:** Tracks conversion by source, promotes/demotes keywords, scores source quality, feeds learnings back to Scout. Generates the 5am digest.
- **Personality:** Empirical, probabilistic. "Source X converts at 12%, Source Y at 2% — demote Y."
- **Tools:** Read ScrapedLead + LeadSource. InvokeLLM (digest generation). SendEmail (digest to operator).
- **Trigger:** Daily 5am + weekly review.
- **Output:** 5am digest email + in-app briefing. Source quality scores. Keyword adjustments.

### Escalation Chain
```
SCOUT (discover sources) → HUNTER [function] (scrape) → VALIDATOR (quality gate)
  → DIPLOMAT (outreach by tier) → ANALYST (learn + feed back to SCOUT)
                    ↑ ORCHESTRATOR watches all, you chat with it ↓
```

### Confidence Gate
- Validator ≥ 70 → auto-approved for outreach
- Validator < 70 → flagged for review → you decide via ORCHESTRATOR chat
- Analyst source quality < 5% conversion over 30 days → Scout demotes source

---

## 4. Build Sequence

### Phase 1 — Foundation Fixes (gaps 1, 2, 3, 13, 14, 15)
1. Add `intent_tier` + `review_status` + `validation_notes` + `screenshot_url` fields to ScrapedLead entity
2. Add `auth_cookies` usage to scrapeLeadSources (wire scrapePageWithCookies)
3. Create `base44/shared/leadKeywords.ts` — 80+ keywords including indirect intent
4. Create `base44/shared/seedSources.ts` — 20+ seeded LeadSource records
5. Create `seedLeadSources` backend function — seeds the source library on first run
6. Update `Daily Lead Engine` workflow cron to `0 5 * * *` (5am ET)
7. Enable screenshots in scrapePage calls, store `screenshot_url`

### Phase 2 — Agent Team (gap 9)
1. Create `base44/agents/lead_engine_orchestrator.jsonc` — full access, chat UI
2. Create `base44/agents/lead_engine_scout.jsonc` — source discovery
3. Create `base44/agents/lead_engine_validator.jsonc` — quality gate
4. Create `base44/agents/lead_engine_diplomat.jsonc` — outreach strategist
5. Create `base44/agents/lead_engine_analyst.jsonc` — performance + digest
6. Create `base44/functions/validateLeads/entry.ts` — validation step (spam, tier, review)
7. Create `base44/functions/sendLeadDigest/entry.ts` — 5am digest email + in-app briefing
8. Add ORCHESTRATOR chat UI component to LeadEngine.jsx

### Phase 3 — Automation + Intelligence (gaps 4, 5, 7, 8, 11, 12)
1. Wire `validateLeads` into `Daily Lead Engine` workflow (after scrape, before outreach)
2. Create review queue UI in LeadEngine.jsx (flagged leads)
3. Wire Gmail mailbox webhook → `markLeadResponded` function → updates status
4. Create `base44/functions/syncLeadsToHubspot/entry.ts` — sync validated leads to CRM
5. Create `base44/functions/scoreSourceQuality/entry.ts` — source performance tracking
6. Wire Analyst's weekly source quality review into a workflow

### Phase 4 — Service-Request Lead Utilization (gap 10)
1. For service_request leads without contact: save screenshot + location
2. Route to client's local FB group for organic reply (Diplomat generates reply templates)
3. Save for market intelligence (Analyst tracks demand by area)

---

## 5. Validation Plan

After implementation, validate each:

### Foundation
- [ ] ScrapedLead entity has new fields (intent_tier, review_status, validation_notes, screenshot_url)
- [ ] leadKeywords.ts has 80+ keywords
- [ ] seedLeadSources function creates 20+ sources on first run
- [ ] Daily Lead Engine workflow cron = `0 5 * * *`
- [ ] scrapeLeadSources captures screenshots
- [ ] scrapeLeadSources uses auth_cookies when present

### Agents
- [ ] 5 agent config files exist with correct tool permissions
- [ ] ORCHESTRATOR chat UI renders on LeadEngine.jsx
- [ ] Each agent has a conversation UI or trigger

### Automation
- [ ] validateLeads runs in workflow after scrape
- [ ] Review queue shows flagged leads
- [ ] Gmail webhook marks leads "responded"
- [ ] syncLeadsToHubspot pushes to CRM
- [ ] scoreSourceQuality runs weekly
- [ ] 5am digest email sends

### End-to-End Test
- [ ] Run `scrapeLeadSources` manually → leads appear with tiers + screenshots
- [ ] Run `validateLeads` → spam flagged, tiers assigned
- [ ] Run `sendLeadOutreach` → HOT leads get same-day email, PROJECT leads get nurture
- [ ] Check ORCHESTRATOR chat → "what's hot today?" returns summary
- [ ] Wait for 5am workflow → digest email arrives
- [ ] Reply to outreach email → lead marked "responded"