# Xtreme AI — Builder Agent Handoff

## What This App Is

**Xtreme AI** is a PWA (Progressive Web App) that serves as an AI-guided business-building studio for small local service businesses (roofing, HVAC, epoxy, plumbing, dental, legal, etc.). It's a mobile-first client portal wrapped in a phone-frame device shell, where a client walks through a guided pipeline that generates their business name, brand identity, website, social media content, and video assets — all powered by AI generators.

The app is a **stripped-down fork** of the "Lead Gen Near You" system, containing ONLY the client portal experience. All admin dashboards, CRM, SEO tooling, autonomous engines, and build systems have been removed. This is a clean, single-purpose app.

---

## The Mobile Device Shell (XtremeShell)

The entire app renders inside a **phone-frame device shell** — a 390px-wide mobile container centered on a dark stage. This is the signature UX element.

### File: `src/components/xtremeai/XtremeShell.jsx`

The shell has three regions:
1. **Brandbar** (top, 52px) — Xtreme AI logo, back button, action icons
2. **Main content** (scrollable middle) — renders the current route via `<Outlet />`
3. **Bottom tab bar** (60px) — 5 tabs: Home, Build, Brand, Assets, More

The "More" tab opens a drawer with secondary navigation (signatures, approvals, walkthroughs, etc.).

### CSS: `src/index.css` (`.xa-*` classes)

All shell styles live in `src/index.css` under the `.xa-*` prefix:
- `.xa-stage` — the fixed full-screen dark backdrop
- `.xa-device` — the 390px phone frame (max-height 880px)
- `.xa-screen` — grid layout: `52px / 1fr / 60px`
- `.xa-brandbar` — top bar with logo + back button
- `.xa-main` — scrollable content area
- `.xa-nav` — bottom tab bar (grid of buttons)
- `.xa-drawer` — "More" bottom sheet drawer

### Brand accent: Metallic Gold (#FDE047)

The brand color is **yellow-gold** (`#fde047`), used on:
- Active tab indicators and icons
- Primary buttons (`.xa-gold` gradient class)
- Section headers and accents
- Hover states (gold border + glow on cards)

Supports **dark and light mode** via the `.dark` class on `<html>` (toggled by ThemeContext). Light mode remaps hardcoded dark utilities (`bg-black`, `text-white`, etc.) to theme tokens via CSS overrides in `index.css`.

---

## The Pipeline (Client Journey)

A client walks through a guided pipeline of steps. Each step is a page that generates or collects something, then advances.

### File: `src/lib/portalStudioSteps.js`

Defines the step sequence for the Portal Studio (admin sandbox) pipeline:
```
welcome → business-name → business-profile → content → logo → brand →
website → social → video → enhancements → your-designs → signatures →
approvals → launch
```

### File: `src/lib/clientSteps.js`

Defines the client-facing pipeline (same steps, client-facing labels).

### How steps work

Each step:
1. Has a `key`, `label`, `icon` (lucide-react), `to` (route path), `body` (description), and optional `gate` (approval tier)
2. Tracks completion via `visited_steps` array on the project record (server-persisted)
3. Shows a **StepCoach** — a guided walkthrough modal that explains the step, then a bottom bar with "Mark complete & continue"

### Pipeline hooks

- `src/hooks/usePortalStudioPipeline.js` — computes step states (completed, current, locked) for the Portal Studio
- `src/hooks/usePortalPipeline.js` — same for the client portal
- `src/hooks/useStepGate.js` — checks approval gates (green/yellow/red tiers)

---

## The Two Contexts

### 1. Client Portal (production)

The real client experience. Clients log in, see their project, walk the pipeline.

- **Entity**: `ClientProject` (one per client, keyed by `client_email`)
- **Layout**: `src/components/client/ClientLayout.jsx` — client sidebar timeline + step coach
- **Pages**: `src/pages/Dashboard.jsx`, `MyPackage.jsx`, `BusinessNameStudio.jsx`, `ContentGenerator.jsx`, `LogoGenerator.jsx`, `BrandGenerator.jsx`, `DesignDirection.jsx`, `SocialMediaGenerator.jsx`, `VideoGenerator.jsx`, `YourDesigns.jsx`, `Enhancements.jsx`, `Signatures.jsx`, `WalkthroughStudio.jsx`, `Assistant.jsx`
- **Auth-gated**: wrapped in `<ProtectedRoute>`

### 2. Portal Studio (admin sandbox)

An isolated clone of the client portal where admins refine, harden, and brand the experience without touching real client data.

- **Entity**: `PortalStudioProject` (sandbox projects, admin-only RLS)
- **Layout**: `XtremeShell` (the mobile device shell) — NOT ClientLayout
- **Pages**: `src/pages/portalstudio/PortalStudio.jsx` (project picker + dashboard), `PortalStudioStep.jsx` (placeholder for each step)
- **Context**: `src/lib/PortalStudioContext.jsx` — manages the active sandbox project
- **Routes**: `/portal-studio`, `/portal-studio/welcome`, `/portal-studio/business-name`, etc.

