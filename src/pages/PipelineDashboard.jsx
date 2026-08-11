import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import {
  Globe, Search, Rocket, CheckCircle, FileText, MapPin, Link2, Mail,
  TrendingUp, Trophy, AlertCircle, RefreshCw, Zap, Activity, ChevronDown,
} from "lucide-react";

const STAGES = [
  { key: 'acquired', label: 'Acquired', icon: Globe, color: 'text-white/50', bg: 'bg-white/5' },
  { key: 'audited', label: 'Audited', icon: Search, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { key: 'deployed', label: 'Deployed', icon: Rocket, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { key: 'gsc_verified', label: 'GSC Verified', icon: CheckCircle, color: 'text-lime-400', bg: 'bg-lime-400/10' },
  { key: 'content_generated', label: 'Content Live', icon: FileText, color: 'text-lime-400', bg: 'bg-lime-400/10' },
  { key: 'citations_built', label: 'Citations', icon: MapPin, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { key: 'backlinks_prospected', label: 'Backlinks', icon: Link2, color: 'text-violet-400', bg: 'bg-violet-400/10' },
  { key: 'outreach_sent', label: 'Outreach', icon: Mail, color: 'text-violet-400', bg: 'bg-violet-400/10' },
  { key: 'ranking', label: 'Ranking', icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { key: 'page_one', label: 'Page One', icon: Trophy, color: 'text-lime-400', bg: 'bg-lime-400/10' },
];

export default function PipelineDashboard() {
  const [pipeline, setPipeline] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [stageFilter, setStageFilter] = useState('all');
  const [error, setError] = useState("");
  const [optResult, setOptResult] = useState(null);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke('getPipelineStatus', {});
      const data = res?.data || res;
      setPipeline(data.pipeline || []);
      setSummary(data.summary || {});
    } catch (e) { setError(e.message); setPipeline([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const runOptimization = async () => {
    setOptimizing(true);
    setError("");
    setOptResult(null);
    try {
      const res = await base44.functions.invoke('autoOptimizeSites', {});
      const data = res?.data || res;
      setOptResult(data);
      await load();
    } catch (e) { setError(e.message); }
    setOptimizing(false);
  };

  const pushAllToMax = async () => {
    setPushing(true);
    setError("");
    setPushResult(null);
    try {
      const res = await base44.functions.invoke('pushAllToMax', {});
      const data = res?.data || res;
      setPushResult(data);
      await load();
    } catch (e) { setError(e.message); }
    setPushing(false);
  };

  const launchAll = async () => {
    setLaunching(true);
    setError("");
    try {
      await base44.functions.invoke('autoLaunchAcquiredDomains', {});
      await load();
    } catch (e) { setError(e.message); }
    setLaunching(false);
  };

  const filtered = stageFilter === 'all'
    ? pipeline
    : pipeline.filter(d => d.current_stage === stageFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Growth Pipeline"
        subtitle="Track every domain from acquisition to page-one ranking — fully autonomous."
      >
        <LoadingButton onClick={pushAllToMax} loading={pushing} variant="primary">
          <Zap className="h-4 w-4" /> Push All to Max
        </LoadingButton>
        <LoadingButton onClick={launchAll} loading={launching} variant="ghost">
          <Zap className="h-4 w-4" /> Auto-Launch All
        </LoadingButton>
        <LoadingButton onClick={runOptimization} loading={optimizing} variant="ghost">
          <Activity className="h-4 w-4" /> Run Optimization Cycle
        </LoadingButton>
        <LoadingButton onClick={load} loading={loading} variant="ghost">
          <RefreshCw className="h-4 w-4" /> Refresh
        </LoadingButton>
      </PageHeader>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {optResult && (
        <div className="rounded-lg border border-lime-400/30 bg-lime-400/5 px-4 py-3 text-sm text-lime-300">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle className="h-4 w-4" /> Optimization complete — {optResult.optimized} domains optimized, {optResult.pages_optimized || 0} pages updated
          </div>
          <button onClick={() => setOptResult(null)} className="ml-auto text-lime-400/60 hover:text-lime-400">×</button>
        </div>
      )}

      {pushResult && (
        <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-300">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle className="h-4 w-4" /> Pipeline push complete — {pushResult.summary?.pushed || 0} domains pushed, {pushResult.summary?.failed || 0} failed
          </div>
          <button onClick={() => setPushResult(null)} className="ml-auto text-cyan-400/60 hover:text-cyan-400">×</button>
        </div>
      )}

      {/* Stage funnel stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-10">
        {STAGES.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setStageFilter(stageFilter === s.key ? 'all' : s.key)}
            className={`rounded-xl border p-3 text-left transition-colors ${
              stageFilter === s.key
                ? 'border-lime-400 bg-lime-400/10'
                : 'border-white/10 bg-zinc-950 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              <span className="text-[9px] uppercase tracking-wider text-white/40 truncate">{s.label}</span>
            </div>
            <div className="mt-1.5 text-2xl font-bold text-white">{summary[s.key] || 0}</div>
            {i < STAGES.length - 1 && (
              <div className="mt-1 h-0.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-lime-400/40"
                  style={{ width: `${((summary[s.key] || 0) / Math.max(summary.acquired || 1, 1)) * 100}%` }}
                />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Domain pipeline cards */}
      <Panel title={`Domain Pipeline (${filtered.length}${stageFilter !== 'all' ? ` · ${STAGES.find(s => s.key === stageFilter)?.label}` : ''})`}>
        {loading ? (
          <div className="text-sm text-white/40 py-8 text-center">Loading pipeline…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Globe}
            title="No domains in pipeline"
            subtitle="Add domains to your portfolio to start tracking their growth journey from acquisition to page one."
          />
        ) : (
          <div className="space-y-2">
            {filtered.map(d => (
              <DomainPipelineCard key={d.id} domain={d} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function DomainPipelineCard({ domain: d }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950 overflow-hidden">
      <div
        className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-white/5"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">{d.domain}</span>
            <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] uppercase text-white/40">{d.tld}</span>
            {d.niche && <span className="text-xs text-white/40 hidden sm:inline">{d.niche}</span>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/40">
            <span>{d.keywords_count} kw</span>
            <span>{d.pages_count} pages</span>
            <span>{d.citations_count} citations</span>
            <span>{d.backlinks_count} backlinks</span>
            {d.best_position > 0 && <span className="text-cyan-400">#{d.best_position}</span>}
            {d.page_one_keywords > 0 && <span className="text-lime-400">{d.page_one_keywords} on page 1</span>}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:block w-40">
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-lime-400/60 to-lime-400 transition-all duration-500"
                style={{ width: `${d.progress}%` }}
              />
            </div>
            <div className="mt-0.5 text-[10px] text-white/40 text-right">{d.progress}% · stage {d.stage_index + 1}/10</div>
          </div>
          <StageBadge stage={d.current_stage} />
          <ChevronDown className={`h-4 w-4 text-white/30 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/10 px-4 py-4 bg-black/50">
          {/* Stage checklist */}
          <div className="grid grid-cols-5 gap-2 lg:grid-cols-10">
            {STAGES.map((s) => {
              const done = d.stages[s.key];
              return (
                <div
                  key={s.key}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center ${
                    done ? 'border-lime-400/30 bg-lime-400/5' : 'border-white/10 bg-black'
                  }`}
                >
                  {done ? (
                    <CheckCircle className="h-4 w-4 text-lime-400" />
                  ) : (
                    <s.icon className="h-4 w-4 text-white/20" />
                  )}
                  <span className={`text-[8px] leading-tight ${done ? 'text-lime-400' : 'text-white/30'}`}>{s.label}</span>
                </div>
              );
            })}
          </div>

          {/* Activity log */}
          {d.logs && d.logs.length > 0 && (
            <div className="mt-4">
              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Recent Activity</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {d.logs.slice().reverse().map((log, i) => (
                  <div key={i} className="text-xs text-white/50 font-mono">{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StageBadge({ stage }) {
  const stageObj = STAGES.find(s => s.key === stage);
  if (!stageObj) return <span className="rounded-md border border-white/10 px-2 py-0.5 text-xs text-white/40">{stage}</span>;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-0.5 text-xs font-medium ${stageObj.color}`}>
      <stageObj.icon className="h-3 w-3" />
      {stageObj.label}
    </span>
  );
}