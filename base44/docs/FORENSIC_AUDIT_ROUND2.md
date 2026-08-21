# Deep Forensic Audit — 2026-08-21 (Round 2)

## EXECUTIVE SUMMARY

All 8 previously deferred gaps have been implemented. This second-round audit
validates the implementations and identifies new gaps introduced by the changes,
plus remaining recommendations for production hardening.

---

## ✅ IMPLEMENTED — All 8 Deferred Gaps

### D1. ClientProject Entity ✅
- **Entity created**: `base44/entities/ClientProject.jsonc` with RLS (client owns record, admin reads all)
- **Hook created**: `useClientProject` — loads/creates/updates the project for the effective user
- **Wired into BusinessProfile**: On profile submit, a ClientProject is created with all profile data
- **Status**: Entity exists and is populated, but generation pages still read from User record (gradual migration — see gap G1)

### D2. Stage-Aware Flow ✅
- **skipIf added** to logo step: rebranding clients skip logo generation
- **shouldSkipStep helper** in clientSteps.js
- **useStepGate updated**: skipped steps auto-pass the gate
- **StepCoach updated**: no coach modal for skipped steps
- **Status**: Rebrand clients skip the logo step entirely

### D3. Track-Aware Steps ✅
- **tracks property** added to social + video steps (excluded from web-pack)
- **getVisibleSteps helper** filters by track + stage
- **ClientTimeline updated**: uses getVisibleSteps, shows correct step count
- **Status**: Web-pack clients don't see social media or video steps

### D4. Asset Download ✅
- **Download buttons** added to YourDesigns for logo, brand mockups, social templates
- **Download all** buttons for brand and social sections
- **DesignSection component** extended with onDownload prop
- **Status**: Clients can download their assets

### D5. Draft Saving ✅
- **localStorage auto-save** on every form change (500ms debounce)
- **Auto-restore** on mount
- **Clear on submit** — draft removed when profile is saved
- **Status**: BusinessProfile wizard progress survives page refresh

### D6. Two-Way Messaging ✅
- **RevisionThread entity** created with RLS
- **useRevisionThreads hook** — loads, creates, sends messages
- **RevisionThreadPanel component** — chat UI with message bubbles
- **submitRevisionRequest updated** — creates a thread on every revision
- **MyPackage updated** — shows thread panel after revision is sent
- **Status**: Clients can send messages and see replies (admin UI pending — see gap G2)

### D7. Auto Contract Generation ✅
- **autoGenerateClientContract backend function** created
- Uses claude_opus_4_8 for high-quality contract generation
- Idempotent — returns existing doc if one already exists
- Personalizes scope based on businessStage (new/rebrand/scale)
- **Signatures page updated** — auto-triggers when client has no docs
- **Status**: Tested and working — creates EsignDocument with generated contract body

### D8. Dynamic Enhancements ✅
- **dynamicEnhancements.js** created with industry-specific catalogs
- 7 industry categories: home-services, contracting, professional-services, retail, health-wellness, automotive, food-hospitality
- **Recommended items** pre-selected and surfaced first
- **Enhancements page updated** — uses dynamic catalog, shows "Recommended" badges
- **Status**: Industry-specific enhancements with pre-selection

---

## 🔴 NEW GAPS IDENTIFIED (Round 2)

### G1. ClientProject Not Yet Used by Generation Pages
**Severity**: Medium
**Impact**: Data duplication — ClientProject is created but generation pages (ContentGenerator, LogoGenerator, BrandGenerator, SocialMediaGenerator, VideoGenerator, WebsiteDesignStudio) still read/write to the User record.
**Fix**: Migrate generation pages to read from ClientProject first, falling back to User. Update useClientUpdate to also write to ClientProject.
**Effort**: 2-3 hours

### G2. Admin-Side Revision Thread UI Missing
**Severity**: Medium
**Impact**: Clients can send messages, but admins have no UI to read or reply to revision threads. Admins would need to query the RevisionThread entity directly.
**Fix**: Add a RevisionThreadPanel to the admin Approvals page, showing threads with reply capability.
**Effort**: 1 hour

### G3. StepCoach nextTo Doesn't Skip Filtered Steps
**Severity**: Low
**Impact**: When a step is filtered out by track (e.g., social media for web-pack), the previous step's nextTo still points to it. The user briefly lands on the filtered page before the gate auto-passes.
**Fix**: Compute nextTo dynamically based on visible steps instead of hardcoded nextTo.
**Effort**: 30 min

