import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Lightbulb, CheckCircle2 } from "lucide-react";
import { getStepByPath } from "@/lib/clientSteps";

// A forced, centered modal that appears on each numbered client step page.
// The only way forward is the single action button — there is no close (X),
// no "Got it", and the backdrop is non-dismissable, so the user must activate
// the next step to proceed. Completion is remembered per-step in localStorage.
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

  const complete = () => {
    try { localStorage.setItem(storageKey, "1"); } catch {}
    setOpen(false);
    if (step.nextTo) navigate(step.nextTo);
  };

  const isLast = !step.nextTo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in">
      <div className="relative w-[min(92vw,440px)] rounded-2xl border border-lime-400/50 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-90">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-400/15">
            <Lightbulb className="h-5 w-5 text-lime-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{step.body}</p>
          <button
            onClick={complete}
            className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300"
          >
            {isLast ? (
              <>Finish <CheckCircle2 className="h-4 w-4" /></>
            ) : (
              <>{step.nextLabel} <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}