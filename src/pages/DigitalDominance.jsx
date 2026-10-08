import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Globe, Rocket, Zap, Eye, Loader2, Sparkles, TrendingUp, Target,
  Shield, Factory, MapPin, CheckCircle, ArrowRight, Activity,
  Layers, Search, Bot, Server, AlertTriangle,
} from "lucide-react";

const SAMPLE_CITIES = [
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX",
  "Phoenix, AZ", "Philadelphia, PA", "San Antonio, TX", "San Diego, CA",
  "Dallas, TX", "San Jose, CA", "Austin, TX", "Jacksonville, FL",
  "Columbus, OH", "Charlotte, NC", "Indianapolis, IN", "Seattle, WA",
  "Denver, CO", "Boston, MA", "El Paso, TX", "Detroit, MI",
];

const GOOGLE_SPEC_FEATURES = [
  { icon: Search, label: "Core Web Vitals", desc: "LCP < 2.5s, FID < 100ms, CLS < 0.1" },
  { icon: Shield, label: "Schema Markup", desc: "JSON-LD structured data for rich snippets" },
  { icon: MapPin, label: "Local SEO", desc: "City-page targeting with NAP consistency" },
  { icon: Server, label: "Mobile-First", desc: "Responsive, AMP-ready, fast on 3G" },
  { icon: Bot, label: "AI-Readable", desc: "Semantic HTML, clean DOM, crawlable" },
  { icon: Layers, label: "Thin Content Free", desc: "Every page 800+ words, unique value" },
];

