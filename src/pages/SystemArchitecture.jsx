import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAutoBuild } from "@/lib/AutoBuildContext";
import { getProductType } from "@/lib/buildProductTypes";
import BackButton from "@/components/client/BackButton";
import { useSystemBuildStep } from "@/hooks/useSystemBuildStep";
import {
  Loader2, Cpu, RefreshCw, CheckCircle, ArrowRight, Layers,
  Database, Layout, Plug, Route, Zap, FileText, Clock,
} from "lucide-react";

// System Architecture — the first "system" step for web_app / ecommerce /
// platform builds. Generates a complete architecture spec (tech stack,
// pages, data models, features, integrations) via the
// generateSystemArchitecture backend function, displays it for review,
// and lets the admin approve it to advance the pipeline.
export default function SystemArchitecture() {
  const autoBuild = useAutoBuild();
  const navigate = useNavigate();
  const { generating, error, approved, validationErrors, warnings, attempt, generate: runGenerate, approve: runApprove } = useSystemBuildStep("generateSystemArchitecture", "architecture", "architecture");

  const build = autoBuild.build;
  const architecture = build?.architecture;
  const productType = getProductType(build?.product_type);
  const TypeIcon = productType.icon;

  useEffect(() => {
    document.title = "System Architecture · Auto Builder";
  }, []);

  const generate = () => runGenerate({
    productType: build.product_type,
    businessName: build.business_name,
    industry: build.industry,
    profile: build.profile,
  });

  const approve = () => runApprove("/system-architecture", "/data-model", navigate);

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

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <BackButton to="/business-profile" />

      {/* Header */}
      <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/15">
            <TypeIcon className="h-5 w-5 text-lime-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-white">System Architecture</h1>
            <p className="text-sm text-white/50">
              {productType.label} · {build.business_name}
            </p>
          </div>
          {architecture && !generating && (
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

      {/* Generating or error state */}
      {generating && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-zinc-950 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
          <p className="text-sm text-white/60">Designing your {productType.label.toLowerCase()} architecture…</p>
          <p className="text-xs text-white/30">This takes 15-30 seconds. The AI is planning pages, data models, features, and integrations.{attempt > 1 ? ` (retry ${attempt}/3)` : ""}</p>
        </div>
      )}

      {error && !generating && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {validationErrors.length > 0 && !generating && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
          <p className="mb-1 text-sm font-semibold text-amber-300">Spec Validation Issues:</p>
          <ul className="space-y-0.5 text-xs text-amber-200/80">
            {validationErrors.map((err, i) => <li key={i}>• {err}</li>)}
          </ul>
        </div>
      )}

      {warnings.length > 0 && !generating && (
        <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-3">
          <p className="mb-1 text-xs font-semibold text-blue-300">Warnings:</p>
          <ul className="space-y-0.5 text-[11px] text-blue-200/70">
            {warnings.map((w, i) => <li key={i}>• {w}</li>)}
          </ul>
        </div>
      )}

      {/* Generate button (no architecture yet) */}
      {!architecture && !generating && !error && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-zinc-950 py-16">
          <Cpu className="h-10 w-10 text-lime-400/50" />
          <div className="text-center">
            <p className="text-sm font-medium text-white">Generate your system architecture</p>
            <p className="mt-1 text-xs text-white/40">The AI will design a complete blueprint — tech stack, pages, data models, features, and integrations — for your {productType.label.toLowerCase()}.</p>
          </div>
          <button
            type="button"
            onClick={generate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-lime-300"
          >
            <Zap className="h-4 w-4" /> Generate Architecture
          </button>
        </div>
      )}

      {/* Architecture spec display */}
      {architecture && !generating && (
        <>
          {/* Concept + summary */}
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-lime-400" />
              <h2 className="text-sm font-semibold text-white">Concept</h2>
            </div>
            <p className="text-sm font-medium text-lime-300">{architecture.concept}</p>
            {architecture.summary && (
              <p className="mt-2 text-sm text-white/60">{architecture.summary}</p>
            )}
          </div>

          {/* Tech stack */}
          {architecture.tech_stack && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-lime-400" />
                <h2 className="text-sm font-semibold text-white">Tech Stack</h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(architecture.tech_stack).filter(([, v]) => v).map(([key, val]) => (
                  <div key={key} className="rounded-lg border border-white/5 bg-black/40 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{key}</div>
                    <div className="mt-0.5 text-sm text-white/80">{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pages */}
          {architecture.pages?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Route className="h-4 w-4 text-lime-400" />
                <h2 className="text-sm font-semibold text-white">Pages ({architecture.pages.length})</h2>
              </div>
              <div className="space-y-2">
                {architecture.pages.map((p, i) => (
                  <div key={i} className="rounded-lg border border-white/5 bg-black/40 p-3">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-lime-400/10 px-1.5 py-0.5 text-xs text-lime-300">{p.route}</code>
                      <span className="text-sm font-medium text-white">{p.name}</span>
                      {p.auth && <span className="rounded-full border border-amber-400/30 px-1.5 py-0.5 text-[9px] text-amber-300">AUTH</span>}
                    </div>
                    <p className="mt-1 text-xs text-white/50">{p.purpose}</p>
                    {p.components?.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {p.components.map((c, j) => (
                          <span key={j} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data models */}
          {architecture.data_models?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Database className="h-4 w-4 text-lime-400" />
                <h2 className="text-sm font-semibold text-white">Data Models ({architecture.data_models.length})</h2>
              </div>
              <div className="space-y-2">
                {architecture.data_models.map((m, i) => (
                  <div key={i} className="rounded-lg border border-white/5 bg-black/40 p-3">
                    <div className="text-sm font-medium text-white">{m.name}</div>
                    {m.description && <p className="mt-0.5 text-xs text-white/40">{m.description}</p>}
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-white/40">
                            <th className="pb-1 pr-3 text-left font-normal">Field</th>
                            <th className="pb-1 pr-3 text-left font-normal">Type</th>
                            <th className="pb-1 pr-3 text-left font-normal">Req</th>
                            <th className="pb-1 text-left font-normal">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(m.fields || []).map((f, j) => (
                            <tr key={j} className="text-white/70">
                              <td className="py-0.5 pr-3 font-mono text-lime-300">{f.name}</td>
                              <td className="py-0.5 pr-3">{f.type}{f.references ? ` → ${f.references}` : ""}</td>
                              <td className="py-0.5 pr-3">{f.required ? "✓" : ""}</td>
                              <td className="py-0.5 text-white/50">{f.description || ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {architecture.features?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-lime-400" />
                <h2 className="text-sm font-semibold text-white">Features ({architecture.features.length})</h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {architecture.features.map((f, i) => (
                  <div key={i} className="rounded-lg border border-white/5 bg-black/40 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{f.name}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                        f.priority === "must" ? "bg-lime-400/15 text-lime-300" :
                        f.priority === "should" ? "bg-amber-400/15 text-amber-300" :
                        "bg-white/5 text-white/40"
                      }`}>{f.priority}</span>
                      <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-white/40">{f.complexity}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/50">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integrations */}
          {architecture.integrations?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Plug className="h-4 w-4 text-lime-400" />
                <h2 className="text-sm font-semibold text-white">Integrations ({architecture.integrations.length})</h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {architecture.integrations.map((it, i) => (
                  <div key={i} className="rounded-lg border border-white/5 bg-black/40 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{it.name}</span>
                      <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-white/40">{it.type}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/50">{it.purpose}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User flows + tech decisions */}
          {(architecture.user_flows?.length > 0 || architecture.tech_decisions?.length > 0) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {architecture.user_flows?.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
                  <h2 className="mb-2 text-sm font-semibold text-white">User Flows</h2>
                  <ul className="space-y-1.5">
                    {architecture.user_flows.map((f, i) => (
                      <li key={i} className="text-xs text-white/60">{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              {architecture.tech_decisions?.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
                  <h2 className="mb-2 text-sm font-semibold text-white">Tech Decisions</h2>
                  <ul className="space-y-1.5">
                    {architecture.tech_decisions.map((d, i) => (
                      <li key={i} className="text-xs text-white/60">{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Effort estimate */}
          {architecture.estimated_effort && (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950 p-4 text-sm text-white/60">
              <Clock className="h-4 w-4 text-lime-400" />
              <span className="font-semibold text-white/80">Estimated effort:</span> {architecture.estimated_effort}
            </div>
          )}

          {/* Approve */}
          <div className="flex items-center justify-between rounded-xl border border-lime-400/30 bg-lime-400/5 p-4">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <CheckCircle className="h-4 w-4 text-lime-400" />
              Review the architecture above, then approve to continue.
            </div>
            <button
              type="button"
              onClick={approve}
              disabled={approved}
              className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
            >
              {approved ? <CheckCircle className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              {approved ? "Approved" : "Approve & Continue"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}