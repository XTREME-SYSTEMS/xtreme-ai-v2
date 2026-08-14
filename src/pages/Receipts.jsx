import { useEffect, useState } from "react";
import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { ScrollText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { usePreview } from "@/lib/PreviewContext";

export default function Receipts() {
  const { previewAsClient } = usePreview();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const clientMode = previewAsClient || user?.role !== "admin";
  const ready = !clientMode || user !== null;
  const filter = clientMode && user?.id ? { created_by_id: user.id } : {};

  return (
    <EntityTable
      entity="Receipt"
      title="Receipts"
      subtitle={clientMode ? "Your activity in the Client Portal." : "Immutable audit trail of every agent, workflow, and operator action."}
      filter={filter}
      ready={ready}
      emptyIcon={ScrollText}
      emptyTitle="No activity yet"
      emptySub="Actions you take in the portal will show up here."
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