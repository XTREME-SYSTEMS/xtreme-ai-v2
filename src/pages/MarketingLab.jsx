import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { Megaphone } from "lucide-react";

export default function MarketingLab() {
  return (
    <EntityTable
      entity="MarketingPack" title="Marketing Lab" subtitle="Exactly 3 marketing workflows per prospect — operator approves one."
      emptyIcon={Megaphone} emptyTitle="No marketing packs yet"
      columns={[
        { key: "option_number", label: "Option" },
        { key: "cost_level", label: "Cost" },
        { key: "speed", label: "Speed" },
        { key: "risk", label: "Risk" },
        { key: "measurement", label: "Measurement" },
        { key: "score", label: "Score", render: (it) => <span className="font-mono text-cyan-400">{Math.round(it.score)}</span> },
        { key: "status", label: "Status", render: (it) => <StatusBadge status={it.status} /> },
      ]}
    />
  );
}