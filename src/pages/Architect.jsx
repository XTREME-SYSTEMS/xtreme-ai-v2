import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import ArchitectProposalRow from "@/components/architect/ArchitectProposalRow";
import ArchitectChat from "@/components/architect/ArchitectChat";
import { Brain, RefreshCw, Zap, Filter } from "lucide-react";

const TYPE_LABELS = {
  what_to_build: "What to Build",
  how_to_build: "How to Build",
  new_technology: "New Technology",
  ai_capability: "AI Capability",
  integration: "Integration",
  strategic_direction: "Strategic Direction",
};

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function Architect() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [stats, setStats] = useState({ pending: 0, approved: 0, implemented: 0, dismissed: 0 });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const all = await base44.entities.ArchitectProposal.list("-created_date", 100).catch(() => []);
      setProposals(all || []);
      setStats({
        pending: (all || []).filter(p => p.status === "pending").length,
        approved: (all || []).filter(p => p.status === "approved").length,
        implemented: (all || []).filter(p => p.status === "implemented").length,
        dismissed: (all || []).filter(p => p.status === "dismissed").length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = base44.entities.ArchitectProposal.subscribe(() => load());
    return unsub;
  }, [load]);

  useEffect(() => {
    document.title = "AI Chief Architect · Lead Gen Near You";
  }, []);

  const runScan = async () => {
    try {
      setScanning(true);
      await base44.functions.invoke("architectScan", { triggered_by: "manual", max_proposals: 15 });
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  // Filter + sort
  const filtered = proposals
    .filter(p => filter === "all" ? true : p.status === filter)
    .filter(p => typeFilter === "all" ? true : p.proposal_type === typeFilter)
    .sort((a, b) => {
      // Sort by priority first, then impact score
      const pa = PRIORITY_ORDER[a.priority] ?? 3;
      const pb = PRIORITY_ORDER[b.priority] ?? 3;
      if (pa !== pb) return pa - pb;
      return (b.impact_score || 0) - (a.impact_score || 0);
    });

  return (
    <div>
      <PageHeader
        title="AI Chief Architect"
        subtitle="A system designed to be 100x smarter, 100x faster, and 10 steps ahead — proactively surfacing what to build, new technologies, and AI capabilities to integrate"
      >
        <LoadingButton loading={scanning} onClick={runScan}>
          <Brain className="h-4 w-4" /> Run Architect Scan
        </LoadingButton>
        <LoadingButton onClick={load} variant="ghost">
          <RefreshCw className="h-4 w-4" /> Refresh
        </LoadingButton>
      </PageHeader>

      {/* AI Chief Architect Chat Agent — full system access, human-like, operates on your behalf */}
      <div className="mb-6">
        <ArchitectChat />
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Pending", value: stats.pending, icon: Zap, color: "text-yellow-400" },
          { label: "Approved", value: stats.approved, icon: Brain, color: "text-lime-400" },
          { label: "Implemented", value: stats.implemented, icon: Brain, color: "text-emerald-400" },
          { label: "Dismissed", value: stats.dismissed, icon: Brain, color: "text-white/40" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-center">
            <s.icon className={`mx-auto h-5 w-5 ${s.color}`} />
            <div className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/40">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Status filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-white/40" />
          {["pending", "approved", "implemented", "dismissed", "all"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${
                filter === f ? "bg-cyan-400/15 text-cyan-300 border border-cyan-400/30" : "border border-white/10 text-white/50 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-2">
          {["all", ...Object.keys(TYPE_LABELS)].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                typeFilter === t ? "bg-lime-400/15 text-lime-300 border border-lime-400/30" : "border border-white/10 text-white/50 hover:text-white"
              }`}
            >
              {t === "all" ? "All Types" : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Proposals */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No proposals yet"
          subtitle="Run an Architect Scan to generate visionary recommendations. The AI Chief Architect will analyze your system, scan the web for emerging tech, and surface 15 actionable proposals across 6 categories."
        >
          <LoadingButton loading={scanning} onClick={runScan}>
            <Brain className="h-4 w-4" /> Run First Scan
          </LoadingButton>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <ArchitectProposalRow key={p.id} proposal={p} onUpdate={load} />
          ))}
        </div>
      )}

      {/* Info footer */}
      <div className="mt-6 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
        <div className="flex items-start gap-2 text-xs text-white/50">
          <Brain className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
          <div>
            <p className="text-white/70 font-medium mb-1">How the AI Chief Architect works</p>
            <p>
              The Architect runs automatically once every 24 hours (4:00 AM ET, after Vision Cortex). Each scan:
              analyzes your current system state (builds, ideas, optimizations, alerts) → searches the web for
              emerging AI capabilities and new technologies → uses Claude Opus to generate 15 visionary proposals
              across 6 categories (what to build, how to build, new technology, AI capability, integration,
              strategic direction) → saves them here for you to review, approve, dismiss, or mark implemented.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}