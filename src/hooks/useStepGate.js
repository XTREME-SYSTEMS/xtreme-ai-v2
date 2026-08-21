import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { usePreviewEmail } from "@/hooks/usePreviewEmail";

// Checks whether the current step's gated activity is actually complete by
// inspecting real data (not just a button click).
//  - "auto" steps (review/view): always complete.
//  - "signatures": complete when the user has no pending unsigned EsignDocuments.
//  - "approvals": complete when the user has no pending Approvals.
// Re-checks automatically via realtime subscriptions when the underlying data changes.
export function useStepGate(step, user) {
  const { effectiveEmail } = usePreviewEmail(user);
  const [state, setState] = useState({ isComplete: true, loading: true, pendingLabel: "" });

  useEffect(() => {
    if (!step) return;

    if (step.gate === "auto" || !step.gate) {
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
              isComplete: pending.length === 0,
              loading: false,
              pendingLabel: pending.length > 0 ? `${pending.length} document${pending.length > 1 ? "s" : ""} to sign` : "",
            });
          }
        } else if (step.gate === "approvals") {
          const pending = await base44.entities.Approval.filter(
            { status: "pending", client_email: effectiveEmail }, "-created_date", 50
          );
          const count = (pending || []).length;
          if (!cancelled) {
            setState({
              isComplete: count === 0,
              loading: false,
              pendingLabel: count > 0 ? `${count} approval${count > 1 ? "s" : ""} pending` : "",
            });
          }
        } else if (step.gate === "profile") {
          try {
            const me = await base44.auth.me();
            const done = !!(me && me.epoxyProfileSubmitted);
            if (!cancelled)
              setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Business profile needed" });
          } catch {
            if (!cancelled) setState({ isComplete: false, loading: false, pendingLabel: "Couldn't verify status" });
          }
        } else if (step.gate === "logo") {
          try {
            const me = await base44.auth.me();
            const done = !!(me && me.chosenLogoUrl);
            if (!cancelled)
              setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Pick your logo" });
          } catch {
            if (!cancelled) setState({ isComplete: false, loading: false, pendingLabel: "Couldn't verify status" });
          }
        } else if (step.gate === "brand") {
          try {
            const me = await base44.auth.me();
            const imgs = (me && me.chosenBrandImages) || [];
            const done = imgs.length > 0;
            if (!cancelled)
              setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Pick your brand mockups" });
          } catch {
            if (!cancelled) setState({ isComplete: false, loading: false, pendingLabel: "Couldn't verify status" });
          }
        } else if (step.gate === "design") {
          try {
            const me = await base44.auth.me();
            const done = !!(me && me.designPacksChosen);
            if (!cancelled)
              setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Pick your design direction" });
          } catch {
            if (!cancelled) setState({ isComplete: false, loading: false, pendingLabel: "Couldn't verify status" });
          }
        } else if (step.gate === "content") {
          try {
            const me = await base44.auth.me();
            const done = !!(me && me.contentTemplatesChosen);
            if (!cancelled)
              setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Pick your content tone" });
          } catch {
            if (!cancelled) setState({ isComplete: false, loading: false, pendingLabel: "Couldn't verify status" });
          }
        } else if (step.gate === "social") {
          try {
            const me = await base44.auth.me();
            const done = !!(me && me.socialMediaChosen);
            if (!cancelled)
              setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Approve your social media pack" });
          } catch {
            if (!cancelled) setState({ isComplete: false, loading: false, pendingLabel: "Couldn't verify status" });
          }
        } else if (step.gate === "video") {
          try {
            const me = await base44.auth.me();
            const done = !!(me && me.videoChosen);
            if (!cancelled)
              setState({ isComplete: done, loading: false, pendingLabel: done ? "" : "Approve your video concepts" });
          } catch {
            if (!cancelled) setState({ isComplete: false, loading: false, pendingLabel: "Couldn't verify status" });
          }
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

    // Polling fallback: re-check every few seconds in case the realtime
    // subscription doesn't fire (e.g. service-role updates from backend
    // functions). Stops naturally when the step changes / component unmounts.
    const interval = setInterval(check, 4000);
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      if (unsub) unsub();
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [step?.to, step?.gate, effectiveEmail]);

  return state;
}