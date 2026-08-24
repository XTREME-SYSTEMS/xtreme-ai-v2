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
      <div className="mx-auto max-w-2xl rounded-xl border border-white/10 bg-zinc-950 p-8 text-center">
        <p className="text-sm text-white/50">Step not found. Return to the Xtreme AI home.</p>
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl border border-yellow-300/30 bg-yellow-300/5 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-300/15">
            <Icon className="h-6 w-6 text-yellow-300" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">{step.label}</h1>
            <p className="text-xs uppercase tracking-wider text-yellow-300">Step {step.step} · Xtreme AI Build</p>
          </div>
          {isComplete && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-yellow-300/40 bg-yellow-300/10 px-2 py-1 text-xs font-semibold text-yellow-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> Complete
            </span>
          )}
        </div>
        <p className="mt-4 text-sm text-white/70">{step.body}</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-950 p-6">
        <div className="flex items-start gap-3">
          <Hammer className="h-5 w-5 shrink-0 text-yellow-300" />
          <div>
            <h2 className="text-sm font-semibold text-white">Ready for cloning</h2>
            <p className="mt-1 text-sm text-white/60">
              This step page is a placeholder. The corresponding Xtreme AI page
              (<code className="rounded bg-white/10 px-1 py-0.5 text-xs text-yellow-300">{step.key}</code>)
              will be cloned here in a follow-up turn — same UX, same generators, but
              reading from your sandbox project instead of real client data.
            </p>
          </div>
        </div>
        <button
          onClick={markDone}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-yellow-300 px-4 py-2.5 text-sm font-semibold text-black hover:bg-yellow-300"
        >
          Mark step complete & continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}