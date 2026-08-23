import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAutoBuild } from "@/lib/AutoBuildContext";
import { getProductType } from "@/lib/buildProductTypes";
import BackButton from "@/components/client/BackButton";
import {
  CheckCircle, ArrowRight, Route, Database, Zap, Plug, Layers, Rocket,
} from "lucide-react";

// System Review — the final review step for web_app / ecommerce / platform
// builds. Summarizes the approved architecture spec and finalizes the build.
export default function SystemReview() {
  const autoBuild = useAutoBuild();
  const navigate = useNavigate();

  const build = autoBuild.build;
  const architecture = build?.architecture;
  const productType = getProductType(build?.product_type);

  useEffect(() => {
    document.title = "System Review · Auto Builder";
  }, []);

  const finalize = async () => {
    if (!build) return;
    const visited = build.visited_steps || [];
    if (!visited.includes("/system-review")) visited.push("/system-review");
    await autoBuild.saveBuild({
      visited_steps: visited,
      status: "complete",
      current_step: "complete",
      logs: [...(build.logs || []), `[${new Date().toISOString()}] Build finalized — architecture approved`],
    });
    navigate("/receipts");
  };

  if (!build) {
    return (
      <div className="py-10 text-center text-white/50">
        No active build. Return to the Auto Builder to create one.
      </div>
    );
  }

  if (!architecture) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <BackButton to="/system-architecture" />
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-6 text-center">
          <p className="text-sm text-amber-200">No architecture spec yet. Generate one first.</p>
          <button
            type="button"
            onClick={() => navigate("/system-architecture")}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300"
          >
            Go to Architecture
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: Route, label: "Pages", count: architecture.pages?.length || 0 },
    { icon: Database, label: "Data Models", count: architecture.data_models?.length || 0 },
    { icon: Zap, label: "Features", count: architecture.features?.length || 0 },
    { icon: Plug, label: "Integrations", count: architecture.integrations?.length || 0 },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <BackButton to="/deploy" />

      <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-5">
        <h1 className="text-xl font-semibold text-white">System Review</h1>
        <p className="mt-1 text-sm text-white/50">
          {productType.label} · {build.business_name}
        </p>
        {architecture.concept && (
          <p className="mt-3 text-sm font-medium text-lime-300">{architecture.concept}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-center">
              <Icon className="mx-auto h-5 w-5 text-lime-400" />
              <div className="mt-1.5 text-2xl font-bold text-white">{s.count}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/40">{s.label}</div>
            </div>
          );
        })}
      </div>

      {architecture.summary && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
          <div className="mb-2 flex items-center gap-2">
            <Layers className="h-4 w-4 text-lime-400" />
            <h2 className="text-sm font-semibold text-white">Summary</h2>
          </div>
          <p className="text-sm text-white/60">{architecture.summary}</p>
        </div>
      )}

      {architecture.estimated_effort && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-sm text-white/60">
          <span className="font-semibold text-white/80">Estimated effort:</span> {architecture.estimated_effort}
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl border border-lime-400/30 bg-lime-400/5 p-4">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <CheckCircle className="h-4 w-4 text-lime-400" />
          Everything looks good? Finalize this build.
        </div>
        <button
          type="button"
          onClick={finalize}
          className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-lime-300"
        >
          <Rocket className="h-4 w-4" /> Finalize Build
        </button>
      </div>
    </div>
  );
}