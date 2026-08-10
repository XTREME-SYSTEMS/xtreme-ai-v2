import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { TrendingUp } from "lucide-react";

export default function SalesPipeline() {
  return (
    <EntityTable
      entity="BusinessProspect" title="Sales Pipeline" subtitle="Prospects moving through the lifecycle: discovered → audited → qualified → proposed → won."
      emptyIcon={TrendingUp} emptyTitle="No prospects in pipeline"
      columns={[
        { key: "name", label: "Business" },
        { key: "category", label: "Category" },
        { key: "city", label: "City" },
        { key: "status", label: "Stage", render: (it) => <StatusBadge status={it.status} /> },
      ]}
    />
  );
}