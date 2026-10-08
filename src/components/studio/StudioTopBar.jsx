import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sparkles, Brain, Inbox, Rocket, Activity, PanelLeft, Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";

const AMBER = "#FF8C00";

const PIPELINE_STEPS = [
  { to: "/onboarding", label: "Onboarding", icon: Sparkles },
  { to: "/strategy-review", label: "Strategy", icon: Brain },
  { to: "/pack-inbox", label: "Pack Inbox", icon: Inbox },
  { to: "/mass-website-factory", label: "Mass Deploy", icon: Rocket },
  { to: "/ranking-monitor", label: "Monitor", icon: Activity },
];

// Top strip — pipeline steps + page toggle + profile.
export default function StudioTopBar({ user, view, onToggleView }) {
  const navigate = useNavigate();
  const location = useLocation();

  const initials = (user?.full_name || user?.email || "U")
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 border-b border-white/5 bg-[#0d0d0d] px-3 py-2">
      {/* Logo */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-white"
        style={{ background: AMBER }}>
        D2
      </div>
      <div className="hidden text-[10px] font-bold uppercase tracking-wider text-white/80 sm:block">
        Digital Dominance 2.0
      </div>

      <div className="mx-1 h-5 w-px bg-white/10" />

      {/* Pipeline steps strip */}
      <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-thin">
        {PIPELINE_STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = location.pathname === step.to;
          return (
            <React.Fragment key={step.to}>
              <button
                onClick={() => navigate(step.to)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  isActive ? "text-white" : "text-white/40 hover:text-white/70 hover:bg-white/5"
                )}
                style={isActive ? { background: AMBER } : {}}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{step.label}</span>
              </button>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className="h-3 w-px shrink-0 bg-white/10" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Page toggle + profile */}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onToggleView}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
            view === "workbench"
              ? "border-white/20 bg-white/10 text-white"
              : "border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5"
          )}
        >
          <PanelLeft className="h-3.5 w-3.5" />
          {view === "workbench" ? "Back to Studio" : "Workbench"}
        </button>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ background: AMBER }}>
          {initials}
        </div>
      </div>
    </div>
  );
}