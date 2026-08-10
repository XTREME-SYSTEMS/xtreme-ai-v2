import EntityTable from "@/components/EntityTable";
import { Lightbulb } from "lucide-react";

export default function Concepts() {
  return (
    <EntityTable
      entity="LeadGenConcept" title="Concept Lab" subtitle="Lead-generation tool & microsite concepts."
      emptyIcon={Lightbulb} emptyTitle="No concepts yet"
      columns={[
        { key: "name", label: "Concept" },
        { key: "tool_type", label: "Tool Type" },
        { key: "value_before_gate", label: "Value Before Gate" },
        { key: "lead_event", label: "Lead Event" },
        { key: "score", label: "Score", render: (it) => <span className="font-mono text-cyan-400">{Math.round(it.score)}</span> },
      ]}
    />
  );
}