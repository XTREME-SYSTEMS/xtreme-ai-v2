import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import { Globe, Plus, Rocket, RefreshCw, Search, CheckCircle, ExternalLink, TrendingUp, Zap, AlertCircle, Radar } from "lucide-react";

export default function DomainPortfolio() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkNiche, setBulkNiche] = useState("");
  const [launching, setLaunching] = useState(null);
  const [launchingAll, setLaunchingAll] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discoverResult, setDiscoverResult] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.DomainPortfolio.list('-created_date', 200);
      setDomains(list);
    } catch (e) { setError(e.message); setDomains([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleBulkAdd = async () => {
    if (!bulkText.trim()) return;
    setLaunching('adding');
    setError("");
    try {
      const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
      const records = lines.map(line => {
        const domain = line.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
        const tld = '.' + domain.split('.').slice(-1)[0];
        return { domain, tld, niche: bulkNiche || '', status: 'acquired', acquired_date: new Date().toISOString().slice(0, 10), logs: ['Added to portfolio'] };
      });
      await base44.entities.DomainPortfolio.bulkCreate(records);
      setBulkText("");
      setBulkNiche("");
      setShowAdd(false);
      await load();
    } catch (e) { setError(e.message); }
    setLaunching(null);
  };

  const launchDomain = async (d) => {
    setLaunching(d.id);
    setError("");
    try {
      // 1. Create campaign + submit to GSC
      await base44.functions.invoke('launchDomainPortfolio', {
        portfolio_id: d.id,
        niche: d.niche,
      });
      await load();
      // 2. Fire-and-forget: run the rank engine to generate keywords/pages/citations
      const engineId = (await base44.entities.DomainPortfolio.get(d.id)).engine_id;
      if (engineId) {
        base44.functions.invoke('runRankEngine', { action: 'run', engine_id: engineId }).catch(() => {});
      }
    } catch (e) { setError(e.message); }
    setLaunching(null);
  };

  const launchAll = async () => {
    const acquired = domains.filter(d => d.status === 'acquired');
    if (!acquired.length) return;
    setLaunchingAll(true);
    setError("");
    for (const d of acquired) {
      try {
        await base44.functions.invoke('launchDomainPortfolio', { portfolio_id: d.id, niche: d.niche });
        const updated = await base44.entities.DomainPortfolio.get(d.id);
        if (updated.engine_id) {
          base44.functions.invoke('runRankEngine', { action: 'run', engine_id: updated.engine_id }).catch(() => {});
        }
      } catch (e) { setError(e.message); }
    }
    await load();
    setLaunchingAll(false);
  };

  const discoverAssets = async () => {
    setDiscovering(true);
    setError("");
    setDiscoverResult(null);
    try {
      const res = await base44.functions.invoke('discoverPortfolioAssets', {});
      const data = res?.data || res;
      setDiscoverResult(data);
      await load();
    } catch (e) { setError(e.message); }
    setDiscovering(false);
  };

  const submitGSC = async (d) => {
    setLaunching('gsc-' + d.id);
    try {
      await base44.functions.invoke('submitToGSC', { portfolio_id: d.id });
      await load();
    } catch (e) { setError(e.message); }
    setLaunching(null);
  };

  const stats = {
    total: domains.length,
    acquired: domains.filter(d => d.status === 'acquired').length,
    active: domains.filter(d => d.status === 'active' || d.status === 'gsc_submitted').length,
    ranking: domains.filter(d => d.best_position > 0).length,
    pageOne: domains.reduce((a, d) => a + (d.page_one_keywords || 0), 0),
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Domain Portfolio" subtitle="Acquire nearme/nearyou domains, auto-launch SEO campaigns, and submit to Google Search Console — at scale.">
        <LoadingButton onClick={discoverAssets} loading={discovering} variant="ghost">
          <Radar className="h-4 w-4" /> Auto-Discover
        </LoadingButton>
        <LoadingButton onClick={() => setShowAdd(true)} variant="primary">
          <Plus className="h-4 w-4" /> Add Domains
        </LoadingButton>
        <LoadingButton onClick={launchAll} loading={launchingAll} variant="ghost" disabled={stats.acquired === 0}>
          <Zap className="h-4 w-4" /> Launch All ({stats.acquired})
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

      {discoverResult && (
        <div className="rounded-lg border border-lime-400/30 bg-lime-400/5 px-4 py-3 text-sm text-lime-300">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle className="h-4 w-4" /> Discovered {discoverResult.discovered?.length || 0} domains · Created {discoverResult.created} new · Linked {discoverResult.existing_linked} existing
          </div>
          {discoverResult.discovered?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {discoverResult.discovered.slice(0, 20).map((d, i) => (
                <span key={i} className="rounded border border-lime-400/20 px-1.5 py-0.5 text-[10px] text-lime-300/80">{d.domain} <span className="text-lime-400/40">({d.source})</span></span>
              ))}
              {discoverResult.discovered.length > 20 && <span className="text-[10px] text-lime-400/50">+{discoverResult.discovered.length - 20} more</span>}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard icon={Globe} label="Total" value={stats.total} />
        <StatCard icon={Plus} label="Acquired" value={stats.acquired} />
        <StatCard icon={Rocket} label="Launched" value={stats.active} />
        <StatCard icon={TrendingUp} label="Ranking" value={stats.ranking} />
        <StatCard icon={CheckCircle} label="Page-One KWs" value={stats.pageOne} />
      </div>

      <Panel title={`Portfolio (${domains.length})`}>
        {loading ? (
          <div className="text-sm text-white/40 py-8 text-center">Loading domains…</div>
        ) : domains.length === 0 ? (
          <EmptyState icon={Globe} title="No domains yet" subtitle="Paste a list of acquired domains to start tracking and launching campaigns."
            children={<LoadingButton onClick={() => setShowAdd(true)} variant="primary"><Plus className="h-4 w-4" /> Add Domains</LoadingButton>} />
        ) : (
          <div className="space-y-2">
            {domains.map(d => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-950 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{d.domain}</span>
                    <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] uppercase text-white/40">{d.tld}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-white/40">
                    <span>{d.niche || '—'}</span>
                    {d.gsc_verified && <span className="text-lime-400 flex items-center gap-0.5"><CheckCircle className="h-3 w-3" /> GSC</span>}
                    {d.gsc_sitemap_submitted && <span className="text-lime-400/70">sitemap</span>}
                    {d.best_position > 0 && <span className="text-cyan-400">#{d.best_position}</span>}
                    {d.engine_id && <span>{d.keywords_count || 0} kw · {d.pages_count || 0} pages</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={d.status} />
                  {d.site_url && (
                    <a href={d.site_url} target="_blank" rel="noopener" className="rounded p-1.5 text-white/40 hover:text-white hover:bg-white/5">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {d.status === 'acquired' ? (
                    <LoadingButton onClick={() => launchDomain(d)} loading={launching === d.id} variant="primary" className="px-2.5 py-1 text-xs">
                      <Rocket className="h-3 w-3" /> Launch
                    </LoadingButton>
                  ) : !d.gsc_verified ? (
                    <LoadingButton onClick={() => submitGSC(d)} loading={launching === 'gsc-' + d.id} variant="ghost" className="px-2.5 py-1 text-xs">
                      <Search className="h-3 w-3" /> GSC
                    </LoadingButton>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-zinc-950 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-1">Add Domains to Portfolio</h3>
            <p className="text-sm text-white/50 mb-4">Paste one domain per line. They'll be tracked as "acquired" until you launch them.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Niche (applies to all)</label>
                <input className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white outline-none focus:border-lime-400" value={bulkNiche} onChange={e => setBulkNiche(e.target.value)} placeholder="e.g. epoxy coatings, lead generation, roofing" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Domains (one per line)</label>
                <textarea className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white outline-none focus:border-lime-400 font-mono" rows={8} value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={"epoxycoatingsnearme.com\nroofingnearyou.com\nplumbersnearme.store"} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <LoadingButton onClick={() => setShowAdd(false)} variant="ghost">Cancel</LoadingButton>
              <LoadingButton onClick={handleBulkAdd} loading={launching === 'adding'} variant="primary"><Plus className="h-4 w-4" /> Add to Portfolio</LoadingButton>
            </div>
          </div>
        </div>
      )}
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