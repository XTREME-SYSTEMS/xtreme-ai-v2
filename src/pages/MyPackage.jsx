import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Package, Info, CheckCircle, ChevronRight } from "lucide-react";
import { useClientTrack } from "@/hooks/useClientTrack";
import { getPackage } from "@/lib/packageContents";
import { getProductDetails } from "@/lib/productDetails";
import PackageTimeline from "@/components/client/PackageTimeline";
import PackageCatalog from "@/components/client/PackageCatalog";
import PurchaseDetailModal from "@/components/client/PurchaseDetailModal";

// Dedicated page for the client's purchased package — the top-level
// destination of the client portal. Shows the package, its approval-gated
// build timeline, and inline approve/reject for any pending gate.
export default function MyPackage() {
  const [user, setUser] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [activePurchase, setActivePurchase] = useState(null);
  const { track } = useClientTrack(user);
  const pkg = getPackage(track.key);

  const load = async () => {
    const [paid, pending, approved] = await Promise.all([
      base44.entities.Base44Purchase.filter({ status: "paid" }, "-paidAt", 20),
      base44.entities.Approval.filter({ status: "pending" }, "-created_date", 50),
      base44.entities.Approval.filter({ status: "approved" }, "-created_date", 50),
    ]);
    setPurchases(paid);
    setApprovals([...pending, ...approved]);
  };

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        await load();
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    document.title = "My Package · Lead Gen Near You";
  }, []);

  const decide = async (id, status) => {
    setBusy(id);
    try {
      await base44.entities.Approval.update(id, {
        status,
        decided_at: new Date().toISOString(),
        decision_by: user?.email || "client",
      });
      await load();
    } catch (e) {}
    setBusy(null);
  };

  const pendingCount = approvals.filter((a) => a.status === "pending").length;

  const fmtMoney = (p) => {
    if (!p?.amount) return "";
    const sym = p.currency === "USD" ? "$" : "";
    return `${sym}${p.amount}${p.currency ? ` ${p.currency}` : ""}`;
  };
  const fmtDate = (iso) => {
    if (!iso) return "";
    try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
    catch { return ""; }
  };

  return (
    <div>
      {/* What you paid for — the source of truth the whole system keys off */}
      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <Package className="h-4 w-4" /> What You Paid For
        </div>
        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-white/50">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-lime-400" /> Loading your purchase…
          </div>
        ) : purchases.length === 0 ? (
          <div className="mt-3">
            <h1 className="text-xl font-semibold text-white sm:text-2xl">No package yet</h1>
            <p className="mt-1 text-sm text-white/50">
              You haven't purchased a package. Choose a plan, tool, or service below to get started.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {purchases.map((p, idx) => {
              const detail = getProductDetails(p.productId);
              const Icon = detail.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePurchase(p)}
                  className="group flex w-full items-center gap-4 rounded-lg border border-white/10 bg-zinc-950 p-4 text-left transition-all hover:border-lime-400/50 hover:bg-white/5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-lime-400/40 text-sm font-semibold text-lime-400">
                    {idx + 1}
                  </div>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${detail.accent}`}>
                    <Icon className="h-5 w-5 text-lime-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-white">{p.productName || p.productId || pkg.title}</h3>
                      <span className="rounded bg-lime-400/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lime-400">Active</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-white/50">{detail.tagline}</p>
                    <p className="mt-0.5 text-[11px] text-white/40">
                      Paid{p.paidAt ? ` on ${fmtDate(p.paidAt)}` : ""}{p.orderId ? ` · Order ${p.orderId.slice(0, 8)}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {p.amount && <div className="text-lg font-bold text-lime-400">{fmtMoney(p)}</div>}
                    {p.quantity > 1 && <div className="text-xs text-white/40">Qty {p.quantity}</div>}
                    <span className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-lime-400 opacity-0 transition-opacity group-hover:opacity-100">
                      Details <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4">
        <h2 className="text-base font-semibold text-white">{pkg.title} — Build Timeline</h2>
        <p className="text-sm text-white/50">{pkg.subtitle}</p>
      </div>

      {pendingCount > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-300">
          <Info className="h-4 w-4 shrink-0" />
          You have <span className="font-semibold">{pendingCount}</span> step{pendingCount === 1 ? "" : "s"} awaiting your approval below.
        </div>
      )}

      <div className="mt-4 rounded-xl border border-white/10 bg-zinc-900 p-4">
        <h2 className="text-sm font-semibold text-white">Your Build Timeline</h2>
        <p className="mb-4 text-xs text-white/50">
          Each gated step needs your approval before we continue.
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-lime-400" />
          </div>
        ) : (
          <PackageTimeline pkg={pkg} user={user} approvals={approvals} busy={busy} onDecide={decide} />
        )}
      </div>

      <PurchaseDetailModal purchase={activePurchase} onClose={() => setActivePurchase(null)} />

      {/* Everything we sell — plans, tools & services */}
      <div className="mt-10 border-t border-white/10 pt-8">
        <h2 className="text-base font-semibold text-white">Everything we offer</h2>
        <p className="mb-6 text-sm text-white/50">Plans, à-la-carte tools, and done-for-you services available to you.</p>
        <PackageCatalog />
      </div>
    </div>
  );
}