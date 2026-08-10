import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { LoadingButton, EmptyState } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import { logReceipt } from "@/lib/lgny";
import { Sparkles, Loader2, Check, Award } from "lucide-react";

export default function PacksTab({ businessId, businessName, mode, entity, generateFn, accent = "text-cyan-400" }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities[entity].filter({ business_id: businessId }, "option_number", 10)
      .then(setItems).finally(() => setLoading(false));
  };
  useEffect(load, [businessId]);

  const run = async () => {
    setGenerating(true);
    try {
      const options = await generateFn({ id: businessId, name: businessName });
      const toCreate = options.map((o, i) => ({
        business_id: businessId,
        option_number: i + 1,
        positioning: o.positioning || o.summary || o.title,
        promise: o.promise, tagline: o.tagline, logo_direction: o.logo_direction,
        colors: o.colors, typography: o.typography, imagery: o.imagery, voice: o.voice, hero: o.hero || o.homepage_concept,
        homepage_concept: o.homepage_concept, primary_tool: o.primary_tool, cta: o.cta,
        pages: o.pages ? (Array.isArray(o.pages) ? o.pages : o.pages.split(",")) : undefined,
        seo_architecture: o.seo_architecture, aeo_architecture: o.aeo_architecture, local_strategy: o.local_strategy,
        visual_direction: o.visual_direction, lead_journey: o.lead_journey,
        channels: o.channels ? (Array.isArray(o.channels) ? o.channels : o.channels.split(",")) : undefined,
        tactics: o.tactics ? (Array.isArray(o.tactics) ? o.tactics : o.tactics.split(",")) : undefined,
        cost_level: o.cost_level, speed: o.speed, risk: o.risk, measurement: o.measurement,
        kpis: o.kpis ? (Array.isArray(o.kpis) ? o.kpis : o.kpis.split(",")) : undefined,
        status: "draft", score: o.score,
      }));
      if (toCreate.length) await base44.entities[entity].bulkCreate(toCreate);
      await logReceipt({ agent_or_workflow: `${mode} Strategist`, action: `generate_${mode}_packs`, entity_type: entity, entity_id: businessId, status: "success", outputs: { count: toCreate.length } });
      load();
    } catch (e) {
      await logReceipt({ agent_or_workflow: `${mode} Strategist`, action: `generate_${mode}_packs`, status: "failed", warnings: String(e) });
    }
    setGenerating(false);
  };

  const approve = async (item) => {
    await base44.entities[entity].bulkUpdate(
      items.map((i) => ({ id: i.id, status: i.id === item.id ? "approved" : "rejected" }))
    );
    await base44.entities.Approval.create({ entity_type: entity, entity_id: item.id, requested_action: `approve ${mode} pack #${item.option_number}`, risk_level: "yellow", status: "approved", decision_by: "operator", notes: businessName });
    await base44.entities.OperatorDecision.create({ topic: `${mode}_pack`, choice: `option_${item.option_number}`, notes: businessName });
    await logReceipt({ agent_or_workflow: "Operator", action: `approve_${mode}_pack`, entity_type: entity, entity_id: item.id, status: "success" });
    load();
  };

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;

  if (items.length === 0) return (
    <EmptyState icon={Award} title={`No ${mode} packs yet`} subtitle={`Generate EXACTLY THREE ${mode} directions for operator selection.`}>
      <LoadingButton loading={generating} onClick={run}><Sparkles className="h-4 w-4" /> Generate 3 {mode} packs</LoadingButton>
    </EmptyState>
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-slate-400">{items.length} option(s) · operator must approve one</span>
        <LoadingButton loading={generating} onClick={run} variant="ghost"><Sparkles className="h-4 w-4 text-cyan-400" /> Regenerate</LoadingButton>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {items.map((it) => (
          <div key={it.id} className={`rounded-xl border bg-slate-900/60 p-4 ${it.status === "approved" ? "border-emerald-500/50" : "border-slate-800"}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${accent}`}>Option {it.option_number}</span>
              <StatusBadge status={it.status} />
            </div>
            <h4 className="mt-1 text-base font-semibold text-white">{it.positioning || it.homepage_concept || it.tagline || `Pack ${it.option_number}`}</h4>
            {it.tagline && <p className="mt-0.5 text-sm italic text-slate-400">"{it.tagline}"</p>}
            {it.promise && <p className="mt-2 text-sm text-slate-300">{it.promise}</p>}
            <div className="mt-3 space-y-1.5">
              {it.logo_direction && <Field label="Logo" value={it.logo_direction} />}
              {it.colors && <Field label="Colors" value={it.colors} />}
              {it.typography && <Field label="Type" value={it.typography} />}
              {it.voice && <Field label="Voice" value={it.voice} />}
              {it.hero && <Field label="Hero" value={it.hero} />}
              {it.primary_tool && <Field label="Primary Tool" value={it.primary_tool} />}
              {it.cta && <Field label="CTA" value={it.cta} />}
              {it.seo_architecture && <Field label="SEO" value={it.seo_architecture} />}
              {it.aeo_architecture && <Field label="AEO" value={it.aeo_architecture} />}
              {it.local_strategy && <Field label="Local" value={it.local_strategy} />}
              {it.lead_journey && <Field label="Lead Journey" value={it.lead_journey} />}
              {it.channels && <Field label="Channels" value={Array.isArray(it.channels) ? it.channels.join(", ") : it.channels} />}
              {it.tactics && <Field label="Tactics" value={Array.isArray(it.tactics) ? it.tactics.join(", ") : it.tactics} />}
              {it.cost_level && <Field label="Cost" value={it.cost_level} />}
              {it.measurement && <Field label="Measurement" value={it.measurement} />}
            </div>
            {it.score != null && <div className="mt-3 text-xs text-slate-500">Score: <span className="font-semibold text-white">{Math.round(it.score)}</span></div>}
            <button
              onClick={() => approve(it)}
              disabled={it.status === "approved"}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> {it.status === "approved" ? "Approved" : "Approve this option"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="w-20 shrink-0 text-slate-500">{label}</span>
      <span className="text-slate-300">{value}</span>
    </div>
  );
}