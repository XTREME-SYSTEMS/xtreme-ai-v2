import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { Panel, EmptyState } from "@/components/ui";
import { ScrollText } from "lucide-react";
import { usePreview } from "@/lib/PreviewContext";

export default function Receipts() {
  const { previewAsClient } = usePreview();

  // In the Client Portal (real client or admin preview), Activity reflects only
  // the client's own actions. A brand-new client has done nothing, so show an
  // empty state directly rather than the global audit trail.
  if (previewAsClient) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white sm:text-2xl">Activity</h1>
          <p className="mt-1 text-sm text-slate-400">Your actions in the Client Portal.</p>
        </div>
        <Panel title="0 records">
          <EmptyState
            icon={ScrollText}
            title="No activity yet"
            subtitle="Actions you take in the portal will show up here."
          />
        </Panel>
      </div>
    );
  }

  return (
    <EntityTable
      entity="Receipt"
      title="Receipts"
      subtitle="Immutable audit trail of every agent, workflow, and operator action."
      emptyIcon={ScrollText}
      emptyTitle="No receipts yet"
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