import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, EmptyState } from "@/components/ui";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { Users, Target, ShieldCheck, Hammer, ScrollText, Search, BookOpen, ArrowRight, GitBranch, Eye, MousePointerClick } from "lucide-react";
import PipelineHealthWidget from "@/components/PipelineHealthWidget";
import SystemAccessGrid from "@/components/SystemAccessGrid";

export default function CommandCenter() {
  const [stats, setStats] = useState({ prospects: 0, opportunities: 0, builds: 0, receipts: 0, clones: 0, recent: [], gscImpressions: 0, gscClicks: 0, topKeywords: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [prospects, opportunities, builds, receipts, clones, keywords] = await Promise.all([
          base44.entities.BusinessProspect.list("-created_date", 1),
          base44.entities.SearchOpportunity.list("-created_date", 1),
          base44.entities.BuildProject.list("-created_date", 1),
          base44.entities.Receipt.list("-created_date", 8),
          base44.entities.CloneProject.list("-created_date", 1),
          base44.entities.RankKeyword.list("-clicks", 200),
        ]);
        const gscImpressions = keywords.reduce((a, k) => a + (k.impressions || 0), 0);
        const gscClicks = keywords.reduce((a, k) => a + (k.clicks || 0), 0);
        const topKeywords = keywords
          .filter((k) => (k.clicks || 0) > 0 || (k.impressions || 0) > 0)
          .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
          .slice(0, 5);
        setStats({
          prospects: prospects.length, opportunities: opportunities.length,
          builds: builds.length, receipts: receipts.length, clones: clones.length, recent: receipts,
          gscImpressions, gscClicks, topKeywords,
        });
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const quick = [
    { to: "/clone-pipeline", label: "Clone Pipeline", icon: GitBranch, desc: "End-to-end clone → rebrand → deploy" },
    { to: "/discovery", label: "Discover Businesses", icon: Search, desc: "Find prospects by industry + geography" },
    { to: "/throw-the-book", label: "Throw The Book", icon: BookOpen, desc: "Score the full tactic library" },
    { to: "/build-queue", label: "Build Queue", icon: Hammer, desc: "Compose generator chains & build" },
  ];

  return (
    <div>
      <PageHeader title="Command Center" subtitle="LEAD GEN NEAR YOU — Universal Growth Factory · THROW THE BOOK AT IT" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Clone Projects" value={loading ? "—" : stats.clones} icon={GitBranch} accent="text-lime-400" />
        <StatCard label="Prospects" value={loading ? "—" : stats.prospects} icon={Users} />
        <StatCard label="Search Opportunities" value={loading ? "—" : stats.opportunities} icon={Target} accent="text-lime-400" />
        <StatCard label="Build Projects" value={loading ? "—" : stats.builds} icon={Hammer} accent="text-lime-400" />
        <StatCard label="Receipts" value={loading ? "—" : stats.receipts} icon={ScrollText} accent="text-lime-400" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <PipelineHealthWidget />
        <Panel title="GSC Traffic Overview" action={<Link to="/gsc-traffic" className="text-xs text-lime-400 hover:text-lime-300">View all →</Link>}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg border border-white/10 bg-zinc-950 p-3">
              <div className="flex items-center gap-1.5 text-white/40 text-xs uppercase"><Eye className="h-3.5 w-3.5" /> Impressions</div>
              <div className="mt-1 text-xl font-semibold text-white">{loading ? "—" : stats.gscImpressions.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-zinc-950 p-3">
              <div className="flex items-center gap-1.5 text-white/40 text-xs uppercase"><MousePointerClick className="h-3.5 w-3.5" /> Clicks</div>
              <div className="mt-1 text-xl font-semibold text-lime-400">{loading ? "—" : stats.gscClicks.toLocaleString()}</div>
            </div>
          </div>
          {stats.topKeywords.length > 0 ? (
            <div className="space-y-1.5">
              <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Top Traffic Keywords</div>
              {stats.topKeywords.map((k, i) => (
                <div key={k.id} className="flex items-center justify-between rounded border border-white/5 bg-zinc-950 px-3 py-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-white/30 text-xs">{i + 1}</span>
                    <span className="truncate text-sm text-white">{k.keyword}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    <span className="text-white/50">{(k.impressions || 0).toLocaleString()} impr</span>
                    <span className="text-lime-400 font-medium">{(k.clicks || 0).toLocaleString()} clicks</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-white/40 py-3 text-center">No traffic data yet. Sync GSC from the GSC Traffic page.</div>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Quick Actions">
          <div className="grid gap-2 sm:grid-cols-2">
            {quick.map((q) => {
              const Icon = q.icon;
              return (
                <Link key={q.to} to={q.to} className="group flex items-start gap-3 rounded-lg border border-white/10 bg-zinc-950 p-3 hover:border-lime-400/40 hover:bg-white/5">
                  <Icon className="mt-0.5 h-5 w-5 text-lime-400" />
                  <div>
                    <div className="text-sm font-medium text-white">{q.label}</div>
                    <div className="text-xs text-white/40">{q.desc}</div>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-white/30 group-hover:text-lime-400" />
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
                <div key={r.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2">
                  <StatusBadge status={r.status} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-white">{r.action}</div>
                    <div className="truncate text-xs text-white/40">{r.agent_or_workflow} · {r.entity_type || ""}</div>
                  </div>
                  <span className="shrink-0 text-xs text-white/30">{new Date(r.created_date).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-zinc-950 p-4">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <ShieldCheck className="h-4 w-4 text-lime-400" />
          <span>Governance: <span className="text-emerald-400">Green</span> (research, drafts, preview, QA, receipts) auto-allowed · <span className="text-amber-400">Yellow</span> preview-only · <span className="text-rose-400">Red</span> production locked pending operator approval.</span>
        </div>
      </div>

      <div className="mt-6">
        <SystemAccessGrid />
      </div>
    </div>
  );
}