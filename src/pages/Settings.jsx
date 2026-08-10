import { PageHeader, Panel } from "@/components/ui";
import { ShieldCheck, Lock, Cpu, Database, GitBranch } from "lucide-react";

const TIERS = [
  { color: "emerald", label: "Green — Automatic", desc: "Research, analysis, public-data reads, draft generation, preview generation, sandbox tests, receipts.", icon: ShieldCheck },
  { color: "amber", label: "Yellow — Preview / Draft only", desc: "Schema drafts, connector setup plans, migration dry-runs, draft outreach, preview deployments.", icon: Lock },
  { color: "rose", label: "Red — Explicit operator approval", desc: "Production deployment, domain purchase, DNS, billing/spend, live ads, outreach, calls/SMS/email, destructive deletes.", icon: Lock },
];

const SYSTEM = [
  { icon: Cpu, label: "Platform", value: "Base44 Universal Growth Factory v1.0" },
  { icon: Database, label: "Entities", value: "30 (source-truth ENTITY_MODEL)" },
  { icon: GitBranch, label: "Phase", value: "Architecture → Preview Build" },
  { icon: ShieldCheck, label: "Production gate", value: "Locked — pending validation + operator approval" },
];

export default function Settings() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="System configuration, governance tiers, and deployment gate." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Governance Tiers">
          <div className="space-y-3">
            {TIERS.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.label} className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                  <Icon className={`mt-0.5 h-5 w-5 ${t.color === "emerald" ? "text-emerald-400" : t.color === "amber" ? "text-amber-400" : "text-rose-400"}`} />
                  <div>
                    <div className="text-sm font-medium text-slate-200">{t.label}</div>
                    <p className="mt-0.5 text-xs text-slate-400">{t.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel title="System">
          <div className="space-y-3">
            {SYSTEM.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm text-slate-400">{s.label}:</span>
                  <span className="text-sm font-medium text-slate-200">{s.value}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Signature Command</div>
            <div className="mt-1 font-mono text-sm text-cyan-300">THROW THE BOOK AT IT</div>
          </div>
        </Panel>
      </div>
    </div>
  );
}