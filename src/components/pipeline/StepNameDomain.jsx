import React, { useState } from "react";
import { LoadingButton } from "@/components/ui";
import { Tag, CheckCircle2, Globe, Edit3, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StepNameDomain({ project, onApprove, generating }) {
  const names = project?.legal_scan?.name_recommendations || [];
  const [selected, setSelected] = useState(
    names.find((n) => n.available) || names[0] || null
  );
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDomain, setCustomDomain] = useState("");

  const handleApprove = () => {
    if (customMode) {
      if (!customName.trim() || !customDomain.trim()) return;
      onApprove(customName.trim(), customDomain.trim().toLowerCase());
    } else if (selected) {
      onApprove(selected.name, selected.domain);
    }
  };

  const canApprove = customMode
    ? customName.trim() && customDomain.trim()
    : selected;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Pick a New Name & Domain</h2>
          <p className="mt-1 text-sm text-white/50">20 AI-generated brand names with available domains. Pick one or enter your own.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCustomMode(!customMode)}
            className={cn("rounded-lg px-3 py-2 text-sm font-medium transition-colors", customMode ? "bg-lime-400 text-black" : "border border-white/15 text-white/70 hover:bg-white/5")}
          >
            <Edit3 className="inline h-4 w-4 mr-1" /> Custom
          </button>
          <LoadingButton onClick={handleApprove} loading={generating} variant="primary" disabled={!canApprove}>
            <Sparkles className="h-4 w-4" /> Approve & Generate Rebrand
            <ArrowRight className="h-4 w-4" />
          </LoadingButton>
        </div>
      </div>

      {customMode ? (
        <div className="space-y-3 rounded-xl border border-lime-400/30 bg-lime-400/5 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Business Name *</label>
              <input className="pipeline-input" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Elite Garage Coatings" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Domain *</label>
              <input className="pipeline-input" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="elitegaragecoatings.com" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {names.map((n, i) => (
            <button
              key={i}
              onClick={() => setSelected(n)}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                selected?.name === n.name ? "border-lime-400 bg-lime-400/10" : "border-white/10 bg-zinc-950 hover:border-white/20"
              )}
            >
              <div className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", selected?.name === n.name ? "border-lime-400 bg-lime-400" : "border-white/30")}>
                {selected?.name === n.name && <CheckCircle2 className="h-4 w-4 text-black" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{n.name}</span>
                  {n.available && <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-300">Available</span>}
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-lime-400/70">
                  <Globe className="h-3 w-3" /> {n.domain}
                </div>
                <div className="text-xs text-white/40 mt-1">{n.rationale}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {generating && (
        <div className="flex items-center gap-3 rounded-lg border border-lime-400/30 bg-lime-400/5 px-4 py-3">
          <Sparkles className="h-5 w-5 animate-pulse text-lime-400" />
          <div>
            <div className="text-sm font-medium text-white">Generating rebrand package…</div>
            <div className="text-xs text-white/50">Creating logos, replacement images, new content, hero section, services, and FAQ. This takes ~30-60 seconds.</div>
          </div>
        </div>
      )}
    </div>
  );
}