import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import {
  Crosshair, Search, Copy, FileSearch, CheckCircle, Globe, TrendingUp,
  Trophy, Lightbulb, Target, ArrowRight, RefreshCw, Building2, Brain, Zap,
} from "lucide-react";

export default function SerpBlueprint() {
  const [blueprints, setBlueprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [niche, setNiche] = useState("");
  const [city, setCity] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);
  const [selectedBp, setSelectedBp] = useState(null);
  const [cloning, setCloning] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.SerpBlueprint.list('-created_date', 200);
      setBlueprints(list);
    } catch { setBlueprints([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const findCompetitors = async () => {
    if (!keyword.trim()) return;
    setSearching(true);
    setError("");
    setSearchResult(null);
    try {
      const res = await base44.functions.invoke("cloneTopSerpCompetitors", {
        keyword: keyword.trim(),
        niche: niche.trim(),
        city: city.trim(),
        clone: false,
      });
      const data = res?.data || res;
      setSearchResult(data);
      await load();
    } catch (e) { setError(e.message); }
    setSearching(false);
  };

  const cloneCompetitor = async (bp) => {
    setCloning(bp.id);
    setError("");
    try {
      const res = await base44.functions.invoke("cloneTopSerpCompetitors", {
        keyword: bp.keyword,
        niche: bp.niche,
        city: bp.city,
        clone: true,
      });
      await load();
    } catch (e) { setError(e.message); }
    setCloning(null);
  };

  const analyzeBlueprint = async (bp) => {
    setAnalyzing(bp.id);
    setError("");
    try {
      await base44.functions.invoke("extractRankingBlueprint", { blueprint_id: bp.id });
      await load();
      const updated = await base44.entities.SerpBlueprint.get(bp.id);
      setSelectedBp(updated);
    } catch (e) { setError(e.message); }
    setAnalyzing(null);
  };

  const stats = {
    total: blueprints.length,
    analyzed: blueprints.filter(b => b.status === 'analyzed').length,
    cloned: blueprints.filter(b => b.status === 'cloned' || b.clone_project_id).length,
    applied: blueprints.filter(b => b.applied_to_portfolio).length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SERP Competitor Cloner"
        subtitle="Clone the top-ranking sites for your target keywords, extract their ranking formula, and use it as a blueprint to build sites that beat them."
      >
        <LoadingButton onClick={load} loading={loading} variant="ghost">
          <RefreshCw className="h-4 w-4" /> Refresh
        </LoadingButton>
      </PageHeader>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Search Panel */}
      <Panel title="Find Top SERP Competitors">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">Target Keyword *</label>
            <input
              className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white outline-none focus:border-lime-400"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") findCompetitors(); }}
              placeholder="e.g. epoxy coatings, roofing, plumbing"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">Niche (optional)</label>
            <input
              className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white outline-none focus:border-lime-400"
              value={niche}
              onChange={e => setNiche(e.target.value)}
              placeholder="e.g. garage floor, roof repair"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">City (optional)</label>
            <input
              className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white outline-none focus:border-lime-400"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g. Austin, TX"
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <LoadingButton onClick={findCompetitors} loading={searching} variant="primary" disabled={!keyword.trim()}>
            <Crosshair className="h-4 w-4" /> Find Top Competitors
          </LoadingButton>
        </div>

        {searchResult && (
          <div className="mt-4 rounded-lg border border-lime-400/30 bg-lime-400/5 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-lime-300 mb-2">
              <CheckCircle className="h-4 w-4" /> Found {searchResult.competitors_found} competitors for "{searchResult.keyword}"
            </div>
            {searchResult.serp_summary && (
              <div className="text-sm text-white/70 mb-3">
                <span className="text-white/50">SERP Analysis: </span>{searchResult.serp_summary}
              </div>
            )}
            {searchResult.top_3_to_clone?.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-lime-400 mb-1.5">Top 3 to Clone:</div>
                <div className="flex flex-wrap gap-1.5">
                  {searchResult.top_3_to_clone.map((url, i) => (
                    <span key={i} className="rounded border border-lime-400/20 px-2 py-0.5 text-xs text-lime-300/80">{url}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Panel>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Globe} label="Competitors Found" value={stats.total} />
        <StatCard icon={Copy} label="Cloned" value={stats.cloned} accent="text-cyan-400" />
        <StatCard icon={Brain} label="Blueprints Extracted" value={stats.analyzed} accent="text-lime-400" />
        <StatCard icon={CheckCircle} label="Applied to Sites" value={stats.applied} accent="text-lime-400" />
      </div>

      {/* Blueprints Table */}
      <Panel title={`SERP Blueprints (${blueprints.length})`}>
        {loading ? (
          <div className="text-sm text-white/40 py-8 text-center">Loading blueprints…</div>
        ) : blueprints.length === 0 ? (
          <EmptyState
            icon={Crosshair}
            title="No SERP competitors yet"
            subtitle="Search for a keyword above to identify the top-ranking sites and extract their ranking formula."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40">
                  <th className="py-2 pr-4 font-medium">#</th>
                  <th className="py-2 px-3 font-medium">Competitor</th>
                  <th className="py-2 px-3 font-medium">Keyword</th>
                  <th className="py-2 px-3 font-medium">Type</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blueprints.map((bp) => (
                  <tr key={bp.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2.5 pr-4">
                      <span className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-semibold ${bp.serp_position <= 3 ? "bg-lime-400/20 text-lime-400 border-lime-400/30" : "bg-white/5 text-white/50 border-white/10"}`}>
                        #{bp.serp_position}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-white font-medium text-sm">{bp.competitor_domain}</div>
                      <div className="text-xs text-white/40 truncate max-w-[200px]">{bp.competitor_title}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-white/60 text-xs">{bp.keyword}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <SiteTypeBadge type={bp.site_type} />
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={bp.status} />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {bp.status === 'analyzed' && (
                          <button
                            onClick={() => setSelectedBp(bp)}
                            className="rounded-lg border border-lime-400/30 px-2.5 py-1 text-xs text-lime-300 hover:bg-lime-400/10"
                          >
                            <FileSearch className="h-3 w-3 inline mr-1" /> Blueprint
                          </button>
                        )}
                        {bp.status !== 'analyzed' && (
                          <LoadingButton
                            onClick={() => analyzeBlueprint(bp)}
                            loading={analyzing === bp.id}
                            variant="ghost"
                            className="px-2.5 py-1 text-xs"
                          >
                            <Brain className="h-3 w-3" /> Analyze
                          </LoadingButton>
                        )}
                        {!bp.clone_project_id && (
                          <LoadingButton
                            onClick={() => cloneCompetitor(bp)}
                            loading={cloning === bp.id}
                            variant="ghost"
                            className="px-2.5 py-1 text-xs"
                          >
                            <Copy className="h-3 w-3" /> Clone
                          </LoadingButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Blueprint Detail Modal */}
      {selectedBp && (
        <BlueprintModal bp={selectedBp} onClose={() => setSelectedBp(null)} />
      )}
    </div>
  );
}

function BlueprintModal({ bp, onClose }) {
  const b = bp.blueprint || {};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-xl border border-white/10 bg-zinc-950 p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Ranking Blueprint</h3>
            <p className="text-sm text-white/50">{bp.competitor_domain} · #{bp.serp_position} for "{bp.keyword}"</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl">×</button>
        </div>

        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="Word Count" value={b.word_count || '—'} />
            <MetricCard label="Internal Links" value={b.internal_links || '—'} />
            <MetricCard label="Images" value={b.images_count || '—'} />
            <MetricCard label="FAQ" value={b.faq_present ? 'Yes' : 'No'} />
          </div>

          {/* Meta */}
          {b.meta_title && (
            <div className="rounded-lg border border-white/10 bg-black p-3">
              <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Meta Title</div>
              <div className="text-sm text-white">{b.meta_title}</div>
            </div>
          )}
          {b.meta_description && (
            <div className="rounded-lg border border-white/10 bg-black p-3">
              <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Meta Description</div>
              <div className="text-sm text-white/70">{b.meta_description}</div>
            </div>
          )}

          {/* Schema */}
          {b.schema_types?.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wider text-lime-400 mb-1.5">Schema Markup</div>
              <div className="flex flex-wrap gap-1.5">
                {b.schema_types.map((s, i) => (
                  <span key={i} className="rounded border border-lime-400/20 bg-lime-400/5 px-2 py-0.5 text-xs text-lime-300">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Content Structure */}
          {b.content_structure && (
            <div>
              <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Content Structure</div>
              <div className="text-sm text-white/70">{b.content_structure}</div>
            </div>
          )}

          {/* Topics */}
          {b.topics_covered?.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wider text-cyan-400 mb-1.5">Topics Covered</div>
              <div className="flex flex-wrap gap-1.5">
                {b.topics_covered.map((t, i) => (
                  <span key={i} className="rounded border border-cyan-400/20 px-2 py-0.5 text-xs text-cyan-300">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Trust Signals */}
          {b.trust_signals?.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wider text-amber-400 mb-1.5">Trust Signals</div>
              <div className="flex flex-wrap gap-1.5">
                {b.trust_signals.map((t, i) => (
                  <span key={i} className="rounded border border-amber-400/20 px-2 py-0.5 text-xs text-amber-300">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Key Strengths */}
          {b.key_strengths?.length > 0 && (
            <div className="rounded-lg border border-lime-400/20 bg-lime-400/5 p-3">
              <div className="text-xs uppercase tracking-wider text-lime-400 mb-2">Key Strengths (Why They Rank)</div>
              <ul className="space-y-1">
                {b.key_strengths.map((s, i) => (
                  <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                    <Trophy className="h-3.5 w-3.5 text-lime-400 mt-0.5 shrink-0" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Content Gaps */}
          {b.content_gaps?.length > 0 && (
            <div className="rounded-lg border border-rose-400/20 bg-rose-400/5 p-3">
              <div className="text-xs uppercase tracking-wider text-rose-400 mb-2">Content Gaps (Our Opportunity)</div>
              <ul className="space-y-1">
                {b.content_gaps.map((g, i) => (
                  <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                    <Target className="h-3.5 w-3.5 text-rose-400 mt-0.5 shrink-0" /> {g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {b.recommendations && (
            <div className="rounded-lg border border-lime-400/30 bg-lime-400/10 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-lime-400 mb-2">
                <Lightbulb className="h-4 w-4" /> How to Beat Them
              </div>
              <div className="text-sm text-white/80">{b.recommendations}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
      <div className="flex items-center gap-2 text-white/40">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className={`mt-2 text-2xl font-semibold ${accent || "text-white"}`}>{value}</div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black p-3 text-center">
      <div className="text-xs uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function SiteTypeBadge({ type }) {
  const styles = {
    direct_competitor: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
    authority_site: "bg-violet-400/10 text-violet-400 border-violet-400/20",
    directory: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    featured_snippet: "bg-lime-400/10 text-lime-400 border-lime-400/20",
    ai_cited: "bg-fuchsia-400/10 text-fuchsia-400 border-fuchsia-400/20",
    local_pack: "bg-rose-400/10 text-rose-400 border-rose-400/20",
  };
  const labels = {
    direct_competitor: "Competitor",
    authority_site: "Authority",
    directory: "Directory",
    featured_snippet: "Snippet",
    ai_cited: "AI Cited",
    local_pack: "Local Pack",
  };
  return (
    <span className={`rounded border px-2 py-0.5 text-xs ${styles[type] || styles.direct_competitor}`}>
      {labels[type] || type}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    identified: "bg-white/5 text-white/50 border-white/10",
    cloned: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
    analyzed: "bg-lime-400/10 text-lime-400 border-lime-400/20",
    applied: "bg-lime-400/20 text-lime-400 border-lime-400/30",
  };
  return (
    <span className={`rounded border px-2 py-0.5 text-xs ${styles[status] || styles.identified}`}>
      {status}
    </span>
  );
}