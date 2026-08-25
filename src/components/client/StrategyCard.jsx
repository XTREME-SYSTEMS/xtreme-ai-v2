import { useState } from "react";
import {
  TrendingUp, DollarSign, Flame, Megaphone, Cpu, ChevronDown, ChevronUp,
  CheckCircle, Target, Rocket, BarChart3, FileText, AlertTriangle,
} from "lucide-react";

// A single strategy card in the Vision Generator. Shows the 4 scores as
// badges, a short description, and expands to reveal the full play-by-play:
// financial outlook, system strategy, marketing strategy, system
// architecture, key documents, roadmap, and risks.
export default function StrategyCard({ strategy, rank, selected, onSelect, saving }) {
  const [expanded, setExpanded] = useState(false);

  const scoreBadge = (Icon, label, score, color) => (
    <div className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${color}`}>
      <Icon className="h-3 w-3" />
      <span className="font-semibold">{score}</span>
      <span className="opacity-60 hidden sm:inline">{label}</span>
    </div>
  );

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      selected
        ? "border-lime-400 bg-lime-400/10 shadow-[0_0_12px_-2px_rgba(255,234,0,0.3)]"
        : "border-white/10 bg-zinc-950 hover:border-lime-400/30"
    }`}>
      {/* Header: rank + name + overall score */}
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          rank === 1 ? "bg-lime-400 text-black" : "border border-white/15 bg-zinc-900 text-white/60"
        }`}>
          {rank}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-white">{strategy.name}</h4>
          <p className="mt-0.5 text-xs leading-relaxed text-white/60">{strategy.description}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-bold text-lime-400">{strategy.overall_score || 0}</div>
          <div className="text-[9px] uppercase tracking-wider text-white/40">Overall</div>
        </div>
      </div>

      {/* Score badges */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {scoreBadge(DollarSign, "Profit", strategy.profitability_score || 0, "border-lime-400/30 bg-lime-400/5 text-lime-400")}
        {scoreBadge(Flame, "Viral", strategy.viral_score || 0, "border-purple-400/30 bg-purple-400/5 text-purple-400")}
        {scoreBadge(Megaphone, "Market", strategy.marketability_score || 0, "border-blue-400/30 bg-blue-400/5 text-blue-400")}
        {scoreBadge(Cpu, "Build", strategy.capability_score || 0, "border-cyan-400/30 bg-cyan-400/5 text-cyan-400")}
      </div>

      {/* Expand button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 flex items-center gap-1 text-xs font-medium text-lime-400/70 hover:text-lime-400"
      >
        {expanded ? <><ChevronUp className="h-3.5 w-3.5" /> Show less</> : <><ChevronDown className="h-3.5 w-3.5" /> Full play-by-play</>}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
          <DetailBlock icon={DollarSign} label="Financial Outlook" text={strategy.financial_outlook} />
          <DetailBlock icon={Cpu} label="System Strategy" text={strategy.system_strategy} />
          <DetailBlock icon={Megaphone} label="Marketing Strategy" text={strategy.marketing_strategy} />
          <DetailBlock icon={BarChart3} label="System Architecture" text={strategy.system_architecture} />

          {strategy.key_documents?.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-black/30 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-lime-400">
                <FileText className="h-3 w-3" /> Key Documents Needed
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {strategy.key_documents.map((doc, i) => (
                  <span key={i} className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">{doc}</span>
                ))}
              </div>
            </div>
          )}

          {strategy.roadmap?.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-black/30 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-lime-400">
                <TrendingUp className="h-3 w-3" /> Execution Roadmap
              </div>
              <div className="mt-2 space-y-2">
                {strategy.roadmap.map((phase, i) => (
                  <div key={i} className="rounded border border-white/10 bg-black/40 p-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime-400 text-[9px] font-bold text-black">{i + 1}</span>
                      <span className="text-xs font-medium text-white">{phase.phase}</span>
                      <span className="ml-auto text-[10px] text-lime-400/60">{phase.timeline}</span>
                    </div>
                    {phase.goals?.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5 pl-7">
                        {phase.goals.map((g, j) => (
                          <li key={j} className="text-[11px] text-white/50">• {g}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {strategy.risks?.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-black/30 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-lime-400">
                <AlertTriangle className="h-3 w-3" /> Key Risks
              </div>
              <div className="mt-2 space-y-1.5">
                {strategy.risks.map((r, i) => (
                  <div key={i} className="text-xs">
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase mr-1.5 ${
                      r.severity === "high" ? "bg-red-400/20 text-red-400" :
                      r.severity === "medium" ? "bg-yellow-400/20 text-yellow-400" :
                      "bg-lime-400/20 text-lime-400"
                    }`}>{r.severity || "medium"}</span>
                    <span className="text-white/70">{r.risk}</span>
                    {r.mitigation && <span className="text-white/40"> — {r.mitigation}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DetailBlock icon={Target} label="Target Audience" text={strategy.target_audience} />
          <DetailBlock icon={Rocket} label="Long-Term Vision" text={strategy.long_term_vision} />
          <DetailBlock icon={CheckCircle} label="Differentiation" text={strategy.differentiation} />
        </div>
      )}

      {/* Choose button */}
      <button
        onClick={() => onSelect(strategy)}
        disabled={saving}
        className={`mt-3 w-full rounded-lg py-2.5 text-sm font-bold transition-all ${
          selected
            ? "bg-lime-400 text-black"
            : "border border-lime-400/40 text-lime-400 hover:bg-lime-400/10"
        } disabled:opacity-50`}
      >
        {saving ? "Saving…" : selected ? "✓ Selected" : "Choose This Strategy"}
      </button>
    </div>
  );
}

function DetailBlock({ icon: Icon, label, text }) {
  if (!text) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-lime-400">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-white/70">{text}</p>
    </div>
  );
}