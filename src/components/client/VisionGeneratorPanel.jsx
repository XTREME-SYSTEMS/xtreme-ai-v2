import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientProject } from "@/hooks/useClientProject";
import { useClientTrack } from "@/hooks/useClientTrack";
import { notifyStepComplete } from "@/lib/pipelineNotify";
import { getVisibleSteps } from "@/lib/clientSteps";
import StrategyCard from "@/components/client/StrategyCard";
import {
  Loader2, Search, Rocket, CheckCircle, ArrowRight,
  RefreshCw, Eye, AlertTriangle, TrendingUp, Zap,
} from "lucide-react";
import { getCategoryIcon } from "@/lib/categoryIcons";

// Fallback categories shown immediately while the research function runs.
// Icons are resolved via getCategoryIcon() — no emojis.
const FALLBACK_CATEGORIES = [
  { name: "Epoxy Flooring", icon: "paint-bucket", description: "Garage floors, basement floors, metallic epoxy, flake systems, self-leveling epoxy", trending_score: 95, is_system_capability: true },
  { name: "Epoxy Coatings", icon: "shield-check", description: "Concrete coatings, protective coatings, warehouse floors, anti-slip, food-grade epoxy", trending_score: 92, is_system_capability: true },
  { name: "Epoxy Contractors", icon: "hard-hat", description: "Full-service epoxy installation — residential, commercial, industrial, repair & resurfacing", trending_score: 90, is_system_capability: true },
  { name: "Polished Concrete", icon: "sparkles", description: "Grind & seal, burnished concrete, stained concrete, densification — commercial & residential", trending_score: 88, is_system_capability: true },
  { name: "Decorative Concrete", icon: "building-2", description: "Stamped concrete, overlays, micro-toppings, stained concrete, resurfacing, exposed aggregate", trending_score: 87, is_system_capability: true },
];

