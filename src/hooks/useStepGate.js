import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { usePreviewEmail } from "@/hooks/usePreviewEmail";
import { shouldSkipStep } from "@/lib/clientSteps";
import { useAutoBuild } from "@/lib/AutoBuildContext";

// Checks whether the current step's gated activity is actually complete by
// inspecting real data (not just a button click).
//  - "auto" steps (review/view): always complete.
//  - "signatures": complete when the user has no pending unsigned EsignDocuments.
//  - "approvals": complete when the user has no pending Approvals.
// Re-checks automatically via realtime subscriptions when the underlying data changes.
export function useStepGate(step, user) {
  const { effectiveEmail } = usePreviewEmail(user);
  const autoBuild = useAutoBuild();
  const [state, setState] = useState({ isComplete: true, loading: true, pendingLabel: "" });

  useEffect(() => {
    if (!step) return;

    if (step.gate === "auto" || !step.gate) {
      setState({ isComplete: true, loading: false, pendingLabel: "" });
      return;
    }
    // D2 — Stage-aware: if the step should be skipped for this user, it's auto-complete
    if (shouldSkipStep(step, user)) {
      setState({ isComplete: true, loading: false, pendingLabel: "" });
      return;
    }
    // AutoBuild mode: signatures & approvals are auto-complete (the admin
    // doesn't sign their own agreement or approve their own design — those
    // are client-facing gates that don't apply to an admin-driven build).
    if (autoBuild.isActive && (step.gate === "signatures" || step.gate === "approvals")) {
      setState({ isComplete: true, loading: false, pendingLabel: "" });
      return;
    }
    if (!effectiveEmail) {
      setState({ isComplete: false, loading: true, pendingLabel: "" });
      return;
    }

    let cancelled = false;

    const check = async () => {
      try {
        if (step.gate === "signatures") {
          const all = await base44.entities.EsignDocument.list("-created_date", 200);
          const mine = (all || []).filter((d) =>
            (d.signers || []).some((s) => s.email && s.email.toLowerCase() === effectiveEmail.toLowerCase())
          );
          const pending = mine.filter((d) => {
            const signer = (d.signers || []).find((s) => s.email?.toLowerCase() === effectiveEmail.toLowerCase()) || {};
            return !signer.signed && d.status !== "signed";
          });
          if (!cancelled) {
            setState({
              isComplete: mine.length > 0 && pending.length === 0,
              loading: false,
              pendingLabel: pending.length > 0 ? `${pending.length} document${pending.length > 1 ? "s" : ""} to sign` : (mine.length === 0 ? "Waiting for documents" : ""),
            });
          }
        } else if (step.gate === "approvals") {
          const all = await base44.entities.Approval.filter(
            { client_email: effectiveEmail }, "-created_date", 50
          );
          const pending = (all || []).filter((a) => a.status === "pending");
          const count = pending.length;
          const total = (all || []).length;
          if (!cancelled) {
            setState({
              isComplete: total > 0 && count === 0,
              loading: false,
              pendingLabel: count > 0 ? `${count} approval${count > 1 ? "s" : ""} pending` : (total === 0 ? "Waiting for approvals" : ""),
            });
          }
        } else if (step.gate === "profile") {
          const done = !!(user && user.epoxyProfileSubmitted);
          if (!cancelled)
            setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Business profile needed" });
        } else if (step.gate === "vision") {
          if (autoBuild.isActive) {
            const done = !!autoBuild.build?.vision?.approved;
            if (!cancelled) setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Generate & approve your vision" });
          } else {
            const projects = await base44.entities.ClientProject.filter({ client_email: effectiveEmail }, "-created_date", 1);
            const done = !!projects?.[0]?.vision?.approved;
            if (!cancelled) setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Generate & approve your vision" });
          }
        } else if (step.gate === "strategy") {
          if (autoBuild.isActive) {
            const done = !!autoBuild.build?.strategy?.approved;
            if (!cancelled) setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Generate & approve your strategy" });
          } else {
            const projects = await base44.entities.ClientProject.filter({ client_email: effectiveEmail }, "-created_date", 1);
            const done = !!projects?.[0]?.strategy?.approved;
            if (!cancelled) setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Generate & approve your strategy" });
          }
        } else if (step.gate === "architecture") {
          const done = !!(autoBuild.isActive && autoBuild.build?.architecture);
          if (!cancelled) setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Generate architecture spec" });
        } else if (step.gate === "data_model") {
          const done = !!(autoBuild.isActive && autoBuild.build?.data_model);
          if (!cancelled) setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Generate data model" });
        } else if (step.gate === "ui_system") {
          const done = !!(autoBuild.isActive && autoBuild.build?.ui_system);
          if (!cancelled) setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Generate UI system" });
        } else if (step.gate === "codegen") {
          const done = !!(autoBuild.isActive && autoBuild.build?.code_manifest);
          if (!cancelled) setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Generate code manifest" });
        } else if (step.gate === "deploy") {
          const done = !!(autoBuild.isActive && autoBuild.build?.deployment);
          if (!cancelled) setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Configure deployment" });
        } else if (step.gate === "logo") {
          const done = !!(user && user.chosenLogoUrl);
          if (!cancelled)
            setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Pick your logo" });
        } else if (step.gate === "brand") {
          const imgs = (user && user.chosenBrandImages) || [];
          const done = imgs.length > 0;
          if (!cancelled)
            setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Pick your brand mockups" });
        } else if (step.gate === "design") {
          const done = !!(user && user.designPacksChosen);
          if (!cancelled)
            setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Pick your design direction" });
        } else if (step.gate === "content") {
          const done = !!(user && user.contentTemplatesChosen);
          if (!cancelled)
            setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Pick your content tone" });
        } else if (step.gate === "social") {
          const done = !!(user && user.socialMediaChosen);
          if (!cancelled)
            setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Approve your social media pack" });
        } else if (step.gate === "video") {
          const done = !!(user && user.videoChosen);
          if (!cancelled)
            setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Approve your video concepts" });
        }
      } catch (e) {
        if (!cancelled) setState({ isComplete: false, loading: false, pendingLabel: "Couldn't verify status" });
      }
    };

    check();

    let unsub;
    if (step.gate === "signatures") {
      unsub = base44.entities.EsignDocument.subscribe(() => check());
    } else if (step.gate === "approvals") {
      unsub = base44.entities.Approval.subscribe(() => check());
    }

    // M2 — Polling fallback: re-check every 15 seconds (was 4s — too aggressive,
    // 15 API calls/min/step) only when the tab is visible. Realtime
    // subscriptions + focus listener cover the rest.
    const interval = setInterval(() => {
      if (!document.hidden) check();
    }, 15000);
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      if (unsub) unsub();
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [step?.to, step?.gate, effectiveEmail, user, autoBuild.isActive,
    autoBuild.build?.architecture, autoBuild.build?.data_model,
    autoBuild.build?.ui_system, autoBuild.build?.code_manifest,
    autoBuild.build?.deployment, autoBuild.build?.vision, autoBuild.build?.strategy]);

  return state;
}