import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import {
  TrendingUp, ArrowUp, ArrowDown, Minus, Search, Eye, MousePointerClick,
  BarChart3, RefreshCw, Globe, Filter, Trophy, Target,
} from "lucide-react";

export default function RankingMonitor() {
  const [engines, setEngines] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [engineFilter, setEngineFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [engList, kwList] = await Promise.all([
        base44.entities.RankEngine.list("-created_date", 100),
        base44.entities.RankKeyword.list("-created_date", 500),
      ]);
      setEngines(engList);
      setKeywords(kwList);
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

  const filtered = useMemo(() => {
    return keywords.filter((k) => {
      if (engineFilter !== "all" && k.engine_id !== engineFilter) return false;
      if (statusFilter !== "all" && k.status !== statusFilter) return false;
      if (search && !k.keyword.toLowerCase().includes(search.toLowerCase())) return false;
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
    return {
      total: filtered.length,
      ranking: ranking.length,
      pageOne: pageOne.length,
      topThree: topThree.length,
      totalVolume,
      totalImpressions,
      totalClicks,
      avgPos,
    };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ranking Monitor"
        subtitle="Track keyword positions and search volume across all cloned sites — powered by Google Search Console."
      >
        <LoadingButton onClick={syncRankings} loading={syncing} variant="ghost">
          <BarChart3 className="h-4 w-4" /> Sync GSC Data
        </LoadingButton>
        <LoadingButton onClick={load} loading={loading} variant="ghost">
          <RefreshCw className="h-4 w-4" /> Refresh
        </LoadingButton>
      </PageHeader>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <StatCard icon={Target} label="Keywords Tracked" value={stats.total} />
        <StatCard icon={Trophy} label="Page One (#1-10)" value={stats.pageOne} accent="lime" />
        <StatCard icon={TrendingUp} label="Top 3" value={stats.topThree} accent="lime" />
        <StatCard icon={BarChart3} label="Avg Position" value={stats.avgPos ? `#${stats.avgPos.toFixed(1)}` : "—"} />
        <StatCard icon={Search} label="Search Volume" value={stats.totalVolume.toLocaleString()} />
        <StatCard icon={Eye} label="Impressions (28d)" value={stats.totalImpressions.toLocaleString()} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-white/40" />
          <select
            value={engineFilter}
            onChange={(e) => setEngineFilter(e.target.value)}
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-white/15 bg-black px-3 py-1.5 text-sm text-white outline-none focus:border-lime-400"
          >
            <option value="all">All Statuses</option>
            <option value="page_one">Page One</option>
            <option value="ranking">Ranking</option>
            <option value="tracking">Tracking</option>
            <option value="target">Target</option>
            <option value="stalled">Stalled</option>
          </select>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search keywords…"
          className="flex-1 min-w-[200px] rounded-lg border border-white/15 bg-black px-3 py-1.5 text-sm text-white outline-none focus:border-lime-400"
        />
      </div>

      {/* Keyword table */}
      <Panel title={`Keyword Rankings (${filtered.length})`}>
        {loading ? (
          <div className="text-sm text-white/40 py-8 text-center">Loading rankings…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No keywords tracked yet"
            subtitle="Launch a Race to Rank campaign or sync Google Search Console to start monitoring positions."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40">
                  <th className="py-2 pr-4 font-medium">Keyword</th>
                  <th className="py-2 px-3 font-medium">Site</th>
                  <th className="py-2 px-3 font-medium">City</th>
                  <th className="py-2 px-3 font-medium text-right">Volume</th>
                  <th className="py-2 px-3 font-medium text-right">Position</th>
                  <th className="py-2 px-3 font-medium text-right">Trend</th>
                  <th className="py-2 px-3 font-medium text-right">Impr.</th>
                  <th className="py-2 px-3 font-medium text-right">Clicks</th>
                  <th className="py-2 px-3 font-medium text-right">CTR</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((k) => {
                  const engine = engineMap[k.engine_id];
                  return <KeywordTableRow key={k.id} k={k} engine={engine} />;
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid hsl(0 0% 15%);background:#000;padding:0.5rem 0.75rem;font-size:0.875rem;color:#fff;outline:none}.input:focus{border-color:hsl(84 100% 59%)}`}</style>
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

function KeywordTableRow({ k, engine }) {
  const pos = k.current_position;
  const prev = k.previous_position;
  let TrendIcon = Minus, trendColor = "text-white/30", trendLabel = "—";
  if (pos && prev) {
    if (pos < prev) {
      TrendIcon = ArrowUp; trendColor = "text-lime-400";
      trendLabel = `▲${(prev - pos).toFixed(0)}`;
    } else if (pos > prev) {
      TrendIcon = ArrowDown; trendColor = "text-rose-400";
      trendLabel = `▼${(pos - prev).toFixed(0)}`;
    }
  }

  const posBadge = pos
    ? pos <= 3
      ? "bg-lime-400/20 text-lime-400 border-lime-400/30"
      : pos <= 10
      ? "bg-lime-400/10 text-lime-400/80 border-lime-400/20"
      : pos <= 30
      ? "bg-yellow-500/10 text-yellow-500/80 border-yellow-500/20"
      : "bg-white/5 text-white/50 border-white/10"
    : "bg-white/5 text-white/30 border-white/10";

  return (
    <tr className="border-b border-white/5 hover:bg-white/5">
      <td className="py-2.5 pr-4">
        <div className="text-white font-medium">{k.keyword}</div>
        {k.search_intent && (
          <div className="text-xs text-white/30 capitalize">{k.search_intent}</div>
        )}
      </td>
      <td className="py-2.5 px-3">
        <span className="text-white/70 text-xs">{engine?.site_name || "—"}</span>
      </td>
      <td className="py-2.5 px-3">
        <span className="text-white/50 text-xs">{k.city || "—"}</span>
      </td>
      <td className="py-2.5 px-3 text-right text-white/70">
        {(k.monthly_volume || 0).toLocaleString()}
      </td>
      <td className="py-2.5 px-3 text-right">
        <span className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-semibold ${posBadge}`}>
          {pos ? `#${pos}` : "—"}
        </span>
      </td>
      <td className="py-2.5 px-3 text-right">
        <span className={`flex items-center justify-end gap-1 text-xs ${trendColor}`}>
          <TrendIcon className="h-3 w-3" />{trendLabel}
        </span>
      </td>
      <td className="py-2.5 px-3 text-right text-white/50 text-xs">
        {(k.impressions || 0).toLocaleString()}
      </td>
      <td className="py-2.5 px-3 text-right text-lime-400/70 text-xs">
        {(k.clicks || 0).toLocaleString()}
      </td>
      <td className="py-2.5 px-3 text-right text-white/50 text-xs">
        {k.ctr ? `${k.ctr.toFixed(1)}%` : "—"}
      </td>
    </tr>
  );
}