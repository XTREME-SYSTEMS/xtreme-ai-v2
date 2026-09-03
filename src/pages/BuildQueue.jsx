import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import { Hammer, Boxes } from "lucide-react";

export default function BuildQueue() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        <Link
          to="/web-pack-queue"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-400/10 border border-amber-400/30 px-4 py-2 text-sm font-semibold text-amber-400 transition-colors hover:bg-amber-400/20"
        >
          <Boxes className="h-4 w-4" />
          Web Pack Queue
        </Link>
      </div>
      <EntityTable
        entity="BuildProject" title="Build Queue" subtitle="Composed generator chains and build projects."
        emptyIcon={Hammer} emptyTitle="No build projects yet"
        columns={[
          { key: "business_name", label: "Business", render: (it) => <Link to={`/prospects/${it.business_id}`} className="text-cyan-400 hover:underline">{it.business_name || "—"}</Link> },
          { key: "generator_chain", label: "Chain", render: (it) => <span className="text-xs text-slate-400">{(it.generator_chain || []).join(" → ")}</span> },
          { key: "status", label: "Status", render: (it) => <StatusBadge status={it.status} /> },
        ]}
      />
    </div>
  );
}