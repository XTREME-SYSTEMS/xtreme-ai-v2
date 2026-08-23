import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Activity, RefreshCw, Zap, ShieldCheck, Wrench, Sparkles,
  AlertTriangle, CheckCircle, XCircle, Loader2, Search,
  TrendingUp, Bug, Eye, Rocket, ChevronDown,
} from "lucide-react";

const CATEGORY_CONFIG = {
  failure: { icon: Bug, color: "text-red-400", border: "border-red-400/30", bg: "bg-red-400/5", label: "Failure" },
  gap: { icon: Eye, color: "text-yellow-400", border: "border-yellow-400/30", bg: "bg-yellow-400/5", label: "Gap" },
  optimization: { icon: TrendingUp, color: "text-lime-400", border: "border-lime-400/30", bg: "bg-lime-400/5", label: "Optimization" },
  enhancement: { icon: Sparkles, color: "text-blue-400", border: "border-blue-400/30", bg: "bg-blue-400/5", label: "Enhancement" },
  hardening: { icon: ShieldCheck, color: "text-purple-400", border: "border-purple-400/30", bg: "bg-purple-400/5", label: "Hardening" },
};

const ACTION_CONFIG = {
  fix: { icon: Wrench, label: "Fix" },
  heal: { icon: ShieldCheck, label: "Heal" },
  harden: { icon: ShieldCheck, label: "Harden" },
  optimize: { icon: Zap, label: "Optimize" },
  enhance: { icon: Sparkles, label: "Enhance" },
  dismiss: { icon: XCircle, label: "Dismiss" },
};

const SEVERITY_CONFIG = {
  critical: "text-red-400 bg-red-400/10",
  high: "text-orange-400 bg-orange-400/10",
  medium: "text-yellow-400 bg-yellow-400/10",
  low: "text-blue-400 bg-blue-400/10",
  info: "text-white/50 bg-white/5",
};

