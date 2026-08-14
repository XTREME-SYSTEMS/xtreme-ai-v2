import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { computePipelineState, currentPipelineStep, pipelineProgress } from "@/lib/pipelineState";
import { UNIVERSAL_PIPELINE } from "@/lib/universalPipeline";
import { logReceipt } from "@/lib/pipelineUtils";
import { Panel, EmptyState } from "@/components/ui";
import { Loader2, Users, ShieldCheck, X, Send, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// Admin-side view of every client's position in the universal pipeline.
// Mirrors exactly what each client sees in their portal, and lets the admin
// push a pipeline-step approval to a specific client — which instantly
// appears in that client's portal as an "Action needed" step.
export default function ClientPipelineOps() {
  const [users, setUsers] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestFor, setRequestFor] = useState(null); // user being targeted
  const [stepKey, setStepKey] = useState("");
  const [risk, setRisk] = useState("yellow");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [u, a] = await Promise.all([
      base44.entities.User.list("-created_date", 200),
      base44.entities.Approval.list("-created_date", 200),
    ]);
    setUsers(u || []);
    setApprovals(a || []);
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try { await load(); } catch (e) {}
      if (!cancelled) setLoading(false);
    };
    run();
    const unsubscribe = base44.entities.Approval.subscribe(() => { load(); });
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  const clients = users.filter((u) => u.role !== "admin");
  const pendingApprovals = approvals.filter((a) => a.status === "pending");

  const approvalsFor = (email) =>
    (email ? approvals.filter((a) => (a.client_email || "").toLowerCase() === email.toLowerCase()) : []);

  const openRequest = (u) => {
    setRequestFor(u);
    // Default to the client's current gate step.
    const cur = currentPipelineStep(u, approvalsFor(u.email));
    const gateSteps = UNIVERSAL_PIPELINE.filter((s) => s.gate);
    const def = cur?.step?.gate ? cur.step.key : (gateSteps.find((s) => !approvalsFor(u.email).some((a) => a.pipeline_step === s.key && a.status === "approved"))?.key || gateSteps[0].key);
    setStepKey(def || "");
    setRisk("yellow");
    setNote("");
  };

  const createApproval = async () => {
    if (!requestFor || !stepKey) return;
    setBusy(true);
    try {
      const step = UNIVERSAL_PIPELINE.find((s) => s.key === stepKey);
      await base44.entities.Approval.create({
        entity_type: "Pipeline",
        entity_id: requestFor.id,
        requested_action: `${step.label} — approval request`,
        pipeline_step: step.key,
        client_email: requestFor.email,
        risk_level: risk,
        status: "pending",
        notes: note || "",
      });
      await logReceipt({
        action: `Approval requested: ${step.label}`,
        entityType: "Approval",
        status: "success",
        notes: `Requested ${step.label} approval from ${requestFor.email}`,
      });
      setRequestFor(null);
      await load();
    } catch (e) {
      /* ignore */
    }
    setBusy(false);
  };

  const gateSteps = UNIVERSAL_PIPELINE.filter((s) => s.gate);

  return (
    <Panel
      title="Client Pipeline Operations"
      action={
        <span className="rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
          {pendingApprovals.length} pending
        </span>
      }
    >
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-white/50">
          <Loader2 className="h-5 w-5 animate-spin text-lime-400" /> Loading client pipelines…
        </div>
      ) : clients.length === 0 ? (
        <EmptyState icon={Users} title="No client accounts yet" subtitle="Clients you invite will appear here with their live pipeline progress." />
      ) : (
        <div className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-white/10 bg-zinc-950 p-2.5 text-center">
              <div className="text-lg font-semibold text-white">{clients.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/40">Clients</div>
            </div>
            <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-2.5 text-center">
              <div className="text-lg font-semibold text-amber-300">{pendingApprovals.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-amber-300/70">Awaiting client</div>
            </div>
            <div className="rounded-lg border border-lime-400/20 bg-lime-400/5 p-2.5 text-center">
              <div className="text-lg font-semibold text-lime-400">
                {clients.filter((c) => pipelineProgress(c, approvalsFor(c.email)).percent === 100).length}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-lime-400/70">Complete</div>
            </div>
          </div>

          {/* Client rows */}
          {clients.map((u) => {
            const aFor = approvalsFor(u.email);
            const states = computePipelineState(u, aFor);
            const cur = currentPipelineStep(u, aFor);
            const prog = pipelineProgress(u, aFor);
            const pending = aFor.filter((a) => a.status === "pending");
            const Icon = cur.step.icon;
            return (
              <div key={u.id} className="rounded-xl border border-white/10 bg-zinc-950 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime-400/10 text-xs font-bold text-lime-400">
                    {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{u.full_name || u.email}</div>
                    <div className="truncate text-xs text-white/40">{u.email}</div>
                  </div>
                  <button
                    onClick={() => openRequest(u)}
                    className="inline-flex items-center gap-1 rounded-md border border-lime-400/40 bg-lime-400/10 px-2.5 py-1.5 text-xs font-semibold text-lime-300 transition-colors hover:bg-lime-400/20"
                  >
                    <Send className="h-3.5 w-3.5" /> Request approval
                  </button>
                </div>

                {/* Progress */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-lime-400 transition-all" style={{ width: `${prog.percent}%` }} />
                  </div>
                  <span className="text-[11px] font-medium text-white/50">{prog.done}/{prog.total}</span>
                </div>

                {/* Current + pending */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-1 text-[11px] font-medium text-lime-300">
                    <Icon className="h-3 w-3" /> {cur.step.label}
                  </span>
                  {pending.length > 0 ? (
                    pending.map((p) => {
                      const s = UNIVERSAL_PIPELINE.find((x) => x.key === p.pipeline_step);
                      return (
                        <span key={p.id} className="inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[11px] font-medium text-amber-300">
                          <Clock className="h-3 w-3" /> {s?.label || p.requested_action}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-[11px] text-white/30">No pending approvals</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request-approval modal */}
      {requestFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 sm:items-center sm:p-4">
          <div className="w-full max-w-md overflow-hidden rounded-t-2xl border border-white/10 bg-zinc-900 shadow-2xl sm:rounded-2xl">
            <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime-400/10">
                <ShieldCheck className="h-4 w-4 text-lime-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-white">Request approval</h3>
                <p className="truncate text-[11px] text-white/40">{requestFor.full_name || requestFor.email}</p>
              </div>
              <button onClick={() => setRequestFor(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 px-4 py-4">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-white/40">Pipeline step</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {gateSteps.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setStepKey(s.key)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border px-2.5 py-2 text-xs font-medium transition-colors",
                        stepKey === s.key ? "border-lime-400 bg-lime-400/10 text-lime-300" : "border-white/10 text-white/70 hover:bg-white/5"
                      )}
                    >
                      <s.icon className="h-3.5 w-3.5" /> {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-white/40">Risk level</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["green", "yellow", "red"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRisk(r)}
                      className={cn(
                        "rounded-md border px-2 py-1.5 text-xs font-medium capitalize transition-colors",
                        risk === r
                          ? r === "green" ? "border-emerald-400 bg-emerald-400/10 text-emerald-300"
                            : r === "yellow" ? "border-amber-400 bg-amber-400/10 text-amber-300"
                              : "border-rose-400 bg-rose-400/10 text-rose-300"
                          : "border-white/10 text-white/60 hover:bg-white/5"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-white/40">Note (optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Add context for the client…"
                  className="w-full rounded-md border border-white/15 bg-black/30 px-2.5 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <button onClick={() => setRequestFor(null)} className="rounded-md border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/5">
                Cancel
              </button>
              <button
                onClick={createApproval}
                disabled={busy || !stepKey}
                className="inline-flex items-center gap-1.5 rounded-md bg-lime-400 px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {busy ? "Sending…" : "Send to client"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}