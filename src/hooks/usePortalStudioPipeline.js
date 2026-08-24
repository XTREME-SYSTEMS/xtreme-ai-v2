import { useMemo } from "react";
import { usePortalStudio } from "@/lib/PortalStudioContext";
import { getVisibleStudioSteps } from "@/lib/portalStudioSteps";

// Computes the step pipeline for the active Portal Studio sandbox project.
// Mirrors usePortalPipeline but reads entirely from the PortalStudioProject
// record — no Approval/EsignDocument entities (sandbox auto-completes gated steps).
export function usePortalStudioPipeline() {
  const { project, loading, isActive } = usePortalStudio();

  const { states, currentStep, progress } = useMemo(() => {
    if (!isActive || !project) {
      return { states: [], currentStep: null, progress: { done: 0, total: 0, percent: 0 } };
    }

    const visibleSteps = getVisibleStudioSteps(project.product_type || "marketing_site");
    const visitedSteps = project.visited_steps || [];

    const states = visibleSteps.map((step) => {
      let completed = false;
      const gate = step.gate;

      if (gate === "auto" || !gate) {
        completed = visitedSteps.includes(step.to);
      } else if (gate === "profile") {
        completed = !!(project.profile && Object.keys(project.profile).length > 0);
      } else if (gate === "content") {
        completed = !!project.content_templates_chosen;
      } else if (gate === "logo") {
        completed = !!project.chosen_logo_url;
      } else if (gate === "brand") {
        completed = (project.chosen_brand_images || []).length > 0;
      } else if (gate === "design") {
        completed = !!project.design_packs_chosen;
      } else if (gate === "social") {
        completed = !!project.social_media_chosen;
      } else if (gate === "video") {
        completed = !!project.video_chosen;
      } else if (gate === "signatures" || gate === "approvals") {
        // Sandbox: gated steps auto-complete (no real e-sign or approval needed)
        completed = visitedSteps.includes(step.to);
      }

      return { step, completed, pendingApproval: null, locked: false, isCurrent: false };
    });

    // Sequential: first incomplete step is current, steps after it are locked
    let prevIncomplete = false;
    let currentFound = false;
    states.forEach((s) => {
      s.locked = prevIncomplete && !s.completed;
      s.isCurrent = !s.completed && !s.locked && !currentFound;
      if (s.isCurrent) currentFound = true;
      if (!s.completed) prevIncomplete = true;
    });

    const done = states.filter((s) => s.completed).length;
    const progress = {
      done,
      total: states.length,
      percent: states.length > 0 ? Math.round((done / states.length) * 100) : 0,
    };
    const currentStep = states.find((s) => s.isCurrent) || states[states.length - 1];

    return { states, currentStep, progress };
  }, [isActive, project]);

  return { states, currentStep, progress, loading };
}