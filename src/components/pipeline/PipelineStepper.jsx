import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Circle } from "lucide-react";

const STEPS = [
  { id: 1, key: "search", label: "Search & Select", desc: "Find a site to clone" },
  { id: 2, key: "original", label: "Original Site", desc: "Preview the target" },
  { id: 3, key: "audit", label: "Legal Audit", desc: "Find must-change items" },
  { id: 4, key: "naming", label: "Name & Domain", desc: "Pick available brand" },
  { id: 5, key: "rebrand", label: "Rebrand Generation", desc: "AI creates all assets" },
  { id: 6, key: "provision", label: "Provisioning", desc: "Drive · Git · Vercel · Supabase" },
  { id: 7, key: "harden", label: "Harden & Validate", desc: "Forensic audit" },
  { id: 8, key: "live", label: "Live Site", desc: "Deployed & racing to rank" },
];

// Map project current_step to the pipeline step it corresponds to
const STEP_MAP = {
  queued: 2, scanning: 2, scanned: 3, generating_rebrand: 5,
  rebrand_ready: 5, approved: 5, provisioning: 6, buying_domain: 6,
  seo_aeo_optimizing: 6, racing_to_rank: 7, complete: 8, failed: 1,
};

export default function PipelineStepper({ currentStep, maxReachedStep, onStepClick, project }) {
  // Compute project-based progress
  const projectStep = project?.current_step ? STEP_MAP[project.current_step] || 0 : 0;
  const progressPct = project ? Math.round(((projectStep - 1) / (STEPS.length - 1)) * 100) : 0;

  return (
    <div className="space-y-2">
      {/* Overall progress bar */}
      {project && (
        <div className="mb-2 px-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wider text-white/40">Pipeline Progress</span>
            <span className="text-[10px] font-medium text-lime-400">{progressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-lime-400 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-1">
        {STEPS.map((step) => {
          const isDone = step.id < currentStep;
          const isActive = step.id === currentStep;
          const isReachable = step.id <= maxReachedStep;
          const isProjectStep = project && projectStep === step.id;
          const Icon = isDone ? CheckCircle2 : (isActive || isProjectStep) ? Loader2 : Circle;

          return (
            <button
              key={step.id}
              onClick={() => isReachable && onStepClick(step.id)}
              disabled={!isReachable}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                isActive ? "bg-lime-400/10 border border-lime-400/30" : "border border-transparent",
                isReachable ? "hover:bg-white/5 cursor-pointer" : "opacity-40 cursor-not-allowed"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isDone ? "text-lime-400" : (isActive || isProjectStep) ? "text-lime-400 animate-spin" : "text-white/30"
                )}
              />
              <div className="min-w-0 flex-1">
                <div className={cn("text-sm font-medium", isActive || isDone ? "text-white" : "text-white/50")}>
                  {step.id}. {step.label}
                </div>
                <div className="text-[11px] text-white/40 truncate">{step.desc}</div>
              </div>
              {project && step.id === 3 && project.legal_scan?.risk_level && (
                <RiskDot level={project.legal_scan.risk_level} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RiskDot({ level }) {
  const colors = { low: "bg-emerald-500", medium: "bg-amber-500", high: "bg-rose-500" };
  return <span className={cn("h-2 w-2 rounded-full shrink-0", colors[level] || "bg-white/30")} />;
}