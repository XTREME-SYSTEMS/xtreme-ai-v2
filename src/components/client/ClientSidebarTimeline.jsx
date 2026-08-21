import { Link } from "react-router-dom";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { usePortalPipeline } from "@/hooks/usePortalPipeline";
import { cn } from "@/lib/utils";

// H1 — Now uses the unified portal pipeline (usePortalPipeline) so the
// sidebar shows the same product-aware steps as the timeline and dashboard.
// Compact, read-only progress timeline shown in the client portal sidebar.
export default function ClientSidebarTimeline({ user }) {
  const { states, loading } = usePortalPipeline(user);

  let currentIndex = states.findIndex((s) => s.isCurrent);
  if (currentIndex === -1) currentIndex = states.length - 1;

  if (loading) {
    return (
      <div className="mt-5 px-2">
        <div className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
          Your Progress
          <ShieldCheck className="h-3 w-3 text-lime-400/70" />
        </div>
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-full bg-white/5" />
              <div className="h-3 w-24 rounded bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 px-2">
      <div className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
        Your Progress
        <ShieldCheck className="h-3 w-3 text-lime-400/70" />
      </div>
      <div className="relative">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/10" />
        <div className="space-y-2.5">
          {states.map((s, i) => {
            const step = s.step;
            const isCurrent = i === currentIndex;
            let dotClass, statusLabel, statusClass, inner;
            if (s.completed) {
              dotClass = "bg-lime-400 text-black";
              statusLabel = "Done";
              statusClass = "text-lime-400";
              inner = <CheckCircle2 className="h-3.5 w-3.5" />;
            } else if (s.pendingApproval) {
              dotClass = "bg-amber-400 text-black ring-2 ring-amber-400/30";
              statusLabel = "Awaiting approval";
              statusClass = "text-amber-400";
              inner = <span className="text-[10px] font-bold">{i + 1}</span>;
            } else if (s.locked) {
              dotClass = "bg-zinc-900 text-white/30 border border-white/10";
              statusLabel = "Locked";
              statusClass = "text-white/30";
              inner = <Lock className="h-3 w-3" />;
            } else if (isCurrent) {
              dotClass = "bg-zinc-900 text-lime-400 border border-lime-400 ring-2 ring-lime-400/20";
              statusLabel = "In progress";
              statusClass = "text-lime-400";
              inner = <span className="text-[10px] font-bold">{i + 1}</span>;
            } else {
              dotClass = "bg-zinc-900 text-white/40 border border-white/10";
              statusLabel = "Upcoming";
              statusClass = "text-white/40";
              inner = <span className="text-[10px] font-semibold">{i + 1}</span>;
            }

            const row = (
              <div className="relative flex items-start gap-2.5">
                <div className={cn(
                  "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  dotClass
                )}>
                  {inner}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className={cn(
                    "truncate text-xs",
                    isCurrent || s.pendingApproval ? "font-semibold text-white" : "text-white/70"
                  )}>
                    {step.label}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-[10px] leading-tight", statusClass)}>{statusLabel}</span>
                    {step.gate && (
                      <span className="rounded bg-white/10 px-1 text-[9px] font-medium uppercase tracking-wide text-white/50">
                        Approval
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );

            return s.pendingApproval ? (
              <Link key={step.key} to="/approvals" className="block rounded-md hover:bg-white/5">
                {row}
              </Link>
            ) : (
              <div key={step.key}>{row}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}