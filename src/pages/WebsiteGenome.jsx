import EntityTable from "@/components/EntityTable";
import { Network } from "lucide-react";

export default function WebsiteGenome() {
  return (
    <EntityTable
      entity="WebsiteGenome" title="Website Genome" subtitle="Reusable structural learnings from every generated website."
      emptyIcon={Network} emptyTitle="No genomes yet"
      columns={[
        { key: "industry", label: "Industry" },
        { key: "market", label: "Market" },
        { key: "tool_pattern", label: "Tool Pattern" },
        { key: "cta_pattern", label: "CTA Pattern" },
        { key: "conversion", label: "Conversion" },
        { key: "confidence", label: "Confidence" },
      ]}
    />
  );
}