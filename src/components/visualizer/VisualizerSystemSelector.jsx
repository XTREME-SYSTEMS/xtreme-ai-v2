import React from "react";
import { Sparkles, Palette, Layers, Gem, Square, Star, CircleDot, Droplet, Wrench, Layers3, Shield } from "lucide-react";
import { FLOOR_SYSTEMS } from "@/lib/floorSystems";
import { cn } from "@/lib/utils";

const ICONS = { Sparkles, Palette, Layers, Gem, Square, Star, CircleDot, Droplet, Wrench, Layers3, Shield };

export default function VisualizerSystemSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {FLOOR_SYSTEMS.filter(s => s.color_system_key !== "none").map((sys) => {
        const Icon = ICONS[sys.icon] || Square;
        const active = selected === sys.name;
        return (
          <button
            key={sys.name}
            onClick={() => onSelect(sys.name)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all",
              active
                ? "border-amber-400 bg-amber-400/10 text-amber-400"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
            )}
          >
            <Icon className="h-6 w-6" />
            <div>
              <div className="text-xs font-semibold leading-tight">{sys.name}</div>
              <div className="text-[10px] text-white/40 leading-tight mt-0.5">{sys.short_description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}