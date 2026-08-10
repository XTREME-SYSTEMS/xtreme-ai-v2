import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, LoadingButton } from "@/components/ui";
import CreateModal from "@/components/CreateModal";
import { Plus } from "lucide-react";

const STAGES = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];

export default function Deals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => base44.entities.Deal.list("-created_date", 200).then(setItems).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const create = async (form) => {
    setBusy(true);
    try {
      await base44.entities.Deal.create({
        name: form.name, account_name: form.account_name, contact_name: form.contact_name,
        value: Number(form.value) || 0, stage: form.stage || "lead", probability: Number(form.probability) || 10,
        close_date: form.close_date, owner_name: form.owner_name, source: form.source, notes: form.notes,
      });
      setOpen(false); await load();
    } catch (e) {}
    setBusy(false);
  };

  const move = async (id, stage) => { await base44.entities.Deal.update(id, { stage }); await load(); };
  const byStage = (s) => items.filter((d) => d.stage === s);
  const total = items.reduce((a, d) => a + (d.value || 0), 0);

  return (
    <div>
      <PageHeader title="Deals" subtitle={`Pipeline · ${items.length} deals · $${total.toLocaleString()} total value`}>
        <LoadingButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Deal</LoadingButton>
      </PageHeader>
      {loading ? <div className="py-8 text-sm text-white/50">Loading…</div> : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {STAGES.map((s) => (
            <div key={s} className="rounded-xl border border-white/10 bg-zinc-950 p-2">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/60">{s}</span>
                <span className="text-xs text-white/40">{byStage(s).length}</span>
              </div>
              <div className="space-y-2">
                {byStage(s).map((d) => (
                  <div key={d.id} className="rounded-lg border border-white/10 bg-black p-2.5">
                    <div className="text-sm font-medium text-white">{d.name}</div>
                    <div className="text-xs text-white/40">{d.account_name || "—"}</div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-sm font-semibold text-lime-300">${(d.value || 0).toLocaleString()}</span>
                      <span className="text-xs text-white/40">{d.probability || 0}%</span>
                    </div>
                    <select value={d.stage} onChange={(e) => move(d.id, e.target.value)} className="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-1.5 py-1 text-xs text-white">
                      {STAGES.map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                ))}
                {byStage(s).length === 0 && <div className="px-1 py-2 text-xs text-white/30">Empty</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      <CreateModal open={open} onClose={() => setOpen(false)} title="New Deal" loading={busy} onSubmit={create}
        fields={[
          { key: "name", label: "Deal name", required: true },
          { key: "account_name", label: "Account" },
          { key: "contact_name", label: "Contact" },
          { key: "value", label: "Value ($)", type: "number" },
          { key: "stage", label: "Stage", type: "select", options: STAGES, default: "lead" },
          { key: "probability", label: "Probability (%)", type: "number" },
          { key: "close_date", label: "Close date", type: "date" },
          { key: "owner_name", label: "Owner" },
          { key: "source", label: "Source" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </div>
  );
}