**Key difference**: Portal Studio uses the XtremeShell mobile frame; the client portal uses ClientLayout. Both walk the same pipeline steps, but read/write different entity types (PortalStudioProject vs ClientProject).

---

## Entities (14 total)

| Entity | Purpose |
|--------|---------|
| **ClientProject** | All generated assets for a client (content, logo, brand, website, social, video), keyed by `client_email`. RLS: client sees own, admin sees all. |
| **PortalStudioProject** | Sandbox project for admin refinement. Admin-only RLS. |
| **SocialAccount** | Client's connected social media accounts (IG, FB, Google Business, etc.) |
| **SocialMediaAsset** | Media library items (uploaded or AI-generated) for social posts |
| **ClientDomain** | AI-recommended business names + domain purchase tracking |
| **RevisionThread** | Two-way messaging between client and admin for revision requests |
| **Approval** | Approval gates (green/yellow/red) that block pipeline steps until decided |
| **WalkthroughProject** | AI-powered 3D walkthrough projects from uploaded space images |
| **Base44Purchase** | Payment records from Wix/Base44 Payments checkout |
| **PromoCode** | Discount codes (percentage or fixed) for checkout |
| **ServiceCatalogEntry** | Backend catalog of products/services with full descriptions, SEO/AEO metadata |
| **EsignDocument** | E-signature documents sent to clients |
| **Receipt** | Payment receipts |
| **User** | Built-in user entity (read-only) |

---

## Backend Functions (35 total)

### Generators (AI-powered)
- `recommendBusinessNames` — AI business name generation + domain research pipeline
- `checkDomainAvailability` — RDAP domain availability check
- `generateContentTemplates` — 10 content tone variations
- `generateWebsiteContent` — hero, about, services, FAQ copy
- `generateSocialMediaPack` — social templates + 30-day calendar
- `generateVideoPack` — video concept generation
- `generateBeforeAfter` — before/after image generation
- `regenerateWebsiteImages` / `regenerateWebsiteSection` — re-gen specific parts
- `generateWalkthrough` — 3D walkthrough from images
- `getWalkthroughByToken` — public walkthrough viewer lookup
- `generateContract` / `autoGenerateClientContract` — client contract generation
- `generateInvoice` — invoice generation
- `generate-seo-page` — SEO landing page generation
- `run-free-audit` — free website audit tool

### Pipeline & Notifications
- `getPipelineSignals` / `getPipelineStatus` — pipeline state queries
- `notifyPipelineStep` — notifies on step changes
- `notifyApprovalPending` / `notifyApprovalDecided` — approval flow notifications
- `notifyThreadMessage` — revision thread message notifications
- `notifyAccountChange` — account change notifications
- `submitRevisionRequest` — client submits a revision request

### Onboarding & Intelligence
- `getIndustryOnboarding` — industry-specific onboarding questions
- `getFinancialIntelligence` — financial profiling for the business
- `seedServiceCatalog` — seeds the service catalog entries
- `websiteQualityGate` — website quality validation

### Auth & Access
- `onUserSignup` — fires on new user signup (grants starter access)
- `grantStarterAccess` — grants initial access tier

### Payments (Wix/Base44 Payments)
- `create-checkout` — creates a Wix checkout session (public, no auth gate)
- `payments-webhook` — handles `ORDER_APPROVED`, `SUBSCRIPTION_CANCELED`, `SUBSCRIPTION_ENDED` — grants/revokes access
- `validate-promo-code` — validates a promo code at checkout
- `send-coupon-email` — sends coupon emails

### E-Sign
- `sendEsignRequest` — sends an e-sign request
- `esignPortal` — public signing portal endpoint

---

## Routes

### Public (no auth)
- `/` — Marketing landing page
- `/pricing` — Pricing page
- `/ThankYou` — Post-purchase thank you
- `/seo/:slug` — SEO landing pages
- `/coupon` — Coupon page
- `/free-audit` — Free audit tool
- `/free-tools` — Free tools page
- `/sign/:token` — E-sign portal (public)
- `/walkthrough/:token` — Walkthrough viewer (public)
- `/login`, `/register`, `/forgot-password`, `/reset-password`

### Authenticated (client portal)
- `/client-portal` — Dashboard
- `/my-package` — Client's purchased package
- `/assistant` — AI assistant chat
- `/business-profile` — Business profile setup
- `/business-name-studio` — Business name generator
- `/walkthrough-studio` — 3D walkthrough creator
- `/content-generator` — Content tone templates
- `/logo-generator` — Logo generation
- `/brand-generator` — Brand pack generation
- `/design-direction` — Design direction picker
- `/social-media` — Social media pack
- `/social-media-studio` — Social media calendar/studio
- `/video-generator` — Video pack
- `/your-designs` — All generated designs
- `/enhancements` — Enhancement add-ons
- `/signatures` — Signature pad
- `/esign/documents` — E-sign documents list

### Portal Studio (admin sandbox, inside XtremeShell)
- `/portal-studio` — Project picker + dashboard
- `/portal-studio/welcome` → `/portal-studio/launch` — Each pipeline step

