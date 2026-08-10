import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, EmptyState } from "@/components/ui";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { Users, Target, ShieldCheck, Hammer, ScrollText, Search, BookOpen, ArrowRight } from "lucide-react";

export default function CommandCenter() {
  const [stats, setStats] = useState({ prospects: 0, opportunities: 0, builds: 0, receipts: 0, recent: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [prospects, opportunities, builds, receipts] = await Promise.all([
          base44.entities.BusinessProspect.list("-created_date", 1),
          base44.entities.SearchOpportunity.list("-created_date", 1),
          base44.entities.BuildProject.list("-created_date", 1),
          base44.entities.Receipt.list("-created_date", 8),
        ]);
        setStats({
          prospects: prospects.length, opportunities: opportunities.length,
          builds: builds.length, receipts: receipts.length, recent: receipts,
        });
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const quick = [
    { to: "/discovery", label: "Discover Businesses", icon: Search, desc: "Find prospects by industry + geography" },
    { to: "/throw-the-book", label: "Throw The Book", icon: BookOpen, desc: "Score the full tactic library" },
    { to: "/build-queue", label: "Build Queue", icon: Hammer, desc: "Compose generator chains & build" },
    { to: "/receipts", label: "Receipts", icon: ScrollText, desc: "Audit trail of every action" },
  ];

  return (
    <div>
      <PageHeader title="Command Center" subtitle="LEAD GEN NEAR YOU — Universal Growth Factory · THROW THE BOOK AT IT" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Prospects" value={loading ? "—" : stats.prospects} icon={Users} />
        <StatCard label="Search Opportunities" value={loading ? "—" : stats.opportunities} icon={Target} accent="text-violet-400" />
        <StatCard label="Build Projects" value={loading ? "—" : stats.builds} icon={Hammer} accent="text-amber-400" />
        <StatCard label="Receipts" value={loading ? "—" : stats.receipts} icon={ScrollText} accent="text-emerald-400" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Quick Actions">
          <div className="grid gap-2 sm:grid-cols-2">
            {quick.map((q) => {
              const Icon = q.icon;
              return (
                <Link key={q.to} to={q.to} className="group flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3 hover:border-cyan-500/40 hover:bg-slate-800/40">
                  <Icon className="mt-0.5 h-5 w-5 text-cyan-400" />
                  <div>
                    <div className="text-sm font-medium text-slate-200">{q.label}</div>
                    <div className="text-xs text-slate-500">{q.desc}</div>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-slate-600 group-hover:text-cyan-400" />
                </Link>
              );
            })}
          </div>
        </Panel>

        <Panel title="Recent Receipts">
          {stats.recent.length === 0 ? (
            <EmptyState icon={ScrollText} title="No receipts yet" subtitle="Run a generation step to start the audit trail." />
          ) : (
            <div className="space-y-2">
              {stats.recent.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
                  <StatusBadge status={r.status} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-slate-200">{r.action}</div>
                    <div className="truncate text-xs text-slate-500">{r.agent_or_workflow} · {r.entity_type || ""}</div>
                  </div>
                  <span className="shrink-0 text-xs text-slate-600">{new Date(r.created_date).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Governance: <span className="text-emerald-400">Green</span> (research, drafts, preview, QA, receipts) auto-allowed · <span className="text-amber-400">Yellow</span> preview-only · <span className="text-rose-400">Red</span> production locked pending operator approval.</span>
        </div>
      </div>
    </div>
  );
}