import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAutoBuild } from "@/lib/AutoBuildContext";
import { getProductType } from "@/lib/buildProductTypes";
import BackButton from "@/components/client/BackButton";
import {
  Loader2, Rocket, RefreshCw, CheckCircle, ArrowRight, Zap,
  Globe, Settings, KeyRound, Route, ExternalLink, Server,
} from "lucide-react";

// Deploy — the fifth "system" step for web_app / ecommerce / platform
// builds. Generates a deployment configuration (build settings, env vars,
// routes, preview URL) via the deploySystemBuild backend function,
// displays it for review, and lets the admin approve to advance to the
// final system review step.
export default function Deploy() {
  const autoBuild = useAutoBuild();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [approved, setApproved] = useState(false);

  const build = autoBuild.build;
  const deployment = build?.deployment;
  const codeManifest = build?.code_manifest;
  const architecture = build?.architecture;
  const productType = getProductType(build?.product_type);
  const TypeIcon = productType.icon;

  useEffect(() => {
    document.title = "Deploy · Auto Builder";
  }, []);

  const generate = async () => {
    if (!build) return;
    setGenerating(true);
    setError("");
    try {
      const res = await base44.functions.invoke("deploySystemBuild", {
        codeManifest,
        architecture,
        productType: build.product_type,
        businessName: build.business_name,
      });
      const spec = res?.data?.data || res?.data;
      if (!spec) throw new Error("No deployment config returned");
      await autoBuild.saveBuild({
        deployment: spec,
        current_step: "deploy",
        logs: [...(build.logs || []), `[${new Date().toISOString()}] Deployment configured — preview URL: ${spec.live_url}`],
      });
    } catch (e) {
      setError(e?.message || "Couldn't generate deployment config. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const approve = async () => {
    if (!build) return;
    setApproved(true);
    const visited = build.visited_steps || [];
    if (!visited.includes("/deploy")) visited.push("/deploy");
    await autoBuild.saveBuild({
      visited_steps: visited,
      logs: [...(build.logs || []), `[${new Date().toISOString()}] Deployment config approved`],
    });
    navigate("/system-review");
  };

  if (autoBuild.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-lime-400" />
      </div>
    );
  }

  if (!build) {
    return (
      <div className="py-10 text-center text-white/50">
        No active build. Return to the Auto Builder to create one.
      </div>
    );
  }

  if (!codeManifest) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <BackButton to="/codegen" />
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-300">
          You need to generate the code manifest first before configuring deployment.
        </div>
      </div>
    );
  }

  const buildConfig = deployment?.build_config;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <BackButton to="/codegen" />

      {/* Header */}
      <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/15">
            <TypeIcon className="h-5 w-5 text-lime-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-white">Deployment</h1>
            <p className="text-sm text-white/50">{productType.label} · {build.business_name}</p>
          </div>
          {deployment && !generating && (
            <button
              type="button"
              onClick={generate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-lime-400/50 hover:text-lime-300"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </button>
          )}
        </div>
      </div>

      {/* Generating */}
      {generating && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-zinc-950 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
          <p className="text-sm text-white/60">Configuring deployment…</p>
          <p className="text-xs text-white/30">Setting up build config, environment variables, and routes.</p>
        </div>
      )}

      {error && !generating && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-300">{error}</div>
      )}

      {/* Generate button */}
      {!deployment && !generating && !error && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-zinc-950 py-16">
          <Rocket className="h-10 w-10 text-lime-400/50" />
          <div className="text-center">
            <p className="text-sm font-medium text-white">Configure your deployment</p>
            <p className="mt-1 text-xs text-white/40">The system will generate build settings, environment variables, routing config, and a preview deployment URL.</p>
          </div>
          <button type="button" onClick={generate} className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-lime-300">
            <Zap className="h-4 w-4" /> Configure Deployment
          </button>
        </div>
      )}

      {/* Deployment display */}
      {deployment && !generating && (
        <>
          {/* Preview URL banner */}
          <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-5">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-lime-400" />
              <div className="flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-lime-300">Preview URL</div>
                <a
                  href={deployment.live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-lime-300"
                >
                  {deployment.live_url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <span className="rounded-full bg-lime-400/15 px-2.5 py-1 text-xs text-lime-300">
                {deployment.status?.replace(/_/g, " ")}
              </span>
            </div>
            {deployment.deployment_notes && (
              <p className="mt-2 text-xs text-white/40">{deployment.deployment_notes}</p>
            )}
          </div>

          {/* Build config */}
          {buildConfig && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4 text-lime-400" />
                <h2 className="text-sm font-semibold text-white">Build Configuration</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-white/5 bg-black/40 p-2.5">
                  <div className="text-[10px] uppercase text-white/40">Framework</div>
                  <div className="text-sm text-white">{buildConfig.framework}</div>
                </div>
                <div className="rounded-lg border border-white/5 bg-black/40 p-2.5">
                  <div className="text-[10px] uppercase text-white/40">Build Cmd</div>
                  <code className="text-xs text-lime-300">{buildConfig.build_command}</code>
                </div>
                <div className="rounded-lg border border-white/5 bg-black/40 p-2.5">
                  <div className="text-[10px] uppercase text-white/40">Dev Cmd</div>
                  <code className="text-xs text-lime-300">{buildConfig.dev_command}</code>
                </div>
                <div className="rounded-lg border border-white/5 bg-black/40 p-2.5">
                  <div className="text-[10px] uppercase text-white/40">Install</div>
                  <code className="text-xs text-lime-300">{buildConfig.install_command}</code>
                </div>
                <div className="rounded-lg border border-white/5 bg-black/40 p-2.5">
                  <div className="text-[10px] uppercase text-white/40">Output Dir</div>
                  <code className="text-xs text-lime-300">{buildConfig.output_directory}</code>
                </div>
                <div className="rounded-lg border border-white/5 bg-black/40 p-2.5">
                  <div className="text-[10px] uppercase text-white/40">Node</div>
                  <div className="text-sm text-white">{buildConfig.node_version}</div>
                </div>
              </div>
            </div>
          )}

          {/* Environment variables */}
          {deployment.env_vars?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-lime-400" />
                <h2 className="text-sm font-semibold text-white">Environment Variables ({deployment.env_vars.length})</h2>
              </div>
              <div className="space-y-1.5">
                {deployment.env_vars.map((env, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/40 p-2.5">
                    <code className="text-xs font-medium text-lime-300">{env.key}</code>
                    <span className="text-xs text-white/40">{env.description}</span>
                    {env.required && (
                      <span className="ml-auto rounded-full bg-red-400/10 px-1.5 py-0.5 text-[9px] uppercase text-red-300">required</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Routes */}
          {deployment.routes?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Route className="h-4 w-4 text-lime-400" />
                <h2 className="text-sm font-semibold text-white">Routes ({deployment.routes.length})</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {deployment.routes.map((route, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/40 px-3 py-1.5 text-xs">
                    <Server className="h-3 w-3 text-lime-400" />
                    <code className="text-white/80">{route.path}</code>
                    <span className="text-white/30">→</span>
                    <span className="text-white/50">{route.page}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Repo info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
              <div className="text-[10px] uppercase tracking-wider text-white/40">Repository</div>
              <code className="mt-1 block text-xs text-lime-300">{deployment.repo_url}</code>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
              <div className="text-[10px] uppercase tracking-wider text-white/40">Platform</div>
              <div className="mt-1 flex items-center gap-1.5 text-sm capitalize text-white">
                <Server className="h-3.5 w-3.5 text-lime-400" />
                {deployment.platform}
              </div>
            </div>
          </div>

          {/* Approve */}
          <div className="flex items-center justify-between rounded-xl border border-lime-400/30 bg-lime-400/5 p-4">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <CheckCircle className="h-4 w-4 text-lime-400" />
              Review the deployment config, then approve to continue.
            </div>
            <button type="button" onClick={approve} disabled={approved} className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50">
              {approved ? <CheckCircle className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              {approved ? "Approved" : "Approve & Continue"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}