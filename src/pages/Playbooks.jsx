import EntityTable from "@/components/EntityTable";
import { BookMarked } from "lucide-react";

export default function Playbooks() {
  return (
    <EntityTable
      entity="IndustryDNA" title="Playbook Library" subtitle="Evidence-based playbooks derived from Industry DNA + Website Genome learnings."
      emptyIcon={BookMarked} emptyTitle="No playbooks yet"
      columns={[
        { key: "industry", label: "Industry" },
        { key: "winning_tactics", label: "Winning Tactics", render: (it) => <span className="text-xs text-emerald-300">{(it.winning_tactics || []).join(", ")}</span> },
        { key: "losing_tactics", label: "Losing Tactics", render: (it) => <span className="text-xs text-rose-300">{(it.losing_tactics || []).join(", ")}</span> },
        { key: "winning_ctas", label: "Winning CTAs", render: (it) => <span className="text-xs text-slate-400">{(it.winning_ctas || []).join(", ")}</span> },
      ]}
    />
  );
}