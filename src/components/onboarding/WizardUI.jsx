import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

// Shared UI helpers for the BusinessProfile wizard. Kept in one file so the
// main page stays lean and every step gets consistent styling.

export const inputCls =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm text-black placeholder:text-black/30 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400";

export function Section({ title, hint, icon: Icon, children }) {
  return (
    <div className="rounded-lg border border-black/10 bg-black/[0.02] p-4">
      <div className="mb-3 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-lime-400" />}
        <h3 className="text-sm font-semibold text-black">{title}</h3>
        {hint && <span className="text-xs text-black/40">· {hint}</span>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function Field({ label, hint, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-black">
        {label} {required && <span className="text-lime-400">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-black/40">{hint}</p>}
    </div>
  );
}

// Multi-choice chip picker. `single` restricts to one selection (radio-style).
export function Chips({ options, selected, onToggle, single }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = single ? selected[0] === opt : selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors " +
              (on
                ? "border-lime-400 bg-lime-400/15 text-lime-600"
                : "border-black/15 bg-white text-black/60 hover:border-black/30")
            }
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// Large selectable card for single-choice steps (stage, industry, business type).
export function OptionCard({ label, desc, icon: Icon, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all " +
        (selected
          ? "border-lime-400 bg-lime-400/10"
          : "border-black/10 bg-white hover:border-black/25")
      }
    >
      {Icon && (
        <div className={
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl " +
          (selected ? "bg-lime-400/20" : "bg-black/5")
        }>
          {typeof Icon === "string" ? Icon : <Icon className="h-5 w-5 text-lime-400" />}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className={"text-sm font-semibold " + (selected ? "text-lime-600" : "text-black")}>{label}</div>
        {desc && <div className="mt-0.5 text-xs text-black/50">{desc}</div>}
      </div>
      {selected && <CheckCircle2 className="h-5 w-5 shrink-0 text-lime-400" />}
    </button>
  );
}

// Step progress dots at the top of the wizard.
export function ProgressDots({ steps, current }) {
  return (
    <div className="mb-6 flex items-center gap-1.5">
      {steps.map((s, i) => (
        <div key={s.key} className="flex flex-1 items-center gap-1.5">
          <div className="flex items-center gap-2">
            <div className={
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors " +
              (i < current ? "bg-lime-400 text-black" :
               i === current ? "border-2 border-lime-400 bg-lime-400/10 text-lime-400" :
               "border border-black/15 bg-white text-black/30")
            }>
              {i < current ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={
              "hidden text-xs font-medium sm:inline " +
              (i <= current ? "text-black" : "text-black/30")
            }>{s.title}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={"h-0.5 flex-1 rounded " + (i < current ? "bg-lime-400" : "bg-black/10")} />
          )}
        </div>
      ))}
    </div>
  );
}

// Bottom navigation buttons for the wizard.
export function NavButtons({ step, total, onBack, onNext, onSubmit, nextLabel, canNext, saving, isLast }) {
  return (
    <div className="mt-6 flex items-center gap-3">
      {step > 0 && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-4 py-2.5 text-sm font-medium text-black/70 hover:border-black/30"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
      )}
      {isLast ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
        >
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><CheckCircle2 className="h-4 w-4" /> Save & Continue</>}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/40"
        >
          {nextLabel || "Continue"} <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}