import { useState } from "react";
import { Image } from "@/components/ui/image";
import { X, Check, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

// Full-screen preview of a single brand mockup with a light/dark backdrop
// color toggle. Lets the client inspect a mockup (business card, brochure,
// t-shirt, …) up close before selecting it.
export default function BrandPackPreview({ pack, selected, onSelect, onClose }) {
  const [light, setLight] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-zinc-950 px-3 py-2.5">
        <span className="text-sm font-semibold text-white">{pack.label}</span>
        <span className="hidden text-xs text-white/40 sm:inline">Brand mockup preview</span>

        <div className="ml-auto flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-900 p-0.5">
          <button
            type="button"
            onClick={() => setLight(false)}
            className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium", !light ? "bg-lime-400 text-black" : "text-white/60")}
          >
            <Moon className="h-3.5 w-3.5" /> Dark
          </button>
          <button
            type="button"
            onClick={() => setLight(true)}
            className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium", light ? "bg-lime-400 text-black" : "text-white/60")}
          >
            <Sun className="h-3.5 w-3.5" /> Light
          </button>
        </div>

        <button
          type="button"
          onClick={() => onSelect()}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
            selected ? "border border-lime-400 bg-lime-400/10 text-lime-300" : "bg-lime-400 text-black hover:bg-lime-300"
          )}
        >
          {selected ? <><Check className="h-3.5 w-3.5" /> Selected</> : "Select this mockup"}
        </button>

        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/5 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className={cn("flex-1 overflow-auto p-4 sm:p-8", light ? "bg-zinc-100" : "bg-zinc-900")}>
        <div className="mx-auto max-w-3xl">
          <div className={cn("overflow-hidden rounded-xl border shadow-2xl", light ? "border-black/10 bg-white" : "border-white/10 bg-zinc-950")}>
            <Image src={pack.url} alt={pack.label} fittingType="fit" className="h-auto w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}