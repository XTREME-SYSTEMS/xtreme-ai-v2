import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, EmptyState, LoadingButton } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import { Sparkles, Globe, Palette, Type, FileText, ImageIcon, Search, ShieldCheck, Play, ArrowRight, Check, Loader2, Plus } from "lucide-react";
import { Image } from "@/components/ui/image";

const STEPS = [
  { key: "name", label: "Website Name", icon: Sparkles },
  { key: "url", label: "URL / Domain", icon: Globe },
  { key: "brand", label: "Brand Identity", icon: Palette },
  { key: "brand_review", label: "Brand Approval", icon: ShieldCheck, gate: true },
  { key: "logo", label: "Logo", icon: Type },
  { key: "content", label: "Content", icon: FileText },
  { key: "images", label: "Images", icon: ImageIcon },
  { key: "seo_aeo", label: "SEO + AEO", icon: Search },
  { key: "final_review", label: "Final Approval", icon: ShieldCheck, gate: true },
  { key: "complete", label: "Complete", icon: Check },
];

export default function WebsiteFactory() {
  const [projects, setProjects] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [seed, setSeed] = useState({ business_name: "", niche: "", audience: "" });
  const [approvals, setApprovals] = useState({});

  const load = async () => {
    const list = await base44.entities.WebsiteFactoryProject.list("-created_date", 50);
    setProjects(list);
    if (list.length && !active) setActive(list[0]);
    setLoading(false);
  };

  const loadApprovals = async (p) => {
    if (!p) return;
    const ids = [p.approval_id, p.final_approval_id].filter(Boolean);
    if (!ids.length) return;
    const all = await base44.entities.Approval.list("-created_date", 50);
    const map = {};
    all.forEach((a) => { if (ids.includes(a.id)) map[a.id] = a; });
    setApprovals(map);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (active) loadApprovals(active); }, [active]);

  const startProject = async () => {
    if (!seed.business_name) return;
    setBusy(true);
    try {
      const res = await base44.functions.invoke("runWebsiteFactory", { action: "start", ...seed });
      const id = res.data?.project_id;
      await load();
      if (id) { const p = (await base44.entities.WebsiteFactoryProject.list("-created_date", 50)).find((x) => x.id === id); setActive(p || null); }
    } catch (e) { console.error(e); }
    setBusy(false);
  };

  const continueProject = async (p) => {
    setBusy(true);
    try {
      await base44.functions.invoke("runWebsiteFactory", { action: "continue", project_id: p.id });
      await load();
      const fresh = (await base44.entities.WebsiteFactoryProject.list("-created_date", 50)).find((x) => x.id === p.id);
      setActive(fresh);
    } catch (e) { console.error(e); }
    setBusy(false);
  };

  const finalizeProject = async (p) => {
    setBusy(true);
    try {
      await base44.functions.invoke("runWebsiteFactory", { action: "finalize", project_id: p.id });
      await load();
      const fresh = (await base44.entities.WebsiteFactoryProject.list("-created_date", 50)).find((x) => x.id === p.id);
      setActive(fresh);
    } catch (e) { console.error(e); }
    setBusy(false);
  };

  const approvalStatus = (id) => approvals[id]?.status;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-lime-400" /></div>;

  return (
    <div>
      <PageHeader title="Website Factory" subtitle="Top-down AI website pipeline: name → URL → brand → logo → content → images → SEO/AEO. Each step feeds the next. Client gates at brand + final.">
        <LoadingButton onClick={load} variant="ghost"><ArrowRight className="h-4 w-4 rotate-90" /> Refresh</LoadingButton>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Panel title="Start New Website">
            <div className="space-y-2">
              <input value={seed.business_name} onChange={(e) => setSeed({ ...seed, business_name: e.target.value })} placeholder="Business / seed name" className="w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white" />
              <input value={seed.niche} onChange={(e) => setSeed({ ...seed, niche: e.target.value })} placeholder="Niche / industry" className="w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white" />
              <input value={seed.audience} onChange={(e) => setSeed({ ...seed, audience: e.target.value })} placeholder="Target audience" className="w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white" />
              <LoadingButton loading={busy} onClick={startProject} className="w-full justify-center"><Plus className="h-4 w-4" /> Generate Website</LoadingButton>
            </div>
          </Panel>

          <Panel title={`Projects (${projects.length})`}>
            {projects.length === 0 ? (
              <EmptyState icon={Sparkles} title="No projects yet" subtitle="Start your first website above." />
            ) : (
              <div className="space-y-1.5">
                {projects.map((p) => (
                  <button key={p.id} onClick={() => setActive(p)} className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${active?.id === p.id ? "border-lime-400/40 bg-lime-400/10" : "border-white/10 hover:bg-white/5"}`}>
                    <div className="truncate font-medium text-white">{p.website_name || p.business_name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge status={p.status} />
                      <span className="text-[10px] text-white/40">{p.current_step}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div>
          {!active ? (
            <EmptyState icon={Sparkles} title="No project selected" subtitle="Start a new website to see the pipeline." />
          ) : (
            <ProjectDetail project={active} approvalStatus={approvalStatus} busy={busy} onContinue={continueProject} onFinalize={finalizeProject} />
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectDetail({ project, approvalStatus, busy, onContinue, onFinalize }) {
  const completedUpTo = STEPS.findIndex((s) => s.key === project.current_step);
  const brandApproved = project.approval_id && approvalStatus(project.approval_id) === "approved";
  const finalApproved = project.final_approval_id && approvalStatus(project.final_approval_id) === "approved";
  const atBrandGate = project.current_step === "brand_review";
  const atFinalGate = project.current_step === "final_review";

  return (
    <div className="space-y-4">
      <Panel title="Pipeline">
        <div className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => {
            const done = i < completedUpTo || project.current_step === "complete";
            const current = i === completedUpTo && project.current_step !== "complete";
            const Icon = s.icon;
            return (
              <div key={s.key} className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${current ? "border-lime-400 bg-lime-400/10 text-lime-300" : done ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-white/10 text-white/40"}`}>
                <Icon className="h-3.5 w-3.5" />
                <span>{s.label}</span>
                {s.gate && <ShieldCheck className="h-3 w-3" />}
              </div>
            );
          })}
        </div>
        {project.logs?.length > 0 && (
          <div className="mt-3 space-y-1 rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-white/50">
            {project.logs.slice(-6).map((l, i) => <div key={i}>› {l}</div>)}
          </div>
        )}
      </Panel>

      {(atBrandGate || atFinalGate) && (
        <Panel title={atBrandGate ? "Brand Approval Gate" : "Final Approval Gate"}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <ShieldCheck className="h-4 w-4 text-lime-400" />
              {atBrandGate ? (brandApproved ? "Client approved the brand. Continue to build the site." : "Awaiting client approval on the client dashboard.") : (finalApproved ? "Client approved the final site. Finalize to complete." : "Awaiting client final approval on the client dashboard.")}
            </div>
            <div className="ml-auto flex gap-2">
              {atBrandGate && <LoadingButton loading={busy} onClick={() => onContinue(project)} disabled={!brandApproved}><Play className="h-4 w-4" /> Continue Build</LoadingButton>}
              {atFinalGate && <LoadingButton loading={busy} onClick={() => onFinalize(project)} disabled={!finalApproved}><Check className="h-4 w-4" /> Finalize</LoadingButton>}
            </div>
          </div>
        </Panel>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="1 · Website Name">
          <div className="text-lg font-semibold text-white">{project.website_name || "—"}</div>
          {project.name_options?.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{project.name_options.map((n) => <span key={n} className="rounded border border-white/10 px-2 py-0.5 text-xs text-white/50">{n}</span>)}</div>}
        </Panel>
        <Panel title="2 · URL / Domain">
          <div className="text-lg font-semibold text-lime-300">{project.domain || "—"}</div>
          {project.domain_options?.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{project.domain_options.map((d) => <span key={d} className="rounded border border-white/10 px-2 py-0.5 text-xs text-white/50">{d}</span>)}</div>}
        </Panel>
      </div>

      {project.brand?.tagline && (
        <Panel title="3 · Brand Identity">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 text-sm">
              <Field label="Tagline" value={project.brand.tagline} />
              <Field label="Positioning" value={project.brand.positioning} />
              <Field label="Promise" value={project.brand.promise} />
              <Field label="Voice" value={project.brand.voice} />
              <Field label="Colors" value={project.brand.colors} />
              <Field label="Typography" value={project.brand.typography} />
            </div>
            <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-white/60">{project.brand.logo_direction}</div>
          </div>
        </Panel>
      )}

      {project.logo_url && (
        <Panel title="4 · Logo">
          <div className="flex items-center gap-4">
            <Image src={project.logo_url} alt="logo" className="h-24 w-24 rounded-lg border border-white/10" fittingType="fit" />
            <p className="text-xs text-white/40">{project.logo_prompt}</p>
          </div>
        </Panel>
      )}

      {project.content?.hero_headline && (
        <Panel title="5 · Content">
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-base font-semibold text-white">{project.content.hero_headline}</div>
              <div className="text-white/60">{project.content.hero_subhead}</div>
            </div>
            {project.content.about && <p className="text-white/70">{project.content.about}</p>}
            {project.content.services?.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {project.content.services.map((s) => (
                  <div key={s.title} className="rounded-lg border border-white/10 bg-zinc-950 p-2.5">
                    <div className="font-medium text-white">{s.title}</div>
                    <div className="text-xs text-white/50">{s.description}</div>
                  </div>
                ))}
              </div>
            )}
            {project.content.faq?.length > 0 && (
              <div className="space-y-1.5">
                {project.content.faq.slice(0, 4).map((f, i) => (
                  <div key={i} className="rounded border border-white/10 bg-black/30 p-2 text-xs">
                    <div className="font-medium text-white">{f.question}</div>
                    <div className="text-white/50">{f.answer}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>
      )}

      {project.images?.length > 0 && (
        <Panel title="6 · Images">
          <div className="grid gap-3 sm:grid-cols-2">
            {project.images.map((img, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-white/10">
                <Image src={img.url} alt={img.type} className="h-40 w-full" fittingType="fill" />
                <div className="p-2 text-xs text-white/40 capitalize">{img.type}</div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {project.seo?.meta_title && (
        <Panel title="7 · SEO + AEO">
          <div className="space-y-2 text-sm">
            <Field label="Meta Title" value={project.seo.meta_title} />
            <Field label="Meta Description" value={project.seo.meta_description} />
            <Field label="Canonical" value={project.seo.canonical} />
            {project.aeo?.answer_summary && <Field label="AEO Answer Summary" value={project.aeo.answer_summary} />}
            {project.aeo?.citation_faq?.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {project.aeo.citation_faq.slice(0, 3).map((f, i) => (
                  <div key={i} className="rounded border border-lime-400/20 bg-lime-400/5 p-2 text-xs">
                    <div className="font-medium text-lime-200">{f.question}</div>
                    <div className="text-white/60">{f.answer}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</div>
      <div className="text-white/80">{value}</div>
    </div>
  );
}