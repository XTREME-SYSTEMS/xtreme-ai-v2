import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import { Bot, ShieldCheck, RefreshCw, Play, Rocket, Activity, AlertTriangle, CheckCircle2, Cpu, Radar, Database } from "lucide-react";
import PipelineOperatorGuide from "@/components/autonomous/PipelineOperatorGuide";

export default function AutonomousSystem() {
  const [plans, setPlans] = useState([]);
  const [plan, setPlan] = useState(null);
  const [phases, setPhases] = useState([]);
  const [health, setHealth] = useState(null);
  const [repairs, setRepairs] = useState([]);
  const [systemFailures, setSystemFailures] = useState({ alerts: [], failedBuilds: [], failedJobs: [] });
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedingRoadmap, setSeedingRoadmap] = useState(false);
  const [running, setRunning] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discoveryRuns, setDiscoveryRuns] = useState([]);

  const loadPlan = useCallback(async (p) => {
    if (!p) { setPhases([]); setHealth(null); setRepairs([]); return; }
    const [phs, hlth, reps] = await Promise.all([
      base44.entities.ImplementationPhase.filter({ plan_id: p.id }),
      base44.entities.SystemHealthScore.filter({ plan_id: p.id }, "-created_date", 1),
      base44.entities.RepairTask.filter({ plan_id: p.id, status: "open" }, "-created_date", 20),
    ]);
    setPhases(phs.sort((a, b) => (a.phase_number || 0) - (b.phase_number || 0)));
    setHealth(hlth[0] || null);
    setRepairs(reps);
  }, []);

  const loadSystemFailures = useCallback(async () => {
    try {
      const [openAlerts, escalatedAlerts, failedBuilds, failedJobs, recentRuns] = await Promise.all([
        base44.entities.SystemAlert.filter({ status: "open" }, "-created_date", 20).catch(() => []),
        base44.entities.SystemAlert.filter({ status: "escalated" }, "-created_date", 20).catch(() => []),
        base44.entities.AutoBuild.filter({ status: "failed" }, "-created_date", 20).catch(() => []),
        base44.entities.GenerationJob.filter({ status: "failed" }, "-created_date", 20).catch(() => []),
        base44.entities.DiscoveryRun.list("-created_date", 5).catch(() => []),
      ]);
      setSystemFailures({
        alerts: [...(openAlerts || []), ...(escalatedAlerts || [])],
        failedBuilds: failedBuilds || [],
        failedJobs: failedJobs || [],
      });
      setDiscoveryRuns(recentRuns || []);
    } catch (e) {
      console.error("Failed to load system failures", e);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const allPlans = await base44.entities.ImplementationPlan.filter({ status: "active" }, "-created_date", 50);
      setPlans(allPlans);
      const p = allPlans[0];
      setPlan(p);
      await loadPlan(p);
      await loadSystemFailures();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [loadPlan, loadSystemFailures]);

  useEffect(() => { load(); }, [load]);

  const switchPlan = async (planId) => {
    const p = plans.find((x) => x.id === planId);
    setPlan(p);
    await loadPlan(p);
  };

  const seed = async () => {
    try {
      setSeeding(true);
      await base44.functions.invoke("seedImplementationPlan", {});
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  };

  const seedRoadmap = async () => {
    try {
      setSeedingRoadmap(true);
      await base44.functions.invoke("seedAiMarketingRoadmap", {});
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSeedingRoadmap(false);
    }
  };

  const runCycle = async () => {
    try {
      setRunning(true);
      await base44.functions.invoke("runAutonomousBuild", {});
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  const runAudit = async () => {
    try {
      setAuditing(true);
      await base44.functions.invoke("forensicAuditAndHarden", {});
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setAuditing(false);
    }
  };

  const runDiscovery = async () => {
    try {
      setDiscovering(true);
      await base44.functions.invoke("runDiscoveryScrape", { triggered_by: "manual" });
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setDiscovering(false);
    }
  };

  const scoreColor = (s) => s >= 100 ? "text-lime-400" : s >= 70 ? "text-yellow-400" : s >= 40 ? "text-orange-400" : "text-red-400";

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw className="h-6 w-6 animate-spin text-lime-400" /></div>;

  if (!plan) {
    return (
      <div>
        <PageHeader title="Pipeline Overview" subtitle="The autonomous growth operating system — discover, validate, build, and deploy" />
        <PipelineOperatorGuide />
        <EmptyState icon={Bot} title="No active implementation plan" subtitle="Seed a plan to bootstrap phases. The autonomous build loop will then drive each phase to 100% with the validator checking everything installed.">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <LoadingButton loading={seeding} onClick={seed}><Rocket className="h-4 w-4" /> Seed Faultline Plan</LoadingButton>
            <LoadingButton loading={seedingRoadmap} onClick={seedRoadmap} variant="ghost"><Bot className="h-4 w-4" /> Seed AI Marketing Roadmap</LoadingButton>
          </div>
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Pipeline Overview" subtitle={`Plan: ${plan.name} · Source: ${plan.source_system}`}>
        {plans.length > 1 && (
          <select
            value={plan.id}
            onChange={(e) => switchPlan(e.target.value)}
            className="rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white"
          >
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <LoadingButton loading={seedingRoadmap} onClick={seedRoadmap} variant="ghost"><Bot className="h-4 w-4" /> Seed AI Roadmap</LoadingButton>
        <LoadingButton loading={running} onClick={runCycle}><Play className="h-4 w-4" /> Run Cycle</LoadingButton>
        <LoadingButton loading={discovering} onClick={runDiscovery} variant="ghost"><Radar className="h-4 w-4" /> Run Discovery</LoadingButton>
        <LoadingButton loading={auditing} onClick={runAudit} variant="ghost"><ShieldCheck className="h-4 w-4" /> Forensic Audit</LoadingButton>
        <LoadingButton onClick={load} variant="ghost"><RefreshCw className="h-4 w-4" /> Refresh</LoadingButton>
      </PageHeader>

      {/* Operator Guide — what the pipeline is, how to operate it, capabilities */}
      <PipelineOperatorGuide />

      {/* Autonomous Discovery — integrated into the system */}
      <Panel title="Autonomous Discovery Engine" className="mb-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-400/15">
            <Radar className="h-5 w-5 text-lime-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/60">
              Scrapes the web for business leads with bad websites and new app/website ideas. Runs on a schedule or manually.
            </p>
            {discoveryRuns.length > 0 && (
              <div className="mt-3 space-y-1.5">
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
            )}
          </div>
          <LoadingButton loading={discovering} onClick={runDiscovery}>
            <Radar className="h-4 w-4" /> Run Now
          </LoadingButton>
        </div>
      </Panel>

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

      {/* System Failures */}
      {(systemFailures.alerts.length > 0 || systemFailures.failedBuilds.length > 0 || systemFailures.failedJobs.length > 0) && (
        <Panel title="System Failures" className="mb-6">
          <div className="space-y-2">
            {systemFailures.alerts.map((a) => (
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
            {systemFailures.failedBuilds.map((b) => (
              <div key={b.id} className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <div className="min-w-0 flex-1">
                  <div className="text-white/80">Failed build: {b.business_name}</div>
                  <div className="mt-0.5 text-xs text-white/40">Step: {b.current_step} · {b.error?.slice(0, 100) || 'unknown error'}</div>
                </div>
              </div>
            ))}
            {systemFailures.failedJobs.map((j) => (
              <div key={j.id} className="flex items-start gap-2 rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                <div className="min-w-0 flex-1">
                  <div className="text-white/80">Failed job: {j.job_type}</div>
                  <div className="mt-0.5 text-xs text-white/40">{j.error?.slice(0, 100) || 'unknown error'}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Progress bar */}
      <Panel title="Plan Progress" className="mb-6">
        <div className="flex items-center justify-between text-sm text-white/60 mb-2">
          <span>{plan.completed_phases || 0} / {plan.total_phases || phases.length} phases passed</span>
          <span className={scoreColor(plan.overall_score || 0)}>{Math.round(plan.overall_score || 0)}% overall</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-lime-400 transition-all" style={{ width: `${plan.overall_score || 0}%` }} />
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-white/40">
          <Activity className="h-3 w-3" /> Trend: <span className="capitalize">{health?.trend || "stable"}</span>
          {health?.open_repair_tasks > 0 && <><AlertTriangle className="h-3 w-3 ml-2" /> {health.open_repair_tasks} open repair tasks</>}
        </div>
      </Panel>

      {/* Phases */}
      <Panel title="Implementation Phases" className="mb-6">
        <div className="space-y-2">
          {phases.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/40 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-white/60">{p.phase_number}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-white">{p.title}</span>
                  <StatusBadge status={p.status} />
                </div>
                <div className="truncate text-xs text-white/40">{p.module} · iteration {p.iteration || 0}/{p.max_iterations || 5}</div>
              </div>
              <div className={`text-lg font-bold ${scoreColor(p.score || 0)}`}>{Math.round(p.score || 0)}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Repair Tasks */}
      {repairs.length > 0 && (
        <Panel title="Open Repair Tasks (auto-generated by reflection)">
          <div className="space-y-2">
            {repairs.map((r) => (
              <div key={r.id} className="flex items-start gap-2 rounded-lg border border-white/10 bg-black/40 p-3 text-sm">
                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${r.severity === 'critical' ? 'text-red-400' : r.severity === 'high' ? 'text-orange-400' : 'text-yellow-400'}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-white/80">{r.description}</div>
                  {r.fix_strategy && <div className="mt-1 text-xs text-lime-400/70">Fix: {r.fix_strategy}</div>}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}