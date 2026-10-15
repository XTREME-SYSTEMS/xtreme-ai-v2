import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { Database } from "lucide-react";

export default function SourceRegistry() {
  return (
    <EntityTable
      entity="SourceAdapterRegistry" title="Scraper / Source Adapter Registry" subtitle="Governed source adapters — public data only, provenance + confidence retained. No CAPTCHA/paywall/auth bypass."
      emptyIcon={Database} emptyTitle="No source adapters registered"
      columns={[
        { key: "source_name", label: "Source" },
        { key: "source_type", label: "Type" },
        { key: "access_method", label: "Access" },
        { key: "rate_limit", label: "Rate Limit" },
        { key: "status", label: "Status", render: (it) => <StatusBadge status={it.status} /> },
      ]}
    />
  );
}