// The Vision Generator — an AI-assisted, discovery-driven vision builder.
// The user describes their vision in one sentence (or picks a trending
// category), the system runs a full web discovery, presents multiple-
// choice results, then generates 10 ranked strategies. The user picks one
// and the system saves the vision + strategy and advances to the build
// pipeline.
export default function VisionGeneratorPanel() {
  const { user } = useClientUser();
  const { productId } = useClientTrack(user);
  const { project, saveProject, loading: projectLoading } = useClientProject(user);
  const navigate = useNavigate();
  const visibleSteps = getVisibleSteps(productId, user);

  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [visionText, setVisionText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [discovering, setDiscovering] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState([]);
  const [selectedDiscovery, setSelectedDiscovery] = useState(null);
  const [generatingStrategies, setGeneratingStrategies] = useState(false);
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const visionApproved = !!project?.vision?.approved;
  const strategyApproved = !!project?.strategy?.approved;
  const bothApproved = visionApproved && strategyApproved;

  // Load trending categories (or seed them on first visit)
  useEffect(() => {
    (async () => {
      try {
        let cats = await base44.entities.TrendingCategory.filter({ active: true }, "-trending_score", 30);
        if (!cats || cats.length === 0) {
          // First visit — trigger research to seed categories
          try {
            await base44.functions.invoke("researchTrendingCategories", {});
            cats = await base44.entities.TrendingCategory.filter({ active: true }, "-trending_score", 30);
          } catch {}
        }
        setCategories(cats?.length > 0 ? cats : FALLBACK_CATEGORIES);
      } catch {
        setCategories(FALLBACK_CATEGORIES);
      } finally {
        setLoadingCats(false);
      }
    })();
  }, []);

  const continueToBuild = () => {
    try { localStorage.setItem("coach:done:/business-generator", "1"); } catch {}
    notifyStepComplete("welcome", { clientEmail: user?.email || "" });
    const idx = visibleSteps.findIndex((s) => s.to === "/business-generator");
    const next = idx >= 0 && idx < visibleSteps.length - 1 ? visibleSteps[idx + 1] : null;
    navigate(next ? next.to : "/business-name-studio");
  };

  // Step 1: Run web discovery on the user's topic
  const handleDiscover = async () => {
    const topic = selectedCategory?.name || visionText.trim();
    if (!topic) {
      setError("Describe your vision in one sentence or pick a category below.");
      return;
    }
    setDiscovering(true);
    setError("");
    setDiscoveryResults([]);
    setSelectedDiscovery(null);
    setStrategies([]);
    try {
      const res = await base44.functions.invoke("discoverVisionTopic", { topic });
      const data = res?.data || res;
      if (data?.options?.length > 0) {
        setDiscoveryResults(data.options);
      } else {
        setError(data?.error || "Could not discover topics. Please try again.");
      }
    } catch (e) {
      setError(e?.message || "Discovery failed. Please try again.");
    } finally {
      setDiscovering(false);
    }
  };

  // Step 2: When user picks a discovery result, generate 10 strategies
  const handleSelectDiscovery = async (option) => {
    setSelectedDiscovery(option);
    setGeneratingStrategies(true);
    setError("");
    setStrategies([]);
    try {
      const topic = selectedCategory?.name || visionText.trim();
      const res = await base44.functions.invoke("generateStrategyOptions", {
        topic,
        vision: visionText.trim() || option.name,
        discoveryOption: option.name,
      });
      const data = res?.data || res;
      if (data?.strategies?.length > 0) {
        setStrategies(data.strategies);
      } else {
        setError(data?.error || "Could not generate strategies. Please try again.");
      }
    } catch (e) {
      setError(e?.message || "Strategy generation failed. Please try again.");
    } finally {
      setGeneratingStrategies(false);
    }
  };

  // Step 3: When user picks a strategy, save vision + strategy and navigate
  const handleSelectStrategy = async (strategy) => {
    setSelectedStrategy(strategy);
    setSaving(true);
    setError("");
    try {
      const topic = selectedCategory?.name || visionText.trim();
      const discoveryName = selectedDiscovery?.name || "";

      // Construct the vision document from the user's input + discovery
      const vision = {
        mission: `${visionText.trim() || strategy.name} — ${discoveryName || topic}`,
        problem: selectedDiscovery?.description || strategy.description,
        target_audience: strategy.target_audience || "Users seeking this solution",
        long_term_vision: strategy.long_term_vision || strategy.description,
        success_metrics: strategy.success_metrics || [
          "Launch within 30 days",
          "Reach 1,000 users in 90 days",
          "Achieve profitability in 6 months",
        ],
        core_values: strategy.core_values || ["Innovation", "User-centricity", "Quality"],
        value_proposition: strategy.value_proposition || selectedDiscovery?.value_proposition || strategy.description,
        market_opportunity: strategy.market_opportunity || strategy.financial_outlook,
        monetization_potential: strategy.monetization_model || "",
        lead_generation_approach: strategy.lead_generation_architecture || "",
        seo_aeo_opportunity: strategy.seo_aeo_roadmap || "",
        autonomous_value_plan: strategy.autonomous_enhancement_plan || "",
        approved: true,
        generated_at: new Date().toISOString(),
      };

      // Construct the strategy document from the chosen option
      const strategyDoc = {
        competitive_positioning: strategy.competitive_positioning || strategy.description,
        go_to_market: strategy.go_to_market || strategy.marketing_strategy,
        revenue_model: strategy.revenue_model || "Subscription",
        pricing_strategy: strategy.pricing_strategy || "Freemium with premium tiers",
        acquisition_channels: strategy.acquisition_channels || ["SEO", "Social Media", "Content Marketing"],
        roadmap: strategy.roadmap || [],
        risks: strategy.risks || [],
        resources: strategy.resources || "Small team + AI tools",
        differentiation: strategy.differentiation || strategy.system_strategy,
        partnerships: strategy.partnerships || "Strategic technology partners",
        monetization_model: strategy.monetization_model || "",
        lead_generation_architecture: strategy.lead_generation_architecture || "",
        seo_aeo_roadmap: strategy.seo_aeo_roadmap || "",
        social_media_automation: strategy.social_media_automation || "",
        funnel_system: strategy.funnel_system || "",
        autonomous_enhancement_plan: strategy.autonomous_enhancement_plan || "",
        retention_strategy: strategy.retention_strategy || "",
        approved: true,
        generated_at: new Date().toISOString(),
      };

      // Save both to the project/AutoBuild
      await saveProject({ vision, strategy: strategyDoc });

      // Invalidate the downstream cached content + website so they regenerate
      // with the new foundation on the next visit — each strategy choice
      // automatically adjusts the content, tone, and website suggestions.
      try {
        await base44.auth.updateMe({
          contentTemplates: null,
          chosenContentTemplate: null,
          chosenContentTone: null,
          contentTemplatesChosen: false,
          websiteContent: null,
          websiteImages: null,
          chosenWebsiteLayout: null,
          chosenPalette: null,
          designPacksChosen: false,
        });
      } catch {}

      // Notify the pipeline
      try { localStorage.setItem("coach:done:/vision", "1"); } catch {}
      try { localStorage.setItem("coach:done:/strategy", "1"); } catch {}
      notifyStepComplete("vision", { clientEmail: user?.email || "" });
      notifyStepComplete("strategy", { clientEmail: user?.email || "" });

      setSaved(true);
      // Navigate to business name step after a brief delay
      setTimeout(() => continueToBuild(), 1200);
    } catch (e) {
      setError(e?.message || "Could not save your selection. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setDiscoveryResults([]);
    setSelectedDiscovery(null);
    setStrategies([]);
    setSelectedStrategy(null);
    setError("");
    setSaved(false);
  };

  // ── Already approved → show success state ──────────────────────────
  if (bothApproved && !saved) {
    return (
      <div className="rounded-xl border border-lime-400/50 bg-lime-400/10 p-5 text-center">
        <CheckCircle className="mx-auto h-8 w-8 text-lime-400" />
        <h3 className="mt-2 text-base font-semibold text-lime-300">Your Foundation Is Set</h3>
        <p className="mt-1 text-sm text-white/60">Vision and Strategy approved — you're ready to build!</p>
        <button
          onClick={continueToBuild}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-bold text-black hover:bg-lime-300"
        >
          Continue to Build <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // ── Saved state ─────────────────────────────────────────────────────
  if (saved) {
    return (
      <div className="rounded-xl border border-lime-400/50 bg-lime-400/10 p-6 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-lime-400" />
        <h3 className="mt-2 text-base font-semibold text-lime-300">Foundation Saved!</h3>
        <p className="mt-1 text-sm text-white/60">Taking you to the Business Name step…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Main Vision Generator card ──────────────────────────────── */}
      <div className="rounded-xl border border-lime-400/40 bg-gradient-to-br from-lime-400/5 to-transparent p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <Eye className="h-4 w-4" /> Vision Generator — AI-Assisted Discovery
        </div>
        <p className="mt-1 text-sm text-white/50">
          Describe your epoxy or concrete business vision in <span className="text-lime-400">one sentence</span>, or pick a category below. The system will research, discover, and build your full strategy.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* ── One-sentence input + Generate button ───────────────────── */}
      <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={visionText}
            onChange={(e) => { setVisionText(e.target.value); setSelectedCategory(null); }}
            placeholder="I want to build an epoxy flooring business that…"
            className="flex-1 rounded-lg border border-white/15 bg-black px-4 py-3 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
            onKeyDown={(e) => { if (e.key === "Enter" && !discovering) handleDiscover(); }}
          />
          <button
            onClick={handleDiscover}
            disabled={discovering || (!visionText.trim() && !selectedCategory)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-lime-400 px-5 py-3 text-sm font-bold text-black transition-all hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {discovering ? <><Loader2 className="h-4 w-4 animate-spin" /> Discovering…</> : <><Search className="h-4 w-4" /> Generate Vision</>}
          </button>
        </div>
      </div>

      {/* ── Trending categories ────────────────────────────────────── */}
      <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <TrendingUp className="h-3.5 w-3.5" /> {loadingCats ? "Loading trending categories…" : "Trending Categories — or pick one to auto-fill"}
        </div>
        {!loadingCats && (
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((cat, i) => {
              const active = selectedCategory?.name === cat.name;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedCategory(active ? null : cat);
                    setVisionText(active ? "" : `${cat.name} — ${cat.description}`);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    active
                      ? "border-lime-400 bg-lime-400/10 text-lime-400"
                      : "border-white/10 bg-black/30 text-white/60 hover:border-lime-400/30 hover:text-lime-400"
                  }`}
                >
                  {(() => { const Icon = getCategoryIcon(cat.name, cat.icon); return <Icon className="h-3.5 w-3.5 text-amber-400" />; })()}
                  {cat.name}
                  {cat.is_system_capability && <span className="text-[9px] uppercase text-lime-400/50">SYS</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Discovery results (multiple choice) ───────────────────── */}
      {discovering && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-6 text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-lime-400" />
          <p className="mt-2 text-sm text-white/50">Running full web discovery on your topic…</p>
        </div>
      )}

      {discoveryResults.length > 0 && !discovering && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
              <Zap className="h-3.5 w-3.5" /> Discovery Results — Pick Your Angle
            </div>
            <button onClick={reset} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70">
              <RefreshCw className="h-3 w-3" /> Start over
            </button>
          </div>
          {discoveryResults.map((opt, i) => {
            const active = selectedDiscovery?.name === opt.name;
            return (
              <button
                key={i}
                onClick={() => handleSelectDiscovery(opt)}
                disabled={generatingStrategies}
                className={`w-full rounded-xl border p-4 text-left transition-all disabled:opacity-50 ${
                  active
                    ? "border-lime-400 bg-lime-400/10"
                    : "border-white/10 bg-zinc-950 hover:border-lime-400/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-lime-400/30 bg-lime-400/10 text-[10px] font-bold text-lime-400">{i + 1}</span>
                      <h4 className="text-sm font-semibold text-white">{opt.name}</h4>
                    </div>
                    <p className="mt-1.5 pl-8 text-xs leading-relaxed text-white/60">{opt.description}</p>
                    {opt.why_it_matters && (
                      <p className="mt-1 pl-8 text-[11px] text-lime-400/60">Why: {opt.why_it_matters}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
                      opt.market_potential === "Very High" ? "bg-lime-400/20 text-lime-400" :
                      opt.market_potential === "High" ? "bg-lime-400/10 text-lime-400/80" :
                      opt.market_potential === "Medium" ? "bg-yellow-400/10 text-yellow-400" :
                      "bg-white/5 text-white/40"
                    }`}>{opt.market_potential || "Medium"}</span>
                  </div>
                </div>
                {active && generatingStrategies && (
                  <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-xs text-lime-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating 10 strategies…
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Strategy cards (10 options) ────────────────────────────── */}
      {generatingStrategies && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-6 text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-lime-400" />
          <p className="mt-2 text-sm text-white/50">Generating 10 ranked strategies with full play-by-play…</p>
          <p className="mt-1 text-xs text-white/30">This includes financial outlook, system architecture, marketing strategy, and all documents needed.</p>
        </div>
      )}

      {strategies.length > 0 && !generatingStrategies && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
              <Rocket className="h-3.5 w-3.5" /> Top 10 Strategies — Pick Your Path
            </div>
            <button onClick={reset} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70">
              <RefreshCw className="h-3 w-3" /> Start over
            </button>
          </div>
          <p className="text-xs text-white/40">
            Ranked by overall score (profitability, viral potential, marketability, and buildability). Click a card to see the full play-by-play, then choose your strategy to proceed to the build pipeline.
          </p>
          {strategies.map((s, i) => (
            <StrategyCard
              key={i}
              strategy={s}
              rank={i + 1}
              selected={selectedStrategy?.name === s.name}
              onSelect={handleSelectStrategy}
              saving={saving}
            />
          ))}
        </div>
      )}
    </div>
  );
}