import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAutoBuild } from "@/lib/AutoBuildContext";
import { getProductType } from "@/lib/buildProductTypes";
import BackButton from "@/components/client/BackButton";
import {
  Loader2, Database, RefreshCw, CheckCircle, ArrowRight, Zap,
  Key, Link2, GitBranch, ChevronDown, ChevronRight, Code2,
} from "lucide-react";

// DataModel — the second "system" step for web_app / ecommerce / platform
// builds. Takes the architecture spec and generates detailed entity schemas
// (fields, validation, indexes, relationships, seed data, API endpoints) via
// the generateDataModel backend function, displays them for review, and lets
// the admin approve to advance the pipeline.
export default function DataModel() {
  const autoBuild = useAutoBuild();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [approved, setApproved] = useState(false);
  const [expanded, setExpanded] = useState({});

  const build = autoBuild.build;
  const dataModel = build?.data_model;
  const architecture = build?.architecture;
  const productType = getProductType(build?.product_type);
  const TypeIcon = productType.icon;

  useEffect(() => {
    document.title = "Data Model · Auto Builder";
  }, []);

  const generate = async () => {
    if (!build) return;
    setGenerating(true);
    setError("");
    try {
      const res = await base44.functions.invoke("generateDataModel", {
        architecture,
        productType: build.product_type,
        businessName: build.business_name,
      });
      const spec = res?.data?.data || res?.data;
      if (!spec) throw new Error("No data model returned");
      await autoBuild.saveBuild({
        data_model: spec,
        current_step: "data_model",
        logs: [...(build.logs || []), `[${new Date().toISOString()}] Data model generated`],
      });
    } catch (e) {
      setError(e?.message || "Couldn't generate data model. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const approve = async () => {
    if (!build) return;
    setApproved(true);
    const visited = build.visited_steps || [];
    if (!visited.includes("/data-model")) visited.push("/data-model");
    await autoBuild.saveBuild({
      visited_steps: visited,
      logs: [...(build.logs || []), `[${new Date().toISOString()}] Data model approved`],
    });
    navigate("/system-review");
  };

  const toggle = (name) => setExpanded((p) => ({ ...p, [name]: !p[name] }));

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
        <BackButton to="/system-architecture" />
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-300">
          You need to generate the system architecture first before refining the data model.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <BackButton to="/system-architecture" />

      {/* Header */}
      <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/15">
            <TypeIcon className="h-5 w-5 text-lime-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-white">Data Model</h1>
            <p className="text-sm text-white/50">
              {productType.label} · {build.business_name}
            </p>
          </div>
          {dataModel && !generating && (
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
          <p className="text-sm text-white/60">Refining entity schemas, validation rules, and API endpoints…</p>
          <p className="text-xs text-white/30">This takes 15-30 seconds. The AI is designing detailed data models from your architecture.</p>
        </div>
      )}

      {error && !generating && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Generate button */}
      {!dataModel && !generating && !error && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-zinc-950 py-16">
          <Database className="h-10 w-10 text-lime-400/50" />
          <div className="text-center">
            <p className="text-sm font-medium text-white">Generate your data model</p>
            <p className="mt-1 text-xs text-white/40">The AI will refine the architecture into detailed entity schemas — fields, validation, indexes, relationships, seed data, and API endpoints.</p>
          </div>
          <button
            type="button"
            onClick={generate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-lime-300"
          >
            <Zap className="h-4 w-4" /> Generate Data Model
          </button>
        </div>
      )}

      {/* Data model display */}
      {dataModel && !generating && (
        <>
          {/* Entities */}
          {dataModel.entities?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Database className="h-4 w-4 text-lime-400" />
                <h2 className="text-sm font-semibold text-white">Entities ({dataModel.entities.length})</h2>
              </div>
              <div className="space-y-2">
                {dataModel.entities.map((entity, i) => {
                  const name = entity.name || `Entity ${i}`;
                  const isOpen = expanded[name] ?? true;
                  return (
                    <div key={i} className="rounded-lg border border-white/5 bg-black/40">
                      <button
                        type="button"
                        onClick={() => toggle(name)}
                        className="flex w-full items-center gap-2 p-3 text-left"
                      >
                        {isOpen ? <ChevronDown className="h-4 w-4 text-white/40" /> : <ChevronRight className="h-4 w-4 text-white/40" />}
                        <span className="text-sm font-medium text-white">{name}</span>
                        <span className="rounded-full bg-lime-400/10 px-2 py-0.5 text-[10px] text-lime-300">{entity.fields?.length || 0} fields</span>
                        {entity.timestamps && <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-white/40">timestamps</span>}
                      </button>
                      {isOpen && (
                        <div className="border-t border-white/5 px-3 pb-3 pt-2">
                          {entity.description && <p className="mb-2 text-xs text-white/50">{entity.description}</p>}
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-white/40">
                                  <th className="pb-1 pr-3 text-left font-normal">Field</th>
                                  <th className="pb-1 pr-3 text-left font-normal">Type</th>
                                  <th className="pb-1 pr-3 text-left font-normal">Req</th>
                                  <th className="pb-1 pr-3 text-left font-normal">Unique</th>
                                  <th className="pb-1 pr-3 text-left font-normal">Default</th>
                                  <th className="pb-1 pr-3 text-left font-normal">Validation</th>
                                  <th className="pb-1 text-left font-normal">Ref / Enum</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(entity.fields || []).map((f, j) => (
                                  <tr key={j} className="text-white/70">
                                    <td className="py-0.5 pr-3 font-mono text-lime-300">{f.name}</td>
                                    <td className="py-0.5 pr-3">{f.type}{f.index ? " 🗂" : ""}</td>
                                    <td className="py-0.5 pr-3">{f.required ? "✓" : ""}</td>
                                    <td className="py-0.5 pr-3">{f.unique ? "✓" : ""}</td>
                                    <td className="py-0.5 pr-3 text-white/50">{f.default || "—"}</td>
                                    <td className="py-0.5 pr-3 text-white/50">{f.validation || "—"}</td>
                                    <td className="py-0.5 text-white/50">
                                      {f.references && <span className="text-amber-300">→ {f.references}</span>}
                                      {f.enum_values && <span className="text-blue-300">{f.enum_values.join(" | ")}</span>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {entity.indexes?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {entity.indexes.map((idx, k) => (
                                <span key={k} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">
                                  🗂 {idx.fields?.join("+")}{idx.unique ? " (unique)" : ""}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Relationships */}
          {dataModel.relationships?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Link2 className="h-4 w-4 text-lime-400" />
                <h2 className="text-sm font-semibold text-white">Relationships ({dataModel.relationships.length})</h2>
              </div>
              <div className="space-y-1.5">
                {dataModel.relationships.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/40 p-2.5 text-xs">
                    <span className="font-mono text-lime-300">{r.from}</span>
                    <GitBranch className="h-3 w-3 text-white/30" />
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-white/50">{r.type}</span>
                    <GitBranch className="h-3 w-3 text-white/30" />
                    <span className="font-mono text-lime-300">{r.to}</span>
                    <span className="ml-auto text-white/40">fk: {r.foreign_key}</span>
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-white/40">{r.cascade}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API endpoints */}
          {dataModel.api_endpoints?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Code2 className="h-4 w-4 text-lime-400" />
                <h2 className="text-sm font-semibold text-white">API Endpoints ({dataModel.api_endpoints.length})</h2>
              </div>
              <div className="space-y-1">
                {dataModel.api_endpoints.map((ep, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/40 p-2.5 text-xs">
                    <span className={`rounded px-1.5 py-0.5 font-mono font-semibold ${
                      ep.method === "GET" ? "bg-blue-400/15 text-blue-300" :
                      ep.method === "POST" ? "bg-lime-400/15 text-lime-300" :
                      ep.method === "PUT" || ep.method === "PATCH" ? "bg-amber-400/15 text-amber-300" :
                      "bg-red-400/15 text-red-300"
                    }`}>{ep.method}</span>
                    <code className="text-white/80">{ep.path}</code>
                    <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-white/40">{ep.operation}</span>
                    {ep.auth_required && <Key className="h-3 w-3 text-amber-300" />}
                    <span className="ml-auto text-white/40">{ep.entity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seed data */}
          {dataModel.seed_data && Object.keys(dataModel.seed_data).length > 0 && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
              <div className="mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-lime-400" />
                <h2 className="text-sm font-semibold text-white">Seed Data</h2>
              </div>
              <div className="space-y-2">
                {Object.entries(dataModel.seed_data).map(([entityName, records]) => (
                  <div key={entityName}>
                    <div className="mb-1 text-xs font-medium text-white/60">{entityName} ({Array.isArray(records) ? records.length : 0})</div>
                    <pre className="overflow-x-auto rounded-lg border border-white/5 bg-black/40 p-2.5 text-[10px] text-white/50">
{JSON.stringify(records, null, 2).slice(0, 500)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approve */}
          <div className="flex items-center justify-between rounded-xl border border-lime-400/30 bg-lime-400/5 p-4">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <CheckCircle className="h-4 w-4 text-lime-400" />
              Review the data model above, then approve to continue.
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