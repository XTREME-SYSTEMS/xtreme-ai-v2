import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientProject } from "@/hooks/useClientProject";
import { useClientTrack } from "@/hooks/useClientTrack";
import { notifyStepComplete } from "@/lib/pipelineNotify";
import { getVisibleSteps } from "@/lib/clientSteps";
import {
  Eye, Brain, Building2, MessageSquareText, ChevronDown, ChevronRight,
  Loader2, Search, Rocket, CheckCircle, ArrowRight, AlertTriangle,
  Sparkles, TrendingUp, Lightbulb, Zap, Target, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ONBOARDING_CARDS, NICHE_INTELLIGENCE, NICHE_SUMMARY } from "@/lib/onboardingCardData";

const ICON_MAP = { Eye, Brain, Building2, MessageSquareText };

// The 4-card onboarding grid. Each card expands to reveal skip-trace-rich
// questions. When all cards are filled, the user clicks "Generate My
// Business Empire" — the system saves all answers, runs vision discovery
// + strategy generation, and advances to the build pipeline.
export default function OnboardingCardGrid() {
  const { user } = useClientUser();
  const { productId } = useClientTrack(user);
  const { project, saveProject } = useClientProject(user);
  const navigate = useNavigate();
  const visibleSteps = getVisibleSteps(productId, user);

  const [expandedCard, setExpandedCard] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showNicheIntel, setShowNicheIntel] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const visionApproved = !!project?.vision?.approved;
  const strategyApproved = !!project?.strategy?.approved;
  const bothApproved = visionApproved && strategyApproved;

  // Load any previously saved answers from the project
  useEffect(() => {
    if (project?.onboarding_answers) {
      setAnswers(project.onboarding_answers);
    }
  }, [project]);

  const setAnswer = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  // Count completed questions per card
  const getCardCompletion = (card) => {
    const total = card.questions.length;
    const done = card.questions.filter((q) => {
      const val = answers[q.key];
      if (q.type === "multi") return Array.isArray(val) && val.length > 0;
      return val && String(val).trim();
    }).length;
    return { done, total, complete: done === total };
  };

  const allCardsComplete = ONBOARDING_CARDS.every(getCardCompletion);

  const continueToBuild = () => {
    try { localStorage.setItem("coach:done:/business-generator", "1"); } catch {}
    notifyStepComplete("welcome", { clientEmail: user?.email || "" });
    const idx = visibleSteps.findIndex((s) => s.to === "/business-generator");
    const next = idx >= 0 && idx < visibleSteps.length - 1 ? visibleSteps[idx + 1] : null;
    navigate(next ? next.to : "/business-name-studio");
  };

  // Generate the vision + strategy from all collected answers
  const handleGenerate = async () => {
    if (!allCardsComplete) {
      setError("Please complete all 4 cards before generating.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      // Build a combined vision text from all answers for the discovery engine
      const visionText = buildVisionText(answers);

      // Save all onboarding answers to the project
      await saveProject({
        onboarding_answers: answers,
        vision_text: visionText,
      });

      // Run vision discovery
      const discoveryRes = await base44.functions.invoke("discoverVisionTopic", { topic: visionText });
      const discoveryData = discoveryRes?.data || discoveryRes;

      if (discoveryData?.options?.length > 0) {
        // Auto-select the top discovery option
        const topOption = discoveryData.options[0];

        // Generate strategy options
        const strategyRes = await base44.functions.invoke("generateStrategyOptions", {
          topic: visionText,
          vision: visionText,
          discoveryOption: topOption.name,
        });
        const strategyData = strategyRes?.data || strategyRes;

        if (strategyData?.strategies?.length > 0) {
          // Auto-select the top strategy
          const topStrategy = strategyData.strategies[0];

          // Build the vision + strategy documents
          const vision = buildVisionDoc(answers, topOption, topStrategy);
          const strategyDoc = buildStrategyDoc(topStrategy);

          // Save to project
          await saveProject({ vision, strategy: strategyDoc });

          // Clear downstream caches so content regenerates
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

          try { localStorage.setItem("coach:done:/vision", "1"); } catch {}
          try { localStorage.setItem("coach:done:/strategy", "1"); } catch {}
          notifyStepComplete("vision", { clientEmail: user?.email || "" });
          notifyStepComplete("strategy", { clientEmail: user?.email || "" });

          setSaved(true);
          setTimeout(() => continueToBuild(), 1200);
        } else {
          setError(strategyData?.error || "Could not generate strategies. Please try again.");
        }
      } else {
        setError(discoveryData?.error || "Could not discover topics. Please try again.");
      }
    } catch (e) {
      setError(e?.message || "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // ── Already approved → success state ──
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

  if (saved) {
    return (
      <div className="rounded-xl border border-lime-400/50 bg-lime-400/10 p-6 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-lime-400" />
        <h3 className="mt-2 text-base font-semibold text-lime-300">Foundation Generated!</h3>
        <p className="mt-1 text-sm text-white/60">Taking you to the next step…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Intro banner ── */}
      <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <Sparkles className="h-4 w-4" /> Build Your Business Empire in 4 Steps
        </div>
        <p className="mt-1 text-sm text-white/60">
          Fill out the 4 cards below. Each answer is skip-traced and researched in the background.
          When you're done, click <span className="text-lime-400 font-semibold">Generate My Business Empire</span> and
          the system builds your complete strategy, website brief, and social media automation plan —
          ready for GPT to create hundreds of passive-income websites.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* ── 4 square cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ONBOARDING_CARDS.map((card, idx) => {
          const Icon = ICON_MAP[card.icon] || Eye;
          const isExpanded = expandedCard === card.id;
          const completion = getCardCompletion(card);
          const c = card.color;

          return (
            <div
              key={card.id}
              className={cn(
                "flex flex-col rounded-xl border bg-zinc-950 transition-all",
                isExpanded ? cn(c.ring, "col-span-1 sm:col-span-2 lg:col-span-4") : c.ring,
                "hover:shadow-lg"
              )}
            >
              {/* Card header — the square card face */}
              <button
                onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                className="flex flex-col items-center gap-3 p-5 text-center"
              >
                <div className={cn("flex h-14 w-14 items-center justify-center rounded-xl", c.solid)}>
                  <Icon className="h-7 w-7" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold", c.ring, c.text)}>
                    {idx + 1}
                  </span>
                  <h3 className="text-sm font-bold text-white">{card.title}</h3>
                </div>
                <p className="text-xs text-white/50">{card.subtitle}</p>
                {/* Completion indicator */}
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 rounded-full bg-white/10">
                    <div
                      className={cn("h-1.5 rounded-full transition-all", c.solid)}
                      style={{ width: `${(completion.done / completion.total) * 100}%` }}
                    />
                  </div>
                  <span className={cn("text-[10px] font-semibold", completion.complete ? c.text : "text-white/40")}>
                    {completion.done}/{completion.total}
                  </span>
                </div>
                {completion.complete && (
                  <span className={cn("flex items-center gap-1 text-[10px] font-semibold", c.text)}>
                    <CheckCircle className="h-3 w-3" /> Complete
                  </span>
                )}
                <div className={cn("flex items-center gap-1 text-[10px] text-white/40 transition-transform", isExpanded && "rotate-180")}>
                  <ChevronDown className="h-3 w-3" /> {isExpanded ? "Collapse" : "Expand"}
                </div>
              </button>

              {/* Expanded content — the questions */}
              {isExpanded && (
                <div className="border-t border-white/10 p-5">
                  <p className="mb-4 text-xs text-white/50">{card.description}</p>

                  {/* Niche intelligence — only in Strategy Blueprint card */}
                  {card.id === "strategy" && (
                    <NicheIntelligenceSection
                      show={showNicheIntel}
                      setShow={setShowNicheIntel}
                    />
                  )}

                  <div className="space-y-4">
                    {card.questions.map((q) => (
                      <QuestionInput
                        key={q.key}
                        question={q}
                        value={answers[q.key]}
                        onChange={(val) => setAnswer(q.key, val)}
                        accentColor={c}
                      />
                    ))}
                  </div>

                  {/* Collapse button */}
                  <button
                    onClick={() => setExpandedCard(null)}
                    className={cn("mt-4 flex items-center gap-1.5 text-xs font-medium", c.text, "hover:opacity-80")}
                  >
                    <ChevronDown className="h-3.5 w-3.5 rotate-180" /> Collapse card
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Generate button ── */}
      <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 text-sm text-white/60">
            {allCardsComplete ? (
              <><CheckCircle className="h-4 w-4 text-lime-400" /> All 4 cards complete — ready to generate!</>
            ) : (
              <><Target className="h-4 w-4 text-white/40" /> Complete all 4 cards to unlock generation</>
            )}
          </div>
          <p className="max-w-lg text-xs text-white/40">
            The system will skip-trace your answers, research your market, discover the best business angles,
            generate 10 ranked strategies, and auto-select the best one. Then GPT uses your brief to build
            hundreds of websites with automated social media — all within about an hour.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating || !allCardsComplete}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-8 py-4 text-base font-bold text-black transition-all hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Generating Your Empire…</>
            ) : (
              <><Rocket className="h-5 w-5" /> Generate My Business Empire</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Question input — renders text, textarea, choice, or multi ──────────
function QuestionInput({ question, value, onChange, accentColor }) {
  const c = accentColor;
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-white">
        {question.skipTrace && <Search className="h-3 w-3 text-amber-400" />}
        {question.label}
      </label>
      <p className="mt-0.5 text-[11px] text-white/40">{question.hint}</p>

      {question.type === "text" && (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          className="mt-2 w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
        />
      )}

      {question.type === "textarea" && (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          rows={3}
          className="mt-2 w-full resize-none rounded-lg border border-white/15 bg-black px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
        />
      )}

      {question.type === "choice" && (
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {question.options.map((opt) => {
            const active = value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-all",
                  active
                    ? cn(c.ring, c.bg, c.text)
                    : "border-white/10 bg-black/30 text-white/60 hover:border-white/20"
                )}
              >
                <div className="text-xs font-semibold">{opt.label}</div>
                {opt.desc && <div className="mt-0.5 text-[10px] text-white/40">{opt.desc}</div>}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "multi" && (
        <div className="mt-2 flex flex-wrap gap-2">
          {question.options.map((opt) => {
            const arr = Array.isArray(value) ? value : [];
            const active = arr.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => {
                  if (active) {
                    onChange(arr.filter((v) => v !== opt.value));
                  } else {
                    onChange([...arr, opt.value]);
                  }
                }}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                  active
                    ? cn(c.ring, c.bg, c.text)
                    : "border-white/10 bg-black/30 text-white/60 hover:border-white/20"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Niche Intelligence section ───────────────────────────────────────────
function NicheIntelligenceSection({ show, setShow }) {
  return (
    <div className="mb-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-4">
      <button
        onClick={() => setShow(!show)}
        className="flex w-full items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400"
      >
        <Lightbulb className="h-4 w-4" />
        {NICHE_SUMMARY.title}
        <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", show && "rotate-180")} />
      </button>

      {!show && (
        <p className="mt-1.5 text-[11px] text-white/40">
          Tap to explore data-backed profitable niches with profit margins, ticket sizes, and scalability ratings.
        </p>
      )}

      {show && (
        <div className="mt-3 space-y-3">
          <p className="text-xs leading-relaxed text-white/60">{NICHE_SUMMARY.intro}</p>

          {/* Key insights */}
          <div className="space-y-1.5">
            {NICHE_SUMMARY.keyInsights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-white/50">
                <TrendingUp className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                <span>{insight}</span>
              </div>
            ))}
          </div>

          {/* Niche categories */}
          {NICHE_INTELLIGENCE.map((cat) => {
            const CatIcon = ICON_MAP[cat.icon] || Building2;
            return (
              <div key={cat.category} className="rounded-lg border border-white/10 bg-black/30 p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <CatIcon className="h-4 w-4 text-amber-400" />
                  {cat.category}
                </div>
                <div className="mt-2 space-y-2">
                  {cat.niches.map((niche) => (
                    <div key={niche.name} className="rounded-md border border-white/5 bg-black/20 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white">{niche.name}</span>
                        <span className={cn(
                          "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                          niche.scalability === "Very High" ? "bg-lime-400/20 text-lime-400" :
                          niche.scalability === "High" ? "bg-lime-400/10 text-lime-400/80" :
                          "bg-white/5 text-white/40"
                        )}>
                          {niche.scalability}
                        </span>
                      </div>
                      <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-[10px]">
                        <div>
                          <span className="text-white/30">Margin</span>
                          <div className="font-semibold text-lime-400">{niche.profitMargin}</div>
                        </div>
                        <div>
                          <span className="text-white/30">Avg Ticket</span>
                          <div className="font-semibold text-white">{niche.avgTicket}</div>
                        </div>
                        <div>
                          <span className="text-white/30">Competition</span>
                          <div className={cn(
                            "font-semibold",
                            niche.competition === "Low" ? "text-lime-400" :
                            niche.competition === "Medium" ? "text-amber-400" :
                            "text-orange-400"
                          )}>{niche.competition}</div>
                        </div>
                      </div>
                      <p className="mt-1.5 text-[10px] leading-relaxed text-white/50">{niche.why}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Helpers: build vision text + documents from answers ─────────────────

function buildVisionText(answers) {
  const parts = [];
  if (answers.full_name) parts.push(`Owner: ${answers.full_name}`);
  if (answers.background_experience) parts.push(`Background: ${answers.background_experience}`);
  if (answers.vision_statement) parts.push(`Vision: ${answers.vision_statement}`);
  if (answers.business_type) parts.push(`Business type: ${answers.business_type}`);
  if (answers.dream_outcome) parts.push(`Goal: ${answers.dream_outcome}`);
  if (answers.industry_niche) parts.push(`Industry: ${answers.industry_niche}`);
  if (answers.competitive_advantage) parts.push(`Advantage: ${answers.competitive_advantage}`);
  if (answers.target_customer) parts.push(`Target customer: ${answers.target_customer}`);
  if (answers.target_cities) parts.push(`Cities: ${answers.target_cities}`);
  if (answers.business_name) parts.push(`Business name: ${answers.business_name}`);
  if (answers.brand_personality) parts.push(`Brand: ${answers.brand_personality}`);
  if (answers.services_offered) parts.push(`Services: ${answers.services_offered}`);
  if (answers.revenue_model) parts.push(`Revenue model: ${answers.revenue_model}`);
  if (answers.scale_target) parts.push(`Scale: ${answers.scale_target} sites`);
  if (answers.content_tone) parts.push(`Content tone: ${answers.content_tone}`);
  if (answers.social_platforms) parts.push(`Social: ${answers.social_platforms.join(", ")}`);
  return parts.join(". ");
}

function buildVisionDoc(answers, option, strategy) {
  return {
    mission: answers.vision_statement || strategy.name,
    problem: option?.description || strategy.description,
    target_audience: answers.target_customer || strategy.target_audience || "Users seeking this solution",
    long_term_vision: strategy.long_term_vision || strategy.description,
    success_metrics: strategy.success_metrics || [
      "Launch within 30 days",
      "Reach 1,000 users in 90 days",
      "Achieve profitability in 6 months",
    ],
    core_values: strategy.core_values || ["Innovation", "User-centricity", "Quality"],
    value_proposition: strategy.value_proposition || strategy.description,
    market_opportunity: strategy.market_opportunity || strategy.financial_outlook,
    monetization_potential: strategy.monetization_model || "",
    lead_generation_approach: strategy.lead_generation_architecture || "",
    seo_aeo_opportunity: strategy.seo_aeo_roadmap || "",
    autonomous_value_plan: strategy.autonomous_enhancement_plan || "",
    onboarding_answers: answers,
    approved: true,
    generated_at: new Date().toISOString(),
  };
}

function buildStrategyDoc(strategy) {
  return {
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
}