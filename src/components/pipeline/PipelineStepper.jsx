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

export default function PipelineStepper({ currentStep, maxReachedStep, onStepClick, project }) {
  return (
    <div className="space-y-1">
      {STEPS.map((step) => {
        const isDone = step.id < currentStep;
        const isActive = step.id === currentStep;
        const isReachable = step.id <= maxReachedStep;
        const Icon = isDone ? CheckCircle2 : isActive ? Loader2 : Circle;

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
                isDone ? "text-lime-400" : isActive ? "text-lime-400 animate-spin" : "text-white/30"
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
  );
}

function RiskDot({ level }) {
  const colors = { low: "bg-emerald-500", medium: "bg-amber-500", high: "bg-rose-500" };
  return <span className={cn("h-2 w-2 rounded-full shrink-0", colors[level] || "bg-white/30")} />;
}