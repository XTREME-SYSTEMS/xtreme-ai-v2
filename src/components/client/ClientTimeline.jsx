import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getStepByPath } from "@/lib/clientSteps";
import { useClientUser } from "@/hooks/useClientUser";
import { usePortalPipeline } from "@/hooks/usePortalPipeline";
import { cn } from "@/lib/utils";

// Horizontal step-by-step timeline pinned to the top of the client portal.
// On mobile it's a compact, horizontally scrollable strip that auto-centers
// the current step. On desktop the same strip shows with labels.
// M1 — Completion is now validation-based (from usePortalPipeline), not
// position-based. Steps show as "done" only when actually completed, and
// "locked" only when a prerequisite is incomplete — regardless of which
// URL the user navigated to.
export default function ClientTimeline() {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const { user } = useClientUser();
  const { states } = usePortalPipeline(user);
  const visibleSteps = states.map((s) => s.step);
  const current = visibleSteps.find((s) => s.to === location.pathname) || getStepByPath(location.pathname);
  const currentIdx = current ? visibleSteps.findIndex((s) => s.to === current.to) : -1;

  // Auto-scroll the current step into view on mount and whenever the step changes.
  useEffect(() => {
    const el = scrollRef.current?.querySelector(`[data-step-idx="${currentIdx}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [currentIdx]);

  return (
    <div className="border-b border-white/10 bg-zinc-950">
      {/* Mobile: compact "Step X of N" header with current step label */}
      <div className="flex items-center justify-between px-4 pt-2 sm:hidden">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
          Step {Math.max(currentIdx + 1, 1)} of {visibleSteps.length}
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
        {visibleSteps.map((step, i) => {
          const Icon = step.icon;
          const isCurrent = i === currentIdx;
          return (
            <div key={step.to} className="flex items-center" data-step-idx={i}>
              <button
                type="button"
                onClick={() => navigate(step.to)}
                className="group flex cursor-pointer flex-col items-center gap-1 shrink-0"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all sm:h-9 sm:w-9",
                    isCurrent
                      ? "border-amber-400 bg-amber-400 text-black"
                      : "border-white/15 bg-zinc-900 text-white/40 hover:border-amber-400/40 hover:text-amber-300"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span
                  className={cn(
                    "hidden whitespace-nowrap text-[11px] font-medium sm:block",
                    isCurrent ? "text-amber-400" : "text-white/30"
                  )}
                >
                  {step.label}
                </span>
              </button>
              {i < visibleSteps.length - 1 && (
                <div
                  className={cn(
                    "mx-0.5 h-0.5 w-3 shrink-0 rounded-full sm:mx-1 sm:w-5",
                    i < currentIdx ? "bg-amber-400" : "bg-white/10"
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