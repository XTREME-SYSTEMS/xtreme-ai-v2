import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAutoBuild } from "@/lib/AutoBuildContext";
import { base44 } from "@/api/base44Client";
import { getProductType } from "@/lib/buildProductTypes";
import BackButton from "@/components/client/BackButton";
import {
  CheckCircle, ArrowRight, Route, Database, Zap, Plug, Layers, Rocket,
  FileCode, Server, Globe, ExternalLink,
} from "lucide-react";

// System Review — the final review step for web_app / ecommerce / platform
// builds. Summarizes the approved architecture spec and finalizes the build.
export default function SystemReview() {
  const autoBuild = useAutoBuild();
  const navigate = useNavigate();

  const build = autoBuild.build;
  const architecture = build?.architecture;
  const codeManifest = build?.code_manifest;
  const deployment = build?.deployment;
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
      logs: [...(build.logs || []), `[${new Date().toISOString()}] Build finalized — all system steps complete`],
    });
    // Create Receipt for the finalization
    try {
      await base44.entities.Receipt.create({
        agent_or_workflow: "SystemReview",
        action: "finalize_build",
        entity_type: "AutoBuild",
        entity_id: build.id,
        inputs: JSON.stringify({ business_name: build.business_name, product_type: build.product_type }).slice(0, 4000),
        outputs: JSON.stringify({ status: "complete" }).slice(0, 4000),
        status: "success",
        evidence: `Build finalized: ${build.business_name} (${build.product_type})`,
      });
    } catch {}
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
    { icon: FileCode, label: "Code Files", count: codeManifest?.files?.length || 0 },
    { icon: Server, label: "Est. LOC", count: codeManifest?.estimated_loc?.toLocaleString() || 0 },
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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

      {/* Deployment preview */}
      {deployment?.live_url && (
        <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-5">
          <div className="mb-2 flex items-center gap-2">
            <Globe className="h-4 w-4 text-lime-400" />
            <h2 className="text-sm font-semibold text-white">Deployment Preview</h2>
            <span className="ml-auto rounded-full bg-lime-400/15 px-2.5 py-1 text-xs text-lime-300">
              {deployment.status?.replace(/_/g, " ")}
            </span>
          </div>
          <a
            href={deployment.live_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-white hover:text-lime-300"
          >
            {deployment.live_url}
            <ExternalLink className="h-3 w-3" />
          </a>
          {deployment.platform && (
            <p className="mt-1 text-xs text-white/40">Platform: {deployment.platform} · {codeManifest?.framework || "—"}</p>
          )}
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