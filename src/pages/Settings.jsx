import { Panel } from "@/components/ui";
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
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-foreground">System configuration, governance tiers, and deployment gate.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Governance Tiers" className="bg-background border-border">
          <div className="space-y-3">
            {TIERS.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.label} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <Icon className={`mt-0.5 h-5 w-5 ${t.color === "emerald" ? "text-emerald-500" : t.color === "amber" ? "text-amber-500" : "text-rose-500"}`} />
                  <div>
                    <div className="text-sm font-medium text-foreground">{t.label}</div>
                    <p className="mt-0.5 text-xs text-foreground">{t.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel title="System" className="bg-background border-border">
          <div className="space-y-3">
            {SYSTEM.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-lime-500" />
                  <span className="text-sm text-foreground">{s.label}:</span>
                  <span className="text-sm font-medium text-foreground">{s.value}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-lg border border-border p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground">Signature Command</div>
            <div className="mt-1 font-mono text-sm text-lime-600">THROW THE BOOK AT IT</div>
          </div>
        </Panel>
      </div>
    </div>
  );
}