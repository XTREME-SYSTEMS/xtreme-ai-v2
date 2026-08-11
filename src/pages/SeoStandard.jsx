import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import { CheckCircle2, Circle, Zap, Clock, AlertCircle, RefreshCw, Search, Filter, Bot, ShieldCheck, TrendingUp } from "lucide-react";

const CATEGORY_META = {
  technical: { label: "Technical SEO", color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/30" },
  indexing: { label: "Indexing", color: "text-lime-400", bg: "bg-lime-400/10", border: "border-lime-400/30" },
  content: { label: "Content", color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/30" },
  on_page: { label: "On-Page", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
  off_page: { label: "Off-Page / Backlinks", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" },
  local: { label: "Local SEO", color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/30" },
  social: { label: "Social Signals", color: "text-pink-400", bg: "bg-pink-400/10", border: "border-pink-400/30" },
  authority: { label: "Authority / E-E-A-T", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" },
  monitoring: { label: "Monitoring / Analytics", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30" },
  aeo: { label: "AEO / Answer Engine", color: "text-indigo-400", bg: "bg-indigo-400/10", border: "border-indigo-400/30" },
  ai_search: { label: "AI Search Engines", color: "text-fuchsia-400", bg: "bg-fuchsia-400/10", border: "border-fuchsia-400/30" },
};

const PRIORITY_META = {
  critical: { label: "Critical", color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/30" },
  high: { label: "High", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" },
  medium: { label: "Medium", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
  low: { label: "Low", color: "text-white/40", bg: "bg-white/5", border: "border-white/10" },
};

const FREQ_META = {
  daily: { label: "Daily", icon: Clock, color: "text-lime-400" },
  weekly: { label: "Weekly", icon: Clock, color: "text-cyan-400" },
  monthly: { label: "Monthly", icon: Clock, color: "text-blue-400" },
  ongoing: { label: "Ongoing", icon: RefreshCw, color: "text-violet-400" },
  one_time: { label: "One-Time", icon: CheckCircle2, color: "text-emerald-400" },
  manual: { label: "Manual", icon: Circle, color: "text-white/40" },
};

export default function SeoStandard() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({ category: "all", automation: "all", priority: "all", search: "" });
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.SeoStandardChecklist.list('-category', 200);
      setMethods(list);
    } catch (e) { setError(e.message); setMethods([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const seedChecklist = async () => {
    setSeeding(true);
    setError("");
    try {
      await base44.functions.invoke('seedSeoStandardChecklist', {});
      await load();
    } catch (e) { setError(e.message); }
    setSeeding(false);
  };

  const toggleStatus = async (method) => {
    setUpdating(method.id);
    const next = method.implementation_status === 'complete' ? 'not_started' : 'complete';
    try {
      await base44.entities.SeoStandardChecklist.update(method.id, { implementation_status: next });
      setMethods(prev => prev.map(m => m.id === method.id ? { ...m, implementation_status: next } : m));
    } catch (e) { setError(e.message); }
    setUpdating(null);
  };

  const filtered = useMemo(() => {
    return methods.filter(m => {
      if (filter.category !== "all" && m.category !== filter.category) return false;
      if (filter.automation === "automated" && !m.automation_capable) return false;
      if (filter.automation === "daily" && m.automation_frequency !== "daily") return false;
      if (filter.priority !== "all" && m.priority !== filter.priority) return false;
      if (filter.search && !m.method_name.toLowerCase().includes(filter.search.toLowerCase()) && !m.description.toLowerCase().includes(filter.search.toLowerCase())) return false;
      return true;
    });
  }, [methods, filter]);

  const stats = useMemo(() => {
    const total = methods.length;
    const complete = methods.filter(m => m.implementation_status === 'complete').length;
    const automated = methods.filter(m => m.automation_capable).length;
    const dailyAuto = methods.filter(m => m.automation_frequency === 'daily').length;
    const weeklyAuto = methods.filter(m => m.automation_frequency === 'weekly').length;
    const critical = methods.filter(m => m.priority === 'critical').length;
    const googleConfirmed = methods.filter(m => m.google_confirmed).length;
    return { total, complete, automated, dailyAuto, weeklyAuto, critical, googleConfirmed, pct: total ? Math.round((complete / total) * 100) : 0 };
  }, [methods]);

  const categoryStats = useMemo(() => {
    const cats = {};
    methods.forEach(m => {
      if (!cats[m.category]) cats[m.category] = { total: 0, complete: 0, automated: 0, daily: 0 };
      cats[m.category].total++;
      if (m.implementation_status === 'complete') cats[m.category].complete++;
      if (m.automation_capable) cats[m.category].automated++;
      if (m.automation_frequency === 'daily') cats[m.category].daily++;
    });
    return cats;
  }, [methods]);

  return (
    <div className="space-y-6">
      <PageHeader title="SEO Standard Checklist" subtitle="Every technological method to get any website to Page 1 of Google — the master standard for every site we build.">
        <LoadingButton onClick={seedChecklist} loading={seeding} variant="primary">
          <Zap className="h-4 w-4" /> {methods.length > 0 ? 'Re-seed Methods' : 'Initialize Checklist'}
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

      {methods.length === 0 && !loading ? (
        <EmptyState icon={CheckCircle2} title="Checklist not initialized" subtitle="Click 'Initialize Checklist' to load 150+ SEO methods across 9 categories."
          children={<LoadingButton onClick={seedChecklist} loading={seeding} variant="primary"><Zap className="h-4 w-4" /> Initialize Now</LoadingButton>} />
      ) : (
        <>
          {/* Overall Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            <StatBox label="Total Methods" value={stats.total} icon={CheckCircle2} color="text-white" />
            <StatBox label="Complete" value={stats.complete} icon={CheckCircle2} color="text-lime-400" />
            <StatBox label="Completion" value={`${stats.pct}%`} icon={TrendingUp} color="text-lime-400" />
            <StatBox label="Automatable" value={stats.automated} icon={Bot} color="text-cyan-400" />
            <StatBox label="Daily Auto" value={stats.dailyAuto} icon={Clock} color="text-lime-400" />
            <StatBox label="Critical" value={stats.critical} icon={AlertCircle} color="text-rose-400" />
            <StatBox label="Google Confirmed" value={stats.googleConfirmed} icon={ShieldCheck} color="text-emerald-400" />
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(categoryStats).map(([cat, s]) => {
              const meta = CATEGORY_META[cat];
              const pct = s.total ? Math.round((s.complete / s.total) * 100) : 0;
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(f => ({ ...f, category: f.category === cat ? "all" : cat }))}
                  className={`rounded-xl border p-4 text-left transition-colors ${filter.category === cat ? meta.border + ' ' + meta.bg : 'border-white/10 bg-zinc-950 hover:border-white/20'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
                    <span className="text-xs text-white/40">{s.complete}/{s.total}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className={`h-2 rounded-full ${meta.color.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-white/40">
                    <span className="flex items-center gap-1"><Bot className="h-3 w-3" /> {s.automated} auto</span>
                    {s.daily > 0 && <span className="flex items-center gap-1 text-lime-400/60"><Clock className="h-3 w-3" /> {s.daily} daily</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                className="w-full rounded-lg border border-white/15 bg-black pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-lime-400"
                placeholder="Search methods..."
                value={filter.search}
                onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
              />
            </div>
            <select className="rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white outline-none focus:border-lime-400" value={filter.automation} onChange={e => setFilter(f => ({ ...f, automation: e.target.value }))}>
              <option value="all">All Methods</option>
              <option value="automated">Automatable Only</option>
              <option value="daily">Daily Automated</option>
            </select>
            <select className="rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white outline-none focus:border-lime-400" value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}>
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            {filter.category !== "all" && (
              <button onClick={() => setFilter(f => ({ ...f, category: "all" }))} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/60 hover:bg-white/5">
                Clear category
              </button>
            )}
            <span className="text-xs text-white/40 ml-auto">{filtered.length} methods</span>
          </div>

          {/* Method List */}
          <Panel title={`Methods (${filtered.length})`}>
            {loading ? (
              <div className="text-sm text-white/40 py-8 text-center">Loading methods…</div>
            ) : (
              <div className="space-y-1.5">
                {filtered.map(m => {
                  const catMeta = CATEGORY_META[m.category];
                  const priMeta = PRIORITY_META[m.priority];
                  const freqMeta = FREQ_META[m.automation_frequency] || FREQ_META.manual;
                  const FreqIcon = freqMeta.icon;
                  const isComplete = m.implementation_status === 'complete';
                  return (
                    <div key={m.id} className={`flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${isComplete ? 'border-lime-400/20 bg-lime-400/5' : 'border-white/5 bg-zinc-950 hover:border-white/10'}`}>
                      <button onClick={() => toggleStatus(m)} disabled={updating === m.id} className="mt-0.5 shrink-0">
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5 text-lime-400" />
                        ) : (
                          <Circle className="h-5 w-5 text-white/30 hover:text-white/60" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-medium ${isComplete ? 'text-white/60 line-through' : 'text-white'}`}>{m.method_name}</span>
                          <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase ${catMeta.color} ${catMeta.bg} ${catMeta.border}`}>{catMeta.label}</span>
                          <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase ${priMeta.color} ${priMeta.bg} ${priMeta.border}`}>{priMeta.label}</span>
                          {m.automation_capable && (
                            <span className="flex items-center gap-0.5 rounded border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 text-[10px] uppercase text-cyan-400">
                              <Bot className="h-2.5 w-2.5" /> Auto
                            </span>
                          )}
                          {m.google_confirmed && (
                            <span className="flex items-center gap-0.5 rounded border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[10px] uppercase text-emerald-400">
                              <ShieldCheck className="h-2.5 w-2.5" /> Confirmed
                            </span>
                          )}
                          <span className={`flex items-center gap-0.5 text-[10px] ${freqMeta.color}`}>
                            <FreqIcon className="h-2.5 w-2.5" /> {freqMeta.label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-white/50">{m.description}</p>
                        {m.function_name && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="text-[10px] text-white/30">Automated by:</span>
                            <code className="text-[10px] text-lime-400/80 font-mono">{m.function_name}()</code>
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs text-white/30">Impact</div>
                        <div className={`text-lg font-bold ${m.impact_score >= 8 ? 'text-lime-400' : m.impact_score >= 6 ? 'text-amber-400' : 'text-white/50'}`}>{m.impact_score}/10</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}

function StatBox({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 p-3">
      <div className="flex items-center gap-1.5 text-white/40 text-xs uppercase tracking-wider">
        <Icon className={`h-3.5 w-3.5 ${color}`} /> {label}
      </div>
      <div className={`mt-1 text-xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}