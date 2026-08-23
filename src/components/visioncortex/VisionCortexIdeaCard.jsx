import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Rocket, RefreshCw, CheckCircle, ChevronDown, ChevronUp, DollarSign, Cpu, Building, Target, AlertTriangle, Shield, Brain, Palette, TrendingUp } from "lucide-react";

// VisionCortexIdeaCard — full exhaustive summary card for a top 10 idea.
// Shows all 15 sections of the exhaustive summary with collapsible details.
export default function VisionCortexIdeaCard({ idea, onProvision }) {
  const [expanded, setExpanded] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [provisioned, setProvisioned] = useState(idea.status === "provisioned");
  const [activeSection, setActiveSection] = useState(null);

  const summary = idea.exhaustive_summary || {};
  const scores = idea.yc_scores || {};
  const overallScore = scores.overall || 0;
  const scoreColor = overallScore >= 80 ? "text-lime-400" : overallScore >= 60 ? "text-yellow-400" : "text-orange-400";

  const handleProvision = async () => {
    setProvisioning(true);
    try {
      await onProvision(idea.id);
      setProvisioned(true);
    } finally {
      setProvisioning(false);
    }
  };

  const sections = [
    { id: "how_it_works", label: "How It Works", icon: Brain, content: summary.how_it_works },
    { id: "how_to_build", label: "How To Build", icon: Cpu, content: summary.how_to_build },
    { id: "possible_complications", label: "Possible Complications", icon: AlertTriangle, content: summary.possible_complications },
    { id: "complication_prevention", label: "Complication Prevention", icon: Shield, content: summary.complication_prevention },
    { id: "financial_cost", label: "Financial Cost", icon: DollarSign, content: summary.financial_cost },
    { id: "gross_income_potential", label: "Gross Income Potential", icon: TrendingUp, content: summary.gross_income_potential },
    { id: "net_income_potential", label: "Net Income Potential", icon: DollarSign, content: summary.net_income_potential },
    { id: "niche", label: "Niche", icon: Target, content: summary.niche },
    { id: "problems_solved", label: "Problems Solved", icon: CheckCircle, content: summary.problems_solved },
    { id: "ai_usage_plan", label: "AI Usage Plan", icon: Brain, content: summary.ai_usage_plan },
    { id: "autonomous_build_plan", label: "Autonomous Build Plan", icon: Cpu, content: summary.autonomous_build_plan },
    { id: "architecture_overview", label: "Architecture Overview", icon: Building, content: summary.architecture_overview },
    { id: "data_systems_needed", label: "Data Systems Needed", icon: Cpu, content: summary.data_systems_needed },
    { id: "brand_strategy", label: "Brand Strategy", icon: Palette, content: summary.brand_strategy },
    { id: "go_to_market", label: "Go To Market", icon: TrendingUp, content: summary.go_to_market },
  ].filter((s) => s.content);

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-lime-400/5 to-transparent p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-400/15 text-sm font-bold text-lime-400">
            #{idea.top_10_rank || "—"}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-white">{idea.title}</h3>
            <p className="mt-0.5 text-sm text-white/60">{idea.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-white/60">{idea.industry}</span>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-white/60">{idea.product_type?.replace(/_/g, " ")}</span>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-white/60">{idea.source?.replace(/_/g, " ")}</span>
              {idea.monetization_model && (
                <span className="rounded-full bg-lime-400/10 px-2 py-0.5 text-lime-400">{idea.monetization_model}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${scoreColor}`}>{overallScore}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/40">YC Score</div>
          </div>
        </div>

        {/* YC Score breakdown */}
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {[
            { label: "Fit", val: scores.founder_market_fit },
            { label: "Mkt", val: scores.market_size },
            { label: "Prob", val: scores.problem_acuity },
            { label: "Comp", val: scores.competition_insight },
            { label: "Demand", val: scores.personal_demand },
            { label: "New", val: scores.recently_possible },
            { label: "Proxy", val: scores.proxy_validation },
            { label: "Scale", val: scores.scalability },
            { label: "Feas", val: scores.technical_feasibility },
            { label: "Auto", val: scores.autonomous_build_potential },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="h-12 w-full overflow-hidden rounded bg-white/5">
                <div
                  className="h-full rounded bg-lime-400/50"
                  style={{ height: `${s.val || 0}%`, marginTop: `${100 - (s.val || 0)}%` }}
                />
              </div>
              <div className="mt-0.5 text-[9px] text-white/40">{s.label}</div>
              <div className="text-[10px] font-medium text-white/70">{s.val || 0}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Problem & Solution */}
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {idea.problem_statement && (
          <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-red-300 mb-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Problem
            </div>
            <p className="text-sm text-white/70">{idea.problem_statement}</p>
          </div>
        )}
        {idea.proposed_solution && (
          <div className="rounded-lg border border-lime-400/20 bg-lime-400/5 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-lime-300 mb-1">
              <CheckCircle className="h-3.5 w-3.5" /> Solution
            </div>
            <p className="text-sm text-white/70">{idea.proposed_solution}</p>
          </div>
        )}
      </div>

      {/* Score breakdown */}
      {idea.score_breakdown && (
        <div className="px-4 pb-3">
          <div className="rounded-lg border border-white/10 bg-black/40 p-3">
            <div className="text-xs font-medium text-white/50 mb-1">YC Framework Analysis</div>
            <p className="text-xs text-white/60 whitespace-pre-wrap">{idea.score_breakdown}</p>
          </div>
        </div>
      )}

      {/* Expandable exhaustive summary */}
      {sections.length > 0 && (
        <div className="border-t border-white/10">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between p-3 text-sm text-white/70 hover:text-lime-300"
          >
            <span className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-lime-400" />
              Exhaustive Build Summary ({sections.length} sections)
            </span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {expanded && (
            <div className="border-t border-white/10 p-4 space-y-3">
              {sections.map((section) => (
                <div key={section.id} className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
                  <button
                    onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                    className="flex w-full items-center justify-between p-3 text-sm text-white/70 hover:text-lime-300"
                  >
                    <span className="flex items-center gap-2">
                      <section.icon className="h-4 w-4 text-lime-400" />
                      {section.label}
                    </span>
                    {activeSection === section.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {activeSection === section.id && (
                    <div className="border-t border-white/10 p-3">
                      <p className="text-sm text-white/70 whitespace-pre-wrap">{section.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div className="border-t border-white/10 p-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {(idea.keywords || []).slice(0, 5).map((kw, i) => (
            <span key={i} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/50">{kw}</span>
          ))}
        </div>
        {provisioned ? (
          <span className="flex items-center gap-1.5 rounded-lg bg-lime-400/10 px-3 py-1.5 text-xs font-medium text-lime-400">
            <CheckCircle className="h-3.5 w-3.5" /> Provisioned to Auto Builder
          </span>
        ) : (
          <button
            onClick={handleProvision}
            disabled={provisioning}
            className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-1.5 text-xs font-medium text-black hover:bg-lime-300 disabled:opacity-50"
          >
            {provisioning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
            Provision to Auto Builder
          </button>
        )}
      </div>
    </div>
  );
}