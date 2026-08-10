import { cn } from "@/lib/utils";

export default function ScoreBar({ value, max = 100, label, className }) {
  const v = Math.max(0, Math.min(max, value || 0));
  const pct = (v / max) * 100;
  const color = v >= 80 ? "bg-emerald-500" : v >= 60 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <div className="flex justify-between text-xs">
          <span className="text-white/50">{label}</span>
          <span className="font-mono text-white/80">{Math.round(v)}</span>
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}