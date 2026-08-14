import { Check } from "lucide-react";

export default function BrandStepper({ steps, stepIndex, onStep }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-zinc-900 p-3">
      <div className="flex min-w-max items-center">
        {steps.map((s, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <button key={s.key} onClick={() => onStep(i)} className="flex items-center">
              <div className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                  active ? "border-lime-400 bg-lime-400 text-black"
                    : done ? "border-lime-400/40 bg-lime-400/10 text-lime-400"
                    : "border-white/15 text-white/40"
                }`}>
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <div className="text-left">
                  <div className={`text-xs font-medium ${active ? "text-white" : done ? "text-white/70" : "text-white/40"}`}>{s.label}</div>
                  <div className="hidden text-[10px] text-white/30 sm:block">{s.desc}</div>
                </div>
              </div>
              {i < steps.length - 1 && <div className="mx-2 h-px w-5 bg-white/15" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}