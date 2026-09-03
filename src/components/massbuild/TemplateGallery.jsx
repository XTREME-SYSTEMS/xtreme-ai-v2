import React from "react";
import { WEBSITE_TEMPLATES } from "@/lib/websiteTemplates";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TemplateGallery({ selectedId, onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {WEBSITE_TEMPLATES.map((tpl) => (
        <button
          key={tpl.id}
          onClick={() => onSelect(tpl.id)}
          className={cn(
            "relative text-left rounded-xl border-2 p-4 transition-all hover:scale-[1.02]",
            selectedId === tpl.id
              ? "border-amber-400 bg-amber-400/10 shadow-[0_0_14px_3px_rgba(255,234,0,0.3)]"
              : "border-white/10 bg-zinc-900 hover:border-white/30"
          )}
        >
          {selectedId === tpl.id && (
            <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-amber-400 flex items-center justify-center">
              <Check className="h-4 w-4 text-black" />
            </div>
          )}
          <div className="flex gap-1 mb-3">
            <div className="h-8 flex-1 rounded" style={{ background: tpl.default_colors.background }} />
            <div className="h-8 w-8 rounded" style={{ background: tpl.default_colors.accent }} />
          </div>
          <div className="font-bold text-white text-sm mb-1">{tpl.name}</div>
          <div className="text-xs text-amber-400 uppercase tracking-wider mb-2">{tpl.industry.replace(/_/g, " ")}</div>
          <div className="text-xs text-white/50 leading-relaxed">{tpl.description}</div>
          <div className="mt-3 flex flex-wrap gap-1">
            {tpl.layout.slice(0, 5).map((s) => (
              <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">{s.replace(/_/g, " ")}</span>
            ))}
            {tpl.layout.length > 5 && <span className="text-[9px] px-1.5 py-0.5 text-white/40">+{tpl.layout.length - 5} more</span>}
          </div>
        </button>
      ))}
    </div>
  );
}