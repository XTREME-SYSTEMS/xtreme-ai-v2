import {
  Sparkles, Brain, Inbox, Rocket, Activity,
  LayoutDashboard,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// GROWTH PIPELINE — the only client-portal journey.
// 5 steps: Onboarding → Strategy Lock → Pack Inbox → Mass Deploy → Monitor.
// All users (including admins) get this same simplified flow.
// ─────────────────────────────────────────────────────────────────────────

export const PORTAL_STEPS = {
  "gp-onboarding": {
    key: "gp-onboarding",
    to: "/onboarding", label: "Onboarding", icon: Sparkles, gate: "auto",
    activityLabel: "Answer onboarding questions",
    title: "AI Onboarding",
    body: "Answer a few questions about your business. Every answer triggers a background skip-trace that builds a full intelligence profile.",
    nextLabel: "Go to Strategy Lock", nextTo: "/strategy-review",
  },
  "gp-strategy": {
    key: "gp-strategy",
    to: "/strategy-review", label: "Strategy Lock", icon: Brain, gate: "auto",
    activityLabel: "Review and lock your strategy",
    title: "Strategy Lock",
    body: "Review the strategy synthesized from your answers and skip-trace intelligence. Lock it to generate your website brief.",
    nextLabel: "Go to Pack Inbox", nextTo: "/pack-inbox",
  },
  "gp-pack": {
    key: "gp-pack",
    to: "/pack-inbox", label: "Pack Inbox", icon: Inbox, gate: "auto",
    activityLabel: "Review GPT mockups",
    title: "Pack Inbox",
    body: "Website mockups from GPT land here for your review. Preview, approve, or reject each one before deployment.",
    nextLabel: "Go to Mass Deploy", nextTo: "/mass-website-factory",
  },
  "gp-deploy": {
    key: "gp-deploy",
    to: "/mass-website-factory", label: "Mass Deploy", icon: Rocket, gate: "auto",
    activityLabel: "Deploy sites at scale",
    title: "Mass Deploy",
    body: "Spin up hundreds of website variations across cities and niches from your approved mockup.",
    nextLabel: "Go to Monitor", nextTo: "/ranking-monitor",
  },
  "gp-monitor": {
    key: "gp-monitor",
    to: "/ranking-monitor", label: "Monitor", icon: Activity, gate: "auto",
    activityLabel: "Track traffic and leads",
    title: "Monitor",
    body: "Track traffic, keyword rankings, and leads across all your deployed sites.",
    nextLabel: null, nextTo: null,
  },
};

const GROWTH_PIPELINE = [
  "gp-onboarding", "gp-strategy", "gp-pack", "gp-deploy", "gp-monitor",
];

// All products now map to the same 5-step growth pipeline.
export const PRODUCT_STEPS = {
  "growth-pipeline": GROWTH_PIPELINE,
};

export const DEFAULT_STEPS = GROWTH_PIPELINE;

// Utility nav items (not part of the build journey)
export const CLIENT_UTILITIES = [
  { to: "/client-portal", label: "Client Portal", icon: LayoutDashboard, end: true },
];

export function getProductStepKeys(productId) {
  return PRODUCT_STEPS[productId] || DEFAULT_STEPS;
}

export function getStepByPath(path) {
  return Object.values(PORTAL_STEPS).find((s) => s.to === path) || null;
}

export function shouldSkipStep(step, user) {
  if (step?.skipIf && step.skipIf(user)) return true;
  return false;
}