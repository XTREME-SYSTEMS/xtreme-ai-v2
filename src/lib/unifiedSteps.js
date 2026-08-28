import { PORTAL_STEPS, PRODUCT_STEPS } from "@/lib/portalSteps";

// ─────────────────────────────────────────────────────────────────────────
// UNIFIED STEP NUMBERING — the single source of truth for step numbers
// across the admin, client portal, and employee portal. Every portal
// references these same fixed numbers so "Step 5" means the same thing
// whether the admin, the client, or the employee is looking at it.
//
// Based on the full build journey (FULL_BUILD_PLUS_MEDIA / "demo" product),
// the superset of all build steps. Products that skip steps (e.g. no
// social/video) simply hide those numbers — the remaining steps keep their
// canonical number so the count stays in sync across portals.
// ─────────────────────────────────────────────────────────────────────────

const CANONICAL_KEYS = PRODUCT_STEPS["demo"]; // FULL_BUILD_PLUS_MEDIA (15 steps)

export const UNIFIED_BUILD_STEPS = CANONICAL_KEYS.map((key, i) => ({
  ...PORTAL_STEPS[key],
  key,
  number: i + 1,
}));

export const TOTAL_BUILD_STEPS = UNIFIED_BUILD_STEPS.length;

// Get the canonical step number for a route path (e.g. "/content-generator" → 5)
export function getStepNumber(path) {
  const s = UNIFIED_BUILD_STEPS.find((s) => s.to === path);
  return s ? s.number : null;
}

// Get the step definition by canonical number
export function getStepByNumber(n) {
  return UNIFIED_BUILD_STEPS[n - 1] || null;
}

// Get the step definition by key
export function getStepByKey(key) {
  return UNIFIED_BUILD_STEPS.find((s) => s.key === key) || null;
}

// ── AutoBuild.current_step → unified step info ──
// The AutoBuild entity uses its own step names (profile, names, review, …)
// that differ from the client portal step keys. This maps them so the
// employee portal can show "Step N/Total: Label" for a build assignment.
const AUTOBUILD_STEP_MAP = {
  profile: "business-profile",
  names: "business-name",
  vision: "strategy",
  strategy: "strategy",
  content: "content",
  logo: "logo",
  brand: "brand",
  website: "website",
  social: "social",
  video: "video",
  review: "your-designs",
  enhancements: "enhancements",
  signatures: "signatures",
  approvals: "approvals",
  launch: "launch",
};

export function getBuildStepInfo(currentStep) {
  if (!currentStep) return null;
  const key = AUTOBUILD_STEP_MAP[currentStep];
  if (!key) return null;
  const s = getStepByKey(key);
  return s ? { number: s.number, label: s.label, total: TOTAL_BUILD_STEPS } : null;
}