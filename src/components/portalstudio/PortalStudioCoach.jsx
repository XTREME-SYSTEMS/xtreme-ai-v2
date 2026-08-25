import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Lightbulb, CheckCircle2, Lock, Loader2, RotateCcw, SkipForward, X } from "lucide-react";
import { getStudioStepByPath, getVisibleStudioSteps } from "@/lib/portalStudioSteps";
import { usePortalStudio } from "@/lib/PortalStudioContext";
import { usePortalStudioPipeline } from "@/hooks/usePortalStudioPipeline";

// Guided walkthrough coach for the Portal Studio — a copy of the client
// portal's StepCoach, but reading completion from the sandbox pipeline.
export default function PortalStudioCoach() {
  const location = useLocation();
  const navigate = useNavigate();
  const step = getStudioStepByPath(location.pathname);
  const { project, saveProject } = usePortalStudio();
  const { states } = usePortalStudioPipeline();
  const visibleSteps = getVisibleStudioSteps(project?.product_type || "marketing_site");
  const [phase, setPhase] = useState("intro");

  const introKey = step ? `studio:coach:intro:${step.to}` : null;
  const doneKey = step ? `studio:coach:done:${step.to}` : null;

  const stateForStep = states.find((s) => s.step.to === step?.to);
  const isComplete = stateForStep?.completed || false;

  const [showEscape, setShowEscape] = useState(false);

  const markVisited = async (path) => {
    if (!project?.id) return;
    const visited = project.visited_steps || [];
    if (!visited.includes(path)) {
      await saveProject({ visited_steps: [...visited, path] });
    }
  };

  const restartStep = () => {
    if (!step) return;
    try {
      localStorage.removeItem(`studio:coach:done:${step.to}`);
      localStorage.removeItem(`studio:coach:intro:${step.to}`);
    } catch {}
    setShowEscape(false);
    window.location.reload();
  };

  const skipStep = () => {
    if (!step) return;
    try {
      localStorage.setItem(`studio:coach:done:${step.to}`, "1");
      localStorage.setItem(`studio:coach:intro:${step.to}`, "1");
    } catch {}
    setShowEscape(false);
    markVisited(step.to);
    const idx = visibleSteps.findIndex((s) => s.to === step?.to);
    if (idx >= 0 && idx < visibleSteps.length - 1) navigate(visibleSteps[idx + 1].to);
    else navigate("/portal-studio");
  };

  useEffect(() => {
    if (!step || !introKey || !doneKey) { setPhase("done"); return; }
    try {
      const completed = localStorage.getItem(doneKey) === "1";
      const introShown = localStorage.getItem(introKey) === "1";
      if (completed && !isComplete) {
        localStorage.removeItem(doneKey);
        localStorage.removeItem(introKey);
        setPhase("intro");
        return;
      }
      if (completed) setPhase("done");
      else if (introShown) setPhase("gate");
      else setPhase("intro");
    } catch { setPhase("intro"); }
  }, [step?.to, introKey, doneKey, isComplete]);

  const currentIdx = visibleSteps.findIndex((s) => s.to === step?.to);
  const isLast = currentIdx === -1 || currentIdx === visibleSteps.length - 1;

  if (!step || phase === "done") return null;

  const start = () => {
    try { localStorage.setItem(introKey, "1"); } catch {}
    setPhase("gate");
  };

  const finish = () => {
    try { localStorage.setItem(doneKey, "1"); } catch {}
    setPhase("done");
    markVisited(step.to);
    const idx = visibleSteps.findIndex((s) => s.to === step?.to);
    if (idx >= 0 && idx < visibleSteps.length - 1) navigate(visibleSteps[idx + 1].to);
  };

  if (phase === "intro") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
        <div className="relative w-[min(92vw,440px)] rounded-2xl border border-amber-400/50 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-90">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/15">
              <Lightbulb className="h-5 w-5 text-amber-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{step.body}</p>
            {step.activityLabel && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-xs font-medium text-amber-400">
                <Lock className="h-3 w-3" /> Activity: {step.activityLabel}
              </p>
            )}
            <button
              onClick={start}
              className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
            >
              Start activity <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-amber-400/30 bg-zinc-950/95 px-4 py-3 shadow-2xl backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/15">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-amber-400" />
          ) : (
            <Lock className="h-4 w-4 text-amber-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {isComplete ? (
            <p className="text-sm font-semibold text-white">Activity complete — you're ready to {isLast ? "finish" : "continue"}.</p>
          ) : (
            <p className="truncate text-sm text-white/80">
              <span className="font-semibold text-white">{step.activityLabel || step.label}</span>
              <span className="text-white/50"> — complete it to unlock the next step.</span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowEscape((v) => !v)}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/15 px-2.5 py-2.5 text-xs font-medium text-white/50 hover:border-white/30 hover:text-white/80"
          title="Stuck? Restart or skip this step"
        >
          {showEscape ? <X className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
        </button>
        <button
          onClick={finish}
          disabled={!isComplete}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
        >
          {isLast ? <>Finish <CheckCircle2 className="h-4 w-4" /></> : <>{(visibleSteps[currentIdx + 1]?.label || step.nextLabel || "Continue").replace("Go to ", "")} <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
      {showEscape && (
        <div className="mx-auto mt-2 flex max-w-3xl flex-wrap items-center gap-2 border-t border-white/10 pt-2">
          <span className="text-xs text-white/50">Stuck on this step?</span>
          <button
            type="button"
            onClick={restartStep}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-400/20"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restart Step
          </button>
          <button
            type="button"
            onClick={skipStep}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 hover:border-white/30"
          >
            <SkipForward className="h-3.5 w-3.5" /> Skip &amp; Continue
          </button>
        </div>
      )}
    </div>
  );
}