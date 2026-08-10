import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel } from "@/components/ui";
import StatCard from "@/components/StatCard";
import { Receipt, Wallet, TrendingUp, DollarSign, ArrowRight, FileSignature, Users } from "lucide-react";

export default function BillingDashboard() {
  const [stats, setStats] = useState({ billed: 0, paid: 0, outstanding: 0, expenses: 0, invoices: 0, deals: 0, contacts: 0, esign: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [invoices, expenses, deals, contacts, esign] = await Promise.all([
          base44.entities.Invoice.list("-created_date", 200),
          base44.entities.Expense.list("-created_date", 200),
          base44.entities.Deal.list("-created_date", 200),
          base44.entities.Contact.list("-created_date", 200),
          base44.entities.EsignDocument.list("-created_date", 200),
        ]);
        const billed = invoices.reduce((a, i) => a + (i.total || 0), 0);
        const paid = invoices.filter((i) => i.status === "paid").reduce((a, i) => a + (i.total || 0), 0);
        const outstanding = billed - paid;
        const exp = expenses.reduce((a, e) => a + (e.amount || 0), 0);
        setStats({ billed, paid, outstanding, expenses: exp, invoices: invoices.length, deals: deals.length, contacts: contacts.length, esign: esign.length });
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const links = [
    { to: "/crm/contacts", label: "Contacts", icon: Users, desc: `${stats.contacts} records` },
    { to: "/crm/deals", label: "Deals", icon: TrendingUp, desc: `${stats.deals} in pipeline` },
    { to: "/esign/documents", label: "E-Sign", icon: FileSignature, desc: `${stats.esign} documents` },
    { to: "/billing/invoices", label: "Invoices", icon: Receipt, desc: `${stats.invoices} invoices` },
    { to: "/billing/expenses", label: "Expenses", icon: Wallet, desc: "Track spending" },
  ];

  return (
    <div>
      <PageHeader title="Business Suite" subtitle="AI-automated CRM, e-sign, and billing — cloned in-app, fully integrated." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Billed" value={loading ? "—" : `$${stats.billed.toLocaleString()}`} icon={DollarSign} />
        <StatCard label="Collected" value={loading ? "—" : `$${stats.paid.toLocaleString()}`} icon={Receipt} accent="text-lime-400" />
        <StatCard label="Outstanding" value={loading ? "—" : `$${stats.outstanding.toLocaleString()}`} icon={TrendingUp} />
        <StatCard label="Expenses" value={loading ? "—" : `$${stats.expenses.toLocaleString()}`} icon={Wallet} accent="text-rose-400" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Suite Modules">
          <div className="grid gap-2 sm:grid-cols-2">
            {links.map((l) => {
              const Icon = l.icon;
              return (
                <Link key={l.to} to={l.to} className="group flex items-start gap-3 rounded-lg border border-white/10 bg-zinc-950 p-3 hover:border-lime-400/40 hover:bg-white/5">
                  <Icon className="mt-0.5 h-5 w-5 text-lime-400" />
                  <div>
                    <div className="text-sm font-medium text-white">{l.label}</div>
                    <div className="text-xs text-white/40">{l.desc}</div>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-white/30 group-hover:text-lime-400" />
                </Link>
              );
            })}
          </div>
        </Panel>
        <Panel title="Net Position">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black px-3 py-2.5">
              <span className="text-sm text-white/60">Revenue collected</span>
              <span className="text-sm font-semibold text-lime-300">${stats.paid.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black px-3 py-2.5">
              <span className="text-sm text-white/60">Outstanding A/R</span>
              <span className="text-sm font-semibold text-amber-300">${stats.outstanding.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black px-3 py-2.5">
              <span className="text-sm text-white/60">Total expenses</span>
              <span className="text-sm font-semibold text-rose-300">${stats.expenses.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-lime-400/30 bg-lime-400/5 px-3 py-2.5">
              <span className="text-sm font-medium text-white">Net profit</span>
              <span className="text-base font-bold text-lime-300">${(stats.paid - stats.expenses).toLocaleString()}</span>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}