export default function SystemOptimization() {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [applying, setApplying] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [filter, setFilter] = useState("open");
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await base44.entities.SystemOptimization.list("-created_date", 100);
      setFindings(data || []);
    } catch (e) {
      setError(e?.message || "Failed to load findings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runScan = async () => {
    try {
      setScanning(true);
      setError(null);
      setScanResult(null);
      const res = await base44.functions.invoke("systemSelfReflection", {});
      setScanResult(res?.data || res);
      await load();
    } catch (e) {
      setError(e?.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const applyFix = async (finding) => {
    try {
      setApplying(finding.id);
      setError(null);
      await base44.functions.invoke("applySystemOptimization", { optimizationId: finding.id });
      await load();
    } catch (e) {
      setError(e?.message || "Fix failed");
    } finally {
      setApplying(null);
    }
  };

  const dismiss = async (finding) => {
    try {
      await base44.entities.SystemOptimization.update(finding.id, {
        status: "dismissed",
        resolved_at: new Date().toISOString(),
        resolution: "Dismissed by operator",
      });
      await load();
    } catch (e) {
      setError(e?.message || "Dismiss failed");
    }
  };

  const filtered = filter === "all"
    ? findings
    : filter === "open"
    ? findings.filter(f => f.status === "open" || f.status === "fixing" || f.status === "failed")
    : findings.filter(f => f.status === filter);

  const stats = {
    total: findings.length,
    open: findings.filter(f => f.status === "open").length,
    fixing: findings.filter(f => f.status === "fixing").length,
    resolved: findings.filter(f => f.status === "resolved").length,
    failed: findings.filter(f => f.status === "failed").length,
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/15">
          <Activity className="h-5 w-5 text-lime-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-white">System Optimization</h1>
          <p className="text-sm text-white/50">Self-reflection engine — scans for failures, gaps, and improvement opportunities</p>
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
        >
          {scanning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {scanning ? "Scanning..." : "Run System Scan"}
        </button>
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/70 hover:border-lime-400/50 hover:text-lime-300">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Scan Result Banner */}
      {scanResult && (
        <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-4">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-lime-400" />
            <span className="text-white/80">
              Scan complete — <span className="font-bold text-lime-300">{scanResult.new_findings}</span> new findings
              {scanResult.deduplicated > 0 && <span className="text-white/50"> · {scanResult.deduplicated} already tracked</span>}
            </span>
            {scanResult.breakdown && (
              <span className="ml-auto text-xs text-white/40">
                {scanResult.breakdown.failures > 0 && `${scanResult.breakdown.failures} failures · `}
                {scanResult.breakdown.gaps > 0 && `${scanResult.breakdown.gaps} gaps · `}
                {scanResult.breakdown.optimizations > 0 && `${scanResult.breakdown.optimizations} optimizations · `}
                {scanResult.breakdown.enhancements > 0 && `${scanResult.breakdown.enhancements} enhancements · `}
                {scanResult.breakdown.hardening > 0 && `${scanResult.breakdown.hardening} hardening`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total", val: stats.total, icon: Activity, color: "text-white" },
          { label: "Open", val: stats.open, icon: AlertTriangle, color: "text-yellow-400" },
          { label: "Fixing", val: stats.fixing, icon: Loader2, color: "text-blue-400" },
          { label: "Resolved", val: stats.resolved, icon: CheckCircle, color: "text-lime-400" },
          { label: "Failed", val: stats.failed, icon: XCircle, color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-center">
            <s.icon className={`mx-auto h-4 w-4 ${s.color}`} />
            <div className={`mt-1 text-2xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/40">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: "open", label: "Active" },
          { key: "all", label: "All" },
          { key: "resolved", label: "Resolved" },
          { key: "dismissed", label: "Dismissed" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === t.key
                ? "bg-lime-400/15 text-lime-300 border border-lime-400/30"
                : "border border-white/10 text-white/50 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Findings List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <RefreshCw className="h-6 w-6 animate-spin text-lime-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-zinc-950 py-12 text-center">
          <CheckCircle className="mx-auto h-8 w-8 text-lime-400/50" />
          <p className="mt-2 text-sm text-white/50">
            {filter === "open" ? "No active findings — run a scan to check the system" : `No ${filter} findings`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((finding) => {
            const cat = CATEGORY_CONFIG[finding.category] || CATEGORY_CONFIG.optimization;
            const action = ACTION_CONFIG[finding.recommended_action] || ACTION_CONFIG.fix;
            const ActionIcon = action.icon;
            const CatIcon = cat.icon;
            const isApplying = applying === finding.id;
            const canAct = finding.status === "open" || finding.status === "failed";

            return (
              <div key={finding.id} className={`rounded-xl border ${cat.border} ${cat.bg} p-4`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cat.bg} ${cat.color}`}>
                    <CatIcon className="h-4 w-4" />
                  </div>
                  <div className="min-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white">{finding.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.medium}`}>
                        {finding.severity}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cat.color} ${cat.bg}`}>
                        {cat.label}
                      </span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40">
                        {finding.area}
                      </span>
                      {finding.status === "resolved" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-lime-400/10 px-2 py-0.5 text-[10px] text-lime-300">
                          <CheckCircle className="h-2.5 w-2.5" /> Resolved
                        </span>
                      )}
                      {finding.status === "fixing" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] text-blue-300">
                          <Loader2 className="h-2.5 w-2.5 animate-spin" /> Fixing
                        </span>
                      )}
                      {finding.status === "failed" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-400/10 px-2 py-0.5 text-[10px] text-red-300">
                          <XCircle className="h-2.5 w-2.5" /> Failed
                        </span>
                      )}
                      {finding.status === "dismissed" && (
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/30">Dismissed</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-white/60">{finding.description}</p>
                    {finding.evidence && (
                      <details className="mt-2">
                        <summary className="inline-flex cursor-pointer items-center gap-1 text-xs text-white/40 hover:text-white/60">
                          <ChevronDown className="h-3 w-3" /> Evidence
                        </summary>
                        <pre className="mt-1 max-h-32 overflow-auto rounded-lg bg-black/40 p-2 text-[10px] text-white/40">
                          {finding.evidence}
                        </pre>
                      </details>
                    )}
                    {finding.resolution && (
                      <div className="mt-2 text-xs text-lime-400/70">→ {finding.resolution}</div>
                    )}
                  </div>
                  {/* Action Buttons */}
                  <div className="flex shrink-0 flex-col gap-1.5">
                    {canAct && (
                      <button
                        onClick={() => applyFix(finding)}
                        disabled={isApplying}
                        className={`inline-flex items-center gap-1 rounded-lg border ${cat.border} px-3 py-1.5 text-xs font-medium ${cat.color} hover:bg-white/5 disabled:opacity-50`}
                      >
                        {isApplying ? <Loader2 className="h-3 w-3 animate-spin" /> : <ActionIcon className="h-3 w-3" />}
                        {action.label}
                      </button>
                    )}
                    {canAct && (
                      <button
                        onClick={() => dismiss(finding)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/50 hover:text-white"
                      >
                        <XCircle className="h-3 w-3" /> Dismiss
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}