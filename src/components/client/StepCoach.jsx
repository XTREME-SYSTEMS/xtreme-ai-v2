import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Lightbulb, CheckCircle2, Lock, Loader2 } from "lucide-react";
import { getStepByPath } from "@/lib/clientSteps";
import { useClientUser } from "@/hooks/useClientUser";
import { useStepGate } from "@/hooks/useStepGate";

// Forced, two-phase gated walkthrough:
//   Phase 1 (intro)  — centered modal explains the step; the only action is
//                      "Start activity", which dismisses the modal and reveals
//                      the page so the user can do the activity.
//   Phase 2 (gate)   — a sticky bottom bar locks the "Continue" button until
//                      the activity is actually complete (verified by useStepGate
//                      against real data). Once complete, the button unlocks and
//                      advances to the next step's intro.
// Both phases are non-dismissable except via the single action button, so the
// user must finish each activity before moving on.
export default function StepCoach() {
  const location = useLocation();
  const navigate = useNavigate();
  const step = getStepByPath(location.pathname);
  const { user } = useClientUser();
  const [phase, setPhase] = useState("intro"); // "intro" | "gate" | "done"

  const introKey = step ? `coach:intro:${step.to}` : null;
  const doneKey = step ? `coach:done:${step.to}` : null;

  useEffect(() => {
    if (!step || !introKey || !doneKey) { setPhase("done"); return; }
    try {
      const completed = localStorage.getItem(doneKey) === "1";
      const introShown = localStorage.getItem(introKey) === "1";
      if (completed) setPhase("done");
      else if (introShown) setPhase("gate");
      else setPhase("intro");
    } catch { setPhase("intro"); }
  }, [step?.to, introKey, doneKey]);

  const { isComplete, loading, pendingLabel } = useStepGate(step, user);
  const isLast = !step?.nextTo;

  if (!step || phase === "done") return null;

  const start = () => {
    try { localStorage.setItem(introKey, "1"); } catch {}
    setPhase("gate");
  };

  const finish = () => {
    try { localStorage.setItem(doneKey, "1"); } catch {}
    setPhase("done");
    if (step.nextTo) navigate(step.nextTo);
  };

  // Phase 1 — intro modal
  if (phase === "intro") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
        <div className="relative w-[min(92vw,440px)] rounded-2xl border border-lime-400/50 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-90">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-400/15">
              <Lightbulb className="h-5 w-5 text-lime-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{step.body}</p>
            {step.activityLabel && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-lime-400/30 bg-lime-400/5 px-3 py-2 text-xs font-medium text-lime-300">
                <Lock className="h-3 w-3" /> Activity: {step.activityLabel}
              </p>
            )}
            <button
              onClick={start}
              className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300"
            >
              Start activity <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Phase 2 — sticky gated bar
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-lime-400/30 bg-zinc-950/95 px-4 py-3 shadow-2xl backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime-400/15">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white/50" />
          ) : isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-lime-400" />
          ) : (
            <Lock className="h-4 w-4 text-amber-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {loading ? (
            <p className="text-sm text-white/60">Checking activity status…</p>
          ) : isComplete ? (
            <p className="text-sm font-semibold text-white">Activity complete — you're ready to {isLast ? "finish" : "continue"}.</p>
          ) : (
            <p className="truncate text-sm text-white/80">
              <span className="font-semibold text-white">{step.activityLabel || step.label}</span>
              {pendingLabel ? <span className="text-amber-400"> · {pendingLabel}</span> : null}
              <span className="text-white/50"> — complete it to unlock the next step.</span>
            </p>
          )}
        </div>
        <button
          onClick={finish}
          disabled={!isComplete}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
        >
          {isLast ? <>Finish <CheckCircle2 className="h-4 w-4" /></> : <>{step.nextLabel} <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
    </div>
  );
}