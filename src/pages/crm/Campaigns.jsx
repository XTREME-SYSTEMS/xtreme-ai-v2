import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { Megaphone } from "lucide-react";

export default function Campaigns() {
  return (
    <EntityTable
      entity="Campaign" title="Campaigns" subtitle="Marketing campaigns across channels."
      emptyIcon={Megaphone} emptyTitle="No campaigns yet"
      columns={[
        { key: "name", label: "Name" },
        { key: "channel", label: "Channel" },
        { key: "status", label: "Status", render: (it) => <StatusBadge status={it.status} /> },
        { key: "budget", label: "Budget", render: (it) => (it.budget ? `$${Number(it.budget).toLocaleString()}` : "—") },
        { key: "leads_generated", label: "Leads" },
        { key: "deals_won", label: "Won" },
      ]}
    />
  );
}