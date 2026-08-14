import { UNIVERSAL_PIPELINE } from "@/lib/universalPipeline";
import { stepMatches } from "@/lib/pipelineUtils";

// Single source of truth for universal-pipeline progress. Used by the client
// portal (ApprovalSteps, sidebar timeline) AND the admin Command Center so
// both sides always agree on where a client is.
//
// Returns an array aligned to UNIVERSAL_PIPELINE:
//   { step, completed, pendingApproval, locked, isCurrent }
export function computePipelineState(user, approvals = []) {
  let prevIncomplete = false;
  let currentFound = false;
  return UNIVERSAL_PIPELINE.map((step) => {
    let completed = false;
    let pendingApproval = null;

    if (step.key === "onboarding") {
      completed = !!user?.onboarded;
    } else if (step.gate) {
      const ap = approvals.find((a) => a.status === "approved" && stepMatches(step, a));
      const pp = approvals.find((a) => a.status === "pending" && stepMatches(step, a));
      if (ap) completed = true;
      else if (pp) pendingApproval = pp;
    }

    const locked = prevIncomplete && !completed && !pendingApproval;
    const isCurrent = !completed && !locked && !currentFound;
    if (isCurrent) currentFound = true;
    if ((step.key === "onboarding" || step.gate) && !completed) prevIncomplete = true;

    return { step, completed, pendingApproval, locked, isCurrent };
  });
}

// The step a user is currently on (first non-completed, non-locked step),
// falling back to the last step when everything is done.
export function currentPipelineStep(user, approvals = []) {
  const states = computePipelineState(user, approvals);
  return states.find((s) => s.isCurrent) || states[states.length - 1];
}

// Simple completion progress for progress bars.
export function pipelineProgress(user, approvals = []) {
  const states = computePipelineState(user, approvals);
  const done = states.filter((s) => s.completed).length;
  return { done, total: states.length, percent: Math.round((done / states.length) * 100) };
}