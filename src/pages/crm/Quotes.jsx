import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { FileText } from "lucide-react";

export default function Quotes() {
  return (
    <EntityTable
      entity="Quote" title="Quotes" subtitle="Proposals and quotes tied to deals."
      emptyIcon={FileText} emptyTitle="No quotes yet"
      columns={[
        { key: "number", label: "Number" },
        { key: "account_name", label: "Account" },
        { key: "deal_name", label: "Deal" },
        { key: "total", label: "Total", render: (it) => (it.total ? `$${Number(it.total).toLocaleString()}` : "—") },
        { key: "status", label: "Status", render: (it) => <StatusBadge status={it.status} /> },
        { key: "valid_until", label: "Valid until", render: (it) => (it.valid_until ? new Date(it.valid_until).toLocaleDateString() : "—") },
      ]}
    />
  );
}