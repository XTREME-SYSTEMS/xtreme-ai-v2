import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import CloneDetail from "@/components/clone/CloneDetail";
import { Globe, Rocket, RefreshCw, Scan, CheckCircle2, Sparkles } from "lucide-react";

export default function CloneStudio() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
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

  const startScan = async () => {
    if (!form.target_url) return;
    setBusy('scan');
    try {
      const res = await base44.functions.invoke('legalScanClone', {
        target_url: form.target_url, industry: form.industry, business_name: form.business_name
      });
      await load();
      setShowCreate(false);
      setForm({ target_url: "", industry: "", business_name: "" });
      if (res?.data?.project_id) loadDetail(res.data.project_id);
    } catch (e) { alert(e.message); }
    setBusy(null);
  };

  const generateRebrand = async (projectId, selectedName, selectedDomain) => {
    setBusy(`rebrand-${projectId}`);
    try {
      await base44.functions.invoke('generateRebrandPackage', {
        project_id: projectId, selected_name: selectedName, selected_domain: selectedDomain
      });
      await loadDetail(projectId);
    } catch (e) { alert(e.message); }
    setBusy(null);
  };

  const approveAndLaunch = async (projectId) => {
    setBusy(`launch-${projectId}`);
    try {
      await base44.functions.invoke('provisionApprovedClone', { project_id: projectId });
      await loadDetail(projectId);
    } catch (e) { alert(e.message); }
    setBusy(null);
  };

  const active = selected ? projects.find(p => p.id === selected) : null;

  return (
    <div className="space-y-6">
      <PageHeader title="XtremeClone Rebrand System" subtitle="Scan any site for legal must-change items → generate a full rebrand package → approve → autonomous provisioning + domain purchase + SEO/AEO gap fill + race to rank.">
        <LoadingButton onClick={() => setShowCreate(true)} variant="primary">
          <Scan className="h-4 w-4" /> Scan a Site
        </LoadingButton>
        <LoadingButton onClick={load} loading={loading} variant="ghost">
          <RefreshCw className="h-4 w-4" /> Refresh
        </LoadingButton>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Globe} label="Clone Projects" value={projects.length} />
        <StatCard icon={CheckCircle2} label="Completed" value={projects.filter(p => p.status === 'complete').length} />
        <StatCard icon={Sparkles} label="Avg Score" value={projects.length ? Math.round(projects.reduce((a, p) => a + (p.validation_score || 0), 0) / projects.length) : 0} suffix="/100" />
        <StatCard icon={Scan} label="Awaiting Review" value={projects.filter(p => p.status === 'awaiting_approval').length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-3">
          {loading ? (
            <div className="text-sm text-white/40 py-8 text-center">Loading…</div>
          ) : projects.length === 0 ? (
            <EmptyState icon={Globe} title="No clone projects yet" subtitle="Enter any website URL to start a deep legal scan and rebrand pipeline." />
          ) : projects.map(p => (
            <button key={p.id} onClick={() => loadDetail(p.id)} className={`w-full text-left rounded-xl border p-4 transition-colors ${selected === p.id ? 'border-lime-400 bg-lime-400/5' : 'border-white/10 bg-zinc-950 hover:bg-white/5'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white truncate">{p.selected_name || p.target_url}</span>
                <StatusBadge status={p.status} />
              </div>
              <div className="mt-1 text-xs text-white/40 truncate">{p.target_url}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-lime-400/70">{p.current_step?.replace(/_/g, ' ')}</span>
                {p.validation_score ? <span className="text-xs text-lime-400">{p.validation_score}/100</span> : null}
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {!active ? (
            <Panel title="Pipeline Detail"><div className="text-sm text-white/40 py-8 text-center">Select a project to view its rebrand pipeline.</div></Panel>
          ) : (
            <CloneDetail
              project={detail || active}
              loading={detailLoading}
              busy={busy}
              onGenerateRebrand={generateRebrand}
              onApproveLaunch={approveAndLaunch}
              onRefresh={() => loadDetail(active.id)}
            />
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-950 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">Scan a Website</h3>
            <div className="space-y-3">
              <Field label="Target URL *"><input className="input" value={form.target_url} onChange={e => setForm({ ...form, target_url: e.target.value })} placeholder="https://competitor-site.com" /></Field>
              <Field label="Industry (optional — auto-detected)"><input className="input" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} placeholder="roofing, hvac, dental…" /></Field>
              <Field label="Business Name Hint (optional)"><input className="input" value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} placeholder="Preferred name hint" /></Field>
            </div>
            <p className="mt-3 text-xs text-white/40">The system will scan the site, identify ONLY legally-must-change items, generate 20 name+domain recommendations, and produce a single-page summary. You'll review and approve before any provisioning happens.</p>
            <div className="mt-5 flex justify-end gap-2">
              <LoadingButton onClick={() => setShowCreate(false)} variant="ghost">Cancel</LoadingButton>
              <LoadingButton onClick={startScan} loading={busy === 'scan'} variant="primary"><Scan className="h-4 w-4" /> Start Legal Scan</LoadingButton>
            </div>
          </div>
        </div>
      )}

      <style>{`.input{width:100%;border-radius:0.5rem;border:1px solid hsl(0 0% 15%);background:#000;padding:0.5rem 0.75rem;font-size:0.875rem;color:#fff;outline:none}.input:focus{border-color:hsl(84 100% 59%)}`}</style>
    </div>
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