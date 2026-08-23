import { AlertTriangle, CheckCircle, Loader2, Rocket, ExternalLink } from "lucide-react";

export function LeadCard({ lead, onClick, onPromote, promoting }) {
  const oppScore = lead.opportunity_score || 0;
  const webScore = lead.website_score || 0;

  return (
    <div className="group cursor-pointer rounded-xl border border-white/10 bg-zinc-950 p-4 transition-colors hover:border-lime-400/30" onClick={onClick}>
      <div className="mb-2 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white line-clamp-1">{lead.business_name}</h3>
          <p className="mt-0.5 text-xs text-white/40">{lead.industry} · {lead.location || "—"}</p>
        </div>
        <div className="text-right">
          <div className={`text-xl font-bold ${oppScore >= 70 ? "text-lime-400" : oppScore >= 40 ? "text-amber-400" : "text-white/40"}`}>{oppScore}</div>
          <div className="text-[8px] uppercase text-white/30">Opp</div>
        </div>
      </div>

      {lead.website_url ? (
        <a href={lead.website_url} target="_blank" rel="noopener noreferrer" className="mb-2 block truncate text-xs text-blue-400 hover:text-blue-300" onClick={(e) => e.stopPropagation()}>
          {lead.website_url}
        </a>
      ) : (
        <div className="mb-2 rounded bg-red-400/10 px-2 py-1 text-xs text-red-300">No website</div>
      )}

      <div className="mb-3 flex flex-wrap gap-1">
        {(lead.issues || []).slice(0, 4).map((issue, i) => (
          <span
            key={i}
            className={`rounded-full px-1.5 py-0.5 text-[9px] ${
              issue.severity === "critical" ? "bg-red-400/15 text-red-300" :
              issue.severity === "major" ? "bg-amber-400/15 text-amber-300" :
              "bg-white/5 text-white/40"
            }`}
          >
            {issue.type.replace(/_/g, " ")}
          </span>
        ))}
        {(lead.issues || []).length > 4 && (
          <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-white/40">
            +{lead.issues.length - 4} more
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="flex items-center justify-between text-[9px] text-white/30">
            <span>Website Health</span>
            <span>{webScore}/100</span>
          </div>
          <div className="mt-0.5 h-1 overflow-hidden rounded bg-white/5">
            <div className={`h-full ${webScore < 30 ? "bg-red-400" : webScore < 60 ? "bg-amber-400" : "bg-lime-400"}`} style={{ width: `${webScore}%` }} />
          </div>
        </div>
        {lead.status !== "converted" && (
          <button
            onClick={(e) => { e.stopPropagation(); onPromote(); }}
            disabled={promoting}
            className="inline-flex items-center gap-1 rounded-lg bg-lime-400 px-2.5 py-1 text-[10px] font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
          >
            {promoting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />}
            Build
          </button>
        )}
      </div>
    </div>
  );
}

export function LeadDetailModal({ lead, onClose, onPromote, promoting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-lime-400/30 bg-zinc-950 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">{lead.business_name}</h2>
            <p className="mt-0.5 text-xs text-white/40">{lead.industry} · {lead.location}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-center">
            <div className={`text-3xl font-bold ${lead.opportunity_score >= 70 ? "text-lime-400" : "text-amber-400"}`}>{lead.opportunity_score}</div>
            <div className="text-[10px] uppercase text-white/40">Opportunity Score</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-center">
            <div className={`text-3xl font-bold ${lead.website_score < 30 ? "text-red-400" : lead.website_score < 60 ? "text-amber-400" : "text-lime-400"}`}>{lead.website_score}</div>
            <div className="text-[10px] uppercase text-white/40">Website Health</div>
          </div>
        </div>

        {(lead.phone || lead.email || lead.address) && (
          <div className="mb-4 rounded-lg border border-white/10 bg-black/40 p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase text-white/40">Contact</h4>
            {lead.phone && <p className="text-xs text-white/70">Phone: {lead.phone}</p>}
            {lead.email && <p className="text-xs text-white/70">Email: {lead.email}</p>}
            {lead.address && <p className="text-xs text-white/70">Address: {lead.address}</p>}
          </div>
        )}

        <div className="mb-4">
          <h4 className="mb-2 text-xs font-semibold uppercase text-white/40">Detected Issues ({lead.issues?.length || 0})</h4>
          <div className="space-y-1.5">
            {(lead.issues || []).map((issue, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-white/5 bg-black/40 p-2">
                <AlertTriangle className={`h-3.5 w-3.5 mt-0.5 ${
                  issue.severity === "critical" ? "text-red-400" :
                  issue.severity === "major" ? "text-amber-400" :
                  "text-white/40"
                }`} />
                <div className="flex-1">
                  <span className="text-xs font-medium text-white">{issue.type.replace(/_/g, " ")}</span>
                  <p className="text-xs text-white/50">{issue.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {lead.suggested_services?.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-semibold uppercase text-white/40">Suggested Services</h4>
            <div className="flex flex-wrap gap-1">
              {lead.suggested_services.map((s, i) => (
                <span key={i} className="rounded bg-lime-400/10 px-2 py-1 text-xs text-lime-300">{s}</span>
              ))}
            </div>
          </div>
        )}

        {lead.competitor_analysis && (
          <div className="mb-4">
            <h4 className="mb-1 text-xs font-semibold uppercase text-white/40">Competitor Analysis</h4>
            <p className="text-xs text-white/60">{lead.competitor_analysis}</p>
          </div>
        )}

        <button
          onClick={onPromote}
          disabled={promoting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
        >
          {promoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
          {promoting ? "Promoting..." : "Promote to AutoBuilder"}
        </button>
      </div>
    </div>
  );
}