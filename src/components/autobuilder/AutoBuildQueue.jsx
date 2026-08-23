import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Loader2, Trash2, Zap, Pause, Play, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// Left sidebar — the queue of all AutoBuild records. Admin creates new
// builds here, selects one to work on, and sees queue status at a glance.
export default function AutoBuildQueue({ builds, loading, selectedId, onSelect, onCreated, onRefresh }) {
  const [creating, setCreating] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState("");

  const createBuild = async () => {
    if (!businessName.trim()) { setError("Business name is required."); return; }
    setCreating(true);
    setError("");
    try {
      const created = await base44.entities.AutoBuild.create({
        business_name: businessName.trim(),
        industry: industry.trim(),
        current_step: "profile",
        status: "queued",
        visited_steps: [],
        logs: [`[${new Date().toISOString()}] Build created`],
      });
      setBusinessName("");
      setIndustry("");
      onCreated(created);
    } catch (e) {
      setError("Couldn't create build. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const deleteBuild = async (id, e) => {
    e.stopPropagation();
    try {
      await base44.entities.AutoBuild.delete(id);
      onRefresh();
    } catch {}
  };

  const toggleAutoAdvance = async (build, e) => {
    e.stopPropagation();
    try {
      await base44.entities.AutoBuild.update(build.id, { auto_advance: !build.auto_advance });
      onRefresh();
    } catch {}
  };

  const statusIcon = (status) => {
    switch (status) {
      case "running": return <Loader2 className="h-3.5 w-3.5 animate-spin text-lime-400" />;
      case "complete": return <CheckCircle className="h-3.5 w-3.5 text-lime-400" />;
      case "failed": return <AlertCircle className="h-3.5 w-3.5 text-red-400" />;
      case "paused": return <Pause className="h-3.5 w-3.5 text-amber-400" />;
      default: return <Clock className="h-3.5 w-3.5 text-white/40" />;
    }
  };

  const statusLabel = (status) => {
    const map = { queued: "Queued", running: "Running", paused: "Paused", complete: "Complete", failed: "Failed" };
    return map[status] || status;
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="border-b border-white/10 p-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-lime-400" />
          <h2 className="text-sm font-semibold text-white">Auto Builder Queue</h2>
          <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60">
            {builds.length}
          </span>
        </div>
      </div>

      {/* Create new build */}
      <div className="border-b border-white/10 p-3">
        <input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Business name…"
          className="w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
        />
        <input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="Industry (e.g. epoxy, hvac)…"
          className="mt-2 w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
        />
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
        <button
          type="button"
          onClick={createBuild}
          disabled={creating}
          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
        >
          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          New Build
        </button>
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-white/30" />
          </div>
        ) : builds.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-white/40">
            No builds yet. Create one above to start the pipeline.
          </div>
        ) : (
          <div className="space-y-1.5">
            {builds.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelect(b.id)}
                className={cn(
                  "group w-full rounded-lg border p-2.5 text-left transition-colors",
                  selectedId === b.id
                    ? "border-lime-400 bg-lime-400/10"
                    : "border-white/10 bg-zinc-950 hover:border-white/20"
                )}
              >
                <div className="flex items-center gap-2">
                  {statusIcon(b.status)}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                    {b.business_name}
                  </span>
                  <button
                    onClick={(e) => toggleAutoAdvance(b, e)}
                    title={b.auto_advance ? "Auto-advance ON" : "Auto-advance OFF"}
                    className={cn(
                      "shrink-0 rounded p-1 transition-colors",
                      b.auto_advance ? "text-lime-400" : "text-white/30 hover:text-white/60"
                    )}
                  >
                    {b.auto_advance ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={(e) => deleteBuild(b.id, e)}
                    className="shrink-0 rounded p-1 text-white/20 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="mt-1 flex items-center gap-2 pl-5 text-[10px] text-white/40">
                  <span>{statusLabel(b.status)}</span>
                  <span>·</span>
                  <span className="capitalize">{b.current_step}</span>
                  {b.industry && <><span>·</span><span className="truncate">{b.industry}</span></>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}