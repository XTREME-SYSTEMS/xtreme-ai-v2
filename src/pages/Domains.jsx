import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { Globe } from "lucide-react";

export default function Domains() {
  return (
    <EntityTable
      entity="DomainCandidate" title="Domain Opportunity Lab" subtitle="Candidate domains — never purchased without operator approval."
      emptyIcon={Globe} emptyTitle="No domains yet"
      columns={[
        { key: "domain", label: "Domain" },
        { key: "availability_status", label: "Availability", render: (it) => <StatusBadge status={it.availability_status === "UNKNOWN" ? "open" : it.availability_status.toLowerCase()} /> },
        { key: "score", label: "Score", render: (it) => <span className="font-mono text-cyan-400">{Math.round(it.score)}</span> },
        { key: "collision_risk", label: "Collision" },
        { key: "trademark_review_status", label: "Trademark" },
      ]}
    />
  );
}