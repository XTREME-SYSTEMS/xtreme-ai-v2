// Universal client-portal step resolution. The portal journey is now
// data-driven: each product in the catalog declares which steps it includes
// (see portalSteps.js → PRODUCT_STEPS). This module builds the visible
// journey dynamically from that list, so the portal always works the same
// consistent way regardless of which package the client bought.
//
// Re-exports the core helpers from portalSteps.js so existing imports keep
// working without changes.

import {
  PORTAL_STEPS,
  getProductStepKeys,
  getStepByPath as _getStepByPath,
  shouldSkipStep as _shouldSkipStep,
  CLIENT_UTILITIES,
} from "@/lib/portalSteps";
import { UNIFIED_BUILD_STEPS } from "@/lib/unifiedSteps";

// Build the visible, ordered, numbered steps for a given product.
// Filters out stage-skipped steps and computes nextLabel/nextTo dynamically
// so the chain is always correct regardless of which steps are included.
export function getVisibleSteps(productId, user) {
  const stepKeys = getProductStepKeys(productId);
  const steps = stepKeys
    .map((key) => PORTAL_STEPS[key])
    .filter((step) => {
      if (!step) return false;
      if (step.skipIf && step.skipIf(user)) return false;
      return true;
    });

  // Assign canonical unified numbers (from unifiedSteps.js) so step numbers
  // match the admin and employee portals. nextLabel/nextTo are computed from
  // actual position in the product's filtered list so the chain stays correct.
  return steps.map((step, i) => {
    const next = steps[i + 1];
    const unified = UNIFIED_BUILD_STEPS.find((s) => s.key === step.key);
    const number = unified ? unified.number : i + 1;
    return {
      ...step,
      step: number,
      number,
      nextLabel: next ? `Go to ${next.label}` : null,
      nextTo: next ? next.to : null,
    };
  });
}

export function getStepByPath(path) {
  return _getStepByPath(path);
}

export function shouldSkipStep(step, user) {
  return _shouldSkipStep(step, user);
}

export { CLIENT_UTILITIES as CLIENT_UTILITIES };

// Kept for backward compat — concatenation of all possible steps + utilities.
// Most consumers should use getVisibleSteps() instead.
export const CLIENT_NAV = [...Object.values(PORTAL_STEPS), ...CLIENT_UTILITIES];