---

## PWA Configuration

- **Manifest**: `public/manifest.json` — name "Xtreme AI", display standalone, gold theme color
- **Service Worker**: `public/sw.js` — offline caching
- **Icons**: configured in manifest (192px, 512px)
- **Mobile-optimized**: 390px device shell, touch-friendly, bottom tab bar

---

## Design System

### Colors (CSS tokens in `src/index.css`)
- `--primary`: `84 100% 59%` (lime green — legacy LGNY accent, still mapped)
- **Xtreme AI accent**: `#fde047` (yellow-gold) — used via `.xa-gold` classes and hardcoded in Portal Studio components
- Dark mode: pure black background (`0 0% 0%`), white text
- Light mode: white background, black text (via CSS overrides)

### Typography
- System sans-serif (no custom font loaded)
- Font roles: `--font-heading`, `--font-body`, `--font-display` all map to system UI

### Components
- **shadcn/ui** — all UI primitives in `src/components/ui/`
- **lucide-react** — all icons
- **Image component** (`src/components/ui/image.jsx`) — Wix Media Platform-aware, serves resized WebP

---

## How to Work on This App

### To refine the Portal Studio (admin sandbox)
1. Navigate to `/portal-studio` — you'll see the project picker inside the mobile shell
2. Create a project or open an existing one
3. Walk the pipeline steps — each step is currently a placeholder (`PortalStudioStep.jsx`) that needs to be replaced with a real cloned page (BusinessNameStudio, ContentGenerator, etc.)
4. The shell's bottom tab bar navigates between sections

### To refine the client portal
1. Log in as a client (or use "Preview as Client" from the admin layout)
2. Walk the real pipeline at `/client-portal` → `/business-name-studio` → etc.
3. These pages use `ClientLayout` (sidebar timeline), not the mobile shell

### To change the brand
- **Gold accent**: change `#fde047` in `src/index.css` (`.xa-*` classes) and in Portal Studio components
- **Logo**: update `src/lib/brandAssets.js` (`XTREME_AI_LOGO` constant)
- **App name**: update `public/manifest.json` and `index.html`

### To add a new pipeline step
1. Add the step to `src/lib/portalStudioSteps.js` (and `clientSteps.js` if client-facing)
2. Add a route in `src/App.jsx` under the Portal Studio route group
3. Create the step page (clone from an existing step or build new)

---

## Known Issues & Notes

- **Portal Studio steps are placeholders** — `PortalStudioStep.jsx` is a generic placeholder. Each step needs to be replaced with a real cloned page that reads/writes the `PortalStudioProject` entity instead of `ClientProject`.
- **Two entity types** — Portal Studio uses `PortalStudioProject`, client portal uses `ClientProject`. Generator functions may need to be adapted to write to the correct entity.
- **No admin dashboard** — this app has no admin panel. Admin functions (approving revisions, managing clients) would need to be added if required.
- **Payments are live** — Wix/Base44 Payments checkout is wired up. The webhook grants access on payment. Never gate checkout on auth.
- **GitHub repo**: `XTREME-SYSTEMS/xtreme-ai` — currently a one-time export, not auto-synced. Set up 2-way GitHub sync from the Base44 dashboard for automatic syncing.

---

## File Map (key files)

```
src/
  components/
    xtremeai/XtremeShell.jsx          ← The mobile device shell
    portalstudio/                      ← Portal Studio layout components
    client/                            ← Client portal components (timeline, coach, etc.)
    ui/                                ← shadcn/ui primitives
  pages/
    portalstudio/                      ← Portal Studio pages (sandbox)
    Dashboard.jsx, MyPackage.jsx, etc. ← Client portal pages
    Login.jsx, Register.jsx, etc.     ← Auth pages
    Marketing.jsx, Pricing.jsx         ← Public pages
  lib/
    PortalStudioContext.jsx            ← Portal Studio state provider
    portalStudioSteps.js               ← Pipeline step definitions (sandbox)
    clientSteps.js                     ← Pipeline step definitions (client)
    brandAssets.js                     ← Logo/brand URLs
  hooks/
    usePortalStudioPipeline.js         ← Pipeline state (sandbox)
    usePortalPipeline.js               ← Pipeline state (client)
  index.css                            ← Theme tokens + .xa-* shell styles
  App.jsx                              ← Router (all routes)

base44/
  entities/
    PortalStudioProject.jsonc          ← Sandbox project entity
    ClientProject.jsonc                ← Client project entity
    (+ 12 more)
  functions/                           ← 35 backend functions
  config.jsonc                         ← App config

public/
  manifest.json                        ← PWA manifest
  sw.js                                ← Service worker
```

---

## Summary

Xtreme AI is a **mobile-first PWA** that wraps a client portal in a phone-frame device shell. Clients walk a guided AI pipeline (name → brand → website → social → video) with approval gates and revision threads. The Portal Studio is an admin sandbox that mirrors the client experience inside the same mobile shell for refinement and branding work. The app is a clean fork — no admin dashboards, CRM, or autonomous engines — just the client portal and its generators.