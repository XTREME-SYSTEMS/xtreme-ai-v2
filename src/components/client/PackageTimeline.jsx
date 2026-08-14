import { CheckCircle2, Lock, Loader2, X } from "lucide-react";

// Step-by-step timeline of a client's package contents with gated approvals.
// A step is "locked" until every prior required step (onboarding or a gate) is complete.
export default function PackageTimeline({ pkg, user, approvals = [], busy, onDecide }) {
  const matches = (step, a) => {
    const hay = `${a.requested_action || ""} ${a.notes || ""} ${a.entity_type || ""}`.toLowerCase();
    return hay.includes(step.label.toLowerCase());
  };

  let prevIncomplete = false;

  return (
    <div className="relative">
      <div className="absolute left-[15px] top-3 bottom-3 w-px bg-white/10" />
      <div className="space-y-3">
        {pkg.steps.map((step, i) => {
          const Icon = step.icon;
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

          let state, statusLabel, statusClass;
          if (completed) { state = "done"; statusLabel = "Complete"; statusClass = "text-lime-400"; }
          else if (pendingApproval) { state = "review"; statusLabel = "Awaiting your approval"; statusClass = "text-amber-400"; }
          else if (locked) { state = "locked"; statusLabel = "Locked"; statusClass = "text-white/30"; }
          else if (step.gate) { state = "pending"; statusLabel = "Pending"; statusClass = "text-white/50"; }
          else { state = "upcoming"; statusLabel = "Upcoming"; statusClass = "text-white/50"; }

          if ((step.key === "onboarding" || step.gate) && !completed) prevIncomplete = true;

          const dotClass =
            state === "done" ? "bg-lime-400 text-black"
            : state === "review" ? "bg-amber-400 text-black"
            : state === "locked" ? "bg-zinc-900 text-white/30 border border-white/10"
            : "bg-zinc-900 text-lime-400 border border-lime-400/40";

          return (
            <div key={step.key} className="relative flex gap-3">
              <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${dotClass}`}>
                {state === "done" ? <CheckCircle2 className="h-4 w-4" /> : state === "locked" ? <Lock className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <div className="flex-1 rounded-lg border border-white/10 bg-zinc-950 p-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-lime-400" />
                  <span className="text-sm font-medium text-white">{step.label}</span>
                  {step.gate && (
                    <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-400">
                      Approval
                    </span>
                  )}
                  <span className={`ml-auto text-xs font-medium ${statusClass}`}>{statusLabel}</span>
                </div>
                <div className="mt-0.5 text-xs text-white/50">{step.desc}</div>

                {pendingApproval && (
                  <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2">
                    <div className="min-w-0 flex-1 truncate text-xs text-white/60">
                      {pendingApproval.requested_action}
                    </div>
                    <button
                      onClick={() => onDecide(pendingApproval.id, "approved")}
                      disabled={busy === pendingApproval.id}
                      className="inline-flex items-center gap-1.5 rounded-md bg-lime-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
                    >
                      {busy === pendingApproval.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Approve
                    </button>
                    <button
                      onClick={() => onDecide(pendingApproval.id, "rejected")}
                      disabled={busy === pendingApproval.id}
                      className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/5 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}