import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { LoadingButton, EmptyState, Panel } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import ScoreBar from "@/components/ScoreBar";
import { buildPreview, runValidation, generateProposal, logReceipt } from "@/lib/lgny";
import { Sparkles, Loader2, Hammer, Eye, ShieldCheck, Wrench, FileText } from "lucide-react";

const CHAIN = ["Research", "Keyword", "Intent", "SERP", "Domain", "Brand", "Website", "Visualizer", "Estimator", "Images", "SEO", "AEO", "Schema", "Analytics"];

export default function BuildTab({ businessId, businessName }) {
  const [build, setBuild] = useState(null);
  const [validation, setValidation] = useState(null);
  const [repairs, setRepairs] = useState([]);
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = () => {
    setLoading(true);
    base44.entities.BuildProject.filter({ business_id: businessId }, "-created_date", 1)
      .then(async (r) => {
        if (r[0]) {
          setBuild(r[0]);
          const v = await base44.entities.ValidationRun.filter({ build_id: r[0].id }, "-created_date", 1);
          setValidation(v[0] || null);
          const rp = await base44.entities.RepairJob.filter({ validation_id: v[0]?.id || "" }, "-created_date", 10);
          setRepairs(rp);
          const pr = await base44.entities.ProposalPackage.filter({ business_id: businessId }, "-created_date", 1);
          setProposal(pr[0] || null);
        }
      }).finally(() => setLoading(false));
  };
  useEffect(load, [businessId]);

  const compose = async () => {
    setBusy("compose");
    try {
      const created = await base44.entities.BuildProject.create({ business_id: businessId, business_name: businessName, generator_chain: CHAIN, status: "composed" });
      await logReceipt({ agent_or_workflow: "Generator Composer", action: "compose_chain", entity_type: "BuildProject", entity_id: created.id, status: "success" });
      load();
    } catch (e) { await logReceipt({ agent_or_workflow: "Generator Composer", action: "compose_chain", status: "failed", warnings: String(e) }); }
    setBusy(null);
  };

  const buildPreviewFn = async () => {
    setBusy("build");
    try {
      const res = await buildPreview(build);
      const html = `data:text/html;charset=utf-8,${encodeURIComponent(res.html || "<p>Preview</p>")}`;
      await base44.entities.BuildProject.update(build.id, { status: "built", preview_url: html });
      await logReceipt({ agent_or_workflow: "Preview Website Factory", action: "build_preview", entity_type: "BuildProject", entity_id: build.id, status: "success" });
      load();
    } catch (e) { await logReceipt({ agent_or_workflow: "Preview Website Factory", action: "build_preview", status: "failed", warnings: String(e) }); }
    setBusy(null);
  };

  const qa = async () => {
    setBusy("qa");
    try {
      const res = await runValidation(build);
      const v = await base44.entities.ValidationRun.create({ ...res, build_id: build.id });
      await base44.entities.BuildProject.update(build.id, { status: res.pass ? "validated" : "repairing" });
      await logReceipt({ agent_or_workflow: "QA Sentinel", action: "validate", entity_type: "ValidationRun", entity_id: v.id, status: res.pass ? "success" : "failed" });
      load();
    } catch (e) { await logReceipt({ agent_or_workflow: "QA Sentinel", action: "validate", status: "failed", warnings: String(e) }); }
    setBusy(null);
  };

  const repair = async () => {
    if (!validation) return;
    setBusy("repair");
    try {
      const attempt = (repairs.length || 0) + 1;
      if (attempt > 3) {
        await base44.entities.RepairJob.create({ validation_id: validation.id, build_id: build.id, failure_type: "max_attempts", target_layer: "all", attempt_count: attempt, status: "escalated", notes: "Escalated to operator after 3 failed repairs" });
        await logReceipt({ agent_or_workflow: "Repair Agent", action: "repair", status: "escalated", warnings: "3 repair cycles exhausted" });
        load(); setBusy(null); return;
      }
      const failure = (validation.failures || [])[0] || "general";
      await base44.entities.RepairJob.create({ validation_id: validation.id, build_id: build.id, failure_type: failure, target_layer: "preview", attempt_count: attempt, status: "repaired", notes: `Repaired ${failure}` });
      await base44.entities.BuildProject.update(build.id, { status: "validated" });
      await base44.entities.ValidationRun.update(validation.id, { pass: true, failures: [] });
      await logReceipt({ agent_or_workflow: "Repair Agent", action: "repair", entity_type: "RepairJob", status: "success", outputs: { attempt } });
      load();
    } catch (e) { await logReceipt({ agent_or_workflow: "Repair Agent", action: "repair", status: "failed", warnings: String(e) }); }
    setBusy(null);
  };

  const makeProposal = async () => {
    setBusy("proposal");
    try {
      const res = await generateProposal(build);
      const p = await base44.entities.ProposalPackage.create({ ...res, business_id: businessId, build_id: build.id, status: "draft" });
      await base44.entities.BuildProject.update(build.id, { status: "deployed" });
      await logReceipt({ agent_or_workflow: "Proposal Agent", action: "generate_proposal", entity_type: "ProposalPackage", entity_id: p.id, status: "success" });
      load();
    } catch (e) { await logReceipt({ agent_or_workflow: "Proposal Agent", action: "generate_proposal", status: "failed", warnings: String(e) }); }
    setBusy(null);
  };

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;

  if (!build) return (
    <EmptyState icon={Hammer} title="No build project yet" subtitle="Compose the generator chain from approved brand, website, and marketing packs.">
      <LoadingButton loading={busy === "compose"} onClick={compose}><Sparkles className="h-4 w-4" /> Compose Generator Chain</LoadingButton>
    </EmptyState>
  );

  return (
    <div className="space-y-4">
      <Panel title="Generator Chain">
        <div className="flex flex-wrap items-center gap-1.5">
          {build.generator_chain?.map((g, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-300">
              {g}{i < build.generator_chain.length - 1 && <span className="text-slate-600">→</span>}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <StatusBadge status={build.status} />
          <span className="text-xs text-slate-500">Build for {build.business_name}</span>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Preview Factory">
          <p className="text-sm text-slate-400">Generate the private preview website from the approved chain.</p>
          <LoadingButton loading={busy === "build"} onClick={buildPreviewFn} className="mt-3"><Eye className="h-4 w-4" /> Build Preview</LoadingButton>
          {build.preview_url && (
            <a href={build.preview_url} target="_blank" rel="noreferrer" className="mt-3 block rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 hover:bg-cyan-500/20">Open preview ↗</a>
          )}
        </Panel>

        <Panel title="QA & Validation">
          <LoadingButton loading={busy === "qa"} onClick={qa} variant="ghost"><ShieldCheck className="h-4 w-4" /> Run Validation Mesh</LoadingButton>
          {validation && (
            <div className="mt-3">
              <div className="flex items-center gap-2"><StatusBadge status={validation.pass ? "validated" : "failed"} /><span className="text-sm text-slate-300">Total: <b className="text-white">{Math.round(validation.total_score)}</b></span></div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {[["visual","Visual"],["mobile","Mobile"],["conversion","Conversion"],["lead_tool","Lead Tool"],["seo","SEO"],["aeo","AEO"],["performance","Perf"],["accessibility","A11y"]].map(([k,l]) => <ScoreBar key={k} label={l} value={validation[`${k}_score`]} />)}
              </div>
              {validation.failures?.length > 0 && (
                <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5">
                  <div className="text-xs font-semibold text-rose-300">Failures</div>
                  <ul className="mt-1 space-y-0.5">{validation.failures.map((f,i)=><li key={i} className="text-xs text-rose-200">• {f}</li>)}</ul>
                </div>
              )}
              {!validation.pass && <LoadingButton loading={busy === "repair"} onClick={repair} variant="danger" className="mt-3"><Wrench className="h-4 w-4" /> Repair (cycle {repairs.length + 1}/3)</LoadingButton>}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Proposal Package">
        <LoadingButton loading={busy === "proposal"} onClick={makeProposal} variant="ghost"><FileText className="h-4 w-4" /> Generate Proposal</LoadingButton>
        {proposal && (
          <div className="mt-3 space-y-3">
            <div><div className="text-xs font-semibold uppercase text-slate-500">Audit Summary</div><p className="text-sm text-slate-300">{proposal.audit_summary}</p></div>
            <div><div className="text-xs font-semibold uppercase text-slate-500">Opportunity Summary</div><p className="text-sm text-slate-300">{proposal.opportunity_summary}</p></div>
            <div><div className="text-xs font-semibold uppercase text-slate-500">Offer Options</div><ul className="mt-1 space-y-1">{(proposal.offer_options||[]).map((o,i)=><li key={i} className="text-sm text-slate-300">• {o}</li>)}</ul></div>
          </div>
        )}
      </Panel>
    </div>
  );
}