import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { Boxes } from "lucide-react";

export default function CapabilityRegistry() {
  return (
    <EntityTable
      entity="CapabilityRegistry" title="Capability Registry" subtitle="Existing validated capabilities — reuse before building new."
      emptyIcon={Boxes} emptyTitle="No capabilities registered"
      columns={[
        { key: "name", label: "Capability" },
        { key: "category", label: "Category" },
        { key: "source_system", label: "Source" },
        { key: "cost_class", label: "Cost" },
        { key: "speed_class", label: "Speed" },
        { key: "validation_status", label: "Validation", render: (it) => <StatusBadge status={it.validation_status === "verified" ? "validated" : it.validation_status === "failed" ? "failed" : "open"} /> },
      ]}
    />
  );
}