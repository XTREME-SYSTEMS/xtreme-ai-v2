import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import { Bot, ShieldCheck, RefreshCw, Play, Rocket, Activity, AlertTriangle, CheckCircle2, Cpu } from "lucide-react";

export default function AutonomousSystem() {
  const [plans, setPlans] = useState([]);
  const [plan, setPlan] = useState(null);
  const [phases, setPhases] = useState([]);
  const [health, setHealth] = useState(null);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedingRoadmap, setSeedingRoadmap] = useState(false);
  const [running, setRunning] = useState(false);
  const [auditing, setAuditing] = useState(false);

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

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const allPlans = await base44.entities.ImplementationPlan.filter({ status: "active" }, "-created_date", 50);
      setPlans(allPlans);
      const p = allPlans[0];
      setPlan(p);
      await loadPlan(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [loadPlan]);

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

  const scoreColor = (s) => s >= 100 ? "text-lime-400" : s >= 70 ? "text-yellow-400" : s >= 40 ? "text-orange-400" : "text-red-400";

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw className="h-6 w-6 animate-spin text-lime-400" /></div>;

  if (!plan) {
    return (
      <div>
        <PageHeader title="Autonomous Implementation Engine" subtitle="Self-driving integration of the Faultline AI modules — generate → validate → reflect → heal to 100%" />
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
      <PageHeader title="Autonomous Implementation Engine" subtitle={`Plan: ${plan.name} · Source: ${plan.source_system}`}>
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
        <LoadingButton loading={auditing} onClick={runAudit} variant="ghost"><ShieldCheck className="h-4 w-4" /> Forensic Audit</LoadingButton>
        <LoadingButton onClick={load} variant="ghost"><RefreshCw className="h-4 w-4" /> Refresh</LoadingButton>
      </PageHeader>

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