### G4. No Email Notification on Revision Thread Messages
**Severity**: Low
**Impact**: When a client sends a message in a revision thread, admins aren't notified via email. They'd have to check the Approvals page manually.
**Fix**: Create a backend function that sends email notifications on new thread messages.
**Effort**: 30 min

### G5. Asset Download Cross-Origin Limitation
**Severity**: Low
**Impact**: The download attribute on anchor tags may not work for cross-origin images (media.base44.com). The browser may open the image in a new tab instead of downloading.
**Fix**: Create a backend function that proxies the download with proper Content-Disposition headers.
**Effort**: 30 min

### G6. Auto-Contract Has No Admin Review
**Severity**: Low
**Impact**: The contract is auto-generated and sent to the client without admin review. An admin might want to edit the contract before it's sent.
**Fix**: Add a governance tier — auto-generated contracts start as "draft" and require admin approval before being sent to the client. Or add an admin notification with an edit link.
**Effort**: 1 hour

### G7. Draft Restore Has No User Prompt
**Severity**: Low
**Impact**: The draft is auto-restored silently. If a user intentionally abandoned a draft and starts fresh, they'll see old data without knowing why.
**Fix**: Show a "Restore previous draft?" prompt when a draft exists.
**Effort**: 15 min

### G8. Enhancements Not Connected to Checkout
**Severity**: Medium
**Impact**: Selected enhancements are saved to the user profile but there's no checkout flow to charge for them. The team invoices manually.
**Fix**: Wire enhancements into create-checkout to charge for them at selection time.
**Effort**: 2 hours

---

## 🟡 REMAINING RECOMMENDATIONS (Pre-Presentation Quick Wins)

### R1. Add Admin Revision Thread Panel (G2)
Most visible gap for the presentation. Admins need to see and reply to client messages.

### R2. Fix StepCoach nextTo for Filtered Steps (G3)
Quick fix — compute next visible step dynamically.

### R3. Add Draft Restore Prompt (G7)
Quick UX improvement — 15 min.

### R4. Test the Full Client Journey End-to-End
Walk through the entire 13-step flow as a client to verify all changes work together:
- Business Profile (with draft saving)
- Content Generator
- Logo Generator (verify skip for rebrand)
- Brand Generator
- Website Design
- Social Media (verify skip for web-pack)
- Video Generator (verify skip for web-pack)
- Your Designs (verify download buttons)
- Enhancements (verify dynamic recommendations)
- Signatures (verify auto-contract)
- Approvals
- Receipts

---

## 📊 VALIDATION RESULTS

| Gap | Implementation | Tested | Status |
|-----|---------------|--------|--------|
| D1 ClientProject | Entity + hook + wired | Entity created | ✅ |
| D2 Stage-aware | skipIf + gate + coach | Logic verified | ✅ |
| D3 Track-aware | tracks + getVisibleSteps | Timeline updated | ✅ |
| D4 Asset download | Download buttons | UI added | ✅ |
| D5 Draft saving | localStorage | Logic verified | ✅ |
| D6 Two-way msg | Entity + hook + UI | Thread created on revision | ✅ |
| D7 Auto contract | Backend function | **Tested — 200 OK** | ✅ |
| D8 Dynamic enh | Industry catalogs | UI updated | ✅ |

---

## 🏗️ ARCHITECTURE NOTES

### New Entities
- **ClientProject**: Offloads creative work from User record. One per client, keyed by client_email.
- **RevisionThread**: Two-way messaging between client and admin. Linked to pipeline step.

### New Backend Functions
- **autoGenerateClientContract**: Auto-creates EsignDocument with AI-generated contract body.

### New Hooks
- **useClientProject**: Loads/creates/updates ClientProject for effective user.
- **useRevisionThreads**: Loads/creates RevisionThreads, sends messages.

### New Components
- **RevisionThreadPanel**: Chat UI with message bubbles, send box, auto-scroll.

### New Lib Modules
- **dynamicEnhancements**: Industry-specific enhancement catalogs with recommendations.

### Updated Files
- BusinessProfile.jsx — draft saving + ClientProject creation
- YourDesigns.jsx — download buttons
- Enhancements.jsx — dynamic industry-aware catalog
- clientSteps.js — skipIf, tracks, getVisibleSteps, shouldSkipStep
- useStepGate.js — stage-aware skip
- StepCoach.jsx — skip coach for filtered steps
- ClientTimeline.jsx — track-aware step filtering
- Signatures.jsx — auto-contract generation
- MyPackage.jsx — revision thread panel
- submitRevisionRequest — creates RevisionThread
- pipelineNotify.js — analytics tracking (from round 1)
- ClientLayout.jsx — error boundary (from round 1)