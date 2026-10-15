import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { Palette } from "lucide-react";

export default function BrandLab() {
  return (
    <EntityTable
      entity="BrandPack" title="Brand Lab" subtitle="Exactly 3 brand packs per prospect — operator approves one."
      emptyIcon={Palette} emptyTitle="No brand packs yet"
      columns={[
        { key: "option_number", label: "Option" },
        { key: "positioning", label: "Positioning" },
        { key: "tagline", label: "Tagline" },
        { key: "colors", label: "Colors" },
        { key: "score", label: "Score", render: (it) => <span className="font-mono text-cyan-400">{Math.round(it.score)}</span> },
        { key: "status", label: "Status", render: (it) => <StatusBadge status={it.status} /> },
      ]}
    />
  );
}