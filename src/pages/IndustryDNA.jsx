import EntityTable from "@/components/EntityTable";
import { Dna } from "lucide-react";

export default function IndustryDNA() {
  return (
    <EntityTable
      entity="IndustryDNA" title="Industry DNA" subtitle="Measured industry intelligence — winning tools, generators, pages, CTAs, offers, domains, tactics."
      emptyIcon={Dna} emptyTitle="No Industry DNA yet"
      columns={[
        { key: "industry", label: "Industry" },
        { key: "geography_scope", label: "Geography" },
        { key: "winning_tools", label: "Winning Tools", render: (it) => <span className="text-xs text-slate-400">{(it.winning_tools || []).join(", ")}</span> },
        { key: "confidence", label: "Confidence" },
      ]}
    />
  );
}