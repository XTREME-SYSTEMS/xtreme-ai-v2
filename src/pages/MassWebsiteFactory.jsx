import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Layers, Rocket, Loader2, ArrowRight, Factory, CheckCircle2, Globe, RefreshCw } from "lucide-react";
import TemplateGallery from "@/components/massbuild/TemplateGallery";
import MassBuildConfig from "@/components/massbuild/MassBuildConfig";
import MassBuildReview from "@/components/massbuild/MassBuildReview";
import { WEBSITE_TEMPLATES, getTemplateById } from "@/lib/websiteTemplates";

export default function MassWebsiteFactory() {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deploying, setDeploying] = useState(false);

  // New project config
  const [config, setConfig] = useState({
    name: "",
    industry: "epoxy_flooring",
    template_id: "epoxy-elite",
    cities: [],
    website_names: [],
    name_strategy: "cartesian",
    background_color: "#0A0A0A",
    accent_color: "#C5A059",
    color_strategy: "fixed",
    tones: ["professional"],
    logo_count: 1,
    site_count_target: 5,
    auto_provision_vercel: false,
  });

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.MassBuildProject.list("-created_date", 50);
      setProjects(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadProjects(); }, []);

  const computeTotal = () => {
    const cities = config.cities.length || 1;
    const names = config.website_names.length || 1;
    if (config.name_strategy === "cartesian") return Math.min(cities * names, config.site_count_target);
    if (config.name_strategy === "paired") return Math.min(Math.max(cities, names), config.site_count_target);
    return Math.min(cities * names, config.site_count_target);
  };

  const createProject = async () => {
    if (!config.name.trim()) { alert("Enter a project name"); return; }
    if (!config.cities.length) { alert("Add at least one city"); return; }
    if (!config.website_names.length) { alert("Add at least one website name"); return; }

    setGenerating(true);
    try {
      // Create the project
      const total = computeTotal();
      const project = await base44.entities.MassBuildProject.create({
        ...config,
        total_sites: total,
        status: "queued",
      });

      // Generate site combinations
      const sites = [];
      if (config.name_strategy === "cartesian") {
        for (const city of config.cities) {
          for (const name of config.website_names) {
            if (sites.length >= total) break;
            sites.push({
              mass_build_id: project.id,
              city,
              website_name: name,
              template_id: config.template_id,
              industry: config.industry,
              background_color: config.background_color,
              accent_color: config.accent_color,
              tone: config.tones[sites.length % config.tones.length] || "professional",
              status: "pending",
              step: "logo",
            });
          }
          if (sites.length >= total) break;
        }
      } else if (config.name_strategy === "paired") {
        const max = Math.max(config.cities.length, config.website_names.length);
        for (let i = 0; i < max && sites.length < total; i++) {
          sites.push({
            mass_build_id: project.id,
            city: config.cities[i % config.cities.length],
            website_name: config.website_names[i % config.website_names.length],
            template_id: config.template_id,
            industry: config.industry,
            background_color: config.background_color,
            accent_color: config.accent_color,
            tone: config.tones[i % config.tones.length] || "professional",
            status: "pending",
            step: "logo",
          });
        }
      } else {
        for (const city of config.cities) {
          for (let i = 0; i < config.website_names.length && sites.length < total; i++) {
            sites.push({
              mass_build_id: project.id,
              city,
              website_name: config.website_names[i],
              template_id: config.template_id,
              industry: config.industry,
              background_color: config.background_color,
              accent_color: config.accent_color,
              tone: config.tones[sites.length % config.tones.length] || "professional",
              status: "pending",
              step: "logo",
            });
          }
        }
      }

      await base44.entities.MassBuildSite.bulkCreate(sites);

      // Trigger generation
      await base44.functions.invoke("generateMassWebsites", { mass_build_id: project.id });

      await loadProjects();
      setActiveProject(project.id);
    } catch (e) {
      console.error(e);
      alert("Failed to create project: " + (e?.message || e));
    }
    setGenerating(false);
  };

  const deployApproved = async (projectId) => {
    setDeploying(true);
    try {
      await base44.functions.invoke("provisionMassVercelSites", { mass_build_id: projectId });
      await loadProjects();
    } catch (e) {
      console.error(e);
      alert("Deploy failed: " + (e?.message || e));
    }
    setDeploying(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-400" /></div>;

  const active = projects.find((p) => p.id === activeProject);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Factory className="h-8 w-8 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Mass Website Factory</h1>
          <p className="text-sm text-white/50">Generate hundreds of websites from templates — bulk logos, content, and Vercel deployment</p>
        </div>
      </div>

      {/* Existing projects */}
      {projects.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-3">Active Batches</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveProject(p.id)}
                className={`text-left rounded-lg border p-3 transition-all ${activeProject === p.id ? "border-amber-400 bg-amber-400/10" : "border-white/10 bg-black hover:border-white/30"}`}
              >
                <div className="font-bold text-white text-sm truncate">{p.name}</div>
                <div className="text-xs text-white/40 mt-1">{p.total_sites} sites · {p.cities?.length || 0} cities</div>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-amber-400">{p.generated_count} gen</span>
                  <span className="text-green-400">{p.approved_count} approved</span>
                  <span className="text-blue-400">{p.deployed_count} deployed</span>
                </div>
                <div className="mt-2">
                  <StatusPill status={p.status} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {active ? (
        // ── Review mode for selected project ──
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{active.name}</h2>
              <p className="text-sm text-white/40">{active.total_sites} sites · template: {getTemplateById(active.template_id)?.name || active.template_id}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => loadProjects()} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 hover:bg-white/5">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
              <button onClick={() => deployApproved(active.id)} disabled={deploying} className="flex items-center gap-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 px-4 py-2 text-sm text-blue-400 font-bold hover:bg-blue-500/30 disabled:opacity-30">
                {deploying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                Deploy Approved to Vercel
              </button>
              <button onClick={() => setActiveProject(null)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 hover:bg-white/5">
                New Batch
              </button>
            </div>
          </div>
          <MassBuildReview project={active} onRefresh={loadProjects} />
        </div>
      ) : (
        // ── New batch configuration ──
        <>
          {/* Project name + industry */}
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Batch Name</label>
                <input value={config.name} onChange={(e) => setConfig({ ...config, name: e.target.value })} placeholder="e.g. Arizona Epoxy Rollout Q4" className="w-full rounded-lg bg-black border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-400 outline-none" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Industry</label>
                <select value={config.industry} onChange={(e) => setConfig({ ...config, industry: e.target.value })} className="w-full rounded-lg bg-black border border-white/10 px-3 py-2 text-sm text-white focus:border-amber-400 outline-none">
                  {[...new Set(WEBSITE_TEMPLATES.map((t) => t.industry))].map((ind) => <option key={ind} value={ind}>{ind.replace(/_/g, " ")}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Template selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="h-5 w-5 text-amber-400" />
              <h3 className="font-bold text-white">Choose a Template</h3>
              <span className="text-xs text-white/40">— ultra high quality, production-ready designs</span>
            </div>
            <TemplateGallery selectedId={config.template_id} onSelect={(id) => {
              const tpl = getTemplateById(id);
              setConfig({ ...config, template_id: id, industry: tpl.industry, background_color: tpl.default_colors.background, accent_color: tpl.default_colors.accent });
            }} />
          </div>

          {/* Configuration */}
          <MassBuildConfig config={config} onChange={setConfig} />

          {/* Summary + Generate */}
          <div className="sticky bottom-4 rounded-xl border border-amber-400/40 bg-zinc-900 p-5 shadow-lg">
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-sm">
                <div className="text-white/50">Batch Summary</div>
                <div className="font-bold text-white">
                  {computeTotal()} websites · {config.cities.length} cities × {config.website_names.length} names
                </div>
                <div className="text-xs text-white/40">
                  {config.tones.length} tone(s) · {config.logo_count} logo(s) per site · template: {getTemplateById(config.template_id)?.name}
                </div>
              </div>
              <button
                onClick={createProject}
                disabled={generating || !config.name || !config.cities.length || !config.website_names.length}
                className="ml-auto flex items-center gap-2 rounded-lg bg-amber-400 text-black px-6 py-3 font-bold text-sm hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />}
                {generating ? "Generating..." : "Generate All Sites"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    configuring: "text-white/40 bg-white/5",
    queued: "text-amber-400 bg-amber-400/10",
    generating: "text-amber-400 bg-amber-400/10",
    reviewing: "text-yellow-400 bg-yellow-400/10",
    deploying: "text-blue-400 bg-blue-400/10",
    complete: "text-green-400 bg-green-400/10",
    failed: "text-red-400 bg-red-400/10",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${map[status] || "text-white/40"}`}>{status}</span>;
}