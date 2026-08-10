import { useState } from "react";
import { X } from "lucide-react";
import { LoadingButton } from "@/components/ui";

// Reusable create modal driven by a field config.
// fields: [{ key, label, type: "text"|"number"|"date"|"email"|"select"|"textarea", options?, required?, default? }]
export default function CreateModal({ open, onClose, title, fields, onSubmit, loading }) {
  const [form, setForm] = useState({});
  if (!open) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    await onSubmit(form);
    setForm({});
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-zinc-950 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-xs font-medium text-white/60">{f.label}</label>
              {f.type === "select" ? (
                <select value={form[f.key] ?? f.default ?? ""} onChange={(e) => set(f.key, e.target.value)} className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white" required={f.required}>
                  <option value="">Select…</option>
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === "textarea" ? (
                <textarea value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} rows={3} className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white" required={f.required} />
              ) : (
                <input
                  type={f.type || "text"}
                  value={form[f.key] ?? ""}
                  onChange={(e) => set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white"
                  required={f.required}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <LoadingButton loading={loading} type="submit">{loading ? "Saving…" : "Create"}</LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}