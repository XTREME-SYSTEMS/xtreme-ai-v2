import { Eye, ClipboardList } from "lucide-react";

// Shows the approved Vision + Strategy that the current generator step is
// aligned to — so the user can see that their foundation choices are driving
// the content, tone, and website suggestions. Renders nothing until the
// project has an approved vision or strategy.
export default function FoundationAppliedBanner({ project, className = "" }) {
  const vision = project?.vision;
  const strategy = project?.strategy;
  if (!vision?.approved && !strategy?.approved) return null;

  return (
    <div className={`rounded-lg border border-lime-400/30 bg-lime-400/5 p-3 ${className}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-lime-400">
        <Eye className="h-3 w-3" /> Aligned to your approved foundation
      </div>
      <div className="mt-1.5 space-y-0.5">
        {vision?.mission && (
          <p className="text-xs text-white/70">
            <span className="font-semibold text-white/40">Vision:</span>{" "}
            <span className="text-white/80">{vision.mission}</span>
          </p>
        )}
        {strategy?.competitive_positioning && (
          <p className="text-xs text-white/70">
            <span className="font-semibold text-white/40">Strategy:</span>{" "}
            <span className="text-white/80">{strategy.competitive_positioning}</span>
          </p>
        )}
      </div>
    </div>
  );
}