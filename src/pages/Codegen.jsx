import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAutoBuild } from "@/lib/AutoBuildContext";
import { getProductType } from "@/lib/buildProductTypes";
import BackButton from "@/components/client/BackButton";
import {
  Loader2, Code, RefreshCw, CheckCircle, ArrowRight, Zap,
  FileCode, FolderTree, Terminal, GitBranch,
} from "lucide-react";

// Codegen — the fourth "system" step for web_app / ecommerce / platform
// builds. Generates a codebase manifest (file list, build steps, estimated
// LOC) via the generateCodeManifest backend function, displays it for
// review, and lets the admin approve to advance to the deploy step.
export default function Codegen() {
  const autoBuild = useAutoBuild();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [approved, setApproved] = useState(false);
  const [filter, setFilter] = useState("all");

  const build = autoBuild.build;
  const codeManifest = build?.code_manifest;
  const architecture = build?.architecture;
  const dataModel = build?.data_model;
  const uiSystem = build?.ui_system;
  const productType = getProductType(build?.product_type);
  const TypeIcon = productType.icon;

  useEffect(() => {
    document.title = "Codegen · Auto Builder";
  }, []);

  const generate = async () => {
    if (!build) return;
    setGenerating(true);
    setError("");
    try {
      const res = await base44.functions.invoke("generateCodeManifest", {
        architecture,
        dataModel,
        uiSystem,
        productType: build.product_type,
        businessName: build.business_name,
      });
      const spec = res?.data?.data || res?.data;
      if (!spec) throw new Error("No code manifest returned");
      await autoBuild.saveBuild({
        code_manifest: spec,
        current_step: "codegen",
        logs: [...(build.logs || []), `[${new Date().toISOString()}] Code manifest generated — ${spec.files?.length || 0} files`],
      });
    } catch (e) {
      setError(e?.message || "Couldn't generate code manifest. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const approve = async () => {
    if (!build) return;
    setApproved(true);
    const visited = build.visited_steps || [];
    if (!visited.includes("/codegen")) visited.push("/codegen");
    await autoBuild.saveBuild({
      visited_steps: visited,
      logs: [...(build.logs || []), `[${new Date().toISOString()}] Code manifest approved`],
    });
    navigate("/deploy");
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

  if (!architecture) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <BackButton to="/ui-system" />
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-300">
          You need to generate the system architecture first before generating the code manifest.
        </div>
      </div>
    );
  }

  const files = codeManifest?.files || [];
  const categories = ["all", ...new Set(files.map((f) => f.category))];
  const filteredFiles = filter === "all" ? files : files.filter((f) => f.category === filter);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <BackButton to="/ui-system" />

      {/* Header */}
      <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/15">
            <TypeIcon className="h-5 w-5 text-lime-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-white">Code Generation</h1>
            <p className="text-sm text-white/50">{productType.label} · {build.business_name}</p>
          </div>
          {codeManifest && !generating && (
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
          <p className="text-sm text-white/60">Generating codebase manifest…</p>
          <p className="text-xs text-white/30">This takes 30-60 seconds. The AI is mapping every file, route, and component.</p>
        </div>
      )}

      {error && !generating && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-300">{error}</div>
      )}

      {/* Generate button */}
      {!codeManifest && !generating && !error && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-zinc-950 py-16">
          <Code className="h-10 w-10 text-lime-400/50" />
          <div className="text-center">
            <p className="text-sm font-medium text-white">Generate your codebase manifest</p>
            <p className="mt-1 text-xs text-white/40">The AI will map every file — pages, components, hooks, API routes, configs, tests — with implementation notes and dependencies.</p>
          </div>
          <button type="button" onClick={generate} className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-lime-300">
            <Zap className="h-4 w-4" /> Generate Code Manifest
          </button>
        </div>
      )}

      {/* Code manifest display */}
      {codeManifest && !generating && (
        <>
          {/* Overview */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-center">
              <FileCode className="mx-auto h-5 w-5 text-lime-400" />
              <div className="mt-1.5 text-2xl font-bold text-white">{files.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/40">Files</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-center">
              <Terminal className="mx-auto h-5 w-5 text-lime-400" />
              <div className="mt-1.5 text-2xl font-bold text-white">{codeManifest.estimated_loc?.toLocaleString() || "—"}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/40">Est. LOC</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-center">
              <GitBranch className="mx-auto h-5 w-5 text-lime-400" />
              <div className="mt-1.5 truncate text-sm font-bold text-white">{codeManifest.framework || "—"}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/40">Framework</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-center">
              <FolderTree className="mx-auto h-5 w-5 text-lime-400" />
              <div className="mt-1.5 truncate text-sm font-bold text-white">{codeManifest.repo_name || "—"}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/40">Repo Name</div>
            </div>
          </div>

          {/* Build steps */}
          {codeManifest.build_steps?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-lime-400" />
                <h2 className="text-sm font-semibold text-white">Build Steps</h2>
              </div>
              <div className="space-y-1">
                {codeManifest.build_steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-400/15 font-mono text-[10px] text-lime-300">{i + 1}</span>
                    <code className="text-white/70">{step}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File manifest */}
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
            <div className="mb-3 flex items-center gap-2">
              <FileCode className="h-4 w-4 text-lime-400" />
              <h2 className="text-sm font-semibold text-white">File Manifest ({files.length})</h2>
            </div>

            {/* Category filter */}
            {categories.length > 2 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilter(cat)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      filter === cat
                        ? "bg-lime-400/15 text-lime-300"
                        : "bg-white/5 text-white/40 hover:text-white/70"
                    }`}
                  >
                    {cat === "all" ? "All" : cat}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              {filteredFiles.map((file, i) => (
                <div key={i} className="rounded-lg border border-white/5 bg-black/40 p-3">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-medium text-lime-300">{file.path}</code>
                    <span className="ml-auto rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] uppercase text-white/40">{file.category}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/50">{file.description}</p>
                  {file.key_content && (
                    <p className="mt-1 text-[11px] text-white/30">{file.key_content}</p>
                  )}
                  {file.depends_on?.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <span className="text-[9px] text-white/30">imports:</span>
                      {file.depends_on.map((dep, j) => (
                        <code key={j} className="text-[9px] text-white/40">{dep}</code>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Approve */}
          <div className="flex items-center justify-between rounded-xl border border-lime-400/30 bg-lime-400/5 p-4">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <CheckCircle className="h-4 w-4 text-lime-400" />
              Review the code manifest above, then approve to continue.
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