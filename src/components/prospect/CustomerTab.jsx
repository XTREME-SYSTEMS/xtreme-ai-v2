import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { LoadingButton, EmptyState } from "@/components/ui";
import { buildCustomer, logReceipt } from "@/lib/lgny";
import { Sparkles, Loader2, Users } from "lucide-react";

export default function CustomerTab({ businessId, businessName, prospect }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities.CustomerProfile.filter({ business_id: businessId }, "-created_date", 1)
      .then((r) => setProfile(r[0])).finally(() => setLoading(false));
  };
  useEffect(load, [businessId]);

  const run = async () => {
    setGenerating(true);
    try {
      const res = await buildCustomer(prospect);
      await base44.entities.CustomerProfile.create({ ...res, business_id: businessId });
      await logReceipt({ agent_or_workflow: "Customer Intelligence Agent", action: "build_customer", entity_type: "CustomerProfile", entity_id: businessId, status: "success" });
      load();
    } catch (e) {
      await logReceipt({ agent_or_workflow: "Customer Intelligence Agent", action: "build_customer", status: "failed", warnings: String(e) });
    }
    setGenerating(false);
  };

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
  if (!profile) return (
    <EmptyState icon={Users} title="No customer profile yet" subtitle="Model the target customer, journey, objections, and conversion event.">
      <LoadingButton loading={generating} onClick={run}><Sparkles className="h-4 w-4" /> Build Customer Profile</LoadingButton>
    </EmptyState>
  );

  const lists = [["problems", "Problems"], ["triggers", "Triggers"], ["objections", "Objections"], ["questions", "Questions"], ["journey", "Journey"]];
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-slate-300"><span className="text-slate-500">Primary:</span> {profile.primary_customer || "—"}</div>
        <LoadingButton loading={generating} onClick={run} variant="ghost"><Sparkles className="h-4 w-4 text-cyan-400" /> Rebuild</LoadingButton>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {lists.map(([k, label]) => (
          <div key={k} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
            <ul className="mt-2 space-y-1">
              {(profile[k] || []).map((x, i) => <li key={i} className="text-sm text-slate-300">• {x}</li>)}
            </ul>
          </div>
        ))}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Conversion Event</div>
          <p className="mt-2 text-sm text-slate-300">{profile.conversion_event || "—"}</p>
          <div className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Secondary Customer</div>
          <p className="mt-1 text-sm text-slate-300">{profile.secondary_customer || "—"}</p>
        </div>
      </div>
    </div>
  );
}