import { base44 } from "@/api/base44Client";

// Analytics tracking for client portal step events. Best-effort — never
// blocks the user's flow on failure. Tracks step completions, revisions,
// generations, and approvals so we can measure funnel performance.
export function trackStepEvent(eventName, properties = {}) {
  try {
    base44.analytics.track({ eventName, properties });
  } catch (e) {
    // best effort — don't block
  }
}

// Track when a client completes a pipeline step
export function trackStepComplete(stepKey, businessName = "") {
  trackStepEvent("client_step_complete", { step: stepKey, business_name: businessName });
}

// Track when a client requests a revision
export function trackRevisionRequest(stepKey, hasComment = false) {
  trackStepEvent("client_revision_request", { step: stepKey, has_comment: hasComment });
}

// Track when a client generates content (logo, brand, social, video)
export function trackGeneration(type, count = 0) {
  trackStepEvent("client_generation", { type, count });
}

// Track when a client approves something
export function trackApproval(stepKey, businessName = "") {
  trackStepEvent("client_approval", { step: stepKey, business_name: businessName });
}