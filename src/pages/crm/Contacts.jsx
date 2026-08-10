import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, EmptyState, LoadingButton } from "@/components/ui";
import CreateModal from "@/components/CreateModal";
import StatusBadge from "@/components/StatusBadge";
import { Users, Plus } from "lucide-react";

export default function Contacts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => base44.entities.Contact.list("-created_date", 200).then(setItems).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const create = async (form) => {
    setBusy(true);
    try {
      await base44.entities.Contact.create({
        first_name: form.first_name, last_name: form.last_name, email: form.email, phone: form.phone,
        title: form.title, account_name: form.account_name, status: form.status || "new",
        source: form.source, lead_score: Number(form.lead_score) || 0, notes: form.notes,
      });
      setOpen(false); await load();
    } catch (e) {}
    setBusy(false);
  };

  return (
    <div>
      <PageHeader title="Contacts" subtitle="AI-optimized CRM — every lead and contact in one pipeline.">
        <LoadingButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Contact</LoadingButton>
      </PageHeader>
      <Panel title={`${items.length} contacts`}>
        {loading ? <div className="py-8 text-sm text-white/50">Loading…</div> : items.length === 0 ? (
          <EmptyState icon={Users} title="No contacts yet" subtitle="Add your first contact to start the CRM.">
            <LoadingButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Contact</LoadingButton>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40">
                <th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Phone</th><th className="px-3 py-2">Account</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Score</th>
              </tr></thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-2 text-white">{c.first_name} {c.last_name}</td>
                    <td className="px-3 py-2 text-white/60">{c.email || "—"}</td>
                    <td className="px-3 py-2 text-white/60">{c.phone || "—"}</td>
                    <td className="px-3 py-2 text-white/60">{c.account_name || "—"}</td>
                    <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                    <td className="px-3 py-2"><span className="rounded-md bg-lime-400/10 px-2 py-0.5 text-xs font-semibold text-lime-300">{c.lead_score ?? 0}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <CreateModal open={open} onClose={() => setOpen(false)} title="New Contact" loading={busy} onSubmit={create}
        fields={[
          { key: "first_name", label: "First name", required: true },
          { key: "last_name", label: "Last name" },
          { key: "email", label: "Email", type: "email" },
          { key: "phone", label: "Phone" },
          { key: "title", label: "Title" },
          { key: "account_name", label: "Account / Company" },
          { key: "source", label: "Source" },
          { key: "status", label: "Status", type: "select", options: ["new", "contacted", "qualified", "won", "lost"], default: "new" },
          { key: "lead_score", label: "Lead score (0-100)", type: "number" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </div>
  );
}