import { useLocation, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { CLIENT_STEPS, getStepByPath } from "@/lib/clientSteps";
import { cn } from "@/lib/utils";

// Horizontal step-by-step timeline pinned to the top center of the client
// portal. Shows the full epoxy website build journey at a glance: completed
// steps are checked, the current step is highlighted, and future steps are
// locked. Clients can click any completed step to revisit it.
export default function ClientTimeline() {
  const location = useLocation();
  const navigate = useNavigate();
  const current = getStepByPath(location.pathname);
  const currentIdx = current ? CLIENT_STEPS.findIndex((s) => s.to === current.to) : -1;

  return (
    <div className="border-b border-white/10 bg-zinc-950">
      <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-3">
        <ol className="flex w-full items-center">
          {CLIENT_STEPS.map((step, i) => {
            const Icon = step.icon;
            const isCurrent = i === currentIdx;
            const isDone = currentIdx > i;
            const isLocked = currentIdx >= 0 && i > currentIdx;
            const clickable = isDone || isCurrent;
            return (
              <li key={step.to} className="flex flex-1 items-center last:flex-none">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && navigate(step.to)}
                  className={cn(
                    "group flex flex-col items-center gap-1.5",
                    clickable ? "cursor-pointer" : "cursor-default"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                      isDone && "border-lime-400 bg-lime-400 text-black",
                      isCurrent && "border-lime-400 bg-lime-400/15 text-lime-400 ring-2 ring-lime-400/30",
                      isLocked && "border-white/15 bg-zinc-900 text-white/30"
                    )}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span
                    className={cn(
                      "hidden whitespace-nowrap text-[11px] font-medium sm:block",
                      isCurrent && "text-lime-400",
                      isDone && "text-white/70",
                      isLocked && "text-white/30"
                    )}
                  >
                    {step.label}
                  </span>
                </button>
                {i < CLIENT_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "mx-1 h-0.5 flex-1 rounded-full transition-colors sm:mx-2",
                      isDone ? "bg-lime-400" : "bg-white/10"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}