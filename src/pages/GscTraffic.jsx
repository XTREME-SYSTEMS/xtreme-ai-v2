import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import {
  TrendingUp, Search, Eye, MousePointerClick, BarChart3, RefreshCw,
  Globe, Trophy, Target, ExternalLink, Filter,
} from "lucide-react";

export default function GscTraffic() {
  const [engines, setEngines] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [siteFilter, setSiteFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [engList, kwList, portList] = await Promise.all([
        base44.entities.RankEngine.list("-created_date", 100),
        base44.entities.RankKeyword.list("-clicks", 1000),
        base44.entities.DomainPortfolio.list("-created_date", 200),
      ]);
      setEngines(engList);
      setKeywords(kwList);
      setPortfolios(portList);
    } catch {
      setEngines([]); setKeywords([]); setPortfolios([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const syncGsc = async () => {
    setSyncing(true);
    try {
      await base44.functions.invoke("syncRankings", {});
      await load();
    } catch (e) { alert(e.message); }
    setSyncing(false);
  };

  const engineMap = useMemo(() => {
    const m = {};
    engines.forEach((e) => { m[e.id] = e; });
    return m;
  }, [engines]);

  // Keywords with traffic (clicks or impressions > 0), sorted by clicks
  const trafficKeywords = useMemo(() => {
    return keywords
      .filter((k) => (k.clicks || 0) > 0 || (k.impressions || 0) > 0)
      .filter((k) => {
        if (siteFilter !== "all" && k.engine_id !== siteFilter) return false;
        if (search && !k.keyword.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
  }, [keywords, siteFilter, search]);

  // Aggregate stats
  const stats = useMemo(() => {
    const all = siteFilter === "all" ? keywords : keywords.filter((k) => k.engine_id === siteFilter);
    const totalImpressions = all.reduce((a, k) => a + (k.impressions || 0), 0);
    const totalClicks = all.reduce((a, k) => a + (k.clicks || 0), 0);
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const ranking = all.filter((k) => (k.current_position || 0) > 0).length;
    const pageOne = all.filter((k) => (k.current_position || 0) > 0 && k.current_position <= 10).length;
    return { totalImpressions, totalClicks, avgCtr, ranking, pageOne, totalKeywords: all.length };
  }, [keywords, siteFilter]);

  // Per-site breakdown
  const siteBreakdown = useMemo(() => {
    const map = {};
    keywords.forEach((k) => {
      if (!k.engine_id) return;
      if (!map[k.engine_id]) {
        map[k.engine_id] = { engine_id: k.engine_id, impressions: 0, clicks: 0, keywords: 0, pageOne: 0 };
      }
      const s = map[k.engine_id];
      s.impressions += k.impressions || 0;
      s.clicks += k.clicks || 0;
      s.keywords += 1;
      if (k.current_position > 0 && k.current_position <= 10) s.pageOne += 1;
    });
    return Object.values(map).sort((a, b) => b.clicks - a.clicks);
  }, [keywords]);

  const verifiedPortfolios = portfolios.filter((p) => p.gsc_verified);

  return (
    <div className="space-y-6">
      <PageHeader title="GSC Traffic Dashboard" subtitle="Central view of Google Search Console ranking data across all active URLs — see which keywords bring in traffic.">
        <LoadingButton onClick={syncGsc} loading={syncing} variant="primary">
          <BarChart3 className="h-4 w-4" /> Sync GSC Data
        </LoadingButton>
        <LoadingButton onClick={load} loading={loading} variant="ghost">
          <RefreshCw className="h-4 w-4" /> Refresh
        </LoadingButton>
      </PageHeader>

      {/* GSC connection status */}
      <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-lime-400">
            <Search className="h-4 w-4" /> Google Search Console Connected
          </div>
          <span className="text-white/30">|</span>
          <span className="text-white/60">{verifiedPortfolios.length} verified properties</span>
          <span className="text-white/30">|</span>
          <span className="text-white/60">{engines.length} active campaigns</span>
          <span className="text-white/30">|</span>
          <span className="text-white/60">Last sync: {keywords.find(k => k.last_checked)?.last_checked ? new Date(keywords.find(k => k.last_checked).last_checked).toLocaleString() : "never"}</span>
        </div>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Eye} label="Impressions (28d)" value={stats.totalImpressions.toLocaleString()} />
        <StatCard icon={MousePointerClick} label="Clicks (28d)" value={stats.totalClicks.toLocaleString()} accent="lime" />
        <StatCard icon={TrendingUp} label="Avg CTR" value={`${stats.avgCtr.toFixed(1)}%`} />
        <StatCard icon={Target} label="Keywords Tracked" value={stats.totalKeywords} />
        <StatCard icon={Trophy} label="Page One" value={stats.pageOne} accent="lime" />
        <StatCard icon={BarChart3} label="Ranking" value={stats.ranking} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-white/40" />
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="rounded-lg border border-white/15 bg-black px-3 py-1.5 text-sm text-white outline-none focus:border-lime-400"
          >
            <option value="all">All Sites</option>
            {engines.map((e) => (
              <option key={e.id} value={e.id}>{e.site_name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keywords…"
            className="flex-1 min-w-[200px] rounded-lg border border-white/15 bg-black px-3 py-1.5 text-sm text-white outline-none focus:border-lime-400"
          />
        </div>
      </div>

      {/* Top Traffic Keywords — the central "which keywords bring in traffic" view */}
      <Panel title={`Top Traffic Keywords (${trafficKeywords.length})`}>
        {loading ? (
          <div className="text-sm text-white/40 py-8 text-center">Loading traffic data…</div>
        ) : trafficKeywords.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No traffic data yet"
            subtitle="Sync GSC data to see which keywords are bringing in impressions and clicks across all your sites."
            children={<LoadingButton onClick={syncGsc} loading={syncing} variant="primary"><BarChart3 className="h-4 w-4" /> Sync GSC Data</LoadingButton>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40">
                  <th className="py-2 pr-4 font-medium">#</th>
                  <th className="py-2 px-3 font-medium">Keyword</th>
                  <th className="py-2 px-3 font-medium">Site</th>
                  <th className="py-2 px-3 font-medium text-right">Clicks</th>
                  <th className="py-2 px-3 font-medium text-right">Impressions</th>
                  <th className="py-2 px-3 font-medium text-right">CTR</th>
                  <th className="py-2 px-3 font-medium text-right">Position</th>
                </tr>
              </thead>
              <tbody>
                {trafficKeywords.slice(0, 100).map((k, i) => {
                  const engine = engineMap[k.engine_id];
                  const ctr = k.impressions > 0 ? ((k.clicks / k.impressions) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={k.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-2.5 pr-4 text-white/30 text-xs">{i + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="text-white font-medium">{k.keyword}</div>
                        {k.search_intent && <div className="text-xs text-white/30 capitalize">{k.search_intent}</div>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-white/70 text-xs">{engine?.site_name || "—"}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-lime-400 font-semibold">{(k.clicks || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-white/60">{(k.impressions || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-white/60 text-xs">{ctr}%</td>
                      <td className="py-2.5 px-3 text-right">
                        {k.current_position ? (
                          <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${
                            k.current_position <= 3 ? "bg-lime-400/20 text-lime-400 border-lime-400/30"
                            : k.current_position <= 10 ? "bg-lime-400/10 text-lime-400/80 border-lime-400/20"
                            : k.current_position <= 30 ? "bg-yellow-500/10 text-yellow-500/80 border-yellow-500/20"
                            : "bg-white/5 text-white/50 border-white/10"
                          }`}>#{k.current_position}</span>
                        ) : <span className="text-white/30 text-xs">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Per-site breakdown */}
      <Panel title="Traffic by Site">
        {siteBreakdown.length === 0 ? (
          <div className="text-sm text-white/40 py-8 text-center">No site traffic data yet.</div>
        ) : (
          <div className="space-y-2">
            {siteBreakdown.map((s) => {
              const engine = engineMap[s.engine_id];
              const portfolio = portfolios.find((p) => p.engine_id === s.engine_id);
              const ctr = s.impressions > 0 ? ((s.clicks / s.impressions) * 100).toFixed(1) : "0.0";
              return (
                <div key={s.engine_id} className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-950 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{engine?.site_name || "Unknown"}</span>
                      {portfolio?.site_url && (
                        <a href={portfolio.site_url} target="_blank" rel="noopener" className="rounded p-1 text-white/30 hover:text-white">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-white/40">
                      {s.keywords} keywords · {s.pageOne} on page one
                    </div>
                  </div>
                  <div className="flex items-center gap-5 shrink-0 text-sm">
                    <div className="text-right">
                      <div className="text-white/40 text-xs uppercase">Impr.</div>
                      <div className="text-white/70">{s.impressions.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/40 text-xs uppercase">Clicks</div>
                      <div className="text-lime-400 font-semibold">{s.clicks.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/40 text-xs uppercase">CTR</div>
                      <div className="text-white/70">{ctr}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  const color = accent === "lime" ? "text-lime-400" : "text-white";
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
      <div className="flex items-center gap-2 text-white/40">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className={`mt-2 text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}