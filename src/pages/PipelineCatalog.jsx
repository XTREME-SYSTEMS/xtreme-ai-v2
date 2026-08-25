import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAutoBuild } from "@/lib/AutoBuildContext";
import {
  Package, LayoutTemplate, Wrench, Loader2, ArrowRight, Sparkles,
  CheckCircle, Tag, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCT_TYPE_OPTIONS } from "@/lib/buildProductTypes";

// Pipeline Catalog — the first stop in the pipeline. Browse pre-existing
// packages, templates, and tools. Pick one to instantly create an AutoBuild
// and enter the guided pipeline with the relevant data pre-loaded.
export default function PipelineCatalog() {
  const [tab, setTab] = useState("packages");
  const [packages, setPackages] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(null);
  const [productType, setProductType] = useState("marketing_site");
  const [businessName, setBusinessName] = useState("");
  const navigate = useNavigate();
  const autoBuild = useAutoBuild();

  const load = useCallback(async () => {
    try {
      const [pkgs, tmpls, svcs] = await Promise.all([
        base44.entities.ServiceCatalogEntry.filter({ active: true }, "name", 100),
        base44.entities.TemplateLibrary.filter({ status: "active" }, "name", 100),
        base44.entities.PromptLibrary.filter({ status: "active" }, "name", 100),
      ]);
      setPackages((pkgs || []).filter((p) => p.category === "package" || p.category === "web-pack" || p.category === "app-pack"));
      setTemplates(tmpls || []);
      setTools(svcs || []);
    } catch {
      setPackages([]); setTemplates([]); setTools([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const launchFromPackage = async (pkg) => {
    setLaunching(pkg.id);
    try {
      const created = await base44.entities.AutoBuild.create({
        business_name: businessName.trim() || pkg.name,
        industry: pkg.organizational_metadata?.tags?.[0] || "",
        product_type: productType,
        current_step: "profile",
        status: "queued",
        visited_steps: [],
        logs: [`[${new Date().toISOString()}] Build created from package: ${pkg.name}`],
      });
      autoBuild.setActiveBuildId(created.id);
      navigate("/my-package");
    } catch {
      setLaunching(null);
    }
  };

  const launchFromTemplate = async (tmpl) => {
    setLaunching(tmpl.id);
    try {
      const created = await base44.entities.AutoBuild.create({
        business_name: businessName.trim() || tmpl.name,
        industry: tmpl.niche !== "general" ? tmpl.niche : "",
        product_type: productType,
        current_step: "profile",
        status: "queued",
        visited_steps: [],
        logs: [`[${new Date().toISOString()}] Build created from template: ${tmpl.name}`],
      });
      autoBuild.setActiveBuildId(created.id);
      navigate("/my-package");
    } catch {
      setLaunching(null);
    }
  };

  const TABS = [
    { key: "packages", label: "Packages", icon: Package, count: packages.length },
    { key: "templates", label: "Templates", icon: LayoutTemplate, count: templates.length },
    { key: "tools", label: "Tools & Prompts", icon: Wrench, count: tools.length },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/15">
            <Layers className="h-5 w-5 text-lime-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Pipeline Catalog</h1>
            <p className="text-sm text-white/50">
              Browse pre-existing packages, templates, and tools. Pick one to instantly start the pipeline with a build pre-loaded.
            </p>
          </div>
        </div>
      </div>

      {/* Quick-start bar — business name + product type */}
      <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-lime-400">Quick Start</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Business name (optional — defaults to package/template name)…"
            className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            {PRODUCT_TYPE_OPTIONS.map((pt) => {
              const Icon = pt.icon;
              const active = productType === pt.value;
              return (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setProductType(pt.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                    active ? "border-lime-400 bg-lime-400/10 text-lime-300" : "border-white/15 text-white/50 hover:border-white/30"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {pt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/10 bg-zinc-950 p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                tab === t.key ? "bg-lime-400/10 text-lime-300" : "text-white/50 hover:text-white/80"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-white/30" />
        </div>
      ) : tab === "packages" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {packages.length === 0 ? (
            <div className="col-span-full rounded-xl border border-white/10 bg-zinc-950 p-8 text-center text-sm text-white/40">
              No packages found. Seed the service catalog to populate this list.
            </div>
          ) : (
            packages.map((pkg) => (
              <div
                key={pkg.id}
                className="group flex flex-col rounded-xl border border-white/10 bg-zinc-950 p-4 transition-colors hover:border-lime-400/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime-400/10">
                    <Package className="h-4.5 w-4.5 text-lime-400" />
                  </div>
                  {pkg.price_label && (
                    <span className="rounded-full bg-lime-400/10 px-2 py-0.5 text-xs font-bold text-lime-300">{pkg.price_label}</span>
                  )}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-white">{pkg.name}</h3>
                {pkg.tagline && <p className="mt-1 text-xs leading-relaxed text-white/50">{pkg.tagline}</p>}
                {pkg.deliverables && pkg.deliverables.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {pkg.deliverables.slice(0, 4).map((d, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-[11px] text-white/40">
                        <CheckCircle className="h-3 w-3 shrink-0 text-lime-400/60" />
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => launchFromPackage(pkg)}
                  disabled={launching === pkg.id}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
                >
                  {launching === pkg.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  {launching === pkg.id ? "Starting…" : "Start Pipeline"}
                </button>
              </div>
            ))
          )}
        </div>
      ) : tab === "templates" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.length === 0 ? (
            <div className="col-span-full rounded-xl border border-white/10 bg-zinc-950 p-8 text-center text-sm text-white/40">
              No templates found. Seed the template library to populate this list.
            </div>
          ) : (
            templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="group flex flex-col rounded-xl border border-white/10 bg-zinc-950 p-4 transition-colors hover:border-lime-400/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime-400/10">
                    <LayoutTemplate className="h-4.5 w-4.5 text-lime-400" />
                  </div>
                  {tmpl.quality_score > 0 && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60">★ {tmpl.quality_score}</span>
                  )}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-white">{tmpl.name}</h3>
                {tmpl.niche && tmpl.niche !== "general" && (
                  <span className="mt-1 inline-flex w-fit items-center gap-1 rounded bg-lime-400/10 px-1.5 py-0.5 text-[10px] font-medium text-lime-300">
                    <Tag className="h-2.5 w-2.5" /> {tmpl.niche}
                  </span>
                )}
                {tmpl.layout_style && <p className="mt-2 text-xs leading-relaxed text-white/50">{tmpl.layout_style}</p>}
                {tmpl.sections && tmpl.sections.length > 0 && (
                  <p className="mt-2 text-[11px] text-white/40">{tmpl.sections.length} sections · {tmpl.sections.map(s => s.name).slice(0, 3).join(", ")}…</p>
                )}
                <button
                  type="button"
                  onClick={() => launchFromTemplate(tmpl)}
                  disabled={launching === tmpl.id}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
                >
                  {launching === tmpl.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  {launching === tmpl.id ? "Starting…" : "Start Pipeline"}
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.length === 0 ? (
            <div className="col-span-full rounded-xl border border-white/10 bg-zinc-950 p-8 text-center text-sm text-white/40">
              No tools or prompts found. Seed the prompt library to populate this list.
            </div>
          ) : (
            tools.map((tool) => (
              <div
                key={tool.id}
                className="group flex flex-col rounded-xl border border-white/10 bg-zinc-950 p-4 transition-colors hover:border-lime-400/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime-400/10">
                    <Wrench className="h-4.5 w-4.5 text-lime-400" />
                  </div>
                  {tool.quality_tier && (
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      tool.quality_tier === "ultra" ? "bg-lime-400/20 text-lime-300" : "bg-white/10 text-white/60"
                    )}>{tool.quality_tier}</span>
                  )}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-white">{tool.name}</h3>
                <span className="mt-1 inline-flex w-fit items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/60">
                  <Sparkles className="h-2.5 w-2.5" /> {tool.step}
                </span>
                {tool.niche && tool.niche !== "general" && (
                  <span className="mt-1 text-[11px] text-white/40">Niche: {tool.niche}</span>
                )}
                {tool.notes && <p className="mt-2 text-xs leading-relaxed text-white/50 line-clamp-2">{tool.notes}</p>}
                <div className="mt-4 text-[11px] text-white/30">
                  Used automatically by the pipeline at the <span className="text-white/50">{tool.step}</span> step.
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}