import { X } from "lucide-react";

// Centered overlay showing the package the client paid for and its contents.
export default function PackageModal({ open, onClose, pkg }) {
  if (!open || !pkg) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-lime-400/40 bg-zinc-900 p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-white/50 hover:text-white" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <div className="text-xs font-semibold uppercase tracking-wider text-lime-400">Your Package</div>
        <h2 className="mt-1 text-xl font-bold text-white">{pkg.title}</h2>
        <p className="mt-1 text-sm text-white/60">{pkg.subtitle}</p>

        <div className="mt-5 space-y-2">
          {pkg.steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex items-start gap-3 rounded-lg border border-white/10 bg-zinc-950 p-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime-400/10 text-xs font-semibold text-lime-400">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-lime-400" />
                    <span className="text-sm font-medium text-white">{s.label}</span>
                    {s.gate && (
                      <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-400">
                        Approval
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-white/50">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-lime-400 py-2 text-sm font-semibold text-black hover:bg-lime-300"
        >
          Got it
        </button>
      </div>
    </div>
  );
}