import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Panel } from "@/components/ui";
import { Activity, AlertTriangle, CheckCircle2, Clock, Zap, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PipelineHealthWidget() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = () => {
      base44.functions.invoke("pipelineHealth", {}).then(setHealth).catch(() => {}).finally(() => setLoading(false));
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Panel title="Pipeline Health">
        <div className="flex items-center justify-center py-8">
          <Activity className="h-5 w-5 animate-pulse text-lime-400" />
          <span className="ml-2 text-sm text-white/50">Scanning pipeline…</span>
        </div>
      </Panel>
    );
  }

  if (!health) return null;

  const stuckCount = health.stuck?.length || 0;
  const failedCount = health.failed_recent?.length || 0;
  const runningCount = health.by_status?.running || 0;
  const completeCount = health.by_status?.complete || 0;
  const approvalCount = health.by_status?.awaiting_approval || 0;

  return (
    <Panel
      title="Pipeline Health"
      action={
        <Link to="/clone-pipeline" className="text-xs text-lime-400 hover:text-lime-300">
          Open Pipeline →
        </Link>
      }
    >
      {/* Top metrics row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric icon={CheckCircle2} label="Complete" value={completeCount} color="text-emerald-400" />
        <Metric icon={Zap} label="Running" value={runningCount} color="text-lime-400" />
        <Metric icon={Clock} label="Awaiting Approval" value={approvalCount} color="text-amber-400" />
        <Metric icon={AlertTriangle} label="Stuck / Failed" value={stuckCount + failedCount} color={stuckCount + failedCount > 0 ? "text-rose-400" : "text-white/40"} />
      </div>

      {/* Success rate + avg score */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/10 bg-black/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <TrendingUp className="h-3.5 w-3.5" /> Success Rate
          </div>
          <div className="mt-1 text-xl font-bold text-white">{health.success_rate}%</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-3">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <Activity className="h-3.5 w-3.5" /> Avg Validation
          </div>
          <div className="mt-1 text-xl font-bold text-white">{health.avg_validation_score}/100</div>
        </div>
      </div>

      {/* Stuck projects alert */}
      {stuckCount > 0 && (
        <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-rose-300">
            <AlertTriangle className="h-3.5 w-3.5" /> {stuckCount} stuck project(s) — auto-recovery will retry in &lt; 15 min
          </div>
          <div className="mt-2 space-y-1">
            {health.stuck.slice(0, 3).map((s) => (
              <div key={s.id} className="text-xs text-white/60">
                {s.name} · {s.minutes_stuck}m stuck at {s.current_step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed projects alert */}
      {failedCount > 0 && (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" /> {failedCount} failed project(s) — auto-recovery will retry
          </div>
        </div>
      )}

      {/* Self-healing status */}
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-lime-400/5 px-3 py-2 text-xs text-lime-400/80">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-400" />
        </span>
        Autonomous recovery active — scans every 15 min
      </div>
    </Panel>
  );
}

function Metric({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-3">
      <Icon className={cn("h-4 w-4", color)} />
      <div className="mt-1.5 text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-white/40">{label}</div>
    </div>
  );
}