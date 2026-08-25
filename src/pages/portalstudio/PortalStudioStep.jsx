import { useNavigate } from "react-router-dom";
import { Hammer, ArrowRight, CheckCircle2 } from "lucide-react";
import { getStudioStepByPath } from "@/lib/portalStudioSteps";
import { usePortalStudio } from "@/lib/PortalStudioContext";
import { usePortalStudioPipeline } from "@/hooks/usePortalStudioPipeline";

// Placeholder for Portal Studio step pages that haven't been cloned from the
// client portal yet. Shows the step metadata and lets the admin mark it
// visited so the pipeline advances. Each step will be replaced with a real
// cloned page (BusinessNameStudio, ContentGenerator, etc.) in follow-up turns.
export default function PortalStudioStep() {
  const navigate = useNavigate();
  const { project, saveProject } = usePortalStudio();
  const { states } = usePortalStudioPipeline();
  const path = window.location.pathname;
  const step = getStudioStepByPath(path);
  const stateForStep = states.find((s) => s.step.to === path);
  const isComplete = stateForStep?.completed || false;

  if (!step || !project) {
    return (
      <div className="p-4">
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-6 text-center">
          <p className="text-sm text-white/50">Step not found. Return to the Xtreme AI home.</p>
        </div>
      </div>
    );
  }

  const Icon = step.icon;

  const markDone = async () => {
    const visited = project.visited_steps || [];
    if (!visited.includes(step.to)) {
      await saveProject({ visited_steps: [...visited, step.to] });
    }
    try { localStorage.setItem(`studio:coach:done:${step.to}`, "1"); } catch {}
    navigate("/portal-studio");
  };

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/8 to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15">
            <Icon className="h-5 w-5 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-white">{step.label}</h1>
            <p className="text-[11px] uppercase tracking-wider text-amber-400">Step {step.step} · Xtreme AI</p>
          </div>
          {isComplete && (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[11px] font-bold text-amber-400">
              <CheckCircle2 className="h-3 w-3" /> Done
            </span>
          )}
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-white/60">{step.body}</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
        <div className="flex items-start gap-2.5">
          <Hammer className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <h2 className="text-[13px] font-semibold text-white">Ready for cloning</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-white/50">
              This step is a placeholder. The full Xtreme AI page
              (<code className="rounded bg-white/10 px-1 text-[11px] text-amber-400">{step.key}</code>)
              will be cloned here — same UX, same generators, reading from your sandbox project.
            </p>
          </div>
        </div>
        <button
          onClick={markDone}
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-black"
        >
          Mark complete & continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}