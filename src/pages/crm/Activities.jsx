import EntityTable from "@/components/EntityTable";
import { ClipboardList } from "lucide-react";

export default function Activities() {
  return (
    <EntityTable
      entity="Activity" title="Activities" subtitle="Calls, emails, meetings, notes and tasks across the CRM."
      emptyIcon={ClipboardList} emptyTitle="No activities yet"
      columns={[
        { key: "type", label: "Type" },
        { key: "subject", label: "Subject" },
        { key: "related_type", label: "Related" },
        { key: "due_date", label: "Due", render: (it) => (it.due_date ? new Date(it.due_date).toLocaleDateString() : "—") },
        { key: "completed", label: "Done", render: (it) => (it.completed ? "✓" : "—") },
      ]}
    />
  );
}