import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { Monitor } from "lucide-react";

export default function WebsiteLab() {
  return (
    <EntityTable
      entity="WebsitePack" title="Website Lab" subtitle="Exactly 3 website/content systems per prospect — operator approves one."
      emptyIcon={Monitor} emptyTitle="No website packs yet"
      columns={[
        { key: "option_number", label: "Option" },
        { key: "homepage_concept", label: "Homepage Concept" },
        { key: "primary_tool", label: "Primary Tool" },
        { key: "cta", label: "CTA" },
        { key: "score", label: "Score", render: (it) => <span className="font-mono text-cyan-400">{Math.round(it.score)}</span> },
        { key: "status", label: "Status", render: (it) => <StatusBadge status={it.status} /> },
      ]}
    />
  );
}