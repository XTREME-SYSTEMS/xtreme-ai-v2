import { CheckCircle, ChevronRight } from "lucide-react";

// VisionCortexIdeaRow — compact clickable row for an idea in the Vision Cortex list.
// Clicking opens the full summary modal.
export default function VisionCortexIdeaRow({ idea, onClick }) {
  const scores = idea.yc_scores || {};
  const overallScore = scores.overall || 0;
  const scoreColor = overallScore >= 80 ? "text-lime-400" : overallScore >= 60 ? "text-yellow-400" : "text-orange-400";
  const hasSummary = idea.exhaustive_summary && Object.keys(idea.exhaustive_summary).length > 0;
  const isProvisioned = idea.status === "provisioned";

  return (
    <button
      onClick={() => onClick(idea)}
      className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-zinc-950 p-3 text-left transition-colors hover:border-lime-400/40 hover:bg-lime-400/5"
    >
      {/* Rank badge */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lime-400/15 text-sm font-bold text-lime-400">
        {idea.top_10_rank ? `#${idea.top_10_rank}` : "—"}
      </div>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-white group-hover:text-lime-300">{idea.title}</h3>
          {isProvisioned && (
            <span className="flex items-center gap-1 rounded-full bg-lime-400/10 px-1.5 py-0.5 text-[9px] font-medium text-lime-400 shrink-0">
              <CheckCircle className="h-2.5 w-2.5" /> Provisioned
            </span>
          )}
        </div>
        <p className="truncate text-xs text-white/50">{idea.description || idea.problem_statement || "No description"}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-white/50">{idea.industry || "Unknown"}</span>
          <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-white/50">{idea.source?.replace(/_/g, " ") || "manual"}</span>
          {hasSummary && (
            <span className="rounded-full bg-lime-400/10 px-1.5 py-0.5 text-lime-400/80">Full summary</span>
          )}
        </div>
      </div>

      {/* YC Score */}
      <div className="shrink-0 text-right">
        <div className={`text-lg font-bold ${scoreColor}`}>{overallScore}</div>
        <div className="text-[9px] uppercase tracking-wider text-white/40">YC Score</div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-white/30 group-hover:text-lime-400" />
    </button>
  );
}