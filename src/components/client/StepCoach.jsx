import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, ArrowRight, Lightbulb } from "lucide-react";
import { getStepByPath } from "@/lib/clientSteps";

// A dismissible pop-up that appears on each numbered client step page with
// directions on what to do there and a "Next" CTA to the following step.
// Dismissals are remembered per-step in localStorage so it doesn't nag.
export default function StepCoach() {
  const location = useLocation();
  const navigate = useNavigate();
  const step = getStepByPath(location.pathname);
  const [open, setOpen] = useState(false);

  const storageKey = step ? `coach:dismissed:${step.to}` : null;

  useEffect(() => {
    if (!step || !storageKey) { setOpen(false); return; }
    try {
      const dismissed = localStorage.getItem(storageKey) === "1";
      setOpen(!dismissed);
    } catch {
      setOpen(true);
    }
  }, [storageKey, step]);

  if (!step || !open) return null;

  const dismiss = () => {
    try { localStorage.setItem(storageKey, "1"); } catch {}
    setOpen(false);
  };

  const goNext = () => {
    dismiss();
    if (step.nextTo) navigate(step.nextTo);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[min(92vw,380px)] animate-in fade-in slide-in-from-bottom-4 rounded-xl border border-lime-400/50 bg-zinc-950 p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime-400/15">
          <Lightbulb className="h-4 w-4 text-lime-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">{step.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-white/60">{step.body}</p>
          <div className="mt-3 flex items-center gap-2">
            {step.nextTo && (
              <button
                onClick={goNext}
                className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-lime-300"
              >
                {step.nextLabel} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={dismiss}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              Got it
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="shrink-0 text-white/40 transition-colors hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}