import {
  Package, Building2, MessageSquareText, PenTool, Shirt, Palette, Share2,
  Video, LayoutTemplate, FileSignature, ShieldCheck, Rocket, Sparkles,
  LayoutDashboard, Settings, Compass, Box, FolderOpen,
  Cpu, Database, ClipboardCheck, Code, Server,
  Eye, ClipboardList,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// UNIVERSAL STEP LIBRARY
// The single source of truth for every possible client-portal step. Each
// product in the catalog declares which step keys it includes (see
// PRODUCT_STEPS below). The portal builds the journey dynamically from that
// list — so when you add a new package, you just list its step keys and the
// portal adapts automatically. No other code changes needed.
//
// `nextLabel` / `nextTo` are defaults only — getVisibleSteps() overrides
// them with computed values based on the actual next step in the product's
// list, so the chain is always correct regardless of which steps are included.
// ─────────────────────────────────────────────────────────────────────────

export const PORTAL_STEPS = {
  welcome: {
    key: "welcome",
    to: "/business-generator", label: "Welcome", icon: Package, gate: "auto",
    activityLabel: "Review your package",
    title: "Welcome to Your Build",
    body: "Here's everything included in your package. Review what's included, then continue to tell us about your business.",
    nextLabel: "Go to Business Name Studio", nextTo: "/business-name-studio",
  },
  "business-name": {
    key: "business-name",
    to: "/business-name-studio", label: "Business Name", icon: Compass, gate: "auto",
    activityLabel: "Find your business name & domain",
    title: "Find Your Business Name & Domain",
    body: "Our AI scans Google and state registries to recommend highly successful, potentially viral business names with available .com domains. Pick your favorite and we'll secure the URL for you.",
    nextLabel: "Go to Business Profile", nextTo: "/business-profile",
  },
  "business-profile": {
    key: "business-profile",
    to: "/business-profile", label: "Business Profile", icon: Building2, gate: "profile",
    activityLabel: "Complete your business profile",
    title: "Tell Us About Your Business",
    body: "Fill out your business details — industry, name, services, service area, logo and photos. Our team uses this to build everything else.",
    nextLabel: "Go to Strategy", nextTo: "/strategy",
  },
  vision: {
    key: "vision",
    to: "/vision", label: "Vision", icon: Eye, gate: "vision",
    activityLabel: "Generate and approve your vision",
    title: "Define Your Vision",
    body: "Before we build anything, we need a clear vision. What are we building? Why does it matter? Who is it for? What does success look like? Every downstream decision flows from this.",
    nextLabel: "Go to Strategy", nextTo: "/strategy",
  },
  strategy: {
    key: "strategy",
    to: "/strategy", label: "Strategy", icon: ClipboardList, gate: "strategy",
    activityLabel: "Generate and approve your strategy",
    title: "Define Your Strategy",
    body: "Now that we have a vision, we need a strategy to get there. How do we win? What's the plan? What are the risks? Every execution decision flows from this.",
    nextLabel: "Go to Content Generator", nextTo: "/content-generator",
  },
  content: {
    key: "content",
    to: "/content-generator", label: "Content Generator", icon: MessageSquareText, gate: "content",
    activityLabel: "Pick your content tone",
    title: "Choose Your Website's Voice",
    body: "We researched your market — competitors, pricing, and what local customers respond to — and wrote 10 different messaging tones. Pick the one that fits your business. We've recommended the best one.",
    nextLabel: "Go to Logo Generator", nextTo: "/logo-generator",
  },
  logo: {
    key: "logo",
    to: "/logo-generator", label: "Logo Generator", icon: PenTool, gate: "logo",
    activityLabel: "Pick your logo",
    title: "Pick Your Logo",
    body: "We generated 10 logo concepts for your business. All are created with transparent backgrounds so they look perfect on any website theme. Tap the one that feels right.",
    nextLabel: "Go to Brand Generator", nextTo: "/brand-generator",
    // Stage-aware: skip logo generation for rebranding clients (they keep their existing logo)
    skipIf: (user) => user?.epoxyProfile?.businessStage === "rebrand",
  },
  brand: {
    key: "brand",
    to: "/brand-generator", label: "Brand Generator", icon: Shirt, gate: "brand",
    activityLabel: "Approve your brand mockups",
    title: "See Your Brand Come to Life",
    body: "We applied your logo to 10 real-world mockups — business cards, brochures, apparel, a vehicle wrap and more. All are included. Don't like one? Regenerate just that item.",
    nextLabel: "Go to Website Design", nextTo: "/design-direction",
  },
  website: {
    key: "website",
    to: "/design-direction", label: "Website Design", icon: Palette, gate: "design",
    activityLabel: "Pick your website design",
    title: "Pick Your Website Design",
    body: "We wrote your site copy from your onboarding and real local data, then designed 10 distinct website layouts with your logo and brand colors. Preview each (desktop + mobile), hover any section to comment or regenerate just that part, and pick the one you love.",
    nextLabel: "Go to Social Media", nextTo: "/social-media",
  },
  social: {
    key: "social",
    to: "/social-media", label: "Social Media", icon: Share2, gate: "social",
    activityLabel: "Approve your social media pack",
    title: "Your Social Media Brand Kit",
    body: "We designed 10 on-brand social templates with your logo — profile, cover, stories, posts, favicon, icons — plus a full 30-day content calendar with captions and best posting times. All included.",
    nextLabel: "Go to Video Generator", nextTo: "/video-generator",
  },
  video: {
    key: "video",
    to: "/video-generator", label: "Video Generator", icon: Video, gate: "video",
    activityLabel: "Approve your video concepts",
    title: "Your Video Concepts",
    body: "We created 10 video concepts using your onboarding, content tone, logo, and brand. Preview each, generate the actual video for any you like, and use them on your site, social media, or YouTube.",
    nextLabel: "Go to Enhancements", nextTo: "/enhancements",
  },
  "your-designs": {
    key: "your-designs",
    to: "/your-designs", label: "Your Designs", icon: LayoutTemplate, gate: "auto",
    activityLabel: "Review your finished brand package",
    title: "Your Finished Brand Package",
    body: "Everything you picked — your content tone, logo, brand mockups, website design, social media kit, and videos — is compiled here. Review it all, then continue to sign your agreement.",
    nextLabel: "Go to Sign Agreement", nextTo: "/signatures",
  },
  enhancements: {
    key: "enhancements",
    to: "/enhancements", label: "Enhancements", icon: Sparkles, gate: "auto",
    activityLabel: "Choose optional add-ons",
    title: "Enhance Your Package",
    body: "Browse every AI tool and add-on available for your business. Try a live, branded demo of each, check the ones you want, and approve to add them to your contract before signing.",
    nextLabel: "Go to Your Designs", nextTo: "/your-designs",
  },
  signatures: {
    key: "signatures",
    to: "/signatures", label: "Sign Agreement", icon: FileSignature, gate: "signatures",
    activityLabel: "Sign your service agreement",
    title: "Sign Your Service Agreement",
    body: "Review and sign your service agreement below. You must sign all pending documents before we can begin building. Need to change something? Go back to any step.",
    nextLabel: "Go to Design Approval", nextTo: "/approvals",
  },
  approvals: {
    key: "approvals",
    to: "/approvals", label: "Design Approval", icon: ShieldCheck, gate: "approvals",
    activityLabel: "Approve your website design",
    title: "Approve Your Website Design",
    body: "Review and approve your website design below. Nothing goes live until you approve it.",
    nextLabel: "Go to Launch", nextTo: "/receipts",
  },
  launch: {
    key: "launch",
    to: "/receipts", label: "Launch", icon: Rocket, gate: "auto",
    activityLabel: "Track your launch",
    title: "Your Website Is Launching",
    body: "Every action your team takes to build and launch your website is logged here for full transparency.",
    nextLabel: null, nextTo: null,
  },
  // ── System build steps (web_app / ecommerce / platform) ──
  "system-architecture": {
    key: "system-architecture",
    to: "/system-architecture", label: "Architecture", icon: Cpu, gate: "architecture",
    activityLabel: "Generate system architecture",
    title: "System Architecture",
    body: "The AI designs a complete blueprint — tech stack, pages, data models, features, and integrations — for your product.",
    nextLabel: "Go to Data Model", nextTo: "/data-model",
  },
  "data-model": {
    key: "data-model",
    to: "/data-model", label: "Data Model", icon: Database, gate: "data_model",
    activityLabel: "Generate data model",
    title: "Data Model",
    body: "The AI refines the architecture into detailed entity schemas with validation rules, indexes, relationships, seed data, and API endpoints.",
    nextLabel: "Go to UI System", nextTo: "/ui-system",
  },
  "ui-system": {
    key: "ui-system",
    to: "/ui-system", label: "UI System", icon: Palette, gate: "ui_system",
    activityLabel: "Generate UI design system",
    title: "UI Design System",
    body: "The AI designs a complete design system — color palette, typography, spacing, component library, layout patterns, and responsive breakpoints.",
    nextLabel: "Go to Codegen", nextTo: "/codegen",
  },
  "codegen": {
    key: "codegen",
    to: "/codegen", label: "Codegen", icon: Code, gate: "codegen",
    activityLabel: "Generate codebase manifest",
    title: "Code Generation",
    body: "The AI maps every file in the codebase — pages, components, hooks, API routes, configs, tests — with implementation notes and dependencies.",
    nextLabel: "Go to Deploy", nextTo: "/deploy",
  },
  "deploy": {
    key: "deploy",
    to: "/deploy", label: "Deploy", icon: Server, gate: "deploy",
    activityLabel: "Configure deployment",
    title: "Deployment",
    body: "The system generates build settings, environment variables, routing config, and a preview deployment URL.",
    nextLabel: "Go to Review", nextTo: "/system-review",
  },
  "system-review": {
    key: "system-review",
    to: "/system-review", label: "Review", icon: ClipboardCheck, gate: "auto",
    activityLabel: "Review the system build",
    title: "System Review",
    body: "Review the complete system blueprint and finalize the build.",
    nextLabel: "Go to Launch", nextTo: "/receipts",
  },
};

// ─────────────────────────────────────────────────────────────────────────
// PRODUCT → STEP MAPPING
// Each productId (matching create-checkout + serviceCatalog) maps to the
// ordered list of step keys that product's portal includes. When you create
// a new package, add its productId here with the steps it should show.
// ─────────────────────────────────────────────────────────────────────────

// Standard build — no social media or video pack. Enhancements appear
// BEFORE Your Designs so the customer can add optional AI tools and add-ons
// to their contract before reviewing the final package and signing.
const FULL_BUILD = [
  "welcome", "business-name", "business-profile", "strategy", "content", "logo", "brand", "website",
  "enhancements", "your-designs", "signatures", "approvals", "launch",
];

// Build with social media + video pack included
const FULL_BUILD_PLUS_MEDIA = [
  "welcome", "business-name", "business-profile", "strategy", "content", "logo", "brand", "website",
  "social", "video", "enhancements", "your-designs", "signatures",
  "approvals", "launch",
];

// System build pipeline (web_app / ecommerce / platform).
// profile → vision → strategy → architecture → data-model → ui-system → codegen → deploy → review → launch
const SYSTEM_BUILD = [
  "welcome", "business-profile", "strategy", "system-architecture", "data-model", "ui-system", "codegen", "deploy", "system-review", "launch",
];

export const PRODUCT_STEPS = {
  "elite-monthly": FULL_BUILD,
  "elite-annual": FULL_BUILD,
  "pro-monthly": FULL_BUILD,
  "pro-annual": FULL_BUILD,
  "web-pack": FULL_BUILD,
  "app-pack": FULL_BUILD_PLUS_MEDIA,
  "deposit": FULL_BUILD_PLUS_MEDIA,
  "ai-tool": FULL_BUILD,
  // Demo mode — full build with social + video so users experience everything,
  // but paywalled at finalization (YourDesigns → pricing redirect).
  "demo": FULL_BUILD_PLUS_MEDIA,
  // ── System build pipelines (web_app / ecommerce / platform) ──
  "web_app": SYSTEM_BUILD,
  "ecommerce": SYSTEM_BUILD,
  "platform": SYSTEM_BUILD,
};

// Fallback for users with no purchase and no plan. grantStarterAccess now
// grants "demo" plan (full workflow, paywalled at finalization); this fallback
// covers edge cases where a user has no plan at all.
export const DEFAULT_STEPS = FULL_BUILD_PLUS_MEDIA;

// Utility nav items (not part of the build journey)
export const CLIENT_UTILITIES = [
  { to: "/client-portal", label: "Client Portal", icon: LayoutDashboard, end: true },
  { to: "/projects", label: "My Projects", icon: FolderOpen, end: true },
  { to: "/social-media-studio", label: "Social Media Studio", icon: Share2, end: true },
  { to: "/walkthrough-studio", label: "3D Walkthrough", icon: Box, end: true },
  { to: "/settings", label: "Settings", icon: Settings, end: true },
];

// Look up the ordered step keys for a productId (falls back to DEFAULT_STEPS)
export function getProductStepKeys(productId) {
  return PRODUCT_STEPS[productId] || DEFAULT_STEPS;
}

// Get a step definition by its route path
export function getStepByPath(path) {
  return Object.values(PORTAL_STEPS).find((s) => s.to === path) || null;
}

// Check if a step should be skipped for this user's stage
export function shouldSkipStep(step, user) {
  if (step?.skipIf && step.skipIf(user)) return true;
  return false;
}