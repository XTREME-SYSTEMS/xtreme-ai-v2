import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { ShieldCheck } from "lucide-react";

export default function QARepair() {
  return (
    <EntityTable
      entity="ValidationRun" title="QA & Repair" subtitle="Validation mesh results and repair cycles (max 3, then escalate)."
      emptyIcon={ShieldCheck} emptyTitle="No validation runs yet"
      columns={[
        { key: "total_score", label: "Total", render: (it) => <span className="font-mono text-cyan-400">{Math.round(it.total_score)}</span> },
        { key: "pass", label: "Pass", render: (it) => <StatusBadge status={it.pass ? "validated" : "failed"} /> },
        { key: "mobile_score", label: "Mobile", render: (it) => <span className="font-mono text-slate-400">{Math.round(it.mobile_score || 0)}</span> },
        { key: "seo_score", label: "SEO", render: (it) => <span className="font-mono text-slate-400">{Math.round(it.seo_score || 0)}</span> },
        { key: "accessibility_score", label: "A11y", render: (it) => <span className="font-mono text-slate-400">{Math.round(it.accessibility_score || 0)}</span> },
        { key: "failures", label: "Failures", render: (it) => <span className="text-xs text-rose-300">{(it.failures || []).length}</span> },
      ]}
    />
  );
}