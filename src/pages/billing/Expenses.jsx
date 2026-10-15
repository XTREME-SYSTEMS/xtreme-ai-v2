import EntityTable from "@/components/EntityTable";
import StatusBadge from "@/components/StatusBadge";
import { Wallet } from "lucide-react";

export default function Expenses() {
  return (
    <EntityTable
      entity="Expense" title="Expenses" subtitle="Track business expenses by category."
      emptyIcon={Wallet} emptyTitle="No expenses yet"
      columns={[
        { key: "vendor", label: "Vendor" },
        { key: "category", label: "Category" },
        { key: "amount", label: "Amount", render: (it) => (it.amount ? `$${Number(it.amount).toLocaleString()}` : "—") },
        { key: "date", label: "Date", render: (it) => (it.date ? new Date(it.date).toLocaleDateString() : "—") },
        { key: "status", label: "Status", render: (it) => <StatusBadge status={it.status} /> },
      ]}
    />
  );
}