import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import { Hammer } from "lucide-react";

export default function BuildQueue() {
  return (
    <EntityTable
      entity="BuildProject" title="Build Queue" subtitle="Composed generator chains and build projects."
      emptyIcon={Hammer} emptyTitle="No build projects yet"
      columns={[
        { key: "business_name", label: "Business", render: (it) => <Link to={`/prospects/${it.business_id}`} className="text-cyan-400 hover:underline">{it.business_name || "—"}</Link> },
        { key: "generator_chain", label: "Chain", render: (it) => <span className="text-xs text-slate-400">{(it.generator_chain || []).join(" → ")}</span> },
        { key: "status", label: "Status", render: (it) => <StatusBadge status={it.status} /> },
      ]}
    />
  );
}