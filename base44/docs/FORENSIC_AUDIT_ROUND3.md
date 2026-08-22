# Forensic Audit — Round 3 (Max Capability & Hardening)

Date: 2026-08-22 · Auditor: Base44 autonomous audit · Scope: full stack

## CRITICAL (revenue / data-loss / silent failure)

### C1 — `process.env` used in Deno backend functions (Supabase + Vercel provisioning silently fails)
- **Where:** `base44/shared/provisioning.ts` — `provisionSupabase()` (L175-176), `provisionVercel()` (L192-193)
- **What:** Uses `process.env.SUPABASE_ACCESS_TOKEN` / `process.env.VERCEL_TOKEN`. Backend functions run in Deno; the reliable env API is `Deno.env.get()`. `create-checkout` already uses `Deno.env.get`. When `process.env` is undefined, both functions throw "secrets missing" and provisioning silently fails — the known "Supabase/Vercel provisioning never works" symptom.
- **Fix:** `process.env.X` → `Deno.env.get("X")`. ✅ Applied.

### C2 — Caller-controlled `host` header used for email links (open-redirect in client emails)
- **Where:** `base44/functions/notifyPipelineStep/entry.ts` (L19-22), `base44/functions/submitRevisionRequest/entry.ts` (L31-34)
- **What:** Falls back to `https://${req.headers.get("host")}` for `appUrl` when the secret + `x-base44-app-url` header are absent. The Wix Payments docs explicitly forbid using caller-controlled `Origin`/`host` for return links — a spoofed host puts malicious links in client + admin emails.
- **Fix:** Remove the `host` fallback; use only the secret + platform header, falling back to `""` (emails omit links rather than send spoofed ones). ✅ Applied.

## HIGH

### H1 — Promo-code usage counter incremented non-atomically (oversell race)
- **Where:** `base44/functions/create-checkout/entry.ts` (L197-199)
- **What:** Reads `promo.usedCount`, then `update(id, { usedCount: usedCount + 1 })`. Two concurrent buyers can both read `usedCount = max-1`, both pass the `maxUses` check, and both checkout — overselling a limited promo.
- **Fix:** Atomic `$inc` via `updateMany({ code }, { $inc: { usedCount: 1 } })`. ✅ Applied.

### H2 — `getAdminEmails` lists ALL users then filters client-side (N+1 waste)
- **Where:** `base44/shared/pipelineNotifications.ts` (L45-52)
- **What:** `User.list()` returns every user in the app; the code then filters for admins in JS. For a growing user base this pulls unnecessary data on every step-completion + revision email.
- **Fix:** `User.filter({ role: "admin" })` — server-side filter. ✅ Applied.

### H3 — Backend functions used user-context integrations (autonomous pipelines 401 from workflows)
- **Where:** 35 backend functions — every `base44.integrations.Core.*` call (72 occurrences), including the autonomous clone/rank/SEO/citation pipelines (`cloneAndLaunch`, `autoCloneSerpCompetitors`, `autoOptimizeSites`, `runRankEngine`, `prospectBacklinks`, `monitorAiVisibility`, `extractRankingBlueprint`, `provisionApprovedClone`, etc.).
- **What:** `base44.integrations` runs as the authenticated user. Autonomous pipelines triggered from scheduled workflows have no user token, so every LLM/image/email call 401'd and the pipeline stalled silently. Client-facing generators happened to work only because a user was logged in.
- **Fix:** Converted all 72 `base44.integrations.*` → `base44.asServiceRole.integrations.*` across 35 functions. `asServiceRole.integrations` works with or without a user (matches `payments-webhook` and `generation.ts`), so every backend function now runs correctly from both the UI and workflows. ✅ Applied.

## MEDIUM

### M1 — `pushAllToMax` iterates up to 200 domains × 6 sequential function invokes (524 timeout)
- **Where:** `base44/functions/pushAllToMax/entry.ts`
- **What:** Known issue. Single-threaded loop over the whole portfolio; each domain invokes ~6 backend functions sequentially. Times out for >~30 domains.
- **Fix:** (Deferred — needs chunked/batched execution or a per-domain workflow.)

### M2 — `generation.ts` enqueue idempotency key is time+random (not idempotent)
- **Where:** `base44/shared/generation.ts` (L23)
- **What:** `idempotency_key` includes `Date.now()` + `Math.random()`, so a retried heartbeat creates duplicate jobs for the same logical input.
- **Fix:** (Deferred — needs deterministic key from input hash.)

### M3 — `usePortalPipeline` "auto" gate reads completion from `localStorage` (per-device)
- **Where:** `src/hooks/usePortalPipeline.js` (L65-67)
- **What:** "auto"/review steps are marked complete via `localStorage.getItem("coach:done:<path>")`. Switching devices or clearing storage loses completion state. Not server-persisted.
- **Fix:** (Deferred — needs a server-side "visited steps" array on the User/ClientProject.)

### M4 — `provisioning.ts` GitHub file push is sequential per-file (10 HTTP calls for 5 files)
- **Where:** `base44/shared/provisioning.ts` (L147-155)
- **What:** Check-then-PUT per file. Could batch via the Git Data API (single commit).
- **Fix:** (Deferred — low volume of files per site.)

## LOW

### L1 — `payments-webhook` admin notification sends one email per admin sequentially
- **Where:** `base44/functions/payments-webhook/entry.ts` (L211-229)
- **What:** N admins = N sequential `SendEmail` calls. Could parallelize with `Promise.all`.
- **Fix:** (Deferred — admin count is small.)

### L2 — `welcomeEmail` accepts an `email` param it never renders
- **Where:** `base44/shared/emailTemplates.ts` (L71-77)
- **What:** Dead parameter. Cosmetic.
- **Fix:** (Deferred.)

### L3 — `resilience.ts` `withTimeout` does not cancel the underlying operation
- **Where:** `base44/shared/resilience.ts` (L28-35)
- **What:** On timeout the promise rejects but the LLM/fetch keeps running to completion, wasting credits/compute.
- **Fix:** (Deferred — Deno `AbortController` plumbing needed.)

## Hardening applied this round
- ✅ C1: Deno.env.get in provisioning (Supabase + Vercel now actually read secrets)
- ✅ C2: Removed host-header fallback in pipeline email links (no more open-redirect in client/admin emails)
- ✅ H1: Atomic promo-code increment (no oversell under concurrency)
- ✅ H2: Server-side admin filter (no full-user scan on every pipeline email)
- ✅ H3: All 72 user-context integration calls → asServiceRole across 35 backend functions (autonomous pipelines no longer 401 from workflows)
- ✅ Webhook re-registered with ORDER_APPROVED + SUBSCRIPTION_CANCELED + SUBSCRIPTION_ENDED (cancellations now revoke access)

## Deferred (next round)
- M1: pushAllToMax chunking (524 timeout on large portfolios)
- M2: deterministic enqueue idempotency (duplicate jobs on heartbeat retry)
- M3: server-persisted "visited steps" (per-device localStorage completion)