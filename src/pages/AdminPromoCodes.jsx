import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Tag, Plus, Trash2, Loader2, Check, X, Edit3, Power, Copy, Sparkles, Zap, Calendar, Gift, Clock, Star } from "lucide-react";
import { SERVICE_CATALOG } from "@/lib/serviceCatalog";

// Pre-designed access pass templates — quick-select buttons that pre-fill the
// form. The admin can still customize everything after selecting a template.
const PASS_TEMPLATES = [
  {
    id: "weekly_deal",
    label: "Weekly Deal",
    icon: Calendar,
    passType: "weekly_deal",
    discountType: "percentage",
    discountValue: 25,
    durationDays: 7,
    capabilities: ["weekly_deal"],
    description: "Weekly deal — 25% off, valid 7 days",
  },
  {
    id: "free_day_pass",
    label: "Free 1-Day Pass",
    icon: Clock,
    passType: "day_pass",
    discountType: "percentage",
    discountValue: 100,
    durationDays: 1,
    capabilities: ["free_usage", "1_day_pass"],
    description: "Free 1-day pass — 100% off, 1 day access",
  },
  {
    id: "free_usage",
    label: "Free Usage",
    icon: Gift,
    passType: "free_usage",
    discountType: "percentage",
    discountValue: 100,
    durationDays: 0,
    capabilities: ["free_usage"],
    description: "Free usage — 100% off, no time limit",
  },
  {
    id: "weekend_special",
    label: "Weekend Special",
    icon: Star,
    passType: "access_pass",
    discountType: "percentage",
    discountValue: 50,
    durationDays: 3,
    capabilities: ["weekend_special"],
    description: "Weekend special — 50% off, 3 day access",
  },
  {
    id: "first_month",
    label: "First Month Free",
    icon: Zap,
    passType: "access_pass",
    discountType: "percentage",
    discountValue: 100,
    durationDays: 30,
    capabilities: ["first_month_free", "full_access"],
    description: "First month free — 100% off, 30 days",
  },
  {
    id: "custom",
    label: "Custom",
    icon: Sparkles,
    passType: "custom",
    discountType: "percentage",
    discountValue: 0,
    durationDays: 0,
    capabilities: [],
    description: "Build your own — fully customizable",
  },
];

// Common capability chips the admin can quick-add. These are free-form
// strings — the admin can also type custom ones. Not tied to any external system.
const COMMON_CAPABILITIES = [
  "full_access", "lead_engine", "brand_generator", "website_builder",
  "seo_tools", "free_audit", "free_consultation", "1_day_pass", "1_week",
  "30_day_access", "weekly_deal", "weekend_special", "first_month_free",
  "unlimited_usage", "single_use", "stackable",
];

