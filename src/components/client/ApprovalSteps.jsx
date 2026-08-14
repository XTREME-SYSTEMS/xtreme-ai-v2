import { useState } from "react";
import { CheckCircle2, Lock, Loader2, X, MessageSquare } from "lucide-react";

// Step-by-step approval timeline for the client. The step they're currently on
// glows green and flashes; gated steps awaiting approval show an Approve / Deny
// control with a comment box (comment required to deny).
export default function ApprovalSteps({ pkg, user, approvals = [], onDecide }) {
  const [comments, setComments] = useState({});
  const [busy, setBusy] = useState(null);

  const matches = (step, a) => {
    const hay = `${a.requested_action || ""} ${a.notes || ""} ${a.entity_type || ""}`.toLowerCase();
    return hay.includes(step.label.toLowerCase());
  };

  const decide = async (id, status, comment) => {
    setBusy(id);
    try {
      await onDecide(id, status, comment);
    } finally {
      setBusy(null);
    }
  };

  let prevIncomplete = false;
  let currentFound = false;

  return (
    <div className="relative">
      <div className="absolute bottom-3 left-[15px] top-3 w-px bg-white/10" />
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
          const isCurrent = !completed && !locked && !currentFound;
          if (isCurrent) currentFound = true;

          if ((step.key === "onboarding" || step.gate) && !completed) prevIncomplete = true;

          let dotClass, statusLabel, statusClass, rowClass;
          if (completed) {
            dotClass = "bg-lime-400 text-black";
            statusLabel = "Complete";
            statusClass = "text-lime-400";
            rowClass = "border-white/10";
          } else if (pendingApproval || isCurrent) {
            // The step they're on — green and flashing.
            dotClass = "bg-lime-400 text-black animate-pulse";
            statusLabel = pendingApproval ? "Action needed" : "In progress";
            statusClass = "text-lime-400";
            rowClass = "border-lime-400 shadow-[0_0_22px_-6px] shadow-lime-400/60 animate-pulse";
          } else if (locked) {
            dotClass = "bg-zinc-900 text-white/30 border border-white/10";
            statusLabel = "Locked";
            statusClass = "text-white/30";
            rowClass = "border-white/10";
          } else {
            dotClass = "bg-zinc-900 text-lime-400 border border-lime-400/40";
            statusLabel = "Upcoming";
            statusClass = "text-white/50";
            rowClass = "border-white/10";
          }

          return (
            <div key={step.key} className="relative flex gap-3">
              <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${dotClass}`}>
                {completed ? <CheckCircle2 className="h-4 w-4" /> : locked ? <Lock className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <div className={`flex-1 rounded-lg border bg-zinc-950 p-4 ${rowClass}`}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-lime-400" />
                  <span className="text-sm font-medium text-white">{step.label}</span>
                  {step.gate && (
                    <span className="rounded bg-lime-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-lime-400">
                      Approval
                    </span>
                  )}
                  <span className={`ml-auto text-xs font-medium ${statusClass}`}>{statusLabel}</span>
                </div>
                <div className="mt-0.5 text-xs text-white/50">{step.desc}</div>

                {pendingApproval && (
                  <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                    <div className="text-xs text-white/60">{pendingApproval.requested_action}</div>
                    <div className="flex items-start gap-2">
                      <MessageSquare className="mt-2 h-4 w-4 shrink-0 text-white/40" />
                      <textarea
                        value={comments[pendingApproval.id] || ""}
                        onChange={(e) => setComments((c) => ({ ...c, [pendingApproval.id]: e.target.value }))}
                        placeholder="Add a comment — required to deny, optional to approve…"
                        rows={2}
                        className="flex-1 rounded-md border border-white/15 bg-black/30 px-2.5 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decide(pendingApproval.id, "approved", comments[pendingApproval.id] || "")}
                        disabled={busy === pendingApproval.id}
                        className="inline-flex items-center gap-1.5 rounded-md bg-lime-400 px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
                      >
                        {busy === pendingApproval.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Approve
                      </button>
                      <button
                        onClick={() => decide(pendingApproval.id, "rejected", comments[pendingApproval.id] || "")}
                        disabled={busy === pendingApproval.id || !(comments[pendingApproval.id] || "").trim()}
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/5 disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" /> Deny
                      </button>
                    </div>
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