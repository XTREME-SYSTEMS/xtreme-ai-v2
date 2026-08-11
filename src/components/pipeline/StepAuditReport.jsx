import React from "react";
import { LoadingButton } from "@/components/ui";
import { Tag, ArrowRight, AlertTriangle, CheckCircle2, Image as ImageIcon, FileText, Phone, Building2, Shield } from "lucide-react";

export default function StepAuditReport({ project, onNext }) {
  const scan = project?.legal_scan || {};
  const mc = scan.must_change || {};
  const ck = scan.can_keep || {};
  const names = scan.name_recommendations || [];

  const riskColor = {
    low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    high: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Legal Audit Report</h2>
          <p className="mt-1 text-sm text-white/50">Everything that must change vs. what can stay. Review before picking a new name.</p>
        </div>
        <LoadingButton onClick={onNext} variant="primary">
          <Tag className="h-4 w-4" /> View Name Recommendations
          <ArrowRight className="h-4 w-4" />
        </LoadingButton>
      </div>

      {/* Risk level + summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`rounded-xl border p-4 ${riskColor[scan.risk_level] || riskColor.medium}`}>
          <div className="text-xs uppercase tracking-wider opacity-70">Risk Level</div>
          <div className="mt-1 text-2xl font-bold capitalize">{scan.risk_level || "medium"}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
          <div className="text-xs uppercase tracking-wider text-white/40">Name Options Ready</div>
          <div className="mt-1 text-2xl font-bold text-lime-400">{names.length}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
          <div className="text-xs uppercase tracking-wider text-white/40">Images to Replace</div>
          <div className="mt-1 text-2xl font-bold text-white">{(mc.images_to_replace || []).length}</div>
        </div>
      </div>

      {scan.executive_summary && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Executive Summary</div>
          <p className="text-sm text-white/80">{scan.executive_summary}</p>
        </div>
      )}

      {/* Must Change */}
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-rose-400" />
          <h3 className="text-sm font-semibold text-rose-300 uppercase tracking-wider">Must Change</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <MustChangeItem icon={Building2} label="Business Name" value={mc.business_name} />
          <MustChangeItem icon={Tag} label="Tagline" value={mc.tagline} />
          <MustChangeItem icon={Shield} label="Logo" value={mc.logo?.description} sub={mc.logo?.location} />
          <MustChangeItem icon={Phone} label="Contact Info" value={[mc.contact_info?.phone, mc.contact_info?.email, mc.contact_info?.address].filter(Boolean).join(" · ")} />
        </div>

        {(mc.trademarked_terms || []).length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-medium text-rose-300 mb-2">Trademarked Terms</div>
            <div className="flex flex-wrap gap-2">
              {mc.trademarked_terms.map((t, i) => (
                <span key={i} className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-300">{t}</span>
              ))}
            </div>
          </div>
        )}

        {(mc.images_to_replace || []).length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-medium text-rose-300 mb-2 flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Images to Replace ({mc.images_to_replace.length})</div>
            <div className="space-y-2">
              {mc.images_to_replace.slice(0, 6).map((img, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-black/40 p-3">
                  <div className="text-sm text-white">{img.description}</div>
                  <div className="text-xs text-rose-300/70 mt-0.5">Reason: {img.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(mc.content_to_replace || []).length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-medium text-rose-300 mb-2 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Content to Replace ({mc.content_to_replace.length})</div>
            <div className="space-y-2">
              {mc.content_to_replace.slice(0, 4).map((c, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-black/40 p-3">
                  <div className="text-xs font-medium text-white/70">{c.section}</div>
                  <div className="text-xs text-white/50 mt-0.5 truncate">"{(c.original_text || "").slice(0, 120)}…"</div>
                  <div className="text-xs text-rose-300/70 mt-0.5">Reason: {c.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Can Keep */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <h3 className="text-sm font-semibold text-emerald-300 uppercase tracking-wider">Can Keep</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <CanKeepItem label="Page Structure" value={ck.page_structure} />
          <CanKeepItem label="Color Scheme" value={ck.color_scheme} />
          <CanKeepItem label="Layout" value={ck.layout} />
          <CanKeepItem label="FAQ Format" value={ck.faq_format} />
          {(ck.service_descriptions || []).length > 0 && (
            <div className="md:col-span-2">
              <div className="text-xs font-medium text-emerald-300 mb-1">Service Descriptions (safe to reuse)</div>
              <ul className="text-xs text-white/60 space-y-0.5">
                {ck.service_descriptions.map((s, i) => <li key={i}>• {s}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MustChangeItem({ icon: Icon, label, value, sub }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-rose-300 mb-1"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className="text-sm text-white">{value}</div>
      {sub && <div className="text-xs text-white/40 mt-0.5">{sub}</div>}
    </div>
  );
}

function CanKeepItem({ label, value }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border border-emerald-500/10 bg-black/20 p-3">
      <div className="text-xs font-medium text-emerald-300 mb-1">{label}</div>
      <div className="text-xs text-white/60">{value}</div>
    </div>
  );
}