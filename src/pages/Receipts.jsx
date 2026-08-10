import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { ScrollText } from "lucide-react";

export default function Receipts() {
  return (
    <EntityTable
      entity="Receipt" title="Receipts" subtitle="Immutable audit trail of every agent, workflow, and operator action."
      emptyIcon={ScrollText} emptyTitle="No receipts yet"
      columns={[
        { key: "agent_or_workflow", label: "Agent / Workflow" },
        { key: "action", label: "Action" },
        { key: "entity_type", label: "Entity" },
        { key: "status", label: "Status", render: (it) => <StatusBadge status={it.status} /> },
        { key: "created_date", label: "Time", render: (it) => new Date(it.created_date).toLocaleString() },
      ]}
    />
  );
}