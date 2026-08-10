import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Panel, EmptyState } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import { Loader2 } from "lucide-react";

// Generic aggregate table page for an entity, with optional business_name join.
export default function EntityTable({ entity, title, subtitle, columns, filter = {}, emptyIcon: Icon, emptyTitle, emptySub, linkTo }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities[entity].list("-created_date", 200).then((r) => setItems(r)).finally(() => setLoading(false));
  }, [entity]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      <Panel title={`${items.length} records`}>
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : items.length === 0 ? (
          <EmptyState icon={Icon} title={emptyTitle || "No records"} subtitle={emptySub || "Generate data from a prospect to populate this view."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                  {columns.map((c) => <th key={c.key} className="px-3 py-2 font-medium">{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    {columns.map((c) => (
                      <td key={c.key} className="px-3 py-2 text-slate-300">
                        {c.render ? c.render(it) : (it[c.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}