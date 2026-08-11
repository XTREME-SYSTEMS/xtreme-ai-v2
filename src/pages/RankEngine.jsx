import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import ScoreBar from "@/components/ScoreBar";
import { Rocket, Target, FileText, Link2, Activity, Plus, RefreshCw, TrendingUp, ArrowUp, ArrowDown, Minus, BarChart3 } from "lucide-react";

export default function RankEngine() {
  const [engines, setEngines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ site_name: "", niche: "", site_url: "", cities: "", services: "" });
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [syncing, setSyncing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.RankEngine.list('-created_date', 50);
      setEngines(list);
    } catch { setEngines([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadDetail = async (id) => {
    setDetailLoading(true);
    setSelected(id);
    try {
      const [kw, pages, cite] = await Promise.all([
        base44.entities.RankKeyword.filter({ engine_id: id }),
        base44.entities.RankPage.filter({ engine_id: id }),
        base44.entities.RankCitation.filter({ engine_id: id }),
      ]);
      setDetail({ keywords: kw, pages, citations: cite });
    } catch { setDetail(null); }
    setDetailLoading(false);
  };

  const runEngine = async (engineId) => {
    setRunning(engineId);
    try {
      await base44.functions.invoke('runRankEngine', { action: 'run', engine_id: engineId });
      await load();
      if (selected === engineId) await loadDetail(engineId);
    } catch (e) { alert(e.message); }
    setRunning(null);
  };

  const syncRankings = async (engineId) => {
    setSyncing(engineId || 'all');
    try {
      await base44.functions.invoke('syncRankings', engineId ? { engine_id: engineId } : {});
      await load();
      if (engineId && selected === engineId) await loadDetail(engineId);
    } catch (e) { alert(e.message); }
    setSyncing(null);
  };

  const startCampaign = async () => {
    if (!form.site_name) return;
    setRunning('create');
    try {
      const res = await base44.functions.invoke('runRankEngine', {
        action: 'start',
        site_name: form.site_name,
        niche: form.niche,
        site_url: form.site_url,
        cities: form.cities.split(',').map(s => s.trim()).filter(Boolean),
        services: form.services.split(',').map(s => s.trim()).filter(Boolean),
      });
      await load();
      setShowCreate(false);
      setForm({ site_name: "", niche: "", site_url: "", cities: "", services: "" });
      if (res?.data?.engine_id) loadDetail(res.data.engine_id);
    } catch (e) { alert(e.message); }
    setRunning(null);
  };

  const active = selected ? engines.find(e => e.id === selected) : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Rank Engine" subtitle="Autonomous SEO execution — keywords, programmatic pages, citations, technical audits, and rank-readiness scoring per site.">
        <LoadingButton onClick={() => syncRankings()} loading={syncing === 'all'} variant="ghost">
          <BarChart3 className="h-4 w-4" /> Sync Rankings
        </LoadingButton>
        <LoadingButton onClick={() => setShowCreate(true)} variant="primary">
          <Plus className="h-4 w-4" /> New Campaign
        </LoadingButton>
        <LoadingButton onClick={load} loading={loading} variant="ghost">
          <RefreshCw className="h-4 w-4" /> Refresh
        </LoadingButton>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Target} label="Campaigns" value={engines.length} />
        <StatCard icon={FileText} label="Pages Generated" value={engines.reduce((a, e) => a + (e.pages_generated || 0), 0)} />
        <StatCard icon={Target} label="Keywords Tracked" value={engines.reduce((a, e) => a + (e.target_keywords_count || 0), 0)} />
        <StatCard icon={Link2} label="Citations Built" value={engines.reduce((a, e) => a + (e.citations_built || 0), 0)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-3">
          {loading ? (
            <div className="text-sm text-white/40 py-8 text-center">Loading campaigns…</div>
          ) : engines.length === 0 ? (
            <EmptyState icon={Rocket} title="No campaigns yet" subtitle="Start a campaign to begin autonomous SEO execution for a site." />
          ) : engines.map(e => (
            <button key={e.id} onClick={() => loadDetail(e.id)} className={`w-full text-left rounded-xl border p-4 transition-colors ${selected === e.id ? 'border-lime-400 bg-lime-400/5' : 'border-white/10 bg-zinc-950 hover:bg-white/5'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{e.site_name}</span>
                <StatusBadge status={e.status} />
              </div>
              <div className="mt-1 text-xs text-white/40">{e.niche} · {(e.cities || []).join(', ') || '—'}</div>
              <div className="mt-3">
                <ScoreBar label="Rank Readiness" value={e.overall_rank_readiness || 0} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-white/40">
                <span>{e.pages_generated || 0} pages · {e.target_keywords_count || 0} kw</span>
                <LoadingButton onClick={(ev) => { ev.stopPropagation(); runEngine(e.id); }} loading={running === e.id} variant="ghost" className="px-2 py-1 text-xs">
                  <Activity className="h-3 w-3" /> Run
                </LoadingButton>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {!active ? (
            <Panel title="Campaign Detail"><div className="text-sm text-white/40 py-8 text-center">Select a campaign to view its SEO execution.</div></Panel>
          ) : (
            <>
              <Panel title={`${active.site_name} — Rank Readiness`}>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <ScoreBar label="Technical SEO" value={active.technical_seo_score || 0} />
                  <ScoreBar label="Content" value={active.content_score || 0} />
                  <ScoreBar label="Authority" value={active.authority_score || 0} />
                  <ScoreBar label="Overall" value={active.overall_rank_readiness || 0} />
                </div>
                {active.audit_summary && <p className="mt-4 text-sm text-white/60">{active.audit_summary}</p>}
                {active.gaps && active.gaps.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Top Gaps</div>
                    <ul className="space-y-1">{active.gaps.map((g, i) => <li key={i} className="text-sm text-white/70 flex gap-2"><span className="text-lime-400">›</span>{g}</li>)}</ul>
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <LoadingButton onClick={() => syncRankings(active.id)} loading={syncing === active.id} variant="ghost" className="text-xs">
                    <BarChart3 className="h-3.5 w-3.5" /> Sync Real Rankings
                  </LoadingButton>
                </div>
              </Panel>

              {detailLoading ? (
                <Panel title="Execution Detail"><div className="text-sm text-white/40 py-6 text-center">Loading…</div></Panel>
              ) : detail ? (
                <>
                  <Panel title={`Target Keywords (${detail.keywords.length})`}>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {detail.keywords.map(k => <KeywordRow key={k.id} k={k} />)}
                    </div>
                  </Panel>

                  <Panel title={`Programmatic Pages (${detail.pages.length})`}>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {detail.pages.map(p => (
                        <div key={p.id} className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-sm">
                          <div className="min-w-0">
                            <div className="text-white truncate">{p.title}</div>
                            <div className="text-xs text-white/40">/{p.slug} · {p.word_count || 0} words</div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-lime-400">{p.seo_score || 0}/100</span>
                            <StatusBadge status={p.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  <Panel title={`Citation Targets (${detail.citations.length})`}>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {detail.citations.map(c => (
                        <div key={c.id} className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-sm">
                          <div>
                            <span className="text-white">{c.source_name}</span>
                            <span className="ml-2 text-xs text-white/40 capitalize">{c.category}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-white/40">DA {c.domain_authority || 0}</span>
                            <StatusBadge status={c.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-950 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">New Rank Engine Campaign</h3>
            <div className="space-y-3">
              <Field label="Site / Business Name *"><input className="input" value={form.site_name} onChange={e => setForm({ ...form, site_name: e.target.value })} placeholder="Acme Garage Coatings" /></Field>
              <Field label="Niche"><input className="input" value={form.niche} onChange={e => setForm({ ...form, niche: e.target.value })} placeholder="garage floor coating" /></Field>
              <Field label="Site URL"><input className="input" value={form.site_url} onChange={e => setForm({ ...form, site_url: e.target.value })} placeholder="https://acme.com" /></Field>
              <Field label="Cities (comma-separated)"><input className="input" value={form.cities} onChange={e => setForm({ ...form, cities: e.target.value })} placeholder="Austin, Dallas, Houston" /></Field>
              <Field label="Services (comma-separated)"><input className="input" value={form.services} onChange={e => setForm({ ...form, services: e.target.value })} placeholder="epoxy coating, polyaspartic, concrete sealing" /></Field>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <LoadingButton onClick={() => setShowCreate(false)} variant="ghost">Cancel</LoadingButton>
              <LoadingButton onClick={startCampaign} loading={running === 'create'} variant="primary"><Rocket className="h-4 w-4" /> Launch Campaign</LoadingButton>
            </div>
          </div>
        </div>
      )}

      <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid hsl(0 0% 15%);background:#000;padding:0.5rem 0.75rem;font-size:0.875rem;color:#fff;outline:none}.input:focus{border-color:hsl(84 100% 59%)}`}</style>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
      <div className="flex items-center gap-2 text-white/40"><Icon className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">{label}</span></div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="block text-xs font-medium text-white/60 mb-1">{label}</label>{children}</div>;
}

function KeywordRow({ k }) {
  const pos = k.current_position;
  const prev = k.previous_position;
  let TrendIcon = Minus, trendColor = "text-white/40", trendLabel = "—";
  if (pos && prev) {
    if (pos < prev) { TrendIcon = ArrowUp; trendColor = "text-lime-400"; trendLabel = `▲${(prev - pos).toFixed(1)}`; }
    else if (pos > prev) { TrendIcon = ArrowDown; trendColor = "text-rose-400"; trendLabel = `▼${(pos - prev).toFixed(1)}`; }
  }
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-sm">
      <div className="min-w-0">
        <span className="text-white truncate">{k.keyword}</span>
        {k.city && <span className="ml-2 text-xs text-white/40">{k.city}</span>}
      </div>
      <div className="flex items-center gap-3 text-xs text-white/40 shrink-0">
        {k.impressions ? <span title="Impressions (28d)">👁 {k.impressions}</span> : null}
        {k.clicks ? <span title="Clicks (28d)" className="text-lime-400/70">►{k.clicks}</span> : null}
        {pos ? (
          <span className="flex items-center gap-1">
            <span className="text-white font-medium">#{pos}</span>
            <span className={`flex items-center gap-0.5 ${trendColor}`} title={`Previous: ${prev || '—'}`}>
              <TrendIcon className="h-3 w-3" />{trendLabel !== "—" && trendLabel}
            </span>
          </span>
        ) : (
          <span className="text-white/30">not ranking</span>
        )}
      </div>
    </div>
  );
}