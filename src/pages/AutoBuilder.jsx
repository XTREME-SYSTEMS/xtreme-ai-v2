import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAutoBuild } from "@/lib/AutoBuildContext";
import {
  Plus, Loader2, Trash2, Zap, Pause, Play, CheckCircle, AlertCircle,
  Clock, ArrowRight, Hammer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCT_TYPE_OPTIONS } from "@/lib/buildProductTypes";

// Auto Builder — admin-side queue. The admin creates builds here, then clicks
// one to enter the EXACT same client portal experience (timeline, StepCoach,
// generator pages) against that build. All client portal hooks transparently
// read/write the AutoBuild record via AutoBuildContext, so the admin walks the
// same guided journey a client does.
export default function AutoBuilder() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState("");
  const [productType, setProductType] = useState("marketing_site");
  const navigate = useNavigate();
  const autoBuild = useAutoBuild();

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.AutoBuild.list("-created_date", 100);
      setBuilds(list || []);
    } catch {
      setBuilds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Poll for updates when a build is running
  useEffect(() => {
    const anyRunning = builds.some((b) => b.status === "running");
    if (!anyRunning) return;
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [builds, load]);

  const createBuild = async () => {
    if (!businessName.trim()) { setError("Business name is required."); return; }
    setCreating(true);
    setError("");
    try {
      const created = await base44.entities.AutoBuild.create({
        business_name: businessName.trim(),
        industry: industry.trim(),
        product_type: productType,
        current_step: "profile",
        status: "queued",
        visited_steps: [],
        logs: [`[${new Date().toISOString()}] Build created`],
      });
      setBusinessName("");
      setIndustry("");
      load();
      // Immediately enter the build
      autoBuild.setActiveBuildId(created.id);
      navigate("/my-package");
    } catch {
      setError("Couldn't create build. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const enterBuild = (build) => {
    autoBuild.setActiveBuildId(build.id);
    // Navigate to the current step's route if mid-pipeline, otherwise
    // start at the welcome page. System-build steps use their own routes.
    const stepRoutes = {
      profile: "/business-profile",
      names: "/business-name-studio",
      content: "/content-generator",
      logo: "/logo-generator",
      brand: "/brand-generator",
      website: "/design-direction",
      social: "/social-media",
      video: "/video-generator",
      review: "/your-designs",
      architecture: "/system-architecture",
      data_model: "/data-model",
      ui_system: "/ui-system",
      codegen: "/codegen",
      deploy: "/deploy",
      system_review: "/system-review",
      complete: "/receipts",
    };
    const route = stepRoutes[build.current_step] || "/my-package";
    navigate(route);
  };

  const deleteBuild = async (id, e) => {
    e.stopPropagation();
    try {
      await base44.entities.AutoBuild.delete(id);
      load();
    } catch {}
  };

  const toggleAutoAdvance = async (build, e) => {
    e.stopPropagation();
    try {
      await base44.entities.AutoBuild.update(build.id, { auto_advance: !build.auto_advance });
      load();
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
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/15">
            <Hammer className="h-5 w-5 text-lime-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Auto Builder</h1>
            <p className="text-sm text-white/50">
              Create a build, then walk through the exact same client portal pipeline — timeline, guided steps, and all generators — against it.
            </p>
          </div>
        </div>
      </div>

      {/* Create new build */}
      <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-lime-400">New Build</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Business name…"
            className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
          />
          <input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="Industry (e.g. epoxy, hvac, roofing)…"
            className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
          />
        </div>
        {/* Product type selector */}
        <div className="mt-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Product Type</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCT_TYPE_OPTIONS.map((pt) => {
              const Icon = pt.icon;
              const active = productType === pt.value;
              return (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setProductType(pt.value)}
                  className={cn(
                    "flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
                    active ? "border-lime-400 bg-lime-400/10" : "border-white/15 hover:border-white/30"
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-lime-400" : "text-white/50")} />
                  <span className={cn("text-xs font-semibold", active ? "text-white" : "text-white/70")}>{pt.label}</span>
                  <span className="text-[10px] leading-tight text-white/40">{pt.description}</span>
                </button>
              );
            })}
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        <button
          type="button"
          onClick={createBuild}
          disabled={creating}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {creating ? "Creating…" : "Create & Enter Build"}
        </button>
      </div>

      {/* Queue */}
      <div className="rounded-xl border border-white/10 bg-zinc-950">
        <div className="flex items-center gap-2 border-b border-white/10 p-3">
          <Zap className="h-4 w-4 text-lime-400" />
          <h2 className="text-sm font-semibold text-white">Build Queue</h2>
          <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60">
            {builds.length}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-white/30" />
          </div>
        ) : builds.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-white/40">
            No builds yet. Create one above to start the pipeline.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {builds.map((b) => (
              <div
                key={b.id}
                onClick={() => enterBuild(b)}
                className="group flex w-full cursor-pointer items-center gap-3 p-3 text-left transition-colors hover:bg-white/5"
              >
                {statusIcon(b.status)}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">{b.business_name}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/40">
                    <span className="rounded bg-lime-400/10 px-1 py-0.5 font-medium text-lime-300">
                      {(b.product_type || "marketing_site").replace("_", " ")}
                    </span>
                    <span>·</span>
                    <span>{statusLabel(b.status)}</span>
                    <span>·</span>
                    <span className="capitalize">{b.current_step}</span>
                    {b.industry && <><span>·</span><span className="truncate">{b.industry}</span></>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => toggleAutoAdvance(b, e)}
                  title={b.auto_advance ? "Auto-advance ON" : "Auto-advance OFF"}
                  className={cn(
                    "shrink-0 rounded p-1.5 transition-colors",
                    b.auto_advance ? "text-lime-400" : "text-white/30 hover:text-white/60"
                  )}
                >
                  {b.auto_advance ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => deleteBuild(b.id, e)}
                  className="shrink-0 rounded p-1.5 text-white/20 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/30 group-hover:text-lime-400" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}