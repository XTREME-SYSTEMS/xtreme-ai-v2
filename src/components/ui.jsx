import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-white sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Panel({ title, children, className, action }) {
  return (
    <div className={cn("rounded-xl border border-slate-800 bg-slate-900/60", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function LoadingButton({ loading, children, onClick, disabled, variant = "primary", className }) {
  const variants = {
    primary: "bg-cyan-500 text-slate-950 hover:bg-cyan-400",
    ghost: "border border-slate-700 text-slate-200 hover:bg-slate-800",
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-12 text-center">
      {Icon && <Icon className="mb-3 h-8 w-8 text-slate-600" />}
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {subtitle && <p className="mt-1 max-w-md text-xs text-slate-500">{subtitle}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}