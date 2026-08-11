import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton } from "@/components/ui";
import ScoreBar from "@/components/ScoreBar";
import StatusBadge from "@/components/StatusBadge";
import { Rocket, Globe, Target, FileText, Link2, TrendingUp, Sparkles, ArrowRight, AlertCircle, CheckCircle2, Search } from "lucide-react";

export default function RaceToRank() {
  const [url, setUrl] = useState("");
  const [cities, setCities] = useState("");
  const [services, setServices] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [engine, setEngine] = useState(null);
  const [detail, setDetail] = useState(null);
  const [polling, setPolling] = useState(false);

  const loadEngine = useCallback(async (engineId) => {
    try {
      const eng = await base44.entities.RankEngine.get(engineId);
      setEngine(eng);
      const [kw, pages, cite] = await Promise.all([
        base44.entities.RankKeyword.filter({ engine_id: engineId }),
        base44.entities.RankPage.filter({ engine_id: engineId }),
        base44.entities.RankCitation.filter({ engine_id: engineId }),
      ]);
      setDetail({ keywords: kw, pages, citations: cite });
    } catch {}
  }, []);

  // Poll for results while the engine is optimizing
  useEffect(() => {
    if (!engine?.id || !polling) return;
    if (engine.status !== "optimizing") { setPolling(false); return; }
    const interval = setInterval(async () => {
      await loadEngine(engine.id);
      const updated = await base44.entities.RankEngine.get(engine.id);
      if (updated.status !== "optimizing") setPolling(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [engine?.id, engine?.status, polling, loadEngine]);

  const handleLaunch = async () => {
    if (!url.trim()) return;
    setLaunching(true);
    setError("");
    setResult(null);
    setEngine(null);
    setDetail(null);
    try {
      const res = await base44.functions.invoke("runRankEngine", {
        action: "quick_start",
        site_url: url.trim(),
        cities: cities ? cities.split(",").map((s) => s.trim()).filter(Boolean) : [],
        services: services ? services.split(",").map((s) => s.trim()).filter(Boolean) : [],
      });
      const data = res?.data || res;
      if (data?.error) { setError(data.error); setLaunching(false); return; }
      setResult(data);
      if (data?.engine_id) {
        await loadEngine(data.engine_id);
        setPolling(true);
      }
    } catch (e) {
      setError(e.message);
    }
    setLaunching(false);
  };

  const handleReset = () => {
    setUrl("");
    setCities("");
    setServices("");
    setResult(null);
    setEngine(null);
    setDetail(null);
    setError("");
  };

  const scores = result?.scores || {};
  const hasResult = !!result?.engine_id;

  return (
    <div className="space-y-6">
      <PageHeader title="Race to Rank" subtitle="Paste any website URL — the system auto-detects the business, discovers keywords, generates SEO pages, builds citations, and races it to page one of Google." />

      {/* === Launcher === */}
      {!hasResult && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-lime-400" />
            <h2 className="text-sm font-semibold text-white">Enter Any Website URL</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className="flex-1 rounded-lg border border-white/15 bg-black px-4 py-3 text-sm text-white outline-none focus:border-lime-400"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLaunch()}
              placeholder="https://any-business-website.com"
              disabled={launching}
            />
            <LoadingButton onClick={handleLaunch} loading={launching} variant="primary" disabled={!url.trim()} className="px-6 py-3">
              <Rocket className="h-4 w-4" /> Launch Campaign
            </LoadingButton>
          </div>

          <button onClick={() => setShowAdvanced(!showAdvanced)} className="mt-3 text-xs text-white/40 hover:text-white/70 flex items-center gap-1">
            <Search className="h-3 w-3" /> {showAdvanced ? "Hide" : "Show"} advanced options (optional)
          </button>

          {showAdvanced && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Target Cities (override)</label>
                <input
                  className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white outline-none focus:border-lime-400"
                  value={cities}
                  onChange={(e) => setCities(e.target.value)}
                  placeholder="Austin, Dallas, Houston"
                  disabled={launching}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Services (override)</label>
                <input
                  className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white outline-none focus:border-lime-400"
                  value={services}
                  onChange={(e) => setServices(e.target.value)}
                  placeholder="epoxy coating, polyaspartic, sealing"
                  disabled={launching}
                />
              </div>
            </div>
          )}

          {launching && (
            <div className="mt-5 flex items-center gap-3 rounded-lg border border-lime-400/30 bg-lime-400/5 px-4 py-3">
              <Sparkles className="h-5 w-5 animate-pulse text-lime-400 shrink-0" />
              <div className="text-sm text-lime-300">
                Scraping site → detecting niche & services → discovering keywords → generating SEO pages → identifying citation targets…
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
        </div>
      )}

      {/* === Results === */}
      {hasResult && (
        <>
          {/* Success banner */}
          <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-lime-400 shrink-0" />
                <div>
                  <div className="text-lg font-bold text-white">{engine?.site_name || "Campaign"} launched!</div>
                  <div className="text-sm text-white/60">
                    {detail?.keywords?.length || 0} keywords · {detail?.pages?.length || 0} pages · {detail?.citations?.length || 0} citation targets
                  </div>
                </div>
              </div>
              <LoadingButton onClick={handleReset} variant="ghost" className="text-xs">
                <Rocket className="h-3.5 w-3.5" /> New Campaign
              </LoadingButton>
            </div>
          </div>

          {/* Scores */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
              <ScoreBar label="Technical SEO" value={scores.technical_seo || engine?.technical_seo_score || 0} />
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
              <ScoreBar label="Content" value={scores.content || engine?.content_score || 0} />
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
              <ScoreBar label="Authority" value={scores.authority || engine?.authority_score || 0} />
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
              <ScoreBar label="Rank Readiness" value={scores.overall_rank_readiness || engine?.overall_rank_readiness || 0} />
            </div>
          </div>

          {/* Detected details */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
              <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Niche</div>
              <div className="text-sm font-medium text-white capitalize">{engine?.niche}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
              <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Target Cities</div>
              <div className="text-sm text-white">{(engine?.cities || []).join(", ") || "—"}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
              <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Services</div>
              <div className="text-sm text-white">{(engine?.services || []).join(", ") || "—"}</div>
            </div>
          </div>

          {/* Gaps */}
          {result?.gaps?.length > 0 && (
            <Panel title="SEO Gaps to Address">
              <ul className="space-y-1.5">
                {result.gaps.map((g, i) => (
                  <li key={i} className="text-sm text-white/70 flex gap-2">
                    <span className="text-lime-400 shrink-0">›</span>{g}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {/* Keywords */}
          {detail?.keywords?.length > 0 && (
            <Panel title={`Discovered Keywords (${detail.keywords.length})`}>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {detail.keywords.map((k) => (
                  <div key={k.id} className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <span className="text-white truncate">{k.keyword}</span>
                      {k.city && <span className="ml-2 text-xs text-white/40">{k.city}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/40 shrink-0">
                      <span className="capitalize">{k.search_intent}</span>
                      <span>Vol: {k.monthly_volume || 0}</span>
                      <span>Diff: {k.difficulty || 0}</span>
                      <StatusBadge status={k.status} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* Pages */}
          {detail?.pages?.length > 0 && (
            <Panel title={`Generated SEO Pages (${detail.pages.length})`}>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {detail.pages.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <div className="text-white truncate">{p.title}</div>
                      <div className="text-xs text-white/40">/{p.slug} · {p.word_count || 0} words</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs shrink-0">
                      <span className="text-lime-400">{p.seo_score || 0}/100</span>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* Citations */}
          {detail?.citations?.length > 0 && (
            <Panel title={`Citation Targets (${detail.citations.length})`}>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {detail.citations.map((c) => (
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
          )}

          {/* Next steps */}
          <div className="rounded-xl border border-lime-400/20 bg-lime-400/5 p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-lime-400 shrink-0 mt-0.5" />
              <div className="text-sm text-white/70">
                <strong className="text-white">The daily Rank Engine workflow runs automatically at 6 AM ET</strong> — it syncs real rankings from Google Search Console, discovers new keywords, generates fresh pages, and tracks your position changes over time.
                <a href="/rank-engine" className="ml-2 text-lime-400 hover:text-lime-300 inline-flex items-center gap-1">
                  View full dashboard <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}