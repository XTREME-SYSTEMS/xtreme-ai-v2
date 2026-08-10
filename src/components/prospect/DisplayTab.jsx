import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { EmptyState, Panel } from "@/components/ui";
import { Loader2 } from "lucide-react";

// Display-only tab: lists records of an entity filtered by business_id (no generate button).
// Used for Generators, QA, Proposal, Experiments tabs that are populated by the Build flow.
export default function DisplayTab({ businessId, entity, title, columns, renderPanel }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities[entity].filter({ business_id: businessId }, "-created_date", 50)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [businessId]);

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-white/50"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;

  if (renderPanel) return renderPanel(items);

  if (items.length === 0) return <EmptyState icon={Loader2} title={`No ${title.toLowerCase()} yet`} subtitle="Records appear here after running the Build flow." />;

  return (
    <Panel title={title}>
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-950 text-left text-xs uppercase tracking-wider text-white/40">
              {columns.map((c) => <th key={c.key} className="px-3 py-2 font-medium">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-white/5 hover:bg-white/5">
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-2 text-white/80">
                    {c.render ? c.render(it) : (it[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}