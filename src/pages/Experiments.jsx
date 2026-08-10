import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { FlaskConical } from "lucide-react";

export default function Experiments() {
  return (
    <EntityTable
      entity="Experiment" title="Experiment Lab" subtitle="Measured marketing experiments — hypothesis, KPI, kill/scale thresholds, verdict."
      emptyIcon={FlaskConical} emptyTitle="No experiments yet"
      columns={[
        { key: "hypothesis", label: "Hypothesis" },
        { key: "channel", label: "Channel" },
        { key: "primary_kpi", label: "Primary KPI" },
        { key: "approval_status", label: "Approval", render: (it) => <StatusBadge status={it.approval_status} /> },
        { key: "status", label: "Status", render: (it) => <StatusBadge status={it.status} /> },
        { key: "verdict", label: "Verdict" },
      ]}
    />
  );
}