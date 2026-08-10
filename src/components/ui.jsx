import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-white sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Panel({ title, children, className, action }) {
  return (
    <div className={cn("rounded-xl border border-white/10 bg-zinc-950", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function LoadingButton({ loading, children, onClick, disabled, variant = "primary", className }) {
  const variants = {
    primary: "bg-lime-400 text-black hover:bg-lime-300",
    ghost: "border border-white/15 text-white/80 hover:bg-white/5",
    danger: "bg-rose-500/90 text-white hover:bg-rose-500",
  };
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={cn("inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50", variants[variant], className)}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function EmptyState({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-zinc-950 px-6 py-12 text-center">
      {Icon && <Icon className="mb-3 h-8 w-8 text-lime-400/60" />}
      <p className="text-sm font-medium text-white">{title}</p>
      {subtitle && <p className="mt-1 max-w-md text-xs text-white/40">{subtitle}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}