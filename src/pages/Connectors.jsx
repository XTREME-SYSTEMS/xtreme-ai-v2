import { PageHeader, Panel } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import { Plug, CheckCircle2, AlertCircle } from "lucide-react";

const CONNECTORS = [
  { name: "Google Calendar", type: "googlecalendar", mode: "BYO shared" },
  { name: "Google Drive", type: "googledrive", mode: "BYO shared" },
  { name: "Google Sheets", type: "googlesheets", mode: "BYO shared" },
  { name: "Google Docs", type: "googledocs", mode: "BYO shared" },
  { name: "Google Tasks", type: "googletasks", mode: "BYO shared" },
  { name: "Gmail", type: "gmail", mode: "BYO shared" },
  { name: "HubSpot", type: "hubspot", mode: "BYO shared" },
  { name: "Supabase", type: "supabase", mode: "BYO shared" },
  { name: "Google Search Console", type: "google_search_console", mode: "Shared" },
  { name: "Slack", type: "slack", mode: "Shared / App user" },
];

export default function Connectors() {
  return (
    <div>
      <PageHeader title="Connectors" subtitle="Workspace-registered and platform connectors. Authorization happens in the builder — no secrets are stored in source or shown in UI." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CONNECTORS.map((c) => (
          <Panel key={c.type}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Plug className="h-5 w-5 text-cyan-400" />
                <div>
                  <div className="text-sm font-medium text-slate-200">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.mode}</div>
                </div>
              </div>
              <StatusBadge status="mocked" />
            </div>
            <p className="mt-3 text-xs text-slate-500">Registered in workspace. Connect via the builder's Connectors panel to activate for workflows and agents.</p>
          </Panel>
        ))}
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Protected actions (live outreach, domain purchase, ad spend, DNS) remain locked behind explicit operator approval gates even after connectors are connected.</span>
      </div>
    </div>
  );
}