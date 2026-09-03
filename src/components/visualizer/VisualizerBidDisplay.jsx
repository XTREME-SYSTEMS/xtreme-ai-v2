import React from "react";
import { cn } from "@/lib/utils";
import { money, BID_TIERS } from "@/lib/bidEngine";
import { Check } from "lucide-react";

export default function VisualizerBidDisplay({ bids, selectedTier, onTierSelect, sqft, finish, onFinishChange }) {
  const activeBid = bids.find(b => b.key === selectedTier) || bids[1];
  const midPrice = Math.round((activeBid.low + activeBid.high) / 2);
  const perSqft = sqft ? (midPrice / sqft).toFixed(2) : "—";

  return (
    <div className="space-y-4">
      {/* Bid tiers */}
      <div className="space-y-2">
        {bids.map((bid) => {
          const active = bid.key === selectedTier;
          return (
            <button
              key={bid.key}
              onClick={() => onTierSelect(bid.key)}
              className={cn(
                "w-full rounded-xl border-2 p-4 text-left transition-all",
                active
                  ? "border-amber-400 bg-amber-400/10"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border-2",
                    active ? "border-amber-400 bg-amber-400" : "border-white/20"
                  )}>
                    {active && <Check className="h-3 w-3 text-black" />}
                  </div>
                  <div>
                    <div className={cn("text-sm font-bold", active ? "text-amber-400" : "text-white")}>
                      {bid.label}
                    </div>
                    <div className="text-[11px] text-white/40">{bid.blurb}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn("text-lg font-bold", active ? "text-amber-400" : "text-white")}>
                    {money(bid.low)} – {money(bid.high)}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active bid summary */}
      {activeBid && sqft > 0 && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-white/50">Your {activeBid.label} Estimate</div>
              <div className="text-2xl font-bold text-amber-400">{money(midPrice)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/50">Per Sq Ft</div>
              <div className="text-xl font-bold text-white">${perSqft}</div>
            </div>
          </div>
        </div>
      )}

      {/* Finish selector */}
      <div>
        <div className="text-xs font-semibold text-white/70 mb-1.5">Finish</div>
        <div className="grid grid-cols-3 gap-2">
          {["Matte", "Satin", "High Gloss"].map((f) => (
            <button
              key={f}
              onClick={() => onFinishChange(f)}
              className={cn(
                "rounded-lg border py-2 text-xs font-medium transition-all",
                finish === f
                  ? "border-amber-400 bg-amber-400/10 text-amber-400"
                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center text-[10px] text-white/30">
        Preliminary, non-binding estimate. Final pricing determined after on-site inspection.
      </div>
    </div>
  );
}