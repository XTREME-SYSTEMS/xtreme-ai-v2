import { CheckCircle, Clock, Loader2, RefreshCw, Rocket, ExternalLink } from "lucide-react";
import { ScoreBars, SCORE_DIMENSIONS } from "./discoveryShared.jsx";

export function IdeaCard({ idea, onClick, onPromote, promoting, onReScore, scoring }) {
  const overall = idea.scores?.overall || 0;
  const scoreColor = overall >= 70 ? "text-lime-400" : overall >= 50 ? "text-amber-400" : "text-white/40";

  return (
    <div className="group cursor-pointer rounded-xl border border-white/10 bg-zinc-950 p-4 transition-colors hover:border-lime-400/30" onClick={onClick}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white line-clamp-2">{idea.title}</h3>
          <p className="mt-0.5 text-xs text-white/40">{idea.industry} · {idea.source}</p>
        </div>
        {overall > 0 && <div className={`text-2xl font-bold ${scoreColor}`}>{overall}</div>}
      </div>
      <p className="mb-3 text-xs text-white/50 line-clamp-2">{idea.description}</p>
      <ScoreBars scores={idea.scores} />
      <div className="flex items-center gap-2">
        {idea.status === "promoted" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-lime-400/15 px-2 py-1 text-[10px] font-medium text-lime-300">
            <CheckCircle className="h-3 w-3" /> Promoted
          </span>
        ) : idea.status === "scored" ? (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onPromote(); }}
              disabled={promoting}
              className="inline-flex items-center gap-1 rounded-lg bg-lime-400 px-2.5 py-1 text-[10px] font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
            >
              {promoting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />}
              Promote
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onReScore(); }}
              disabled={scoring}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[10px] text-white/60 hover:text-white disabled:opacity-50"
            >
              {scoring ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Re-score
            </button>
          </>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[10px] text-white/40">
            <Clock className="h-3 w-3" /> New
          </span>
        )}
      </div>
    </div>
  );
}

export function IdeaDetailModal({ idea, onClose, onPromote, promoting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-lime-400/30 bg-zinc-950 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">{idea.title}</h2>
            <p className="mt-0.5 text-xs text-white/40">{idea.industry} · {idea.source} · {idea.product_type}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        {idea.scores?.overall > 0 && (
          <div className="mb-4 flex items-center gap-6 rounded-lg border border-white/10 bg-black/40 p-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${idea.scores.overall >= 70 ? "text-lime-400" : idea.scores.overall >= 50 ? "text-amber-400" : "text-white/40"}`}>
                {idea.scores.overall}
              </div>
              <div className="text-[10px] uppercase text-white/40">Overall</div>
            </div>
            <div className="flex-1 grid grid-cols-4 gap-2">
              {SCORE_DIMENSIONS.map((dim) => (
                <div key={dim.key}>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/40">{dim.label}</span>
                    <span className={dim.color}>{idea.scores[dim.key] || 0}</span>
                  </div>
                  <div className="mt-0.5 h-1.5 overflow-hidden rounded bg-white/5">
                    <div className={`h-full ${dim.bg}`} style={{ width: `${idea.scores[dim.key] || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 text-sm">
          {idea.description && <DetailField label="Description" value={idea.description} />}
          {idea.problem_statement && <DetailField label="Problem" value={idea.problem_statement} />}
          {idea.proposed_solution && <DetailField label="Solution" value={idea.proposed_solution} />}
          {idea.target_audience && <DetailField label="Target Audience" value={idea.target_audience} />}
          {idea.score_breakdown && <DetailField label="Score Analysis" value={idea.score_breakdown} small />}
          {idea.monetization_model && <DetailField label="Monetization" value={idea.monetization_model} />}
          {idea.competitors?.length > 0 && (
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase text-white/40">Competitors</h4>
              <div className="flex flex-wrap gap-1">
                {idea.competitors.map((c, i) => (
                  <span key={i} className="rounded bg-white/5 px-2 py-0.5 text-xs text-white/60">{c}</span>
                ))}
              </div>
            </div>
          )}
          {idea.source_url && (
            <a href={idea.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-lime-400 hover:text-lime-300">
              <ExternalLink className="h-3 w-3" /> View Source
            </a>
          )}
        </div>

        {idea.status !== "promoted" ? (
          <button
            onClick={onPromote}
            disabled={promoting}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
          >
            {promoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            {promoting ? "Promoting..." : "Promote to AutoBuilder"}
          </button>
        ) : (
          <div className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-lime-400/30 bg-lime-400/5 py-2.5 text-sm text-lime-300">
            <CheckCircle className="h-4 w-4" /> Promoted to AutoBuilder
          </div>
        )}
      </div>
    </div>
  );
}

function DetailField({ label, value, small }) {
  return (
    <div>
      <h4 className="mb-1 text-xs font-semibold uppercase text-white/40">{label}</h4>
      <p className={small ? "text-white/60 text-xs" : "text-white/70"}>{value}</p>
    </div>
  );
}