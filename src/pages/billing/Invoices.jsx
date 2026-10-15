import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, EmptyState, LoadingButton } from "@/components/ui";
import CreateModal from "@/components/CreateModal";
import StatusBadge from "@/components/StatusBadge";
import { Receipt, Plus, Sparkles, CheckCircle2, Loader2 } from "lucide-react";

export default function Invoices() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gen, setGen] = useState(null);
  const [toast, setToast] = useState(null);

  const load = () => base44.entities.Invoice.list("-created_date", 200).then(setItems).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const nextNum = () => `INV-${String(Date.now()).slice(-6)}`;

  const create = async (form) => {
    setBusy(true);
    try {
      const lines = form.lines ? [{ description: form.lines, qty: 1, unit_price: Number(form.value) || 0, total: Number(form.value) || 0 }] : [];
      const subtotal = Number(form.value) || 0;
      const tax = Math.round(subtotal * 0.07 * 100) / 100;
      await base44.entities.Invoice.create({
        number: nextNum(), account_name: form.account_name, deal_name: form.deal_name, contact_name: form.contact_name,
        issue_date: new Date().toISOString().slice(0, 10), due_date: form.due_date,
        lines, subtotal, tax_rate: 7, tax, total: subtotal + tax, status: "draft", notes: form.notes,
      });
      setOpen(false); await load();
    } catch (e) {}
    setBusy(false);
  };

  const aiGenerate = async () => {
    setGen("new");
    try {
      const r = await base44.functions.invoke("generateInvoice", { account_name: "New Client", deal_name: "Marketing Package", value: 2500 });
      const d = r.data;
      if (d?.lines) {
        await base44.entities.Invoice.create({
          number: nextNum(), account_name: "New Client", issue_date: new Date().toISOString().slice(0, 10),
          due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          lines: d.lines, subtotal: d.subtotal, tax_rate: d.tax_rate, tax: d.tax, total: d.total, notes: d.notes,
          status: "draft", ai_generated: true,
        });
        setToast("AI invoice generated.");
        await load();
      }
    } catch (e) {}
    setGen(null);
    setTimeout(() => setToast(null), 4000);
  };

  const markPaid = async (id) => {
    await base44.entities.Invoice.update(id, { status: "paid", amount_paid: items.find((i) => i.id === id)?.total || 0, paid_date: new Date().toISOString().slice(0, 10) });
    await load();
  };

  const total = items.reduce((a, i) => a + (i.total || 0), 0);
  const paid = items.filter((i) => i.status === "paid").reduce((a, i) => a + (i.total || 0), 0);

  return (
    <div>
      <PageHeader title="Invoices" subtitle={`Clone of QuickBooks invoicing · ${items.length} invoices · $${total.toLocaleString()} billed · $${paid.toLocaleString()} paid`}>
        <button onClick={aiGenerate} disabled={gen === "new"} className="inline-flex items-center gap-1.5 rounded-lg border border-lime-400/40 px-3 py-2 text-sm font-semibold text-lime-300 hover:bg-lime-400/10 disabled:opacity-50">
          {gen === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} AI Invoice
        </button>
        <LoadingButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Invoice</LoadingButton>
      </PageHeader>
      {toast && <div className="mb-3 rounded-lg border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-sm text-lime-200">{toast}</div>}
      <Panel title={`${items.length} invoices`}>
        {loading ? <div className="py-8 text-sm text-white/50">Loading…</div> : items.length === 0 ? (
          <EmptyState icon={Receipt} title="No invoices yet" subtitle="Create an invoice or let AI generate one from a deal.">
            <LoadingButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Invoice</LoadingButton>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40">
                <th className="px-3 py-2">Number</th><th className="px-3 py-2">Account</th><th className="px-3 py-2">Due</th><th className="px-3 py-2">Total</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Action</th>
              </tr></thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-2 text-white">{i.number} {i.ai_generated && <Sparkles className="ml-1 inline h-3 w-3 text-lime-400" />}</td>
                    <td className="px-3 py-2 text-white/60">{i.account_name || "—"}</td>
                    <td className="px-3 py-2 text-white/60">{i.due_date ? new Date(i.due_date).toLocaleDateString() : "—"}</td>
                    <td className="px-3 py-2 text-lime-300">${(i.total || 0).toLocaleString()}</td>
                    <td className="px-3 py-2"><StatusBadge status={i.status} /></td>
                    <td className="px-3 py-2 text-right">
                      {i.status !== "paid" && <button onClick={() => markPaid(i.id)} className="inline-flex items-center gap-1 rounded-md border border-lime-400/40 px-2 py-1 text-xs font-semibold text-lime-300 hover:bg-lime-400/10"><CheckCircle2 className="h-3 w-3" /> Mark paid</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <CreateModal open={open} onClose={() => setOpen(false)} title="New Invoice" loading={busy} onSubmit={create}
        fields={[
          { key: "account_name", label: "Account / Client", required: true },
          { key: "deal_name", label: "Deal / Project" },
          { key: "contact_name", label: "Contact" },
          { key: "value", label: "Amount ($)", type: "number", required: true },
          { key: "due_date", label: "Due date", type: "date" },
          { key: "lines", label: "Line description" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </div>
  );
}