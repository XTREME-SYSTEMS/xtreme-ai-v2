import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  ChevronRight, Lightbulb, Wrench, Cpu, Bot, Plug, Compass,
  CheckCircle, XCircle, ArrowUpRight, Zap, Clock, TrendingUp,
} from "lucide-react";

const TYPE_CONFIG = {
  what_to_build: { icon: Lightbulb, label: "What to Build", color: "text-lime-400", bg: "bg-lime-400/10" },
  how_to_build: { icon: Wrench, label: "How to Build", color: "text-blue-400", bg: "bg-blue-400/10" },
  new_technology: { icon: Cpu, label: "New Technology", color: "text-purple-400", bg: "bg-purple-400/10" },
  ai_capability: { icon: Bot, label: "AI Capability", color: "text-cyan-400", bg: "bg-cyan-400/10" },
  integration: { icon: Plug, label: "Integration", color: "text-orange-400", bg: "bg-orange-400/10" },
  strategic_direction: { icon: Compass, label: "Strategic Direction", color: "text-amber-400", bg: "bg-amber-400/10" },
};

const PRIORITY_CONFIG = {
  critical: { label: "CRITICAL", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" },
  high: { label: "HIGH", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30" },
  medium: { label: "MEDIUM", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30" },
  low: { label: "LOW", color: "text-white/50", bg: "bg-white/5", border: "border-white/10" },
};

const HORIZON_LABELS = {
  immediate: "Days",
  short_term: "Weeks",
  medium_term: "Months",
  long_term: "Quarters",
};

export default function ArchitectProposalRow({ proposal, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [acting, setActing] = useState(false);
  const type = TYPE_CONFIG[proposal.proposal_type] || TYPE_CONFIG.what_to_build;
  const priority = PRIORITY_CONFIG[proposal.priority] || PRIORITY_CONFIG.medium;
  const TypeIcon = type.icon;
  const isActioned = proposal.status === "approved" || proposal.status === "dismissed" || proposal.status === "implemented";

  const updateStatus = async (status) => {
    try {
      setActing(true);
      await base44.entities.ArchitectProposal.update(proposal.id, {
        status,
        logs: [...(proposal.logs || []), `[${new Date().toISOString()}] Status changed to ${status}`],
      });
      onUpdate?.();
    } catch (e) {
      console.error(e);
    } finally {
      setActing(false);
    }
  };

  return (
    <div className={`rounded-xl border ${isActioned ? "border-white/5 opacity-60" : "border-white/10"} bg-zinc-950 transition-colors hover:border-lime-400/30`}>
      {/* Header row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 p-3 text-left"
      >
        {/* Type icon */}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${type.bg}`}>
          <TypeIcon className={`h-4 w-4 ${type.color}`} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-white">{proposal.title}</h3>
            <span className={`shrink-0 rounded-full ${priority.bg} ${priority.border} border px-1.5 py-0.5 text-[9px] font-bold ${priority.color}`}>
              {priority.label}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-white/50">{proposal.description}</p>

          {/* Quick stats */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
            <span className={`flex items-center gap-1 ${type.color}`}>
              <TypeIcon className="h-3 w-3" /> {type.label}
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <TrendingUp className="h-3 w-3" /> {proposal.impact_score}/100 impact
            </span>
            <span className="flex items-center gap-1 text-white/40">
              <Zap className="h-3 w-3" /> {proposal.effort_score <= 30 ? "Easy" : proposal.effort_score <= 60 ? "Medium" : "Hard"} effort
            </span>
            <span className="flex items-center gap-1 text-white/40">
              <Clock className="h-3 w-3" /> {HORIZON_LABELS[proposal.time_horizon] || "Months"}
            </span>
            {proposal.status === "approved" && (
              <span className="flex items-center gap-1 text-lime-400"><CheckCircle className="h-3 w-3" /> Approved</span>
            )}
            {proposal.status === "dismissed" && (
              <span className="flex items-center gap-1 text-white/40"><XCircle className="h-3 w-3" /> Dismissed</span>
            )}
            {proposal.status === "implemented" && (
              <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="h-3 w-3" /> Implemented</span>
            )}
          </div>
        </div>

        <ChevronRight className={`mt-1 h-4 w-4 shrink-0 text-white/30 transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-white/10 px-3 pb-3 pt-2">
          {/* Rationale */}
          {proposal.rationale && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1">Why This Matters</div>
              <p className="text-sm text-white/70">{proposal.rationale}</p>
            </div>
          )}

          {/* Current gap */}
          {proposal.current_gap && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-red-400/60 mb-1">Current Gap</div>
              <p className="text-sm text-white/60">{proposal.current_gap}</p>
            </div>
          )}

          {/* Proposed solution */}
          {proposal.proposed_solution && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-lime-400/60 mb-1">Proposed Solution</div>
              <p className="text-sm text-white/70">{proposal.proposed_solution}</p>
            </div>
          )}

          {/* Competitive advantage */}
          {proposal.competitive_advantage && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400/60 mb-1">Competitive Advantage</div>
              <p className="text-sm text-white/60">{proposal.competitive_advantage}</p>
            </div>
          )}

          {/* Implementation steps */}
          {proposal.implementation_steps && proposal.implementation_steps.length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1">Implementation Steps</div>
              <ol className="space-y-1">
                {proposal.implementation_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-white/50">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Technology references */}
          {proposal.technology_references && proposal.technology_references.length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-400/60 mb-1">Technology References</div>
              <div className="space-y-1">
                {proposal.technology_references.map((tech, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border border-white/10 bg-black/40 p-2">
                    <Cpu className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-400" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-white">{tech.name}</span>
                        {tech.url && (
                          <a href={tech.url} target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:text-lime-300">
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {tech.description && <p className="text-xs text-white/50">{tech.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estimated impact */}
          {proposal.estimated_impact && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/60 mb-1">Estimated Impact</div>
              <p className="text-sm text-white/60">{proposal.estimated_impact}</p>
            </div>
          )}

          {/* Action buttons */}
          {!isActioned && (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => updateStatus("approved")}
                disabled={acting}
                className="flex items-center gap-1.5 rounded-lg bg-lime-400/15 border border-lime-400/30 px-3 py-1.5 text-xs font-medium text-lime-300 hover:bg-lime-400/25 disabled:opacity-50"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                onClick={() => updateStatus("dismissed")}
                disabled={acting}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" /> Dismiss
              </button>
              <button
                onClick={() => updateStatus("implemented")}
                disabled={acting}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-400/20 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-400/10 disabled:opacity-50"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Mark Implemented
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}