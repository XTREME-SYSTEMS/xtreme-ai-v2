import React, { useState } from "react";
import { getColorsBySystem } from "@/lib/colorChartData";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export default function VisualizerColorChart({ systemKey, selected, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const [broken, setBroken] = useState({});
  const colors = getColorsBySystem(systemKey);
  if (!colors.length) return null;

  const visible = expanded ? colors : colors.slice(0, 8);

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
        {visible.map((color) => {
          const active = selected === color.color_name;
          const showImage = color.image_url && !broken[color.code];
          return (
            <button
              key={color.code}
              onClick={() => onSelect(color)}
              className={cn(
                "group relative overflow-hidden rounded-lg border-2 transition-all",
                active ? "border-amber-400 ring-2 ring-amber-400/30" : "border-white/10 hover:border-white/30"
              )}
              title={`${color.color_name} (${color.code})`}
            >
              <div
                className="aspect-square w-full overflow-hidden"
                style={{ backgroundColor: color.hex || "#333" }}
              >
                {showImage && (
                  <img
                    src={color.image_url}
                    alt={color.color_name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={() => setBroken((prev) => ({ ...prev, [color.code]: true }))}
                  />
                )}
              </div>
              {active && (
                <div className="absolute inset-0 flex items-center justify-center bg-amber-400/30">
                  <Check className="h-5 w-5 text-black" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1 py-0.5">
                <div className="truncate text-[9px] font-medium text-white">{color.color_name}</div>
              </div>
            </button>
          );
        })}
      </div>
      {colors.length > 8 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full rounded-lg border border-white/10 py-2 text-xs font-medium text-white/60 transition-colors hover:border-amber-400 hover:text-amber-400"
        >
          {expanded ? "Show less" : `Show all ${colors.length} colors`}
        </button>
      )}
    </div>
  );
}