import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useClientTrack } from "@/hooks/useClientTrack";
import { getPackage } from "@/lib/packageContents";
import { cn } from "@/lib/utils";

// Compact, read-only progress timeline shown in the client portal sidebar.
// Mirrors PackageTimeline's gate logic so the user always sees which step
// of their approval-gated build they are currently on.
export default function ClientSidebarTimeline({ user }) {
  const { track } = useClientTrack(user);
  const [approvals, setApprovals] = useState([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await base44.entities.Approval.list("-created_date", 50);
        if (!cancelled) setApprovals(list || []);
      } catch (e) {
        if (!cancelled) setApprovals([]);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const pkg = getPackage(track?.key);
  const steps = pkg?.steps || [];

  const matches = (step, a) => {
    const hay = `${a.requested_action || ""} ${a.notes || ""} ${a.entity_type || ""}`.toLowerCase();
    return hay.includes(step.label.toLowerCase());
  };

  // First pass: compute per-step state.
  let prevIncomplete = false;
  const states = steps.map((step) => {
    let completed = false;
    let pendingApproval = null;
    if (step.key === "onboarding") {
      completed = !!user?.onboarded;
    } else if (step.gate) {
      const ap = approvals.find((a) => a.status === "approved" && matches(step, a));
      const pp = approvals.find((a) => a.status === "pending" && matches(step, a));
      if (ap) completed = true;
      else if (pp) pendingApproval = pp;
    }
    const locked = prevIncomplete && !completed && !pendingApproval;
    if ((step.key === "onboarding" || step.gate) && !completed) prevIncomplete = true;
    return { completed, pendingApproval, locked };
  });

  // The "current" step is the first one that isn't done and isn't locked.
  let currentIndex = states.findIndex((s) => !s.completed && !s.locked);
  if (currentIndex === -1) currentIndex = states.length - 1;

  if (!steps.length) return null;

  return (
    <div className="mt-5 px-2">
      <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
        Your Progress
      </div>
      <div className="relative">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/10" />
        <div className="space-y-2.5">
          {steps.map((step, i) => {
            const st = states[i];
            const isCurrent = i === currentIndex;
            let dotClass, statusLabel, statusClass, inner;
            if (st.completed) {
              dotClass = "bg-lime-400 text-black";
              statusLabel = "Done";
              statusClass = "text-lime-400";
              inner = <CheckCircle2 className="h-3.5 w-3.5" />;
            } else if (st.pendingApproval) {
              dotClass = "bg-amber-400 text-black ring-2 ring-amber-400/30";
              statusLabel = "Awaiting approval";
              statusClass = "text-amber-400";
              inner = <span className="text-[10px] font-bold">{i + 1}</span>;
            } else if (st.locked) {
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
                    isCurrent || st.pendingApproval ? "font-semibold text-white" : "text-white/70"
                  )}>
                    {step.label}
                  </div>
                  <div className={cn("text-[10px] leading-tight", statusClass)}>{statusLabel}</div>
                </div>
              </div>
            );

            return st.pendingApproval ? (
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