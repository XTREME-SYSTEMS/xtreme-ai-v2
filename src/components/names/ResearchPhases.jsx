import { CheckCircle2, Loader2, Brain, Globe, Search, Building2, Sparkles } from "lucide-react";

// ResearchPhases — shows the 5-phase research pipeline transparency.
// Displayed after generation completes, so all phases are done.
const PHASE_ICONS = [Brain, Globe, Search, Building2, Sparkles];

export default function ResearchPhases({ phases }) {
  if (!phases || phases.length === 0) return null;

  return (
    <div className="rounded-xl border border-lime-400/20 bg-zinc-950 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-lime-400" />
        <span className="text-xs font-semibold text-white">Research Pipeline — Full Transparency</span>
      </div>
      <div className="space-y-2">
        {phases.map((phase, i) => {
          const Icon = PHASE_ICONS[i] || CheckCircle2;
          return (
            <div key={i} className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-lime-400/30 bg-lime-400/10">
                <Icon className="h-3.5 w-3.5 text-lime-400" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-white">{phase.name}</div>
                <div className="text-[10px] text-white/40">
                  {phase.count !== undefined && `${phase.count} processed`}
                  {phase.total !== undefined && ` · ${phase.available} of ${phase.total} available`}
                </div>
              </div>
              <CheckCircle2 className="h-4 w-4 text-lime-400" />
            </div>
          );
        })}
      </div>
    </div>
  );
}