import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Brain, RefreshCw, ChevronRight, Lightbulb, Cpu, Bot, Compass, Wrench, Plug,
} from "lucide-react";

const TYPE_ICONS = {
  what_to_build: Lightbulb,
  how_to_build: Wrench,
  new_technology: Cpu,
  ai_capability: Bot,
  integration: Plug,
  strategic_direction: Compass,
};

const PRIORITY_COLORS = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-yellow-400",
  low: "text-white/50",
};

export default function ArchitectWidget() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const load = async () => {
    try {
      const all = await base44.entities.ArchitectProposal.filter(
        { status: "pending" },
        "-created_date",
        5
      ).catch(() => []);
      // Sort by priority: critical > high > medium > low
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const sorted = (all || []).sort((a, b) => {
        const pa = priorityOrder[a.priority] ?? 3;
        const pb = priorityOrder[b.priority] ?? 3;
        if (pa !== pb) return pa - pb;
        return (b.impact_score || 0) - (a.impact_score || 0);
      });
      setProposals(sorted.slice(0, 3));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.ArchitectProposal.subscribe(() => load());
    return unsub;
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

  return (
    <div className="rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/5 to-transparent p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/15">
          <Brain className="h-4 w-4 text-cyan-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">AI Chief Architect</h3>
          <p className="text-[10px] text-white/40">100x smarter · 10 steps ahead · proactively surfaces what to build</p>
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          className="flex items-center gap-1.5 rounded-lg bg-cyan-400/15 border border-cyan-400/30 px-2.5 py-1.5 text-[11px] font-medium text-cyan-300 hover:bg-cyan-400/25 disabled:opacity-50"
        >
          {scanning ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
          {scanning ? "Scanning..." : "Run Scan"}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <RefreshCw className="h-5 w-5 animate-spin text-cyan-400/50" />
        </div>
      ) : proposals.length === 0 ? (
        <div className="py-4 text-center">
          <Brain className="mx-auto h-6 w-6 text-cyan-400/30" />
          <p className="mt-1.5 text-xs text-white/40">No pending proposals. Run a scan to generate visionary recommendations.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {proposals.map((p) => {
            const Icon = TYPE_ICONS[p.proposal_type] || Lightbulb;
            return (
              <Link
                key={p.id}
                to="/architect"
                className="group flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 p-2 hover:border-cyan-400/30"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-white group-hover:text-cyan-300">{p.title}</div>
                  <div className="flex items-center gap-2 text-[9px]">
                    <span className={PRIORITY_COLORS[p.priority] || "text-white/50"}>{(p.priority || "").toUpperCase()}</span>
                    <span className="text-white/30">·</span>
                    <span className="text-emerald-400">{p.impact_score}/100 impact</span>
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 text-white/30 group-hover:text-cyan-400" />
              </Link>
            );
          })}
        </div>
      )}

      <Link
        to="/architect"
        className="mt-2 flex items-center justify-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
      >
        View all proposals <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}