import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { usePreview } from "@/lib/PreviewContext";
import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import PreviewBanner from "@/components/client/PreviewBanner";
import { Panel, EmptyState } from "@/components/ui";
import { ScrollText } from "lucide-react";

export default function Receipts() {
  const { previewAsClient, previewClientEmail } = usePreview();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // In the Client Portal (real client or admin preview), Activity reflects
  // only the client's own actions — RLS scopes the Receipt reads to the
  // current user, and client-portal actions (approvals, signatures) are now
  // logged here. When an admin previews a specific client, we resolve that
  // client's user id and filter receipts to it.
  const isClientView = previewAsClient;

  useEffect(() => {
    if (!isClientView) return;
    let cancelled = false;
    (async () => {
      try {
        let list = await base44.entities.Receipt.list("-created_date", 50);
        if (previewAsClient && previewClientEmail) {
          const users = await base44.entities.User.filter({ email: previewClientEmail }, undefined, 5);
          const uid = users[0]?.id;
          if (uid) list = (list || []).filter((r) => r.created_by_id === uid);
        }
        if (!cancelled) setRows(list || []);
      } catch (e) {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isClientView, previewAsClient, previewClientEmail]);

  if (isClientView) {
    return (
      <div>
        <PreviewBanner />
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white sm:text-2xl">Activity</h1>
          <p className="mt-1 text-sm text-white/50">Your actions in the Client Portal — approvals, signatures and more.</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-lime-400" />
          </div>
        ) : rows.length === 0 ? (
          <Panel title="0 records">
            <EmptyState
              icon={ScrollText}
              title="No activity yet"
              subtitle="Actions you take — like approving a step or signing a document — will show up here."
            />
          </Panel>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-xs uppercase tracking-wider text-white/50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Action</th>
                  <th className="px-4 py-2.5 text-left font-medium">Type</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((r) => (
                  <tr key={r.id} className="bg-zinc-950">
                    <td className="px-4 py-2.5 font-medium text-white">{r.action}</td>
                    <td className="px-4 py-2.5 text-white/60">{r.entity_type}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-2.5 text-white/50">{new Date(r.created_date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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