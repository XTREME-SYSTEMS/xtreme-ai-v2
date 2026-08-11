import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { LoadingButton } from "@/components/ui";
import { ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StepHardening({ project, onNext }) {
  const [hardening, setHardening] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [error, setError] = useState("");

  const score = project?.validation_score || 0;
  const summary = project?.validation_summary || "";

  const runHardening = async () => {
    setHardening(true);
    setError("");
    try {
      const res = await base44.functions.invoke("rebrandAssistant", {
        action: "forensic_audit",
        project_id: project.id,
      });
      if (res?.data) {
        setAuditResult(res.data);
      } else if (res?.error) {
        setError(res.error);
      }
    } catch (e) {
      setError(e.message);
    }
    setHardening(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Harden & Validate</h2>
          <p className="mt-1 text-sm text-white/50">Final forensic audit and validation of the entire clone-to-launch pipeline.</p>
        </div>
        <div className="flex gap-2">
          <LoadingButton onClick={runHardening} loading={hardening} variant="ghost">
            <ShieldCheck className="h-4 w-4" /> Run Forensic Audit
          </LoadingButton>
          <LoadingButton onClick={onNext} variant="primary">
            View Live Site
            <ArrowRight className="h-4 w-4" />
          </LoadingButton>
        </div>
      </div>

      {/* Validation score */}
      <div className="rounded-xl border border-white/10 bg-zinc-950 p-6">
        <div className="flex items-center gap-4">
          <div className={cn("text-5xl font-bold", score >= 80 ? "text-lime-400" : score >= 50 ? "text-amber-400" : "text-rose-400")}>
            {score}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Validation Score</div>
            <div className="text-xs text-white/50">{score >= 80 ? "Excellent — ready to race to rank" : score >= 50 ? "Good — minor gaps remaining" : "Needs attention"}</div>
          </div>
          <div className="ml-auto">
            <ScoreRing score={score} />
          </div>
        </div>
        {summary && <p className="mt-4 text-sm text-white/70 border-t border-white/10 pt-4">{summary}</p>}
      </div>

      {/* Pipeline summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Business Name" value={project?.selected_name} done={!!project?.selected_name} />
        <SummaryCard label="Domain" value={project?.selected_domain} done={!!project?.selected_domain} />
        <SummaryCard label="Vercel URL" value={project?.provisioning?.vercel?.url} done={!!project?.provisioning?.vercel?.url} link={project?.provisioning?.vercel?.url} />
        <SummaryCard label="Rank Engine" value={project?.rank_engine_id ? "Active" : ""} done={!!project?.rank_engine_id} />
      </div>

      {/* Forensic audit result */}
      {auditResult && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-4 w-4 text-lime-400" />
            <h3 className="text-sm font-semibold text-white">Forensic Audit Result</h3>
            <span className="ml-auto text-lg font-bold text-lime-400">{auditResult.overall_score}/100</span>
          </div>

          {auditResult.business_owner_summary && (
            <p className="text-sm text-white/70 mb-4">{auditResult.business_owner_summary}</p>
          )}

          {(auditResult.must_change_pending || []).length > 0 && (
            <AuditSection title="Must-Change Items Still Pending" icon={AlertCircle} color="rose" items={auditResult.must_change_pending} />
          )}

          {auditResult.recommendations?.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium text-lime-300 mb-1.5">Recommendations</div>
              <div className="space-y-1.5">
                {auditResult.recommendations.map((r, i) => (
                  <div key={i} className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium uppercase", r.priority === "high" ? "bg-rose-500/20 text-rose-300" : r.priority === "medium" ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-white/60")}>{r.priority}</span>
                      <span className="text-sm text-white">{r.action}</span>
                    </div>
                    {r.impact && <div className="text-xs text-white/40 mt-1 ml-6">{r.impact}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{error}</div>}
    </div>
  );
}

function AuditSection({ title, icon: Icon, color, items }) {
  const [open, setOpen] = useState(false);
  const colorCls = color === "rose" ? "text-rose-300" : "text-lime-300";
  return (
    <div className="mb-3">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-xs font-medium w-full">
        {open ? <ChevronDown className="h-3.5 w-3.5 text-white/40" /> : <ChevronRight className="h-3.5 w-3.5 text-white/40" />}
        <Icon className={cn("h-3.5 w-3.5", colorCls)} />
        <span className={colorCls}>{title} ({items.length})</span>
      </button>
      {open && (
        <ul className="text-xs text-white/60 space-y-0.5 mt-1 ml-6">
          {items.map((f, i) => <li key={i}>• {f}</li>)}
        </ul>
      )}
    </div>
  );
}

function SummaryCard({ label, value, done, link }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/40">
        {done ? <CheckCircle2 className="h-3 w-3 text-lime-400" /> : <AlertCircle className="h-3 w-3 text-white/30" />}
        {label}
      </div>
      {link ? (
        <a href={link.startsWith("http") ? link : `https://${link}`} target="_blank" rel="noreferrer" className="mt-1 block text-sm text-lime-400 truncate hover:text-lime-300">{value || "—"}</a>
      ) : (
        <div className="mt-1 text-sm text-white truncate">{value || "—"}</div>
      )}
    </div>
  );
}

function ScoreRing({ score }) {
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  return (
    <svg className="h-16 w-16 -rotate-90">
      <circle cx="32" cy="32" r={radius} fill="none" stroke="hsl(0 0% 15%)" strokeWidth="4" />
      <circle cx="32" cy="32" r={radius} fill="none" stroke="hsl(84 100% 59%)" strokeWidth="4" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
}