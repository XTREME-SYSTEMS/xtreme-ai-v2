import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, EmptyState } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import CommandCenter from "@/pages/CommandCenter";
import ClientDashboard from "@/pages/ClientDashboard";
import { FlaskConical, Plus, Trash2, Check, X, Loader2, RefreshCw, Sparkles } from "lucide-react";

const RISK_OPTS = ["green", "yellow", "red"];

export default function TestLab() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState({ entity_type: "", requested_action: "", risk_level: "yellow", notes: "" });

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.Approval.list("-created_date", 50);
      setApprovals(list);
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const bump = () => setRefreshKey((k) => k + 1);
  const reload = async () => { await load(); bump(); };

  const addApproval = async () => {
    if (!form.entity_type || !form.requested_action) return;
    setBusy("add");
    try {
      await base44.entities.Approval.create({ ...form, status: "pending" });
      setForm({ entity_type: "", requested_action: "", risk_level: "yellow", notes: "" });
      await reload();
    } catch (e) {}
    setBusy(null);
  };

  const decide = async (id, status) => {
    setBusy(id + status);
    try {
      await base44.entities.Approval.update(id, { status, decided_at: new Date().toISOString(), decision_by: "test-lab" });
      await reload();
    } catch (e) {}
    setBusy(null);
  };

  const remove = async (id) => {
    setBusy(id + "del");
    try {
      await base44.entities.Approval.delete(id);
      await reload();
    } catch (e) {}
    setBusy(null);
  };

  const seedSample = async () => {
    setBusy("seed");
    try {
      await base44.entities.Approval.bulkCreate([
        { entity_type: "BrandPack", requested_action: "Approve brand palette v2", risk_level: "yellow", status: "pending", notes: "Logo + color system" },
        { entity_type: "WebsitePack", requested_action: "Release preview build to production", risk_level: "red", status: "pending", notes: "Homepage + pricing" },
        { entity_type: "MarketingPack", requested_action: "Approve Google Ads copy", risk_level: "yellow", status: "pending", notes: "3 ad variants" },
      ]);
      await reload();
    } catch (e) {}
    setBusy(null);
  };

  const clearAll = async () => {
    if (!window.confirm("Delete ALL approvals? This cannot be undone.")) return;
    setBusy("clear");
    try {
      await base44.entities.Approval.deleteMany({});
      await reload();
    } catch (e) {}
    setBusy(null);
  };

  return (
    <div>
      <PageHeader title="Test Lab" subtitle="Admin & client dashboards side-by-side, live. Add, delete, or modify approvals to watch both update in real time." />

      <Panel title="Approval Controls — Add / Modify / Delete">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="text-xs text-white/50">Entity type</label>
                <input value={form.entity_type} onChange={(e) => setForm({ ...form, entity_type: e.target.value })} placeholder="e.g. BrandPack" className="w-full rounded-md border border-white/15 bg-black px-2.5 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-white/50">Requested action</label>
                <input value={form.requested_action} onChange={(e) => setForm({ ...form, requested_action: e.target.value })} placeholder="e.g. Approve brand palette" className="w-full rounded-md border border-white/15 bg-black px-2.5 py-2 text-sm text-white" />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="text-xs text-white/50">Risk level</label>
                <select value={form.risk_level} onChange={(e) => setForm({ ...form, risk_level: e.target.value })} className="w-full rounded-md border border-white/15 bg-black px-2.5 py-2 text-sm text-white">
                  {RISK_OPTS.map((r) => <option key={r} value={r} className="bg-black">{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/50">Notes (optional)</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="w-full rounded-md border border-white/15 bg-black px-2.5 py-2 text-sm text-white" />
              </div>
            </div>
            <button onClick={addApproval} disabled={busy === "add" || !form.entity_type || !form.requested_action} className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3.5 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50">
              {busy === "add" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Approval
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <button onClick={seedSample} disabled={busy === "seed"} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white hover:bg-white/5 disabled:opacity-50">
                {busy === "seed" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-lime-400" />} Seed sample
              </button>
              <button onClick={reload} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white hover:bg-white/5 disabled:opacity-50">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
              <button onClick={clearAll} disabled={busy === "clear"} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/10 disabled:opacity-50">
                {busy === "clear" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete all
              </button>
            </div>
            <div className="text-xs text-white/40">{approvals.length} approval(s) — modify or delete below; both dashboards update live.</div>
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <EmptyState icon={FlaskConical} title="Loading…" />
          ) : approvals.length === 0 ? (
            <EmptyState icon={FlaskConical} title="No approvals" subtitle="Add one above or seed sample data." />
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {approvals.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black px-3 py-2">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${a.risk_level === "red" ? "text-rose-400" : a.risk_level === "yellow" ? "text-amber-400" : "text-emerald-400"}`}>{a.risk_level || "green"}</span>
                  <StatusBadge status={a.status} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-white">{a.requested_action}</div>
                    <div className="truncate text-xs text-white/40">{a.entity_type}{a.notes ? ` · ${a.notes}` : ""}</div>
                  </div>
                  <button onClick={() => decide(a.id, "approved")} disabled={busy === a.id + "approved"} title="Approve" className="inline-flex items-center gap-1 rounded-md bg-lime-400 px-2 py-1 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-50"><Check className="h-3 w-3" /></button>
                  <button onClick={() => decide(a.id, "rejected")} disabled={busy === a.id + "rejected"} title="Reject" className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-xs font-semibold text-white hover:bg-white/5 disabled:opacity-50"><X className="h-3 w-3" /></button>
                  <button onClick={() => remove(a.id)} disabled={busy === a.id + "del"} title="Delete" className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 px-2 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-zinc-950">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-lime-400" />
            <h2 className="text-sm font-semibold text-white">Admin Dashboard</h2>
            <span className="ml-auto text-xs text-white/40">/client-portal · admin view</span>
          </div>
          <div className="overflow-y-auto p-4" style={{ maxHeight: "70vh" }}>
            <div key={`admin-${refreshKey}`}><CommandCenter /></div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-lime-400" />
            <h2 className="text-sm font-semibold text-white">Client Dashboard</h2>
            <span className="ml-auto text-xs text-white/40">/client-portal · client view</span>
          </div>
          <div className="overflow-y-auto p-4" style={{ maxHeight: "70vh" }}>
            <div key={`client-${refreshKey}`}><ClientDashboard /></div>
          </div>
        </div>
      </div>
    </div>
  );
}