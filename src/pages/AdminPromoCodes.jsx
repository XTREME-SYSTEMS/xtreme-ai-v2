import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Tag, Plus, Trash2, Loader2, Check, X, Edit3, Power, Copy } from "lucide-react";
import { SERVICE_CATALOG } from "@/lib/serviceCatalog";

// Admin dashboard for managing promo codes. Create, edit, toggle, and delete
// codes. Each code has a discount type (percentage/fixed), value, optional
// usage limit, date range, and product restrictions.
export default function AdminPromoCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function emptyForm() {
    return {
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      active: true,
      maxUses: 0,
      validFrom: "",
      validUntil: "",
      applicableProductIds: [],
      minOrderAmount: 0,
    };
  }

  const loadCodes = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.PromoCode.list("-created_date", 200);
      setCodes(all || []);
    } catch (e) {
      setError(e?.message || "Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCodes(); }, []);

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const startEdit = (code) => {
    setEditing(code);
    setForm({
      code: code.code || "",
      description: code.description || "",
      discountType: code.discountType || "percentage",
      discountValue: String(code.discountValue ?? ""),
      active: code.active !== false,
      maxUses: code.maxUses || 0,
      validFrom: code.validFrom ? code.validFrom.slice(0, 16) : "",
      validUntil: code.validUntil ? code.validUntil.slice(0, 16) : "",
      applicableProductIds: code.applicableProductIds || [],
      minOrderAmount: code.minOrderAmount || 0,
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.discountValue) {
      setError("Code and discount value are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        active: form.active,
        maxUses: Number(form.maxUses) || 0,
        validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
        applicableProductIds: form.applicableProductIds,
        minOrderAmount: Number(form.minOrderAmount) || 0,
      };
      if (editing) {
        await base44.entities.PromoCode.update(editing.id, payload);
      } else {
        await base44.entities.PromoCode.create(payload);
      }
      setShowForm(false);
      await loadCodes();
    } catch (e) {
      setError(e?.message || "Failed to save promo code");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (code) => {
    try {
      await base44.entities.PromoCode.update(code.id, { active: !code.active });
      await loadCodes();
    } catch (e) {
      setError(e?.message || "Failed to toggle code");
    }
  };

  const handleDelete = async (code) => {
    if (!confirm(`Delete promo code "${code.code}"?`)) return;
    try {
      await base44.entities.PromoCode.delete(code.id);
      await loadCodes();
    } catch (e) {
      setError(e?.message || "Failed to delete code");
    }
  };

  const toggleProduct = (productId) => {
    setForm((f) => {
      const ids = f.applicableProductIds.includes(productId)
        ? f.applicableProductIds.filter((id) => id !== productId)
        : [...f.applicableProductIds, productId];
      return { ...f, applicableProductIds: ids };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-lime-400/30 bg-lime-400/10">
          <Tag className="h-5 w-5 text-lime-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-white">Promo Codes</h1>
          <p className="text-sm text-white/50">Create and manage discount codes for checkout.</p>
        </div>
        <button
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-lime-300"
        >
          <Plus className="h-4 w-4" /> New Code
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-300">
          <X className="h-4 w-4" /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-400">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl border border-lime-400/30 bg-zinc-950 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">{editing ? "Edit Promo Code" : "New Promo Code"}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">Code</label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER25"
                className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">Description (internal)</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Summer sale 25% off"
                className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">Discount Type</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white focus:border-lime-400 focus:outline-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">
                Discount Value {form.discountType === "percentage" ? "(%)" : "($)"}
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                placeholder={form.discountType === "percentage" ? "25" : "50"}
                className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">Max Uses (0 = unlimited)</label>
              <input
                type="number"
                min="0"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white focus:border-lime-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">Min Order Amount ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white focus:border-lime-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">Valid From</label>
              <input
                type="datetime-local"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white focus:border-lime-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">Valid Until</label>
              <input
                type="datetime-local"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white focus:border-lime-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Product restrictions */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">
              Applicable Products (leave empty = all products)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SERVICE_CATALOG.map((s) => (
                <button
                  key={s.productId}
                  type="button"
                  onClick={() => toggleProduct(s.productId)}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                    form.applicableProductIds.includes(s.productId)
                      ? "border-lime-400 bg-lime-400/20 text-lime-300"
                      : "border-white/15 text-white/50 hover:border-lime-400/40 hover:text-lime-300"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-black"
            />
            Active
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white/60 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editing ? "Save Changes" : "Create Code"}
            </button>
          </div>
        </form>
      )}

      {/* Code list */}
      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin text-lime-400" /> Loading promo codes…
        </div>
      ) : codes.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-zinc-950 py-12 text-center">
          <Tag className="mx-auto h-8 w-8 text-white/20" />
          <p className="mt-3 text-sm text-white/40">No promo codes yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {codes.map((c) => (
            <div key={c.id} className="rounded-xl border border-white/10 bg-zinc-950 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-400/10">
                  <Tag className="h-5 w-5 text-lime-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{c.code}</span>
                    <button
                      onClick={() => navigator.clipboard?.writeText(c.code)}
                      className="text-white/30 hover:text-lime-400"
                      title="Copy code"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      c.active ? "bg-lime-400/20 text-lime-300" : "bg-white/10 text-white/40"
                    }`}>
                      {c.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {c.description && (
                    <p className="mt-0.5 text-xs text-white/50">{c.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/60">
                    <span>
                      {c.discountType === "percentage" ? `${c.discountValue}% off` : `$${c.discountValue} off`}
                    </span>
                    <span>
                      Uses: {c.usedCount || 0}{c.maxUses > 0 ? ` / ${c.maxUses}` : " / ∞"}
                    </span>
                    {c.validUntil && (
                      <span>Expires: {new Date(c.validUntil).toLocaleDateString()}</span>
                    )}
                    {c.applicableProductIds?.length > 0 && (
                      <span>{c.applicableProductIds.length} product(s)</span>
                    )}
                    {c.minOrderAmount > 0 && (
                      <span>Min: ${c.minOrderAmount}</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => handleToggle(c)}
                    className="rounded-md border border-white/15 p-1.5 text-white/50 hover:text-lime-400"
                    title={c.active ? "Deactivate" : "Activate"}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => startEdit(c)}
                    className="rounded-md border border-white/15 p-1.5 text-white/50 hover:text-lime-400"
                    title="Edit"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    className="rounded-md border border-white/15 p-1.5 text-white/50 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}