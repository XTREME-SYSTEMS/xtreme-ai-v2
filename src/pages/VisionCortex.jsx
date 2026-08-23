import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import VisionCortexIdeaRow from "@/components/visioncortex/VisionCortexIdeaRow";
import VisionCortexIdeaModal from "@/components/visioncortex/VisionCortexIdeaModal";
import { Brain, RefreshCw, Rocket, Filter, Activity, Database, CheckCircle, Clock, Bot } from "lucide-react";

// VisionCortex — the full Vision Cortex dashboard page.
// Shows all top 10 ideas with exhaustive summaries, plus controls to
// run a new discovery+validation cycle, filter ideas, and provision
// individual ideas to the Auto Builder.
export default function VisionCortex() {
  const [topIdeas, setTopIdeas] = useState([]);
  const [allIdeas, setAllIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("top_10");
  const [lastRun, setLastRun] = useState(null);
  const [stats, setStats] = useState({ discovered: 0, validated: 0, top10: 0, autonomous: 0, provisioned: 0 });
  const [selectedIdea, setSelectedIdea] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [top, all, runs] = await Promise.all([
        base44.entities.VisionCortexIdea.filter({ is_top_10: true }, "-top_10_rank", 10).catch(() => []),
        base44.entities.VisionCortexIdea.list("-created_date", 100).catch(() => []),
        base44.entities.DiscoveryRun.filter({ source: "vision_cortex" }, "-created_date", 1).catch(() => []),
      ]);
      setTopIdeas(top || []);
      setAllIdeas(all || []);
      if (runs && runs.length > 0) setLastRun(runs[0]);

      // Calculate stats
      const allList = all || [];
      setStats({
        discovered: allList.filter((i) => i.status === "discovered").length,
        validated: allList.filter((i) => i.status === "validated").length,
        top10: allList.filter((i) => i.is_top_10).length,
        autonomous: allList.filter((i) => i.system_category === "fully_autonomous").length,
        provisioned: allList.filter((i) => i.status === "provisioned").length,
      });
    } catch (e) {
      console.error("Vision Cortex load error", e);
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

  const provisionTopIdea = async () => {
    if (topIdeas.length > 0 && topIdeas[0].status !== "provisioned") {
      await provisionIdea(topIdeas[0].id);
    }
  };

  const filteredIdeas = filter === "top_10"
    ? topIdeas
    : filter === "provisioned"
    ? allIdeas.filter((i) => i.status === "provisioned")
    : filter === "autonomous"
    ? allIdeas.filter((i) => i.system_category === "fully_autonomous")
    : filter === "all"
    ? allIdeas
    : topIdeas;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/15">
          <Brain className="h-5 w-5 text-lime-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            Vision Cortex
          </h1>
          <p className="text-sm text-white/50">
            AI-Assisted Idea Discovery & Validation Engine — feeds the Auto Builder
            {lastRun && (
              <span className="ml-2 text-white/30">
                · Last cycle: {new Date(lastRun.created_date).toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={runCycle}
          disabled={running}
          className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-xs font-medium text-black hover:bg-lime-300 disabled:opacity-50"
        >
          {running ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
          {running ? "Cycling..." : "Run Full Cycle"}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-400/40 bg-red-400/5 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Running indicator */}
      {running && (
        <div className="flex items-center gap-2 rounded-xl border border-lime-400/30 bg-lime-400/5 p-4 text-sm text-lime-300">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Scraping sources → Extracting 50 ideas → Scoring with YC framework → Selecting top 10 → Generating exhaustive summaries...</span>
        </div>
      )}

      {/* Ideas list — at the top, immediately visible */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            {filter === "top_10" ? "Top 10 Ideas" : filter === "autonomous" ? "Fully Autonomous Systems" : filter === "provisioned" ? "Provisioned Ideas" : "All Ideas"}
            <span className="ml-2 text-xs font-normal text-white/40">({filteredIdeas.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-white/40" />
            {["top_10", "autonomous", "provisioned", "all"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${
                  filter === f ? "bg-lime-400/15 text-lime-300 border border-lime-400/30" : "border border-white/10 text-white/50 hover:text-white"
                }`}
              >
                {f === "top_10" ? "Top 10" : f === "autonomous" ? "Autonomous Systems" : f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <RefreshCw className="h-6 w-6 animate-spin text-lime-400" />
          </div>
        ) : filteredIdeas.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-zinc-950 py-12 text-center">
            <Brain className="mx-auto h-8 w-8 text-lime-400/50" />
            <p className="mt-2 text-sm text-white/50">
              No ideas yet. Run a cycle to discover, score, and rank the top 10 ideas.
            </p>
            <p className="mt-1 text-xs text-white/30">
              The system will scrape Reddit, Product Hunt, Hacker News, AI directories, and more to find 50 ideas,
              then score them against the YC 10-question framework and generate exhaustive build summaries for the top 10.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredIdeas.map((idea) => (
              <VisionCortexIdeaRow key={idea.id} idea={idea} onClick={setSelectedIdea} />
            ))}
          </div>
        )}
      </div>

      {/* Auto-provision top idea */}
      {topIdeas.length > 0 && topIdeas[0].status !== "provisioned" && !running && (
        <div className="flex items-center justify-between rounded-xl border border-lime-400/30 bg-lime-400/5 p-4">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-lime-400" />
            <span className="text-sm text-white/70">
              Provision the #1 idea "{topIdeas[0].title}" to the Auto Builder?
            </span>
          </div>
          <button
            onClick={provisionTopIdea}
            className="rounded-lg bg-lime-400 px-3 py-1.5 text-xs font-medium text-black hover:bg-lime-300"
          >
            Provision #1 Idea
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Discovered", value: stats.discovered, icon: Database, color: "text-blue-400" },
          { label: "Validated", value: stats.validated, icon: Activity, color: "text-yellow-400" },
          { label: "Top 10", value: stats.top10, icon: Brain, color: "text-lime-400" },
          { label: "Autonomous", value: stats.autonomous, icon: Bot, color: "text-cyan-400" },
          { label: "Provisioned", value: stats.provisioned, icon: CheckCircle, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-center">
            <s.icon className={`mx-auto h-5 w-5 ${s.color}`} />
            <div className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/40">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Info footer */}
      <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Clock className="h-3.5 w-3.5 text-lime-400" />
          <span>
            Vision Cortex runs automatically once every 24 hours via the "Vision Cortex Daily Cycle" workflow.
            Each cycle: scrape 6+ sources → extract 50 ideas → score with YC framework → select top 10 → generate exhaustive summaries.
          </span>
        </div>
      </div>

      {/* Full summary modal */}
      <VisionCortexIdeaModal
        idea={selectedIdea}
        open={!!selectedIdea}
        onClose={() => setSelectedIdea(null)}
        onProvision={provisionIdea}
      />
    </div>
  );
}