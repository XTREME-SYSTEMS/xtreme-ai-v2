import EntityTable from "@/components/EntityTable";
import { BookOpen } from "lucide-react";

export default function ThrowTheBook() {
  return (
    <EntityTable
      entity="TacticScore" title="Throw The Book At It" subtitle="The full marketing tactic library, scored per business. Only appropriate tactics enter execution."
      emptyIcon={BookOpen} emptyTitle="No tactic scores yet"
      columns={[
        { key: "tactic_family", label: "Family" },
        { key: "tactic_name", label: "Tactic" },
        { key: "total", label: "Total", render: (it) => <span className="font-mono text-cyan-400">{Math.round(it.total)}</span> },
        { key: "decision", label: "Decision" },
        { key: "rationale", label: "Rationale" },
      ]}
    />
  );
}