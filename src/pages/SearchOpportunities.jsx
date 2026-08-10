import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { Target } from "lucide-react";

export default function SearchOpportunities() {
  return (
    <EntityTable
      entity="SearchOpportunity" title="Search Opportunity Engine" subtitle="PAGE ONE HUNTER — organic search opportunities where a better tool/page can win."
      emptyIcon={Target} emptyTitle="No opportunities yet"
      columns={[
        { key: "query", label: "Query" },
        { key: "intent", label: "Intent" },
        { key: "tool_opportunity", label: "Recommended Tool" },
        { key: "overall_score", label: "Score", render: (it) => <span className="font-mono text-cyan-400">{Math.round(it.overall_score)}</span> },
        { key: "status", label: "Status", render: (it) => <StatusBadge status={it.status} /> },
      ]}
    />
  );
}