import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { getVisibleSteps } from "@/lib/clientSteps";
import { useClientTrack } from "@/hooks/useClientTrack";
import { useClientProject } from "@/hooks/useClientProject";
import { usePreviewEmail } from "@/hooks/usePreviewEmail";

// H1 — Unified portal pipeline. The single source of truth for portal
// progress. Replaces the old UNIVERSAL_PIPELINE system so the dashboard,
// timeline, sidebar, and "Start Here" all show the same product-aware steps
// the client actually sees in the timeline.
//
// Returns { steps, states, currentStep, progress, loading } where:
//   steps    — the visible step definitions (from getVisibleSteps)
//   states   — array aligned to steps: { step, completed, pendingApproval, locked, isCurrent }
//   currentStep — the first non-completed, non-locked step (or last if all done)
//   progress — { done, total, percent }
export function usePortalPipeline(user) {
  const { productId, loading: trackLoading } = useClientTrack(user);
  const { effectiveEmail } = usePreviewEmail(user);
  const { project } = useClientProject(user);
  const [approvals, setApprovals] = useState([]);
  const [esignDocs, setEsignDocs] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const visibleSteps = getVisibleSteps(productId, user);

  const loadData = useCallback(async () => {
    if (!effectiveEmail) { setDataLoading(false); return; }
    try {
      const [a, d] = await Promise.all([
        base44.entities.Approval.filter(
          { client_email: effectiveEmail }, "-created_date", 100
        ).catch(() => []),
        base44.entities.EsignDocument.list("-created_date", 200).catch(() => []),
      ]);
      setApprovals(a || []);
      setEsignDocs(d || []);
    } catch {}
    setDataLoading(false);
  }, [effectiveEmail]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime: refetch when approvals or esign docs change
  useEffect(() => {
    const unsubA = base44.entities.Approval.subscribe(() => loadData());
    const unsubD = base44.entities.EsignDocument.subscribe(() => loadData());
    return () => { unsubA?.(); unsubD?.(); };
  }, [loadData]);

  // Compute completion for each step (M3 — reads from ClientProject with User fallback)
  const states = visibleSteps.map((step) => {
    let completed = false;
    let pendingApproval = null;
    const gate = step.gate;

    if (gate === "auto" || !gate) {
      completed = true;
    } else if (gate === "profile") {
      completed = !!(user?.epoxyProfileSubmitted);
    } else if (gate === "logo") {
      completed = !!(project?.chosen_logo_url || user?.chosenLogoUrl);
    } else if (gate === "brand") {
      const imgs = project?.chosen_brand_images || user?.chosenBrandImages || [];
      completed = imgs.length > 0;
    } else if (gate === "design") {
      completed = !!(project?.design_packs_chosen ?? user?.designPacksChosen);
    } else if (gate === "content") {
      completed = !!(project?.content_templates_chosen ?? user?.contentTemplatesChosen);
    } else if (gate === "social") {
      completed = !!(project?.social_media_chosen ?? user?.socialMediaChosen);
    } else if (gate === "video") {
      completed = !!(project?.video_chosen ?? user?.videoChosen);
    } else if (gate === "signatures") {
      const mine = (esignDocs || []).filter((d) =>
        (d.signers || []).some((s) => s.email?.toLowerCase() === effectiveEmail?.toLowerCase())
      );
      const pending = mine.filter((d) => {
        const signer = (d.signers || []).find((s) => s.email?.toLowerCase() === effectiveEmail?.toLowerCase()) || {};
        return !signer.signed && d.status !== "signed";
      });
      completed = pending.length === 0;
    } else if (gate === "approvals") {
      const pending = (approvals || []).filter((a) => a.status === "pending");
      completed = pending.length === 0;
      if (pending.length > 0) pendingApproval = pending[0];
    }

    return { step, completed, pendingApproval, locked: false, isCurrent: false };
  });

  // Compute locked + current (sequential: first incomplete step is current,
  // steps after it are locked until prerequisites are done)
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

  return {
    steps: visibleSteps,
    states,
    currentStep,
    progress,
    loading: trackLoading || dataLoading,
  };
}