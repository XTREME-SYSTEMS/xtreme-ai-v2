import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAutoBuild } from "@/lib/AutoBuildContext";
import { base44 } from "@/api/base44Client";
import { getProductType } from "@/lib/buildProductTypes";
import BackButton from "@/components/client/BackButton";
import {
  CheckCircle, ArrowRight, Route, Database, Zap, Plug, Layers, Rocket,
  FileCode, Server, Globe, ExternalLink, ShieldCheck, Loader2, XCircle,
  Github, CloudUpload, FileText, Sparkles,
} from "lucide-react";

// System Review — the final review step for web_app / ecommerce / platform
// builds. Summarizes the approved architecture spec and finalizes the build.
export default function SystemReview() {
  const autoBuild = useAutoBuild();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [provisioning, setProvisioning] = useState(false);
  const [provisionResult, setProvisionResult] = useState(null);

  const build = autoBuild.build;
  const architecture = build?.architecture;
  const codeManifest = build?.code_manifest;
  const deployment = build?.deployment;
  const productType = getProductType(build?.product_type);

  useEffect(() => {
    document.title = "System Review · Auto Builder";
  }, []);

  const verifyDeployment = async () => {
    if (!deployment?.live_url) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await base44.functions.invoke("verifyDeployment", {
        liveUrl: deployment.live_url,
        buildId: build.id,
      });
      setVerifyResult(res.data);
    } catch (e) {
      setVerifyResult({ error: e?.message || "Verification failed" });
    } finally {
      setVerifying(false);
    }
  };

  const provisionBuild = async () => {
    if (!build) return;
    setProvisioning(true);
    setProvisionResult(null);
    try {
      const res = await base44.functions.invoke("provisionSystemBuild", { build_id: build.id });
      setProvisionResult(res.data);
      // Reload the build to pick up the new deployment field
      await autoBuild.reload();
    } catch (e) {
      setProvisionResult({ error: e?.message || "Provisioning failed" });
    } finally {
      setProvisioning(false);
    }
  };

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

      {/* Provisioned resources — GitHub, Vercel, Supabase, Drive, Docs */}
      <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-lime-400" />
          <h2 className="text-sm font-semibold text-white">Provisioned Resources</h2>
          <button
            type="button"
            onClick={provisionBuild}
            disabled={provisioning || !codeManifest}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
          >
            {provisioning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
            {provisioning ? "Provisioning…" : "Provision Build"}
          </button>
        </div>

        {provisionResult?.error && (
          <p className="mb-3 text-xs text-red-400">⚠ {provisionResult.error}</p>
        )}
        {provisionResult?.success && (
          <p className="mb-3 text-xs text-lime-400">✓ Provisioning complete — all resources created.</p>
        )}

        <div className="grid gap-2.5 sm:grid-cols-2">
          {/* GitHub */}
          <a
            href={deployment.repo_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2.5 rounded-lg border border-white/10 bg-zinc-950 p-3 ${deployment.repo_url ? "hover:border-lime-400/40" : "opacity-40 pointer-events-none"}`}
          >
            <Github className="h-4 w-4 text-lime-400" />
            <div className="min-w-0">
              <div className="text-xs font-medium text-white">GitHub Repo</div>
              <div className="truncate text-[11px] text-white/50">{deployment.repo || "Not provisioned"}</div>
            </div>
            {deployment.repo_url && <ExternalLink className="ml-auto h-3 w-3 text-white/30" />}
          </a>

          {/* Vercel */}
          <a
            href={deployment.live_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2.5 rounded-lg border border-white/10 bg-zinc-950 p-3 ${deployment.live_url ? "hover:border-lime-400/40" : "opacity-40 pointer-events-none"}`}
          >
            <Globe className="h-4 w-4 text-lime-400" />
            <div className="min-w-0">
              <div className="text-xs font-medium text-white">Vercel Deploy</div>
              <div className="truncate text-[11px] text-white/50">{deployment.live_url || "Not deployed"}</div>
            </div>
            {deployment.live_url && <ExternalLink className="ml-auto h-3 w-3 text-white/30" />}
          </a>

          {/* Supabase */}
          <a
            href={deployment.supabase_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2.5 rounded-lg border border-white/10 bg-zinc-950 p-3 ${deployment.supabase_url ? "hover:border-lime-400/40" : "opacity-40 pointer-events-none"}`}
          >
            <Database className="h-4 w-4 text-lime-400" />
            <div className="min-w-0">
              <div className="text-xs font-medium text-white">Supabase DB</div>
              <div className="truncate text-[11px] text-white/50">{deployment.supabase_url || "Not needed"}</div>
            </div>
            {deployment.supabase_url && <ExternalLink className="ml-auto h-3 w-3 text-white/30" />}
          </a>

          {/* Google Drive */}
          <a
            href={deployment.drive_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2.5 rounded-lg border border-white/10 bg-zinc-950 p-3 ${deployment.drive_url ? "hover:border-lime-400/40" : "opacity-40 pointer-events-none"}`}
          >
            <CloudUpload className="h-4 w-4 text-lime-400" />
            <div className="min-w-0">
              <div className="text-xs font-medium text-white">Drive (Docs)</div>
              <div className="truncate text-[11px] text-white/50">{deployment.drive_url ? "Folder ready" : "Not uploaded"}</div>
            </div>
            {deployment.drive_url && <ExternalLink className="ml-auto h-3 w-3 text-white/30" />}
          </a>
        </div>

        {/* Generated docs list */}
        {deployment.docs_list?.length > 0 && (
          <div className="mt-3 rounded-lg border border-white/10 bg-zinc-950 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-white/70">
              <FileText className="h-3.5 w-3.5 text-lime-400" />
              Generated Documentation ({deployment.docs_list.length} files)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {deployment.docs_list.map((doc) => (
                <span key={doc} className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-mono text-white/50">
                  {doc}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

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