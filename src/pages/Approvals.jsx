import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { usePreview } from "@/lib/PreviewContext";
import ApprovalSteps from "@/components/client/ApprovalSteps";
import { logReceipt } from "@/lib/pipelineUtils";
import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { CheckCircle } from "lucide-react";

export default function Approvals() {
  const { previewAsClient } = usePreview();
  const [user, setUser] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Client view = a real client (non-admin) OR an admin previewing as client.
  const isClientView = previewAsClient || user?.role !== "admin";

  const load = async () => {
    // RLS scopes reads to the current user; fetch pending + approved.
    const [pending, approved] = await Promise.all([
      base44.entities.Approval.filter({ status: "pending" }, "-created_date", 50),
      base44.entities.Approval.filter({ status: "approved" }, "-created_date", 50),
    ]);
    setApprovals([...pending, ...approved]);
  };

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        if (previewAsClient || u?.role !== "admin") await load();
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    document.title = "Approvals · Lead Gen Near You";
  }, []);

  const decide = async (id, status, comment) => {
    const update = {
      status,
      decided_at: new Date().toISOString(),
      decision_by: user?.email || "client",
    };
    if (comment) update.notes = comment;
    await base44.entities.Approval.update(id, update);
    // Log to the client's Activity feed.
    await logReceipt({
      action: `Approval ${status}`,
      entityType: "Approval",
      entityId: id,
      status: status === "approved" ? "success" : "escalated",
      notes: comment ? `${status === "approved" ? "Approved" : "Denied"}: ${comment}` : status === "approved" ? "Approved" : "Denied",
    });
    await load();
  };

  // Admin governance view (not previewing).
  if (!isClientView) {
    return (
      <EntityTable
        entity="Approval"
        title="Approval Center"
        subtitle="Governance approvals — green (auto), yellow (preview), red (production locked)."
        emptyIcon={CheckCircle}
        emptyTitle="No approvals yet"
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

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-white sm:text-2xl">Approvals</h1>
      <p className="mb-5 text-sm text-white/50">
        Each step of your build is laid out below in order. The green, flashing step is the one you're on —
        approve it to move forward, or deny it with a comment telling us what to change.
      </p>

      <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-lime-400" />
          </div>
        ) : (
          <ApprovalSteps user={user} approvals={approvals} onDecide={decide} />
        )}
      </div>
    </div>
  );
}