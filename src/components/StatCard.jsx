import { cn } from "@/lib/utils";

export default function StatCard({ label, value, sub, icon: Icon, accent = "text-lime-400" }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-white/40">{label}</span>
        {Icon && <Icon className={cn("h-4 w-4", accent)} />}
      </div>
      <div className={cn("mt-2 text-2xl font-semibold", accent)}>{value}</div>
      {sub && <div className="mt-1 text-xs text-white/40">{sub}</div>}
    </div>
  );
}