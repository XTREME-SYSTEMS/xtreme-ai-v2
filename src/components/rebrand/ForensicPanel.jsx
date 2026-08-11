import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Panel, LoadingButton } from "@/components/ui";
import ScoreBar from "@/components/ScoreBar";
import {
  ShieldCheck, AlertTriangle, FileText, TrendingUp, DollarSign,
  Server, ChevronDown, Sparkles, Loader2,
} from "lucide-react";

export default function ForensicPanel({ project, onUpdated }) {
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openSections, setOpenSections] = useState({});

  const runAudit = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("rebrandAssistant", {
        action: "forensic_audit",
        project_id: project.id,
      });
      setAudit(res.data);
      onUpdated?.();
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const toggle = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Show existing validation if no new audit
  const displayScore = audit?.overall_score ?? project?.validation_score ?? 0;
  const summary = audit?.business_owner_summary ?? project?.validation_summary;

  return (
    <Panel
      title="Forensic Audit"
      action={
        <LoadingButton onClick={runAudit} loading={loading} variant="ghost" className="text-xs px-2 py-1">
          <ShieldCheck className="h-3 w-3" /> {audit ? "Re-run" : "Run Audit"}
        </LoadingButton>
      }
    >
      {!audit && !summary && !loading && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <ShieldCheck className="mb-2 h-8 w-8 text-white/20" />
          <p className="text-sm text-white/60">No audit yet.</p>
          <p className="text-xs text-white/40 mt-1">Run a deep forensic audit to get a full business owner summary, legal compliance status, SEO readiness, and prioritized recommendations.</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-lime-400 mb-2" />
          <p className="text-sm text-white/60">Running deep forensic audit…</p>
          <p className="text-xs text-white/40 mt-1">Analyzing legal, brand, SEO, infrastructure, and risks</p>
        </div>
      )}

      {audit && (
        <>
          {/* Score */}
          <div className="mb-4">
            <ScoreBar label="Overall Score" value={displayScore} />
          </div>

          {/* Business Owner Summary — prominent */}
          {audit.business_owner_summary && (
            <div className="mb-4 rounded-lg border border-lime-400/30 bg-lime-400/5 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-lime-300 mb-2">
                <FileText className="h-3.5 w-3.5" /> Business Owner Summary
              </div>
              <p className="text-sm text-white/90 whitespace-pre-wrap">{audit.business_owner_summary}</p>
            </div>
          )}

          {/* Must-change pending */}
          {audit.must_change_pending?.length > 0 && (
            <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-2">
                <AlertTriangle className="h-3.5 w-3.5" /> Must-Change Items Pending ({audit.must_change_pending.length})
              </div>
              <ul className="space-y-1">
                {audit.must_change_pending.map((m, i) => (
                  <li key={i} className="text-sm text-white/70 flex gap-2">
                    <span className="text-amber-400">•</span> {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Collapsible sections */}
          <div className="space-y-1">
            <Section title="Legal Compliance" icon={ShieldCheck} open={openSections.legal} onClick={() => toggle("legal")} content={audit.legal_compliance} />
            <Section title="Brand Assessment" icon={Sparkles} open={openSections.brand} onClick={() => toggle("brand")} content={audit.brand_assessment} />
            <Section title="SEO/AEO Readiness" icon={TrendingUp} open={openSections.seo} onClick={() => toggle("seo")} content={audit.seo_aeo_readiness} />
            <Section title="Infrastructure Status" icon={Server} open={openSections.infra} onClick={() => toggle("infra")} content={audit.infrastructure_status} />
            <Section title="Monetization Opportunities" icon={DollarSign} open={openSections.mon} onClick={() => toggle("mon")} content={audit.monetization_opportunities} />
            <Section title="Risk Assessment" icon={AlertTriangle} open={openSections.risk} onClick={() => toggle("risk")} content={audit.risk_assessment} />
          </div>

          {/* Recommendations */}
          {audit.recommendations?.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Prioritized Recommendations</div>
              <div className="space-y-1.5">
                {audit.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border border-white/5 px-3 py-2 text-sm">
                    <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      r.priority === "high" ? "bg-rose-500/20 text-rose-300" :
                      r.priority === "medium" ? "bg-amber-500/20 text-amber-300" :
                      "bg-lime-500/20 text-lime-300"
                    }`}>{r.priority}</span>
                    <div>
                      <div className="text-white/90">{r.action}</div>
                      {r.impact && <div className="text-xs text-white/40">Impact: {r.impact}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Fallback: show existing validation summary if no new audit */}
      {!audit && summary && (
        <div className="mb-3">
          <ScoreBar label="Last Audit Score" value={displayScore} />
          <div className="mt-3 rounded-lg border border-white/10 bg-black p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white/60 mb-2">
              <FileText className="h-3.5 w-3.5" /> Last Summary
            </div>
            <p className="text-sm text-white/70 whitespace-pre-wrap">{summary}</p>
          </div>
        </div>
      )}
    </Panel>
  );
}

function Section({ title, icon: Icon, open, onClick, content }) {
  if (!content) return null;
  return (
    <div className="rounded-lg border border-white/5">
      <button onClick={onClick} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/5">
        <Icon className="h-3.5 w-3.5 text-white/40" />
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-white/30 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-3 pb-3 text-sm text-white/60 whitespace-pre-wrap">{content}</div>}
    </div>
  );
}