export default function DigitalDominance() {
  const navigate = useNavigate();
  const [simResult, setSimResult] = useState(null);
  const [massProjects, setMassProjects] = useState([]);
  const [webPacks, setWebPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState({
    name: "Digital Dominance — National Rollout",
    industry: "epoxy",
    cities: SAMPLE_CITIES.slice(0, 10).join("\n"),
    website_names: "Xtreme Epoxy",
    accent_color: "#0047FF",
    background_color: "#0A0A0A",
    tones: "professional,bold",
    auto_provision_vercel: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sims, projects, packs] = await Promise.all([
        base44.entities.SimulationResult.filter(
          { simulation_type: "digital_dominance", status: "complete" },
          { sort: "-created_date", limit: 1 }
        ),
        base44.entities.MassBuildProject.filter({}, { sort: "-created_date", limit: 5 }),
        base44.entities.WebPack.filter({}, { sort: "-created_date", limit: 5 }),
      ]);
      const simItems = sims?.items || sims || [];
      if (simItems.length > 0) setSimResult(simItems[0]);
      setMassProjects(projects?.items || projects || []);
      setWebPacks(packs?.items || packs || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const createMassDeployment = async () => {
    setCreating(true);
    try {
      const cities = config.cities.split("\n").map((c) => c.trim()).filter(Boolean);
      const names = config.website_names.split(",").map((n) => n.trim()).filter(Boolean);
      const tones = config.tones.split(",").map((t) => t.trim()).filter(Boolean);

      const project = await base44.entities.MassBuildProject.create({
        name: config.name,
        industry: config.industry,
        cities,
        website_names: names,
        name_strategy: "cartesian",
        background_color: config.background_color,
        accent_color: config.accent_color,
        color_strategy: "fixed",
        tones,
        logo_count: 1,
        auto_provision_vercel: config.auto_provision_vercel,
        status: "queued",
        total_sites: cities.length * names.length,
        current_step: "logos",
      });

      navigate("/mass-website-factory");
    } catch (e) {
      console.error("Failed to create mass deployment", e);
    } finally {
      setCreating(false);
    }
  };

  const fmtNum = (n) => {
    if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return Math.round(n).toLocaleString();
  };

  const totalDeployed = massProjects.reduce((sum, p) => sum + (p.deployed_count || 0), 0);
  const totalGenerated = massProjects.reduce((sum, p) => sum + (p.generated_count || 0), 0);
  const totalApproved = massProjects.reduce((sum, p) => sum + (p.approved_count || 0), 0);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Globe className="h-4 w-4" /> Digital Dominance System
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Programmatic Website Domination</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Generate hundreds to thousands of Google-spec-compliant websites in minutes — deployed across cities,
            states, and countries. Every site is built to Google's own recommendations: Core Web Vitals, schema
            markup, mobile-first, semantic HTML, and AI-readable content. Powered by your Vision → Strategy →
            Simulation pipeline.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setShowConfig(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Rocket className="h-4 w-4" /> Launch Mass Deployment
            </button>
            <button
              onClick={() => navigate("/simulation-lab")}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40"
            >
              <Activity className="h-4 w-4" /> Open Simulation Lab
            </button>
            <button
              onClick={() => navigate("/web-pack-queue")}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40"
            >
              <Eye className="h-4 w-4" /> ChatGPT Mockup Pipeline
            </button>
          </div>
        </div>
      </div>

      {/* Simulation connection */}
      {simResult?.summary && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <TrendingUp className="h-3.5 w-3.5" /> Connected to Your Latest Simulation
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <SimStat label="Sites Projected" value={fmtNum(simResult.summary.total_sites_projected || 0)} />
            <SimStat label="Monthly Traffic" value={fmtNum(simResult.summary.total_traffic_projected || 0)} />
            <SimStat label="Keywords Ranking" value={fmtNum(simResult.summary.total_keywords_projected || 0)} />
            <SimStat label="Domain Authority" value={`${simResult.summary.avg_domain_authority_projected || 0}`} />
            <SimStat label="Market Share" value={`${simResult.summary.market_share_projected || 0}%`} />
            <SimStat label="Expected Revenue" value={`$${fmtNum(simResult.summary.expected_revenue_12m || 0)}`} />
          </div>
        </div>
      )}

      {/* Google Spec compliance */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Shield className="h-4 w-4" /> Google-Spec Compliance — Every Site Built to Google's Recommendations
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GOOGLE_SPEC_FEATURES.map((f, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{f.label}</div>
                <div className="text-xs text-muted-foreground">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deployment stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Factory} label="Total Sites Generated" value={fmtNum(totalGenerated)} sub="across all batches" />
        <StatCard icon={CheckCircle} label="Approved & Deployed" value={fmtNum(totalDeployed)} sub="live on Vercel" />
        <StatCard icon={Eye} label="Mockup Pipelines" value={webPacks.length} sub="ChatGPT → website" />
      </div>

      {/* Mass deployment projects */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Layers className="h-4 w-4" /> Mass Deployment Batches
          </div>
          <button
            onClick={() => navigate("/mass-website-factory")}
            className="text-xs text-primary hover:underline"
          >
            View all →
          </button>
        </div>
        {massProjects.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-border p-8 text-center">
            <Factory className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">No mass deployments yet. Launch your first batch above.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {massProjects.map((p) => (
              <div key={p.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.cities?.length || 0} cities · {p.total_sites || 0} sites · {p.industry}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Badge label="Generated" value={p.generated_count || 0} />
                    <Badge label="Approved" value={p.approved_count || 0} />
                    <Badge label="Deployed" value={p.deployed_count || 0} />
                  </div>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    p.status === "complete" ? "bg-primary/20 text-primary" :
                    p.status === "generating" ? "bg-yellow-500/20 text-yellow-500" :
                    "bg-muted text-muted-foreground"
                  }`}>{p.status}</span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${p.total_sites ? ((p.deployed_count || 0) / p.total_sites) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ChatGPT Mockup Pipeline */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Zap className="h-4 w-4" /> ChatGPT Mockup → Perfect Website Pipeline
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a ChatGPT-generated design mockup — the vision AI reads it and generates pixel-perfect HTML/CSS
          that reproduces the design exactly, then deploys it as a live website in seconds.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <PipelineStep icon={Bot} label="ChatGPT creates mockup" />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <PipelineStep icon={Eye} label="Vision AI reads design" />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <PipelineStep icon={Zap} label="HTML generated" />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <PipelineStep icon={Rocket} label="Deployed live" />
        </div>
        {webPacks.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {webPacks.slice(0, 3).map((wp) => (
              <div key={wp.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-2.5">
                <Eye className="h-4 w-4 text-primary/60" />
                <span className="flex-1 text-xs font-medium text-foreground">{wp.name}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                  wp.status === "deployed" ? "bg-primary/20 text-primary" :
                  wp.status === "failed" ? "bg-destructive/20 text-destructive" :
                  "bg-muted text-muted-foreground"
                }`}>{wp.status}</span>
                {wp.vercel_url && (
                  <a href={wp.vercel_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                    View live →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => navigate("/web-pack-queue")}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/40"
        >
          <Eye className="h-4 w-4" /> Open Web Pack Queue
        </button>
      </div>

      {/* Config modal */}
      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
              <Rocket className="h-5 w-5 text-primary" />
              <h2 className="flex-1 text-sm font-semibold text-foreground">Launch Mass Deployment</h2>
              <button onClick={() => setShowConfig(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <Field label="Project Name">
                <input value={config.name} onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
              </Field>
              <Field label="Industry">
                <input value={config.industry} onChange={(e) => setConfig({ ...config, industry: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
              </Field>
              <Field label="Cities (one per line)">
                <textarea value={config.cities} onChange={(e) => setConfig({ ...config, cities: e.target.value })} rows={6}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
              </Field>
              <Field label="Website Names (comma-separated)">
                <input value={config.website_names} onChange={(e) => setConfig({ ...config, website_names: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Accent Color">
                  <input type="color" value={config.accent_color} onChange={(e) => setConfig({ ...config, accent_color: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
                </Field>
                <Field label="Background Color">
                  <input type="color" value={config.background_color} onChange={(e) => setConfig({ ...config, background_color: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
                </Field>
              </div>
              <Field label="Content Tones (comma-separated)">
                <input value={config.tones} onChange={(e) => setConfig({ ...config, tones: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
              </Field>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={config.auto_provision_vercel} onChange={(e) => setConfig({ ...config, auto_provision_vercel: e.target.checked })}
                  className="rounded border-border" />
                Auto-deploy approved sites to Vercel
              </label>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                <Target className="inline h-3 w-3 mr-1 text-primary" />
                This will create <strong className="text-foreground">{config.cities.split("\n").filter(c => c.trim()).length}</strong> cities ×
                <strong className="text-foreground"> {config.website_names.split(",").filter(n => n.trim()).length}</strong> names =
                <strong className="text-primary"> {config.cities.split("\n").filter(c => c.trim()).length * config.website_names.split(",").filter(n => n.trim()).length}</strong> sites
              </div>
            </div>
            <div className="flex gap-2 border-t border-border p-4">
              <button onClick={createMassDeployment} disabled={creating}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                {creating ? "Creating…" : "Launch Deployment"}
              </button>
              <button onClick={() => setShowConfig(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SimStat({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-background p-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-bold text-primary">{value}</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground/70">{sub}</div>
    </div>
  );
}

function Badge({ label, value }) {
  return (
    <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      {label}: <strong className="text-foreground">{value}</strong>
    </span>
  );
}

function PipelineStep({ icon: Icon, label }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="text-[10px] font-medium text-muted-foreground text-center">{label}</span>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}