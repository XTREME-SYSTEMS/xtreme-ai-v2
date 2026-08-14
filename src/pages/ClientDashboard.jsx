import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, EmptyState } from "@/components/ui";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { CheckCircle, FileText, ScrollText, ShieldCheck, ArrowRight, Loader2, Check, X, HelpCircle } from "lucide-react";
import ClientOnboarding from "@/components/ClientOnboarding";
import DashboardTour from "@/components/DashboardTour";

export default function ClientDashboard() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState({ pending: [], proposals: [], receipts: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    const [pending, proposals, receipts] = await Promise.all([
      base44.entities.Approval.filter({ status: "pending" }, "-created_date", 20),
      base44.entities.ProposalPackage.list("-created_date", 5),
      base44.entities.Receipt.list("-created_date", 6),
    ]);
    setData({ pending, proposals, receipts });
  };

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        await load();
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const decide = async (id, status) => {
    setBusy(id);
    try {
      await base44.entities.Approval.update(id, {
        status,
        decided_at: new Date().toISOString(),
        decision_by: user?.email || "client",
      });
      await load();
    } catch (e) {}
    setBusy(null);
  };

  const restartTour = () => {
    try { localStorage.removeItem("lgny_tour_done"); } catch (e) {}
    window.dispatchEvent(new Event("lgny-tour-restart"));
  };

  const pendingCount = data.pending.length;

  return (
    <div>
      <PageHeader title="My Dashboard" subtitle={`Welcome${user?.full_name ? `, ${user.full_name}` : ""} — your approval-gated growth workflow.`}>
        <button onClick={restartTour} className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/5">
          <HelpCircle className="h-3.5 w-3.5" /> Take tour
        </button>
      </PageHeader>

      <div className="mb-6 rounded-xl border border-lime-400/30 bg-lime-400/5 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-lime-400" />
          <div className="text-sm text-white/70">
            <span className="font-semibold text-white">Approval-gated workflow.</span> Nothing goes live without your sign-off. Review pending items below — approve to release, or reject to send back for revision.
          </div>
        </div>
      </div>

      <div className="mb-6" id="tour-onboarding">
        <ClientOnboarding user={user} />
      </div>

      <div id="tour-stats" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending Approvals" value={loading ? "—" : pendingCount} icon={CheckCircle} accent="text-lime-400" />
        <StatCard label="Proposals" value={loading ? "—" : data.proposals.length} icon={FileText} />
        <StatCard label="Recent Activity" value={loading ? "—" : data.receipts.length} icon={ScrollText} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div id="tour-approvals">
          <Panel
            title="Action Required — Pending Approvals"
            action={<Link to="/approvals" className="inline-flex items-center gap-1 text-xs font-medium text-lime-400 hover:text-lime-300">View all <ArrowRight className="h-3.5 w-3.5" /></Link>}
          >
            {loading ? (
              <EmptyState icon={CheckCircle} title="Loading…" />
            ) : data.pending.length === 0 ? (
              <EmptyState icon={CheckCircle} title="You're all caught up" subtitle="No pending approvals. Your team will post work here for sign-off." />
            ) : (
              <div className="space-y-2">
                {data.pending.map((a) => (
                  <div key={a.id} className="rounded-lg border border-white/10 bg-zinc-950 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${a.risk_level === "red" ? "text-rose-400" : a.risk_level === "yellow" ? "text-amber-400" : "text-emerald-400"}`}>{a.risk_level || "green"} risk</span>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="mt-1 text-sm font-medium text-white">{a.requested_action}</div>
                    <div className="text-xs text-white/40">{a.entity_type}{a.notes ? ` · ${a.notes}` : ""}</div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => decide(a.id, "approved")} disabled={busy === a.id} className="inline-flex items-center gap-1.5 rounded-md bg-lime-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-50">
                        {busy === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve
                      </button>
                      <button onClick={() => decide(a.id, "rejected")} disabled={busy === a.id} className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/5 disabled:opacity-50">
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div id="tour-activity">
          <Panel
            title="Recent Activity"
            action={<Link to="/receipts" className="inline-flex items-center gap-1 text-xs font-medium text-lime-400 hover:text-lime-300">View all <ArrowRight className="h-3.5 w-3.5" /></Link>}
          >
            {data.receipts.length === 0 ? (
              <EmptyState icon={ScrollText} title="No activity yet" subtitle="Work your team completes will show here." />
            ) : (
              <div className="space-y-2">
                {data.receipts.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2">
                    <StatusBadge status={r.status} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-white">{r.action}</div>
                      <div className="truncate text-xs text-white/40">{r.agent_or_workflow} · {r.entity_type || ""}</div>
                    </div>
                    <span className="shrink-0 text-xs text-white/30">{new Date(r.created_date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <div className="mt-6" id="tour-proposals">
        <Panel
          title="My Proposals"
          action={<Link to="/proposals" className="inline-flex items-center gap-1 text-xs font-medium text-lime-400 hover:text-lime-300">View all <ArrowRight className="h-3.5 w-3.5" /></Link>}
        >
          {data.proposals.length === 0 ? (
            <EmptyState icon={FileText} title="No proposals yet" subtitle="Your team will prepare proposal packages here." />
          ) : (
            <div className="space-y-2">
              {data.proposals.map((p) => (
                <Link key={p.id} to="/proposals" className="flex items-center gap-3 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 hover:border-lime-400/40">
                  <FileText className="h-4 w-4 shrink-0 text-lime-400" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-white">{p.audit_summary || p.opportunity_summary || "Proposal package"}</div>
                    <div className="truncate text-xs text-white/40">{p.status || ""}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-white/30" />
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <DashboardTour />
    </div>
  );
}