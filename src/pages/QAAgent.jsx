import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import {
  Bug, Play, Activity, AlertTriangle, CheckCircle, Clock,
  TrendingUp, RefreshCw, FileText, Zap,
} from "lucide-react";

export default function QAAgent() {
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [findings, setFindings] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [alertList, optList] = await Promise.all([
        base44.entities.SystemAlert.filter({ status: "open" }, "-created_date", 10),
        base44.entities.SystemOptimization.list("-created_date", 20),
      ]);
      setAlerts(alertList || []);
      setFindings((optList || []).filter((o) => o.area === "qa_crawl").slice(0, 10));
      setProposals((optList || []).filter((o) => o.recommended_action === "enhance" && o.status === "open").slice(0, 5));
    } catch (e) {
      console.error("Failed to load QA data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const runFullCycle = async () => {
    setRunning(true);
    try {
      const res = await base44.functions.invoke("qaRunFullCycle", {});
      setLastRun(res.data);
      await loadData();
    } catch (e) {
      console.error("QA cycle failed:", e);
      alert("QA cycle failed: " + (e?.message || "unknown error"));
    } finally {
      setRunning(false);
    }
  };

  const quickCrawl = async () => {
    setRunning(true);
    try {
      const res = await base44.functions.invoke("qaCrawlSite", { maxPages: 5 });
      setLastRun({ ...res.data, llm_summary: "Quick crawl — no AI analysis." });
      await loadData();
    } catch (e) {
      console.error("Crawl failed:", e);
      alert("Crawl failed: " + (e?.message || "unknown error"));
    } finally {
      setRunning(false);
    }
  };

  const score = lastRun?.score;
  const scoreColor = score >= 75 ? "text-green-400" : score >= 50 ? "text-amber-400" : "text-red-400";

  return (
    <div className="space-y-6">
      <PageHeader
        title="QA Agent"
        subtitle="Autonomous testing, auditing, and self-healing — crawls the site, captures errors, researches fixes, and emails a daily report."
      />

      {/* Action bar */}
      <div className="flex flex-wrap gap-3">
        <LoadingButton onClick={runFullCycle} loading={running}>
          <Zap className="h-4 w-4 mr-1.5" /> Run Full QA Cycle
        </LoadingButton>
        <LoadingButton variant="ghost" onClick={quickCrawl} loading={running}>
          <Bug className="h-4 w-4 mr-1.5" /> Quick Crawl
        </LoadingButton>
        <LoadingButton variant="ghost" onClick={loadData} loading={loading}>
          <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
        </LoadingButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Health Score" value={score != null ? `${score}/100` : "—"} valueClass={scoreColor} />
        <StatCard icon={Bug} label="Pages Crawled" value={lastRun?.pages_crawled ?? "—"} />
        <StatCard icon={AlertTriangle} label="Open Alerts" value={alerts.length} valueClass={alerts.length > 0 ? "text-red-400" : ""} />
        <StatCard icon={FileText} label="Findings" value={lastRun?.findings_count ?? "—"} />
      </div>

      {/* Last run result */}
      {lastRun && (
        <Panel title="Last Run Result">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <div><span className="text-white/40">Method:</span> <span className="text-white">{lastRun.method}</span></div>
              <div><span className="text-white/40">Critical:</span> <span className="text-red-400">{lastRun.critical_count ?? 0}</span></div>
              <div><span className="text-white/40">High:</span> <span className="text-amber-400">{lastRun.high_count ?? 0}</span></div>
              <div><span className="text-white/40">Completed:</span> <span className="text-white">{lastRun.completed_at ? new Date(lastRun.completed_at).toLocaleString() : "—"}</span></div>
            </div>
            {lastRun.llm_summary && (
              <div className="rounded-lg border border-white/10 bg-black p-4">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
                  <TrendingUp className="h-3.5 w-3.5" /> AI Analysis & Recommendations
                </div>
                <pre className="whitespace-pre-wrap text-xs text-white/70 font-sans">{lastRun.llm_summary}</pre>
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* Open Alerts */}
      <Panel title="Open Alerts">
        {loading ? (
          <div className="py-8 text-center text-white/30">Loading...</div>
        ) : alerts.length === 0 ? (
          <EmptyState icon={CheckCircle} title="No open alerts" subtitle="System is healthy — no critical issues detected." />
        ) : (
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-sm text-white">{a.message}</div>
                  <div className="text-xs text-white/40 mt-0.5">{a.alert_type} · {new Date(a.created_date).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Recent Findings */}
      <Panel title="Recent QA Findings">
        {loading ? (
          <div className="py-8 text-center text-white/30">Loading...</div>
        ) : findings.length === 0 ? (
          <EmptyState icon={Bug} title="No findings yet" subtitle="Run a QA cycle to crawl the site and detect issues." />
        ) : (
          <div className="space-y-2">
            {findings.map((f) => (
              <div key={f.id} className="flex items-start gap-3 rounded-lg border border-white/10 bg-black p-3">
                <SeverityBadge severity={f.severity} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white">{f.title}</div>
                  <div className="text-xs text-white/40 mt-0.5">{f.description}</div>
                </div>
                <span className="shrink-0 rounded px-2 py-0.5 text-[10px] font-medium bg-white/5 text-white/50">{f.recommended_action}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Optimization Proposals */}
      {proposals.length > 0 && (
        <Panel title="Optimization Proposals">
          <div className="space-y-2">
            {proposals.map((p) => (
              <div key={p.id} className="flex items-start gap-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
                <TrendingUp className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-sm text-white">{p.title}</div>
                  <div className="text-xs text-white/50 mt-0.5">{p.description}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Daily automation note */}
      <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Clock className="h-4 w-4 text-amber-400" />
          <span>Daily automation is active — a full QA cycle runs every night at 3:00 AM ET and emails a report to all admins.</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, valueClass }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
      <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-1">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className={`text-2xl font-bold ${valueClass || "text-white"}`}>{value}</div>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const colors = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-amber-400/20 text-amber-400 border-amber-400/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return (
    <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold uppercase ${colors[severity] || colors.low}`}>
      {severity}
    </span>
  );
}