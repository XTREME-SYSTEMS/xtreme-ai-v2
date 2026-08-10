import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { CheckCircle } from "lucide-react";

export default function Approvals() {
  return (
    <EntityTable
      entity="Approval" title="Approval Center" subtitle="Governance approvals — green (auto), yellow (preview), red (production locked)."
      emptyIcon={CheckCircle} emptyTitle="No approvals yet"
      columns={[
        { key: "entity_type", label: "Entity" },
        { key: "requested_action", label: "Action" },
        { key: "risk_level", label: "Risk", render: (it) => <span className={`text-xs font-medium ${it.risk_level === "red" ? "text-rose-400" : it.risk_level === "yellow" ? "text-amber-400" : "text-emerald-400"}`}>{it.risk_level}</span> },
        { key: "decision_by", label: "By" },
        { key: "status", label: "Status", render: (it) => <StatusBadge status={it.status} /> },
      ]}
    />
  );
}