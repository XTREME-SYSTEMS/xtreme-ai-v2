import { cn } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/lgny";

export default function StatusBadge({ status, className }) {
  const cls = STATUS_COLORS[status] || "bg-slate-500/15 text-slate-300 border-slate-500/30";
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize", cls, className)}>
      {status}
    </span>
  );
}