import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, EmptyState } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import { Users, Star } from "lucide-react";

export default function Prospects() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.BusinessProspect.list("-created_date", 100).then((r) => { setItems(r); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Prospect Database" subtitle="Deduplicated business prospects with audit + opportunity status." />
      <Panel title={`${items.length} prospects`}>
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading…</div>
        ) : items.length === 0 ? (
          <EmptyState icon={Users} title="No prospects yet" subtitle="Run Business Discovery to populate the database.">
            <Link to="/discovery" className="rounded-lg bg-cyan-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-cyan-400">Go to Discovery</Link>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Business</th>
                  <th className="pb-2 pr-4 font-medium">Location</th>
                  <th className="pb-2 pr-4 font-medium">Rating</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-2.5 pr-4">
                      <Link to={`/prospects/${p.id}`} className="font-medium text-slate-200 hover:text-cyan-400">{p.name}</Link>
                      <div className="text-xs text-slate-500">{p.category || "—"}</div>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-400">{p.city ? `${p.city}, ${p.state || ""}` : "—"}</td>
                    <td className="py-2.5 pr-4 text-slate-400">
                      {p.rating ? <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-400" />{p.rating} ({p.review_count || 0})</span> : "—"}
                    </td>
                    <td className="py-2.5 pr-4"><StatusBadge status={p.status} /></td>
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