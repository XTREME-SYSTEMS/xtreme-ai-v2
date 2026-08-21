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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in">
      <div className="w-[min(92vw,440px)] rounded-2xl border border-lime-400/50 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-90">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-400/15">
            <Lightbulb className="h-5 w-5 text-lime-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{step.body}</p>
          <div className="mt-6 flex w-full items-center justify-center gap-2">
            {step.nextTo && (
              <button
                onClick={goNext}
                className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-lime-300"
              >
                {step.nextLabel} <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={dismiss}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              Got it
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="absolute right-4 top-4 text-white/40 transition-colors hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}