// Admin dashboard for managing promo codes. Create, edit, toggle, and delete
// codes. Each code has a pass type, stackable capabilities, discount, optional
// usage limit, date range, duration, and product restrictions. Pre-designed
// templates let the admin quick-start; the custom builder allows full control.
export default function AdminPromoCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [customCapability, setCustomCapability] = useState("");

  function emptyForm() {
    return {
      code: "",
      label: "",
      description: "",
      passType: "discount",
      capabilities: [],
      discountType: "percentage",
      discountValue: "",
      durationDays: 0,
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

  const applyTemplate = (template) => {
    setForm((f) => ({
      ...f,
      label: template.label,
      passType: template.passType,
      discountType: template.discountType,
      discountValue: String(template.discountValue),
      durationDays: template.durationDays,
      capabilities: template.capabilities,
      description: template.description,
    }));
  };

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const startEdit = (code) => {
    setEditing(code);
    setForm({
      code: code.code || "",
      label: code.label || "",
      description: code.description || "",
      passType: code.passType || "discount",
      capabilities: code.capabilities || [],
      discountType: code.discountType || "percentage",
      discountValue: String(code.discountValue ?? ""),
      durationDays: code.durationDays || 0,
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
    if (!form.code.trim() || form.discountValue === "") {
      setError("Code and discount value are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        label: form.label.trim(),
        description: form.description.trim(),
        passType: form.passType,
        capabilities: form.capabilities,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        durationDays: Number(form.durationDays) || 0,
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

  const toggleCapability = (cap) => {
    setForm((f) => {
      const caps = f.capabilities.includes(cap)
        ? f.capabilities.filter((c) => c !== cap)
        : [...f.capabilities, cap];
      return { ...f, capabilities: caps };
    });
  };

  const addCustomCapability = () => {
    const cap = customCapability.trim().toLowerCase().replace(/\s+/g, "_");
    if (!cap) return;
    if (!form.capabilities.includes(cap)) {
      setForm((f) => ({ ...f, capabilities: [...f.capabilities, cap] }));
    }
    setCustomCapability("");
  };

  const removeCapability = (cap) => {
    setForm((f) => ({ ...f, capabilities: f.capabilities.filter((c) => c !== cap) }));
  };

  const passTypeLabel = (pt) => {
    const labels = {
      discount: "Discount",
      access_pass: "Access Pass",
      free_usage: "Free Usage",
      day_pass: "Day Pass",
      weekly_deal: "Weekly Deal",
      custom: "Custom",
    };
    return labels[pt] || pt;
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
          <p className="text-sm text-white/50">Create and manage fully customizable promo codes — weekly deals, free passes, discounts, or anything you want.</p>
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

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl border border-lime-400/30 bg-zinc-950 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">{editing ? "Edit Promo Code" : "New Promo Code"}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Pre-designed templates */}
          {!editing && (
            <div>
              <label className="mb-2 block text-xs font-medium text-white/60">Quick-Start Templates</label>
              <div className="flex flex-wrap gap-2">
                {PASS_TEMPLATES.map((t) => {
                  const Icon = t.icon;
                  const isActive = form.passType === t.passType && form.label === t.label;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        isActive
                          ? "border-lime-400 bg-lime-400/20 text-lime-300"
                          : "border-white/15 text-white/50 hover:border-lime-400/40 hover:text-lime-300"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Basic fields */}
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
              <label className="mb-1 block text-xs font-medium text-white/60">Label (display name)</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Weekly Deal"
                className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">Pass Type</label>
              <select
                value={form.passType}
                onChange={(e) => setForm({ ...form, passType: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white focus:border-lime-400 focus:outline-none"
              >
                <option value="discount">Discount</option>
                <option value="access_pass">Access Pass</option>
                <option value="free_usage">Free Usage</option>
                <option value="day_pass">Day Pass</option>
                <option value="weekly_deal">Weekly Deal</option>
                <option value="custom">Custom</option>
              </select>
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
              <label className="mb-1 block text-xs font-medium text-white/60">Duration (days, 0 = no limit)</label>
              <input
                type="number"
                min="0"
                value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                placeholder="7"
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

          {/* Capabilities builder — stackable checkboxes */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">
              Access Capabilities (stackable — check all that apply)
            </label>
            {/* Selected capabilities */}
            {form.capabilities.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {form.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="inline-flex items-center gap-1 rounded-md border border-lime-400/40 bg-lime-400/15 px-2 py-1 text-[11px] font-medium text-lime-300"
                  >
                    {cap}
                    <button
                      type="button"
                      onClick={() => removeCapability(cap)}
                      className="text-lime-400/60 hover:text-lime-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {/* Common capability chips */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_CAPABILITIES.map((cap) => {
                const selected = form.capabilities.includes(cap);
                return (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => toggleCapability(cap)}
                    className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                      selected
                        ? "border-lime-400 bg-lime-400/20 text-lime-300"
                        : "border-white/15 text-white/50 hover:border-lime-400/40 hover:text-lime-300"
                    }`}
                  >
                    {selected ? "✓ " : ""}{cap}
                  </button>
                );
              })}
            </div>
            {/* Custom capability input */}
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={customCapability}
                onChange={(e) => setCustomCapability(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomCapability(); } }}
                placeholder="Add custom capability (e.g. vip_access)"
                className="flex-1 rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={addCustomCapability}
                className="rounded-lg border border-lime-400/40 px-3 py-2 text-sm font-medium text-lime-300 hover:bg-lime-400/10"
              >
                <Plus className="h-4 w-4" />
              </button>
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
                    {c.passType && c.passType !== "discount" && (
                      <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                        {passTypeLabel(c.passType)}
                      </span>
                    )}
                  </div>
                  {c.label && (
                    <div className="mt-0.5 text-xs font-medium text-lime-400/80">{c.label}</div>
                  )}
                  {c.description && (
                    <p className="mt-0.5 text-xs text-white/50">{c.description}</p>
                  )}
                  {/* Capabilities */}
                  {c.capabilities?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.capabilities.map((cap) => (
                        <span key={cap} className="rounded border border-lime-400/20 bg-lime-400/5 px-1.5 py-0.5 text-[10px] text-lime-400/70">
                          {cap}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/60">
                    <span>
                      {c.discountType === "percentage" ? `${c.discountValue}% off` : `$${c.discountValue} off`}
                    </span>
                    {c.durationDays > 0 && (
                      <span>{c.durationDays} day pass</span>
                    )}
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