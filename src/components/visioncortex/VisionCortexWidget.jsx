import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Brain, RefreshCw, Sparkles, TrendingUp, ArrowRight, Rocket, Eye } from "lucide-react";

// VisionCortexWidget — the main Vision Cortex dashboard widget.
// Placed at the TOP of the Command Center. Shows the top 10 ideas
// from the latest Vision Cortex cycle, with quick actions to run
// a new cycle or view the full dashboard.
export default function VisionCortexWidget() {
  const [topIdeas, setTopIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const ideas = await base44.entities.VisionCortexIdea.filter(
        { is_top_10: true },
        "-top_10_rank",
        10
      ).catch(() => []);
      setTopIdeas(ideas || []);

      // Get the latest discovery run for timestamp
      const runs = await base44.entities.DiscoveryRun.filter(
        { source: "vision_cortex" },
        "-created_date",
        1
      ).catch(() => []);
      if (runs && runs.length > 0) setLastRun(runs[0]);
    } catch (e) {
      console.error("Vision Cortex widget load error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = base44.entities.VisionCortexIdea.subscribe(() => load());
    return unsub;
  }, [load]);

  const runCycle = async () => {
    try {
      setRunning(true);
      setError(null);
      // Phase 1: Discover
      const discoverRes = await base44.functions.invoke("visionCortexDiscover", {
        max_sources: 6,
        max_ideas_per_source: 10,
        max_total: 50,
        triggered_by: "manual",
      });
      const discoverData = discoverRes?.data || discoverRes;
      if (discoverData?.error) throw new Error(discoverData.error);

      // Phase 2: Validate
      if (discoverData?.run_id) {
        await base44.functions.invoke("visionCortexValidate", {
          run_id: discoverData.run_id,
          top_n: 10,
          min_score: 40,
          generate_summaries: true,
        });
      }

      await load();
    } catch (e) {
      console.error("Vision Cortex cycle error", e);
      setError(e?.response?.data?.error || e?.message || "Cycle failed");
    } finally {
      setRunning(false);
    }
  };

  const provisionIdea = async (ideaId) => {
    try {
      const res = await base44.functions.invoke("visionCortexProvision", {
        idea_id: ideaId,
        auto_advance: true,
      });
      const data = res?.data || res;
      if (data?.error) {
        setError(data.error);
      } else {
        await load();
      }
    } catch (e) {
      setError(e?.message || "Provision failed");
    }
  };

  return (
    <div className="rounded-xl border border-lime-400/20 bg-gradient-to-br from-zinc-950 via-zinc-950 to-lime-400/5 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/15">
            <Brain className="h-5 w-5 text-lime-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Vision Cortex
              <Sparkles className="h-4 w-4 text-lime-400" />
            </h2>
            <p className="text-xs text-white/50">
              AI-Assisted Idea Discovery & Validation Engine
              {lastRun && (
                <span className="ml-2 text-white/30">
                  · Last cycle: {new Date(lastRun.created_date).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runCycle}
            disabled={running}
            className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-1.5 text-xs font-medium text-black hover:bg-lime-300 disabled:opacity-50"
          >
            {running ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
            {running ? "Cycling..." : "Run Cycle"}
          </button>
          <Link
            to="/vision-cortex"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:border-lime-400/50 hover:text-lime-300"
          >
            <Eye className="h-3.5 w-3.5" /> Full View
          </Link>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-3 rounded-lg border border-red-400/30 bg-red-400/5 p-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Running indicator */}
      {running && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-lime-400/30 bg-lime-400/5 p-3 text-sm text-lime-300">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Scraping sources, extracting ideas, scoring with YC framework, generating exhaustive summaries...</span>
        </div>
      )}

      {/* Top 10 Ideas */}
      {loading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-lime-400" />
        </div>
      ) : topIdeas.length === 0 ? (
        <div className="py-8 text-center">
          <Brain className="mx-auto h-8 w-8 text-lime-400/30" />
          <p className="mt-2 text-sm text-white/50">
            No ideas yet. Run a cycle to discover and validate the top 10 ideas.
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {topIdeas.map((idea) => {
            const score = idea.yc_scores?.overall || 0;
            const scoreColor = score >= 80 ? "text-lime-400" : score >= 60 ? "text-yellow-400" : "text-orange-400";
            return (
              <div
                key={idea.id}
                className="group flex items-start gap-3 rounded-lg border border-white/10 bg-black/40 p-3 hover:border-lime-400/30"
              >
                {/* Rank badge */}
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-lime-400/15 text-xs font-bold text-lime-400">
                  #{idea.top_10_rank || "—"}
                </div>
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to="/vision-cortex"
                      className="truncate text-sm font-medium text-white hover:text-lime-300"
                    >
                      {idea.title}
                    </Link>
                    <span className={`shrink-0 text-sm font-bold ${scoreColor}`}>
                      {score}
                    </span>
                  </div>
                  <p className="truncate text-xs text-white/40">
                    {idea.industry} · {idea.source?.replace(/_/g, " ")}
                  </p>
                  {/* Mini score bars */}
                  <div className="mt-1.5 flex gap-1">
                    {[
                      { label: "Prob", val: idea.yc_scores?.problem_acuity },
                      { label: "Mkt", val: idea.yc_scores?.market_size },
                      { label: "Auto", val: idea.yc_scores?.autonomous_build_potential },
                      { label: "Scal", val: idea.yc_scores?.scalability },
                    ].map((s) => (
                      <div key={s.label} className="flex-1">
                        <div className="h-1 rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-lime-400/60"
                            style={{ width: `${s.val || 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Provision button */}
                {idea.status !== "provisioned" && (
                  <button
                    onClick={() => provisionIdea(idea.id)}
                    className="shrink-0 rounded-md border border-lime-400/30 px-2 py-1 text-[10px] font-medium text-lime-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-lime-400/10"
                  >
                    <Rocket className="h-3 w-3" />
                  </button>
                )}
                {idea.status === "provisioned" && (
                  <span className="shrink-0 rounded-md bg-lime-400/10 px-2 py-1 text-[10px] font-medium text-lime-400">
                    ✓
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer link */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-white/40">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Top 10 ranked by YC 10-question framework</span>
        </div>
        <Link to="/vision-cortex" className="flex items-center gap-1 text-lime-400 hover:text-lime-300">
          View all details <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}