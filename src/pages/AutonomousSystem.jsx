import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import {
  Bot, ShieldCheck, RefreshCw, Play, Rocket, Activity, AlertTriangle,
  CheckCircle2, Cpu, Radar, Database, Boxes, Zap, Clock, Pause,
} from "lucide-react";
import PipelineOperatorGuide from "@/components/autonomous/PipelineOperatorGuide";

// Pipeline Overview — the dashboard for the Xtreme AI Pipeline.
// The AutoBuilder IS the pipeline. This page shows queue health,
// recent builds, system alerts, and optimization findings.
export default function AutonomousSystem() {
  const [builds, setBuilds] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [optimizations, setOptimizations] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discoveryRuns, setDiscoveryRuns] = useState([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [allBuilds, openAlerts, openOpts, recentHealth, recentRuns] = await Promise.all([
        base44.entities.AutoBuild.list("-created_date", 50),
        base44.entities.SystemAlert.filter({ status: "open" }, "-created_date", 10).catch(() => []),
        base44.entities.SystemOptimization.filter({ status: "open" }, "-created_date", 10).catch(() => []),
        base44.entities.SystemHealthScore.list("-created_date", 1).catch(() => []),
        base44.entities.DiscoveryRun.list("-created_date", 5).catch(() => []),
      ]);
      setBuilds(allBuilds || []);
      setAlerts(openAlerts || []);
      setOptimizations(openOpts || []);
      setHealth((recentHealth || [])[0] || null);
      setDiscoveryRuns(recentRuns || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Poll for updates when a build is running
  useEffect(() => {
    const anyRunning = builds.some((b) => b.status === "running");
    if (!anyRunning) return;
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [builds, load]);

  const runCycle = async () => {
    try {
      setRunning(true);
      await base44.functions.invoke("runAutonomousBuild", {});
      await load();
    } catch (e) { console.error(e); } finally { setRunning(false); }
  };

  const runAudit = async () => {
    try {
      setAuditing(true);
      await base44.functions.invoke("forensicAuditAndHarden", {});
      await load();
    } catch (e) { console.error(e); } finally { setAuditing(false); }
  };

  const runDiscovery = async () => {
    try {
      setDiscovering(true);
      await base44.functions.invoke("runDiscoveryScrape", { triggered_by: "manual" });
      await load();
    } catch (e) { console.error(e); } finally { setDiscovering(false); }
  };

  const scoreColor = (s) => s >= 90 ? "text-lime-400" : s >= 70 ? "text-yellow-400" : s >= 40 ? "text-orange-400" : "text-red-400";

  const stats = {
    total: builds.length,
    queued: builds.filter(b => b.status === "queued").length,
    running: builds.filter(b => b.status === "running").length,
    complete: builds.filter(b => b.status === "complete").length,
    failed: builds.filter(b => b.status === "failed").length,
    paused: builds.filter(b => b.status === "paused").length,
  };
  const completionRate = stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0;

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw className="h-6 w-6 animate-spin text-lime-400" /></div>;

  return (
    <div>
      <PageHeader title="Pipeline Overview" subtitle="The Xtreme AI autonomous growth factory — discover, build, deploy, scale">
        <LoadingButton loading={running} onClick={runCycle}><Play className="h-4 w-4" /> Run Cycle</LoadingButton>
        <LoadingButton loading={discovering} onClick={runDiscovery} variant="ghost"><Radar className="h-4 w-4" /> Run Discovery</LoadingButton>
        <LoadingButton loading={auditing} onClick={runAudit} variant="ghost"><ShieldCheck className="h-4 w-4" /> Forensic Audit</LoadingButton>
        <LoadingButton onClick={load} variant="ghost"><RefreshCw className="h-4 w-4" /> Refresh</LoadingButton>
      </PageHeader>

      <PipelineOperatorGuide />

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total Builds", val: stats.total, icon: Boxes, color: "text-white" },
          { label: "Queued", val: stats.queued, icon: Clock, color: "text-yellow-400" },
          { label: "Running", val: stats.running, icon: Zap, color: "text-lime-400" },
          { label: "Complete", val: stats.complete, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Failed", val: stats.failed, icon: AlertTriangle, color: "text-red-400" },
          { label: "Completion", val: `${completionRate}%`, icon: Activity, color: scoreColor(completionRate) },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-white/10 bg-zinc-950 p-3">
            <div className="flex items-center gap-1.5 text-xs text-white/50"><m.icon className="h-3 w-3" /> {m.label}</div>
            <div className={`mt-1 text-2xl font-bold ${m.color}`}>{m.val}</div>
          </div>
        ))}
      </div>

      {/* Health Score */}
      {health && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {[
            { label: "Overall", val: health.overall_score, icon: Activity },
            { label: "Completeness", val: health.completeness_score, icon: CheckCircle2 },
            { label: "Correctness", val: health.correctness_score, icon: Cpu },
            { label: "Integration", val: health.integration_score, icon: Bot },
            { label: "Security", val: health.security_score, icon: ShieldCheck },
            { label: "Performance", val: health.performance_score, icon: Rocket },
            { label: "Autonomy", val: health.autonomy_score, icon: Bot },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-white/10 bg-zinc-950 p-3">
              <div className="flex items-center gap-1.5 text-xs text-white/50"><m.icon className="h-3 w-3" /> {m.label}</div>
              <div className={`mt-1 text-2xl font-bold ${scoreColor(m.val || 0)}`}>{Math.round(m.val || 0)}</div>
            </div>
          ))}
        </div>
      )}

      {/* System Alerts */}
      {alerts.length > 0 && (
        <Panel title="System Alerts" className="mb-6">
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-sm">
                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${a.severity === 'critical' ? 'text-red-400' : 'text-orange-400'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase text-white/50">{(a.alert_type || '').replace(/_/g, ' ')}</span>
                    {a.status === 'escalated' && <span className="rounded-full bg-red-400/10 px-1.5 py-0.5 text-[10px] text-red-300">escalated</span>}
                  </div>
                  <div className="mt-0.5 text-white/80">{a.message}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Auto Builder Queue */}
      <Panel title="Auto Builder Queue" className="mb-6">
        {builds.length === 0 ? (
          <EmptyState icon={Boxes} title="No builds yet" subtitle="Create a build from the Pipeline Catalog or Auto Builder page to start the pipeline.">
            <LoadingButton onClick={runCycle}><Rocket className="h-4 w-4" /> Run Cycle</LoadingButton>
          </EmptyState>
        ) : (
          <div className="space-y-2">
            {builds.slice(0, 15).map((b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/40 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-white/60">
                  {b.status === "running" ? <Zap className="h-4 w-4 text-lime-400" /> :
                   b.status === "complete" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> :
                   b.status === "failed" ? <AlertTriangle className="h-4 w-4 text-red-400" /> :
                   b.status === "paused" ? <Pause className="h-4 w-4 text-amber-400" /> :
                   <Clock className="h-4 w-4 text-white/40" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-white">{b.business_name}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/40">
                    <span className="rounded bg-lime-400/10 px-1 py-0.5 font-medium text-lime-300">
                      {(b.product_type || "marketing_site").replace("_", " ")}
                    </span>
                    <span>·</span>
                    <span className="capitalize">{b.current_step}</span>
                    {b.auto_advance && <><span>·</span><span className="text-lime-400">auto-advance</span></>}
                    {b.industry && <><span>·</span><span className="truncate">{b.industry}</span></>}
                  </div>
                </div>
              </div>
            ))}
            {builds.length > 15 && (
              <div className="text-center text-xs text-white/40 pt-2">+ {builds.length - 15} more builds</div>
            )}
          </div>
        )}
      </Panel>

      {/* Discovery Runs */}
      {discoveryRuns.length > 0 && (
        <Panel title="Recent Discovery Runs" className="mb-6">
          <div className="space-y-1.5">
            {discoveryRuns.map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs">
                <Database className="h-3.5 w-3.5 shrink-0 text-white/40" />
                <span className="text-white/60 capitalize">{r.run_type?.replace(/_/g, " ") || "discovery"}</span>
                <span className="text-white/30">·</span>
                <span className="text-white/50">{r.items_found || 0} found</span>
                <span className="text-white/30">·</span>
                <span className={`capitalize ${r.status === "complete" ? "text-emerald-400" : r.status === "failed" ? "text-red-400" : "text-yellow-400"}`}>{r.status}</span>
                <span className="ml-auto text-white/30">{new Date(r.created_date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Open Optimizations */}
      {optimizations.length > 0 && (
        <Panel title="Open Optimization Findings">
          <div className="space-y-2">
            {optimizations.map((o) => (
              <div key={o.id} className="flex items-start gap-2 rounded-lg border border-white/10 bg-black/40 p-3 text-sm">
                <ShieldCheck className={`mt-0.5 h-4 w-4 shrink-0 ${o.severity === 'critical' ? 'text-red-400' : o.severity === 'high' ? 'text-orange-400' : 'text-yellow-400'}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-white/80">{o.title}</div>
                  <div className="mt-0.5 text-xs text-white/40">{o.description}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}