import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { LoadingButton, EmptyState } from "@/components/ui";
import ScoreBar from "@/components/ScoreBar";
import StatusBadge from "@/components/StatusBadge";
import { auditPresence, logReceipt } from "@/lib/lgny";
import { Sparkles, Loader2, ShieldCheck } from "lucide-react";

export default function AuditTab({ businessId, businessName, prospect }) {
  const [audit, setAudit] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities.PresenceAudit.filter({ business_id: businessId }, "-created_date", 1)
      .then(async (r) => {
        if (r[0]) {
          setAudit(r[0]);
          const ev = await base44.entities.AuditEvidence.filter({ audit_id: r[0].id }, "-created_date", 50);
          setEvidence(ev);
        }
      }).finally(() => setLoading(false));
  };
  useEffect(load, [businessId]);

  const run = async () => {
    setGenerating(true);
    try {
      const res = await auditPresence(prospect);
      const created = await base44.entities.PresenceAudit.create({ ...res, business_id: businessId, status: "complete" });
      if (res.weaknesses?.length) {
        await base44.entities.AuditEvidence.bulkCreate(
          res.weaknesses.map((w) => ({ audit_id: created.id, business_id: businessId, category: "weakness", finding: w, severity: "medium", source: "ai_audit", confidence: "medium" }))
        );
      }
      await base44.entities.BusinessProspect.update(businessId, { status: "audited" });
      await logReceipt({ agent_or_workflow: "Presence Auditor", action: "audit", entity_type: "PresenceAudit", entity_id: created.id, status: "success" });
      load();
    } catch (e) {
      await logReceipt({ agent_or_workflow: "Presence Auditor", action: "audit", status: "failed", warnings: String(e) });
    }
    setGenerating(false);
  };

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;

  if (!audit) return (
    <EmptyState icon={ShieldCheck} title="No audit yet" subtitle="Run a presence audit to score website, SEO, local SEO, AEO, conversion, brand, reputation, technical, offer, and lead capture.">
      <LoadingButton loading={generating} onClick={run}><Sparkles className="h-4 w-4" /> Run Presence Audit</LoadingButton>
    </EmptyState>
  );

  const scores = [
    ["website", "Website"], ["seo", "SEO"], ["local_seo", "Local SEO"], ["aeo", "AEO"],
    ["conversion", "Conversion"], ["brand", "Brand"], ["reputation", "Reputation"], ["social", "Social"],
    ["technical", "Technical"], ["offer", "Offer"], ["lead_capture", "Lead Capture"],
  ];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusBadge status="complete" />
          <span className="text-sm text-slate-400">Overall: <span className="font-semibold text-white">{Math.round(audit.overall_score)}</span></span>
        </div>
        <LoadingButton loading={generating} onClick={run} variant="ghost"><Sparkles className="h-4 w-4 text-cyan-400" /> Re-run Audit</LoadingButton>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {scores.map(([k, label]) => <ScoreBar key={k} label={label} value={audit[`${k}_score`]} />)}
          </div>
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">Opportunity Gap</div>
            <p className="mt-1 text-sm text-slate-300">{audit.opportunity_gap || "—"}</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Evidence / Weaknesses</div>
          <div className="mt-2 space-y-2">
            {evidence.length === 0 ? <p className="text-sm text-slate-500">None recorded.</p> :
              evidence.map((e) => (
                <div key={e.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-2.5">
                  <div className="flex items-center gap-2"><StatusBadge status={e.severity === "critical" ? "failed" : e.severity === "high" ? "escalated" : "open"} /><span className="text-xs text-slate-500">{e.category}</span></div>
                  <p className="mt-1 text-sm text-slate-300">{e.finding}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}