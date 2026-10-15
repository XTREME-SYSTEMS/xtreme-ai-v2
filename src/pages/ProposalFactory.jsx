import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { FileText } from "lucide-react";

export default function ProposalFactory() {
  return (
    <EntityTable
      entity="ProposalPackage" title="Proposal Factory" subtitle="Constructive prospect audit/proposal packages."
      emptyIcon={FileText} emptyTitle="No proposals yet"
      columns={[
        { key: "audit_summary", label: "Audit Summary" },
        { key: "opportunity_summary", label: "Opportunity Summary" },
        { key: "offer_options", label: "Offers", render: (it) => <span className="text-xs text-slate-400">{(it.offer_options || []).length}</span> },
        { key: "status", label: "Status", render: (it) => <StatusBadge status={it.status} /> },
      ]}
    />
  );
}