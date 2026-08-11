import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, EmptyState, LoadingButton } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import { BookOpen, Loader2, Plus, X, Sparkles } from "lucide-react";

const STEPS = ["name", "url", "brand", "logo", "content", "images", "seo_aeo"];

export default function PromptLibraryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const list = await base44.entities.PromptLibrary.list("-created_date", 100);
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
    if (!editing.name || !editing.step || !editing.prompt_text) return;
    if (editing.id) {
      await base44.entities.PromptLibrary.update(editing.id, { ...editing });
    } else {
      await base44.entities.PromptLibrary.create({ ...editing, status: "active", niche: editing.niche || "general", quality_tier: editing.quality_tier || "ultra" });
    }
    setEditing(null);
    await load();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-lime-400" /></div>;

  return (
    <div>
      <PageHeader title="Prompt Library" subtitle="Ultra-quality prompts that drive every generator step in the Website Factory. Use curly-brace variables for interpolation.">
        <LoadingButton onClick={seed} loading={seeding}><Sparkles className="h-4 w-4" /> Seed Defaults</LoadingButton>
        <LoadingButton onClick={() => setEditing({ name: "", step: "name", niche: "general", prompt_text: "", quality_tier: "ultra", model_hint: "claude_sonnet_4_6", notes: "" })}><Plus className="h-4 w-4" /> New Prompt</LoadingButton>
      </PageHeader>

      {items.length === 0 && !editing ? (
        <EmptyState icon={BookOpen} title="No prompts yet" subtitle="Seed the default ultra-quality prompt set or create your own.">
          <LoadingButton onClick={seed} loading={seeding}><Sparkles className="h-4 w-4" /> Seed Defaults</LoadingButton>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {STEPS.map((step) => {
            const stepItems = items.filter((i) => i.step === step);
            if (!stepItems.length) return null;
            return (
              <Panel key={step} title={`Step · ${step}`}>
                <div className="space-y-2">
                  {stepItems.map((p) => (
                    <div key={p.id} className="rounded-lg border border-white/10 bg-zinc-950 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium text-white">{p.name}</div>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[10px]">
                        <span className="rounded border border-lime-400/30 bg-lime-400/10 px-1.5 py-0.5 text-lime-300">{p.niche || "general"}</span>
                        <span className="rounded border border-white/15 px-1.5 py-0.5 text-white/50">{p.quality_tier}</span>
                        {p.model_hint && <span className="text-white/30">{p.model_hint}</span>}
                      </div>
                      <pre className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-black/40 p-2 text-[11px] text-white/50">{p.prompt_text}</pre>
                      <button onClick={() => setEditing({ ...p })} className="mt-2 text-xs font-medium text-lime-400 hover:text-lime-300">Edit →</button>
                    </div>
                  ))}
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEditing(null)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/15 bg-zinc-950 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">{editing.id ? "Edit Prompt" : "New Prompt"}</h3>
              <button onClick={() => setEditing(null)} className="text-white/50 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <LabeledInput label="Name" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">Step</div>
                <select value={editing.step} onChange={(e) => setEditing({ ...editing, step: e.target.value })} className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white">
                  {STEPS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <LabeledInput label="Niche ('general' = universal)" value={editing.niche} onChange={(v) => setEditing({ ...editing, niche: v })} />
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">Prompt text — use double-curly variables</div>
                <textarea value={editing.prompt_text} onChange={(e) => setEditing({ ...editing, prompt_text: e.target.value })} rows={8} className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 font-mono text-xs text-white" />
              </div>
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">Quality tier</div>
                <select value={editing.quality_tier} onChange={(e) => setEditing({ ...editing, quality_tier: e.target.value })} className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white">
                  <option value="ultra">ultra</option>
                  <option value="premium">premium</option>
                  <option value="standard">standard</option>
                </select>
              </div>
              <LabeledInput label="Model hint" value={editing.model_hint || ""} onChange={(v) => setEditing({ ...editing, model_hint: v })} />
              <LabeledInput label="Notes" value={editing.notes || ""} onChange={(v) => setEditing({ ...editing, notes: v })} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <LoadingButton onClick={() => setEditing(null)} variant="ghost">Cancel</LoadingButton>
              <LoadingButton onClick={save}>Save Prompt</LoadingButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LabeledInput({ label, value, onChange }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white" />
    </div>
  );
}