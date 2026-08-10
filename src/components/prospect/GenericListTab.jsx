import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { LoadingButton, EmptyState } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import { logReceipt } from "@/lib/lgny";
import { Sparkles, Loader2 } from "lucide-react";

// Generic tab: lists records of an entity filtered by business_id, with an AI generate button.
export default function GenericListTab({ businessId, businessName, entity, title, columns, generateFn, generateLabel, extraFields = {} }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities[entity].filter({ business_id: businessId }, "-created_date", 100)
      .then((r) => setItems(r)).finally(() => setLoading(false));
  };
  useEffect(load, [businessId]);

  const run = async () => {
    setGenerating(true);
    try {
      const records = await generateFn({ id: businessId, name: businessName });
      const toCreate = records.map((r) => ({ ...r, ...extraFields, business_id: businessId }));
      if (toCreate.length) await base44.entities[entity].bulkCreate(toCreate);
      await logReceipt({ agent_or_workflow: entity, action: generateLabel, entity_type: entity, entity_id: businessId, status: "success", outputs: { count: toCreate.length } });
      load();
    } catch (e) {
      await logReceipt({ agent_or_workflow: entity, action: generateLabel, entity_type: entity, entity_id: businessId, status: "failed", warnings: String(e) });
    }
    setGenerating(false);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <LoadingButton loading={generating} onClick={run} variant="ghost">
          <Sparkles className="h-4 w-4 text-cyan-400" /> {generateLabel}
        </LoadingButton>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Sparkles} title={`No ${title.toLowerCase()} yet`} subtitle={`Run ${generateLabel} to generate.`} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-left text-xs uppercase tracking-wider text-slate-500">
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
    </div>
  );
}