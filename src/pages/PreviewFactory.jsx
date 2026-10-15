import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { Eye } from "lucide-react";

export default function PreviewFactory() {
  return (
    <EntityTable
      entity="BuildProject" title="Preview Factory" subtitle="Private preview websites generated from approved chains."
      emptyIcon={Eye} emptyTitle="No previews yet"
      columns={[
        { key: "business_name", label: "Business" },
        { key: "preview_url", label: "Preview", render: (it) => it.preview_url ? <a href={it.preview_url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Open ↗</a> : "—" },
        { key: "status", label: "Status", render: (it) => <StatusBadge status={it.status} /> },
      ]}
    />
  );
}