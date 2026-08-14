import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Package, Info } from "lucide-react";
import { useClientTrack } from "@/hooks/useClientTrack";
import { getPackage } from "@/lib/packageContents";
import PackageModal from "@/components/client/PackageModal";
import PackageTimeline from "@/components/client/PackageTimeline";
import ClientOnboarding from "@/components/ClientOnboarding";

// Dedicated page for the client's purchased package — the top-level
// destination of the client portal. Shows the package, its approval-gated
// build timeline, and inline approve/reject for any pending gate.
export default function MyPackage() {
  const [user, setUser] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [pkgOpen, setPkgOpen] = useState(false);
  const { track } = useClientTrack(user);
  const pkg = getPackage(track.key);

  const load = async () => {
    const [pending, approved] = await Promise.all([
      base44.entities.Approval.filter({ status: "pending" }, "-created_date", 50),
      base44.entities.Approval.filter({ status: "approved" }, "-created_date", 50),
    ]);
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

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
            <Package className="h-4 w-4" /> Your Package
          </div>
          <h1 className="mt-1 text-xl font-semibold text-white sm:text-2xl">{pkg.title}</h1>
          <p className="mt-1 text-sm text-white/50">
            Welcome{user?.full_name ? `, ${user.full_name}` : ""} — {pkg.subtitle}
          </p>
        </div>
        <button
          onClick={() => setPkgOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-lime-400 px-4 py-2.5 text-sm font-semibold text-lime-400 transition-colors hover:bg-lime-400/10"
        >
          <Info className="h-4 w-4" />
          What's included
        </button>
      </div>

      {pendingCount > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-300">
          <Info className="h-4 w-4 shrink-0" />
          You have <span className="font-semibold">{pendingCount}</span> step{pendingCount === 1 ? "" : "s"} awaiting your approval below.
        </div>
      )}

      {user && !user.onboarded && (
        <div className="mt-6">
          <ClientOnboarding user={user} />
        </div>
      )}

      <div className="mt-6 rounded-xl border border-white/10 bg-zinc-900 p-4">
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

      <PackageModal open={pkgOpen} onClose={() => setPkgOpen(false)} pkg={pkg} />
    </div>
  );
}