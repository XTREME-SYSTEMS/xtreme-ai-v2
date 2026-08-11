import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import ScoreBar from "@/components/ScoreBar";
import { Image } from "@/components/ui/image";
import { Copy, Globe, Sparkles, Rocket, RefreshCw, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";

const STEPS = [
  { key: "scraping", label: "Scrape Target" },
  { key: "analyzing", label: "Identify Legal Changes" },
  { key: "recommending", label: "20 Name + Domain Options" },
  { key: "rebranding", label: "Rebrand Content" },
  { key: "provisioning", label: "Provision Drive/Git/Supabase/Vercel" },
  { key: "branding", label: "Generate Logos" },
  { key: "imaging", label: "Generate Images" },
  { key: "seo", label: "SEO + GSC + Rank Engine" },
  { key: "monetizing", label: "Monetization Options" },
  { key: "social", label: "Social Media Automation" },
  { key: "validating", label: "Validate + Audit" },
];

export default function CloneStudio() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ target_url: "", industry: "", business_name: "" });
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.CloneProject.list('-created_date', 50);
      setProjects(list);
    } catch { setProjects([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadDetail = async (id) => {
    setDetailLoading(true); setSelected(id);
    try { setDetail(await base44.entities.CloneProject.get(id)); } catch { setDetail(null); }
    setDetailLoading(false);
  };

  const launchClone = async () => {
    if (!form.target_url) return;
    setRunning('create');
    try {
      const res = await base44.functions.invoke('cloneAndLaunch', {
        target_url: form.target_url, industry: form.industry, business_name: form.business_name, auto_proceed: true
      });
      await load();
      setShowCreate(false);
      setForm({ target_url: "", industry: "", business_name: "" });
      if (res?.data?.project_id) loadDetail(res.data.project_id);
    } catch (e) { alert(e.message); }
    setRunning(null);
  };

  const resumeProject = async (id) => {
    setRunning(id);
    try {
      await base44.functions.invoke('cloneAndLaunch', { project_id: id });
      await load();
      if (selected === id) await loadDetail(id);
    } catch (e) { alert(e.message); }
    setRunning(null);
  };

  const active = selected ? projects.find(p => p.id === selected) : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Clone Studio" subtitle="End-to-end autonomous website cloning — scrape, identify legal changes, rebrand, provision, generate logos/images, SEO, monetization, and social media automation.">
        <LoadingButton onClick={() => setShowCreate(true)} variant="primary">
          <Rocket className="h-4 w-4" /> Clone a Site
        </LoadingButton>
        <LoadingButton onClick={load} loading={loading} variant="ghost">
          <RefreshCw className="h-4 w-4" /> Refresh
        </LoadingButton>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Globe} label="Clone Projects" value={projects.length} />
        <StatCard icon={CheckCircle2} label="Completed" value={projects.filter(p => p.status === 'complete').length} />
        <StatCard icon={Sparkles} label="Avg Validation" value={projects.length ? Math.round(projects.reduce((a, p) => a + (p.validation_score || 0), 0) / projects.length) : 0} suffix="/100" />
        <StatCard icon={Rocket} label="Running" value={projects.filter(p => p.status === 'running').length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-3">
          {loading ? (
            <div className="text-sm text-white/40 py-8 text-center">Loading…</div>
          ) : projects.length === 0 ? (
            <EmptyState icon={Globe} title="No clone projects yet" subtitle="Enter any website URL to autonomously clone, rebrand, provision, and launch it end-to-end." />
          ) : projects.map(p => (
            <button key={p.id} onClick={() => loadDetail(p.id)} className={`w-full text-left rounded-xl border p-4 transition-colors ${selected === p.id ? 'border-lime-400 bg-lime-400/5' : 'border-white/10 bg-zinc-950 hover:bg-white/5'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white truncate">{p.selected_name || p.target_url}</span>
                <StatusBadge status={p.status} />
              </div>
              <div className="mt-1 text-xs text-white/40 truncate">{p.target_url}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-lime-400/70">{STEPS.find(s => s.key === p.current_step)?.label || p.current_step}</span>
                {p.validation_score ? <span className="text-xs text-lime-400">{p.validation_score}/100</span> : null}
              </div>
              {p.status === 'running' && (
                <div className="mt-2">
                  <LoadingButton onClick={(e) => { e.stopPropagation(); resumeProject(p.id); }} loading={running === p.id} variant="ghost" className="px-2 py-1 text-xs">
                    <RefreshCw className="h-3 w-3" /> Resume
                  </LoadingButton>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {!active ? (
            <Panel title="Pipeline Detail"><div className="text-sm text-white/40 py-8 text-center">Select a project to view its clone pipeline.</div></Panel>
          ) : (
            <CloneDetail project={detail || active} loading={detailLoading} onResume={() => resumeProject(active.id)} running={running === active.id} />
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-950 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">Clone a Website</h3>
            <div className="space-y-3">
              <Field label="Target URL *"><input className="input" value={form.target_url} onChange={e => setForm({ ...form, target_url: e.target.value })} placeholder="https://competitor-site.com" /></Field>
              <Field label="Industry (optional — auto-detected)"><input className="input" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} placeholder="roofing, hvac, dental…" /></Field>
              <Field label="Business Name Hint (optional)"><input className="input" value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} placeholder="Preferred name (if any)" /></Field>
            </div>
            <p className="mt-3 text-xs text-white/40">The pipeline runs fully autonomously: scrape → identify legal changes → 20 name/domain options → rebrand → provision (Drive/Git/Supabase/Vercel) → logos → images → SEO/GSC → monetization → social → validate.</p>
            <div className="mt-5 flex justify-end gap-2">
              <LoadingButton onClick={() => setShowCreate(false)} variant="ghost">Cancel</LoadingButton>
              <LoadingButton onClick={launchClone} loading={running === 'create'} variant="primary"><Rocket className="h-4 w-4" /> Launch Clone</LoadingButton>
            </div>
          </div>
        </div>
      )}

      <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid hsl(0 0% 15%);background:#000;padding:0.5rem 0.75rem;font-size:0.875rem;color:#fff;outline:none}.input:focus{border-color:hsl(84 100% 59%)}`}</style>
    </div>
  );
}

function CloneDetail({ project, loading, onResume, running }) {
  if (loading) return <Panel title="Pipeline Detail"><div className="text-sm text-white/40 py-6 text-center">Loading…</div></Panel>;

  const stepIdx = STEPS.findIndex(s => s.key === project.current_step);

  return (
    <>
      <Panel title="Pipeline Progress">
        <div className="space-y-1.5">
          {STEPS.map((s, i) => {
            const done = i < stepIdx || project.status === 'complete';
            const current = i === stepIdx && project.status !== 'complete';
            return (
              <div key={s.key} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${current ? 'bg-lime-400/10 text-lime-300' : done ? 'text-white/50' : 'text-white/30'}`}>
                {done ? <CheckCircle2 className="h-4 w-4 text-lime-400" /> : current ? <RefreshCw className="h-4 w-4 animate-spin" /> : <div className="h-4 w-4 rounded-full border border-white/20" />}
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>
        {project.status === 'running' && (
          <div className="mt-4 flex justify-end">
            <LoadingButton onClick={onResume} loading={running} variant="ghost" className="text-xs"><RefreshCw className="h-3.5 w-3.5" /> Resume Pipeline</LoadingButton>
          </div>
        )}
      </Panel>

      {project.validation_score > 0 && (
        <Panel title="Validation Score">
          <ScoreBar label="Overall Completeness" value={project.validation_score} />
          {project.validation_summary && <p className="mt-3 text-sm text-white/60">{project.validation_summary}</p>}
        </Panel>
      )}

      {project.name_options && project.name_options.length > 0 && (
        <Panel title={`Name + Domain Options (${project.name_options.length})`}>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {project.name_options.map((o, i) => (
              <div key={i} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${o.name === project.selected_name ? 'border-lime-400 bg-lime-400/5' : 'border-white/5'}`}>
                <div><span className="text-white font-medium">{o.name}</span><span className="ml-2 text-xs text-white/40">{o.domain}</span></div>
                <div className="flex items-center gap-2">
                  {o.available ? <CheckCircle2 className="h-3.5 w-3.5 text-lime-400" /> : <AlertCircle className="h-3.5 w-3.5 text-white/30" />}
                  {o.name === project.selected_name && <span className="text-xs text-lime-400">SELECTED</span>}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {project.logo_options && project.logo_options.length > 0 && (
        <Panel title={`Logo Options (${project.logo_options.length})`}>
          <div className="grid grid-cols-3 gap-3">
            {project.logo_options.map((l, i) => (
              <div key={i} className={`rounded-lg border p-2 ${l.url === project.selected_logo_url ? 'border-lime-400' : 'border-white/10'}`}>
                <Image src={l.url} fittingType="fit" className="h-20 w-full" />
                {l.url === project.selected_logo_url && <div className="mt-1 text-center text-xs text-lime-400">SELECTED</div>}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {project.generated_images && project.generated_images.length > 0 && (
        <Panel title={`Generated Images (${project.generated_images.length})`}>
          <div className="grid grid-cols-2 gap-3">
            {project.generated_images.map((img, i) => (
              <div key={i} className="rounded-lg border border-white/10 p-2">
                <Image src={img.url} fittingType="fill" className="h-32 w-full rounded" />
                <div className="mt-1 text-xs text-white/40 capitalize">{img.type}</div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {project.provisioning && (
        <Panel title="Provisioning Status">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {['drive', 'github', 'supabase', 'vercel'].map(svc => {
              const data = project.provisioning[svc];
              return (
                <div key={svc} className="rounded-lg border border-white/10 p-3">
                  <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/40">
                    {data ? <CheckCircle2 className="h-3.5 w-3.5 text-lime-400" /> : <AlertCircle className="h-3.5 w-3.5 text-rose-400" />}
                    {svc}
                  </div>
                  {data?.url && <a href={data.url} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-xs text-lime-400 hover:underline truncate"><ExternalLink className="h-3 w-3" />{data.url.replace(/^https?:\/\//, '').slice(0, 30)}</a>}
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {project.monetization_options && project.monetization_options.length > 0 && (
        <Panel title={`Monetization Opportunities (${project.monetization_options.length})`}>
          <div className="space-y-2">
            {project.monetization_options.map((m, i) => (
              <div key={i} className="rounded-lg border border-white/5 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white capitalize">{m.type}</span>
                  <span className="text-xs text-lime-400">{m.estimated_revenue}</span>
                </div>
                <p className="mt-1 text-xs text-white/50">{m.description}</p>
                <p className="mt-1 text-xs text-white/40">Implementation: {m.implementation}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {project.social_content && project.social_content.platforms && (
        <Panel title="Social Media Automation Plan">
          <div className="flex flex-wrap gap-2 mb-3">
            {project.social_content.platforms.map((p, i) => <span key={i} className="rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-1 text-xs text-lime-300">{p}</span>)}
          </div>
          <p className="text-sm text-white/60">{project.social_content.post_schedule}</p>
          {project.social_content.content_templates && (
            <div className="mt-3 space-y-1">
              {project.social_content.content_templates.map((t, i) => (
                <div key={i} className="rounded-lg border border-white/5 px-3 py-2 text-xs">
                  <span className="text-lime-400 capitalize">{t.platform}</span> <span className="text-white/40">· {t.frequency}</span>
                  <p className="mt-1 text-white/60">{t.template}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {project.logs && project.logs.length > 0 && (
        <Panel title="Execution Logs">
          <div className="max-h-40 overflow-y-auto space-y-0.5 font-mono text-xs text-white/40">
            {project.logs.slice(-30).map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </Panel>
      )}
    </>
  );
}

function StatCard({ icon: Icon, label, value, suffix }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
      <div className="flex items-center gap-2 text-white/40"><Icon className="h-4 w-4" /><span className="text-xs uppercase tracking-wider">{label}</span></div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}{suffix}</div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="block text-xs font-medium text-white/60 mb-1">{label}</label>{children}</div>;
}