import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, EmptyState, LoadingButton } from "@/components/ui";
import CreateModal from "@/components/CreateModal";
import StatusBadge from "@/components/StatusBadge";
import { Building2, Plus } from "lucide-react";

export default function Accounts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => base44.entities.Account.list("-created_date", 200).then(setItems).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const create = async (form) => {
    setBusy(true);
    try {
      await base44.entities.Account.create({
        name: form.name, website: form.website, industry: form.industry, phone: form.phone,
        email: form.email, city: form.city, state: form.state, address: form.address,
        status: form.status || "lead", owner_name: form.owner_name,
        annual_revenue: Number(form.annual_revenue) || 0, employees: Number(form.employees) || 0,
        description: form.description,
      });
      setOpen(false); await load();
    } catch (e) {}
    setBusy(false);
  };

  return (
    <div>
      <PageHeader title="Accounts" subtitle="Companies and organizations in your CRM.">
        <LoadingButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Account</LoadingButton>
      </PageHeader>
      <Panel title={`${items.length} accounts`}>
        {loading ? <div className="py-8 text-sm text-white/50">Loading…</div> : items.length === 0 ? (
          <EmptyState icon={Building2} title="No accounts yet" subtitle="Add your first account to organize contacts and deals.">
            <LoadingButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Account</LoadingButton>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40">
                <th className="px-3 py-2">Name</th><th className="px-3 py-2">Industry</th><th className="px-3 py-2">Location</th><th className="px-3 py-2">Owner</th><th className="px-3 py-2">Status</th>
              </tr></thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-2 text-white">{a.name}</td>
                    <td className="px-3 py-2 text-white/60">{a.industry || "—"}</td>
                    <td className="px-3 py-2 text-white/60">{a.city ? `${a.city}, ${a.state || ""}` : "—"}</td>
                    <td className="px-3 py-2 text-white/60">{a.owner_name || "—"}</td>
                    <td className="px-3 py-2"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <CreateModal open={open} onClose={() => setOpen(false)} title="New Account" loading={busy} onSubmit={create}
        fields={[
          { key: "name", label: "Account name", required: true },
          { key: "website", label: "Website" },
          { key: "industry", label: "Industry" },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email", type: "email" },
          { key: "address", label: "Address" },
          { key: "city", label: "City" },
          { key: "state", label: "State" },
          { key: "owner_name", label: "Owner" },
          { key: "status", label: "Status", type: "select", options: ["lead", "active", "customer", "churned"], default: "lead" },
          { key: "annual_revenue", label: "Annual revenue", type: "number" },
          { key: "employees", label: "Employees", type: "number" },
          { key: "description", label: "Description", type: "textarea" },
        ]}
      />
    </div>
  );
}