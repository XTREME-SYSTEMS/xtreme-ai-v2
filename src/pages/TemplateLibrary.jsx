import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, EmptyState, LoadingButton } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import { LayoutTemplate, Loader2, Plus, X, Sparkles } from "lucide-react";

export default function TemplateLibraryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const list = await base44.entities.TemplateLibrary.list("-created_date", 100);
    setItems(list);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const seed = async () => {
    setSeeding(true);
    try { await base44.functions.invoke("seedTemplateAndPromptLibrary", {}); await load(); } catch (e) {}
    setSeeding(false);
  };

  const save = async () => {
    if (!editing.name) return;
    if (editing.id) {
      await base44.entities.TemplateLibrary.update(editing.id, { ...editing });
    } else {
      await base44.entities.TemplateLibrary.create({ ...editing, status: "active" });
    }
    setEditing(null);
    await load();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-lime-400" /></div>;

  return (
    <div>
      <PageHeader title="Template Library" subtitle="Ultra-high-quality, niche-matched website templates that drive the Website Factory.">
        <LoadingButton onClick={seed} loading={seeding}><Sparkles className="h-4 w-4" /> Seed Defaults</LoadingButton>
        <LoadingButton onClick={() => setEditing({ name: "", niche: "general", layout_style: "", sections: [], design_direction: {}, conversion_principles: "", quality_score: 95 })}><Plus className="h-4 w-4" /> New Template</LoadingButton>
      </PageHeader>

      {items.length === 0 && !editing ? (
        <EmptyState icon={LayoutTemplate} title="No templates yet" subtitle="Seed the default ultra-quality templates or create your own.">
          <LoadingButton onClick={seed} loading={seeding}><Sparkles className="h-4 w-4" /> Seed Defaults</LoadingButton>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((t) => (
            <Panel key={t.id} title={t.name} action={<StatusBadge status={t.status} />}>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded border border-lime-400/30 bg-lime-400/10 px-2 py-0.5 text-lime-300">{t.niche || "general"}</span>
                  <span className="text-white/40">Quality: <span className="text-white/70">{t.quality_score}</span></span>
                </div>
                <p className="text-white/60">{t.layout_style}</p>
                {t.design_direction?.colors && <p className="text-xs text-white/40">🎨 {t.design_direction.colors}</p>}
                {t.design_direction?.typography && <p className="text-xs text-white/40">🔤 {t.design_direction.typography}</p>}
                {t.sections?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {t.sections.map((s, i) => <span key={i} className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/50">{s.name}</span>)}
                  </div>
                )}
                <button onClick={() => setEditing({ ...t, sections: t.sections || [] })} className="mt-1 text-xs font-medium text-lime-400 hover:text-lime-300">Edit →</button>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEditing(null)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/15 bg-zinc-950 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">{editing.id ? "Edit Template" : "New Template"}</h3>
              <button onClick={() => setEditing(null)} className="text-white/50 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <LabeledInput label="Name" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
              <LabeledInput label="Niche ('general' = universal)" value={editing.niche} onChange={(v) => setEditing({ ...editing, niche: v })} />
              <LabeledInput label="Layout style" value={editing.layout_style} onChange={(v) => setEditing({ ...editing, layout_style: v })} textarea />
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">Design Direction</div>
                <LabeledInput label="Colors" value={editing.design_direction?.colors || ""} onChange={(v) => setEditing({ ...editing, design_direction: { ...editing.design_direction, colors: v } })} />
                <LabeledInput label="Typography" value={editing.design_direction?.typography || ""} onChange={(v) => setEditing({ ...editing, design_direction: { ...editing.design_direction, typography: v } })} />
                <LabeledInput label="Imagery" value={editing.design_direction?.imagery || ""} onChange={(v) => setEditing({ ...editing, design_direction: { ...editing.design_direction, imagery: v } })} />
              </div>
              <LabeledInput label="Conversion principles" value={editing.conversion_principles} onChange={(v) => setEditing({ ...editing, conversion_principles: v })} textarea />
              <LabeledInput label="Quality score" value={String(editing.quality_score ?? 95)} onChange={(v) => setEditing({ ...editing, quality_score: Number(v) || 95 })} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <LoadingButton onClick={() => setEditing(null)} variant="ghost">Cancel</LoadingButton>
              <LoadingButton onClick={save}>Save Template</LoadingButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LabeledInput({ label, value, onChange, textarea }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</div>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white" />
      )}
    </div>
  );
}