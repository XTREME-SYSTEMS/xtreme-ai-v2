import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { X, Search, Eye, Loader2, Package, ArrowRight } from "lucide-react";
import { usePreview } from "@/lib/PreviewContext";

// Modal that lets an admin pick which client to preview as. Lists all
// non-admin users, with clients who have a paid package shown first. Once
// a client is picked, the preview context is scoped to their email and the
// admin is dropped into the client portal at /business-generator.
export default function PreviewAsClientModal({ onClose }) {
  const navigate = useNavigate();
  const { setPreviewClient } = usePreview();
  const [users, setUsers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [u, p] = await Promise.all([
          base44.entities.User.list("-created_date", 200),
          base44.entities.Base44Purchase.filter({ status: "paid" }, "-paidAt", 200),
        ]);
        setUsers((u || []).filter((x) => x.role !== "admin"));
        setPurchases(p || []);
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const purchaseByEmail = {};
  for (const p of purchases) {
    if (p.buyerEmail) purchaseByEmail[p.buyerEmail.toLowerCase()] = p;
  }

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.email || "").toLowerCase().includes(q) ||
      (u.full_name || "").toLowerCase().includes(q)
    );
  });

  // Clients with purchases first, then everyone else
  const sorted = [...filtered].sort((a, b) => {
    const aHas = !!purchaseByEmail[(a.email || "").toLowerCase()];
    const bHas = !!purchaseByEmail[(b.email || "").toLowerCase()];
    if (aHas !== bHas) return bHas - aHas;
    return 0;
  });

  const pick = (email) => {
    setPreviewClient(email);
    onClose();
    navigate("/business-generator");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-lime-400/30 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-400/10">
            <Eye className="h-4 w-4 text-lime-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-white">Preview as Client</h2>
            <p className="text-xs text-white/50">Pick a user to see the Business Generator exactly as they see it.</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-black px-3 py-2">
            <Search className="h-4 w-4 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-white/50">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-lime-400" /> Loading clients…
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-12 text-center text-sm text-white/50">
              {users.length === 0 ? "No clients found." : "No matches."}
            </div>
          ) : (
            <div className="space-y-1.5">
              {sorted.map((u) => {
                const p = purchaseByEmail[(u.email || "").toLowerCase()];
                return (
                  <button
                    key={u.id}
                    onClick={() => pick(u.email)}
                    className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-black/40 p-3 text-left transition-colors hover:border-lime-400/50 hover:bg-lime-400/5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-zinc-900 text-xs font-bold text-white/70">
                      {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-white">
                        {u.full_name || u.email}
                      </div>
                      <div className="truncate text-xs text-white/40">{u.email}</div>
                    </div>
                    {p ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-lime-400/40 bg-lime-400/10 px-2 py-1 text-[10px] font-semibold text-lime-300">
                        <Package className="h-3 w-3" /> {p.productName || p.productId}
                      </span>
                    ) : (
                      <span className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-medium text-white/30">
                        No package
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 shrink-0 text-white/30" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}