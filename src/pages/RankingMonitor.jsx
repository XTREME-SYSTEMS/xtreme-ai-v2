import { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Loader2, RefreshCw, TrendingUp, ArrowUp, ArrowDown, Minus, Search, Eye,
  MousePointerClick, BarChart3, Globe, Filter, Trophy, Target, Crosshair,
  Clock, CheckCircle, ExternalLink,
} from 'lucide-react';
import StudioTopBar from '@/components/studio/StudioTopBar';

export default function RankingMonitor() {
  const [engines, setEngines] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [trackingLive, setTrackingLive] = useState(false);
  const [liveResult, setLiveResult] = useState(null);
  const [engineFilter, setEngineFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [engPage, kwPage] = await Promise.all([
        base44.entities.RankEngine.filter({}, { sort: '-created_date', limit: 100, fields: ['site_name', 'domain', 'status', 'created_date'] }),
        base44.entities.RankKeyword.filter({}, { sort: '-created_date', limit: 500, fields: ['keyword', 'engine_id', 'city', 'monthly_volume', 'current_position', 'previous_position', 'impressions', 'clicks', 'ctr', 'status', 'search_intent', 'last_checked'] }),
      ]);
      setEngines(engPage.items || []);
      setKeywords(kwPage.items || []);
    } catch {
      setEngines([]);
      setKeywords([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const syncRankings = async () => {
    setSyncing(true);
    try {
      await base44.functions.invoke('syncRankings', {});
      await load();
    } catch (e) { console.error(e); }
    setSyncing(false);
  };

  const trackLive = async () => {
    setTrackingLive(true);
    setLiveResult(null);
    try {
      const res = await base44.functions.invoke('trackLiveRankings', {});
      const data = res?.data || res;
      setLiveResult(data);
      await load();
    } catch (e) { console.error(e); }
    setTrackingLive(false);
  };

  const engineMap = useMemo(() => {
    const m = {};
    engines.forEach((e) => { m[e.id] = e; });
    return m;
  }, [engines]);

  const filtered = useMemo(() => {
    return keywords.filter((k) => {
      if (engineFilter !== 'all' && k.engine_id !== engineFilter) return false;
      if (statusFilter !== 'all' && k.status !== statusFilter) return false;
      if (search && !k.keyword?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [keywords, engineFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const ranking = filtered.filter((k) => k.current_position > 0);
    const pageOne = filtered.filter((k) => k.current_position > 0 && k.current_position <= 10);
    const topThree = filtered.filter((k) => k.current_position > 0 && k.current_position <= 3);
    const totalVolume = filtered.reduce((a, k) => a + (k.monthly_volume || 0), 0);
    const totalImpressions = filtered.reduce((a, k) => a + (k.impressions || 0), 0);
    const totalClicks = filtered.reduce((a, k) => a + (k.clicks || 0), 0);
    const avgPos = ranking.length
      ? ranking.reduce((a, k) => a + k.current_position, 0) / ranking.length
      : 0;
    return { total: filtered.length, ranking: ranking.length, pageOne: pageOne.length, topThree: topThree.length, totalVolume, totalImpressions, totalClicks, avgPos };
  }, [filtered]);

  return (
    <div className="studio-workspace flex h-dvh min-h-0 flex-col bg-background text-foreground">
      <StudioTopBar />
      <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Header */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><TrendingUp className="h-6 w-6" /></div>
              <div className="flex-1">
                <h1 className="text-xl font-bold">Ranking Monitor</h1>
                <p className="text-sm text-muted-foreground">Track keyword positions and search volume across all deployed sites — powered by Google Search Console and live rank tracking.</p>
              </div>
              <button onClick={load} className="rounded-lg border border-border p-2 hover:bg-secondary"><RefreshCw className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={trackLive} disabled={trackingLive} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40">
                {trackingLive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />} Track Live Positions
              </button>
              <button onClick={syncRankings} disabled={syncing} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-40">
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />} Sync GSC Data
              </button>
            </div>
          </div>

          {/* Live result banner */}
          {liveResult && (
            <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/5 p-4">
              <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">
                Live tracking complete — {liveResult.keywords_checked} keywords checked across {liveResult.portfolios_processed} sites · {liveResult.keywords_ranking} currently ranking
              </span>
              <button onClick={() => setLiveResult(null)} className="ml-auto text-muted-foreground hover:text-foreground">×</button>
            </div>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <StatCard icon={Target} label="Keywords Tracked" value={stats.total} />
            <StatCard icon={Trophy} label="Page One (#1-10)" value={stats.pageOne} accent />
            <StatCard icon={TrendingUp} label="Top 3" value={stats.topThree} accent />
            <StatCard icon={BarChart3} label="Avg Position" value={stats.avgPos ? `#${stats.avgPos.toFixed(1)}` : '—'} />
            <StatCard icon={Search} label="Search Volume" value={stats.totalVolume.toLocaleString()} />
            <StatCard icon={Eye} label="Impressions (28d)" value={stats.totalImpressions.toLocaleString()} />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <select value={engineFilter} onChange={(e) => setEngineFilter(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
                <option value="all">All Sites</option>
                {engines.map((e) => <option key={e.id} value={e.id}>{e.site_name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
                <option value="all">All Statuses</option>
                <option value="page_one">Page One</option>
                <option value="ranking">Ranking</option>
                <option value="tracking">Tracking</option>
                <option value="target">Target</option>
                <option value="stalled">Stalled</option>
              </select>
            </div>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search keywords…" className="flex-1 min-w-[200px] rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" />
          </div>

          {/* Keyword table */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><BarChart3 className="h-4 w-4 text-primary" /> Keyword Rankings ({filtered.length})</h2>
            {loading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">No keywords tracked yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Launch a Race to Rank campaign or sync Google Search Console to start monitoring positions.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Keyword</th>
                      <th className="py-2 px-3 font-medium">Site</th>
                      <th className="py-2 px-3 font-medium">City</th>
                      <th className="py-2 px-3 font-medium text-right">Volume</th>
                      <th className="py-2 px-3 font-medium text-right">Position</th>
                      <th className="py-2 px-3 font-medium text-right">Trend</th>
                      <th className="py-2 px-3 font-medium text-right">Impr.</th>
                      <th className="py-2 px-3 font-medium text-right">Clicks</th>
                      <th className="py-2 px-3 font-medium text-right">CTR</th>
                      <th className="py-2 px-3 font-medium text-right">Last Check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((k) => {
                      const engine = engineMap[k.engine_id];
                      return <KeywordRow key={k.id} k={k} engine={engine} />;
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Deployed sites link */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold"><Globe className="h-4 w-4 text-primary" /> Monitored Sites ({engines.length})</h2>
                <p className="mt-1 text-xs text-muted-foreground">Sites deployed via Vercel and tracked for keyword rankings.</p>
              </div>
              <Link to="/autonomous-pipeline" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                View Pipeline <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
            {engines.length > 0 && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {engines.slice(0, 6).map((e) => (
                  <div key={e.id} className="rounded-lg border border-border bg-background p-3">
                    <p className="truncate text-sm font-medium">{e.site_name}</p>
                    {e.domain && <a href={`https://${e.domain}`} target="_blank" rel="noreferrer" className="truncate text-xs text-primary hover:underline">{e.domain}</a>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className={`mt-2 text-2xl font-semibold ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</div>
    </div>
  );
}

function KeywordRow({ k, engine }) {
  const pos = k.current_position;
  const prev = k.previous_position;
  let TrendIcon = Minus, trendColor = 'text-muted-foreground', trendLabel = '—';
  if (pos && prev) {
    if (pos < prev) {
      TrendIcon = ArrowUp; trendColor = 'text-green-500';
      trendLabel = `▲${(prev - pos).toFixed(0)}`;
    } else if (pos > prev) {
      TrendIcon = ArrowDown; trendColor = 'text-destructive';
      trendLabel = `▼${(pos - prev).toFixed(0)}`;
    }
  }

  const posBadge = pos
    ? pos <= 3
      ? 'bg-green-500/20 text-green-500 border-green-500/30'
      : pos <= 10
      ? 'bg-green-500/10 text-green-500/80 border-green-500/20'
      : pos <= 30
      ? 'bg-primary/10 text-primary border-primary/20'
      : 'bg-secondary text-muted-foreground border-border'
    : 'bg-secondary text-muted-foreground border-border';

  return (
    <tr className="border-b border-border/50 hover:bg-secondary/30">
      <td className="py-2.5 pr-4">
        <div className="font-medium">{k.keyword}</div>
        {k.search_intent && <div className="text-xs text-muted-foreground capitalize">{k.search_intent}</div>}
      </td>
      <td className="py-2.5 px-3"><span className="text-xs text-muted-foreground">{engine?.site_name || '—'}</span></td>
      <td className="py-2.5 px-3"><span className="text-xs text-muted-foreground">{k.city || '—'}</span></td>
      <td className="py-2.5 px-3 text-right text-muted-foreground">{(k.monthly_volume || 0).toLocaleString()}</td>
      <td className="py-2.5 px-3 text-right">
        <span className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-semibold ${posBadge}`}>
          {pos ? `#${pos}` : '—'}
        </span>
      </td>
      <td className="py-2.5 px-3 text-right">
        <span className={`flex items-center justify-end gap-1 text-xs ${trendColor}`}>
          <TrendIcon className="h-3 w-3" />{trendLabel}
        </span>
      </td>
      <td className="py-2.5 px-3 text-right text-xs text-muted-foreground">{(k.impressions || 0).toLocaleString()}</td>
      <td className="py-2.5 px-3 text-right text-xs text-primary">{(k.clicks || 0).toLocaleString()}</td>
      <td className="py-2.5 px-3 text-right text-xs text-muted-foreground">{k.ctr ? `${k.ctr.toFixed(1)}%` : '—'}</td>
      <td className="py-2.5 px-3 text-right text-xs whitespace-nowrap">
        {k.last_checked ? (
          <span className="flex items-center justify-end gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />{new Date(k.last_checked).toLocaleDateString()}
          </span>
        ) : <span className="text-muted-foreground/50">never</span>}
      </td>
    </tr>
  );
}