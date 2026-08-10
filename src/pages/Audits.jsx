import EntityTable from "@/components/EntityTable";
import ScoreBar from "@/components/ScoreBar";
import StatusBadge from "@/components/StatusBadge";
import { ClipboardCheck } from "lucide-react";

export default function Audits() {
  return (
    <EntityTable
      entity="PresenceAudit" title="Presence Audits" subtitle="Website, SEO, local SEO, AEO, conversion, brand, reputation, social, technical, offer, lead capture."
      emptyIcon={ClipboardCheck} emptyTitle="No audits yet"
      columns={[
        { key: "overall_score", label: "Overall", render: (it) => <span className="font-mono text-cyan-400">{Math.round(it.overall_score)}</span> },
        { key: "seo_score", label: "SEO", render: (it) => <ScoreBar value={it.seo_score} className="w-24" /> },
        { key: "local_seo_score", label: "Local", render: (it) => <ScoreBar value={it.local_seo_score} className="w-24" /> },
        { key: "conversion_score", label: "Conv.", render: (it) => <ScoreBar value={it.conversion_score} className="w-24" /> },
        { key: "opportunity_gap", label: "Opportunity Gap" },
        { key: "status", label: "Status", render: (it) => <StatusBadge status={it.status} /> },
      ]}
    />
  );
}