import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { Factory } from "lucide-react";

export default function GeneratorRegistry() {
  return (
    <EntityTable
      entity="GeneratorRegistry" title="Generator Registry" subtitle="Registered generators across intelligence, brand, website, interactive, creative, video, social, sales, lifecycle, SEO/AEO, operations, meta."
      emptyIcon={Factory} emptyTitle="No generators registered"
      columns={[
        { key: "name", label: "Generator" },
        { key: "category", label: "Category" },
        { key: "quality_score", label: "Quality", render: (it) => <span className="font-mono text-cyan-400">{Math.round(it.quality_score || 0)}</span> },
        { key: "origin", label: "Origin" },
        { key: "status", label: "Status", render: (it) => <StatusBadge status={it.status} /> },
      ]}
    />
  );
}