import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Lock } from "lucide-react";
import { CLIENT_STEPS, getStepByPath } from "@/lib/clientSteps";
import { cn } from "@/lib/utils";

// Horizontal step-by-step timeline pinned to the top of the client portal.
// On mobile it's a compact, horizontally scrollable strip that auto-centers
// the current step — no overflow, no icons going off-screen. On desktop the
// same strip shows with labels. Completed steps are checked and clickable;
// future steps are locked.
export default function ClientTimeline() {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const current = getStepByPath(location.pathname);
  const currentIdx = current ? CLIENT_STEPS.findIndex((s) => s.to === current.to) : -1;

  // Auto-scroll the current step into view on mount and whenever the step changes.
  useEffect(() => {
    const el = scrollRef.current?.querySelector(`[data-step-idx="${currentIdx}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [currentIdx]);

  return (
    <div className="border-b border-white/10 bg-zinc-950">
      {/* Mobile: compact "Step X of 13" header with current step label */}
      <div className="flex items-center justify-between px-4 pt-2 sm:hidden">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-lime-400">
          Step {Math.max(currentIdx + 1, 1)} of {CLIENT_STEPS.length}
        </span>
        <span className="truncate pl-2 text-[11px] font-medium text-white/60">
          {current?.label || ""}
        </span>
      </div>

      {/* Horizontally scrollable step strip — no overflow on any screen */}
      <div
        ref={scrollRef}
        className="flex items-center gap-1 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-1.5 sm:py-3"
      >
        {CLIENT_STEPS.map((step, i) => {
          const Icon = step.icon;
          const isCurrent = i === currentIdx;
          const isDone = currentIdx > i;
          const isLocked = currentIdx >= 0 && i > currentIdx;
          const clickable = isDone || isCurrent;
          return (
            <div key={step.to} className="flex items-center" data-step-idx={i}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && navigate(step.to)}
                className={cn(
                  "group flex flex-col items-center gap-1 shrink-0",
                  clickable ? "cursor-pointer" : "cursor-default"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all sm:h-9 sm:w-9",
                    isDone && "border-lime-400 bg-lime-400 text-black",
                    isCurrent && "border-lime-400 bg-lime-400/15 text-lime-400 ring-2 ring-lime-400/30",
                    isLocked && "border-white/15 bg-zinc-900 text-white/30"
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : isLocked ? <Lock className="h-3 w-3" /> : <Icon className="h-4 w-4" />}
                </span>
                <span
                  className={cn(
                    "hidden whitespace-nowrap text-[11px] font-medium sm:block",
                    isCurrent ? "text-lime-400" : isDone ? "text-white/60" : "text-white/30"
                  )}
                >
                  {step.label}
                </span>
              </button>
              {i < CLIENT_STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-0.5 h-0.5 w-3 shrink-0 rounded-full sm:mx-1 sm:w-5",
                    isDone ? "bg-lime-400" : "bg-white/10"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}