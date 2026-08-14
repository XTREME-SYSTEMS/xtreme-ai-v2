import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Package } from "lucide-react";
import { useClientTrack } from "@/hooks/useClientTrack";
import { getPackage } from "@/lib/packageContents";
import PackageModal from "@/components/client/PackageModal";
import PackageTimeline from "@/components/client/PackageTimeline";
import ClientAssistantChat from "@/components/client/ClientAssistantChat";
import ClientOnboarding from "@/components/ClientOnboarding";

export default function ClientDashboard() {
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
    document.title = "Client Portal · Lead Gen Near You";
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

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-white sm:text-2xl">Client Portal</h1>
      <p className="mb-5 text-sm text-white/50">
        Welcome{user?.full_name ? `, ${user.full_name}` : ""} — your {pkg.title} build, step by step.
      </p>

      {/* Package button (top-left) → opens centered modal */}
      <div className="mb-6">
        <button
          onClick={() => setPkgOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300"
        >
          <Package className="h-4 w-4" />
          My Package — {pkg.title}
        </button>
      </div>

      {/* Onboarding interview surfaces above the timeline until complete */}
      {user && !user.onboarded && (
        <div className="mb-6">
          <ClientOnboarding user={user} />
        </div>
      )}

      {/* Package broken open into a gated, step-by-step timeline */}
      <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
        <h2 className="text-sm font-semibold text-white">Your Build Timeline</h2>
        <p className="mb-4 text-xs text-white/50">
          {pkg.subtitle} Each gated step needs your approval before we continue.
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

      {/* AI assistant chat */}
      <div className="mt-6 rounded-xl border border-white/10 bg-zinc-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Ask your assistant</h2>
        <div className="h-96">
          <ClientAssistantChat user={user} pkg={pkg} />
        </div>
      </div>
    </div>
  );
}