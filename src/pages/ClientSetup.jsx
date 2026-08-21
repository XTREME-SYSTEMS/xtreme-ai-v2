import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, Package, Loader2, CheckCircle2, Send, Search, Mail, X } from "lucide-react";
import { SERVICE_CATALOG } from "@/lib/serviceCatalog";

// Admin page to: (1) invite a new client (sends them a setup email to create
// their password), and (2) assign a package to a client (creates a paid
// Base44Purchase record so it shows in their client portal / My Package page).

// Only plans and packages are assignable to a portal track.
const ASSIGNABLE = SERVICE_CATALOG.filter((s) => s.category === "plan" || s.category === "web-pack" || s.category === "app-pack");

export default function ClientSetup() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [purchases, setPurchases] = useState([]);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null);

  // Assign form
  const [assignEmail, setAssignEmail] = useState("");
  const [assignProductId, setAssignProductId] = useState(ASSIGNABLE[0]?.productId || "");
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState(null);

  // Search
  const [query, setQuery] = useState("");

  const loadUsers = async () => {
    try {
      const all = await base44.entities.User.list("-created_date", 200);
      const clients = (all || []).filter((u) => u.role !== "admin");
      setUsers(clients);
    } catch (e) {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadPurchases = async () => {
    try {
      const paid = await base44.entities.Base44Purchase.filter({ status: "paid" }, "-paidAt", 200);
      setPurchases(paid || []);
    } catch (e) {
      setPurchases([]);
    }
  };

  useEffect(() => {
    loadUsers();
    loadPurchases();
  }, []);

  const inviteClient = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      await base44.users.inviteUser(inviteEmail.trim(), "user");
      setInviteMsg({ type: "ok", text: `Invitation sent to ${inviteEmail.trim()}. They'll get an email to set up their password.` });
      setInviteEmail("");
      await loadUsers();
    } catch (e) {
      setInviteMsg({ type: "err", text: e?.message || "Couldn't send invite. The user may already exist." });
    } finally {
      setInviting(false);
    }
  };

  const assignPackage = async (e) => {
    e.preventDefault();
    if (!assignEmail.trim() || !assignProductId) return;
    const product = ASSIGNABLE.find((p) => p.productId === assignProductId);
    if (!product) return;
    setAssigning(true);
    setAssignMsg(null);
    try {
      await base44.entities.Base44Purchase.create({
        checkoutSessionId: `admin-assign-${Date.now()}`,
        status: "paid",
        buyerEmail: assignEmail.trim().toLowerCase(),
        productId: product.productId,
        productName: product.name,
        amount: String(product.price),
        currency: "USD",
        paidAt: new Date().toISOString(),
      });
      setAssignMsg({ type: "ok", text: `${product.name} assigned to ${assignEmail.trim()}. They'll see it in their portal.` });
      setAssignEmail("");
      await loadPurchases();
    } catch (e) {
      setAssignMsg({ type: "err", text: e?.message || "Couldn't assign package." });
    } finally {
      setAssigning(false);
    }
  };

  const filtered = users.filter((u) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (u.email || "").toLowerCase().includes(q) || (u.full_name || "").toLowerCase().includes(q);
  });

  const purchasesByEmail = {};
  for (const p of purchases) {
    const key = (p.buyerEmail || "").toLowerCase();
    if (!purchasesByEmail[key]) purchasesByEmail[key] = [];
    purchasesByEmail[key].push(p);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-lime-400/30 bg-lime-400/10">
          <UserPlus className="h-5 w-5 text-lime-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Client Setup</h1>
          <p className="text-sm text-white/50">Invite a client to create their login, then assign them a package so it appears in their portal.</p>
        </div>
      </div>

      {/* Two-column action cards */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Invite client */}
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
            <Mail className="h-4 w-4" /> Step 1 — Invite Client
          </div>
          <p className="mt-1 text-xs text-white/50">Enter the client's email. They'll get a setup email to create their own password and log in.</p>
          <form onSubmit={inviteClient} className="mt-4 space-y-3">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="client@email.com"
              className="w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={inviting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
            >
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {inviting ? "Sending…" : "Send Invite"}
            </button>
          </form>
          {inviteMsg && (
            <div className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs ${
              inviteMsg.type === "ok" ? "border-lime-400/40 bg-lime-400/10 text-lime-300" : "border-red-400/40 bg-red-400/10 text-red-300"
            }`}>
              {inviteMsg.type === "ok" ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
              {inviteMsg.text}
            </div>
          )}
        </div>

        {/* Assign package */}
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
            <Package className="h-4 w-4" /> Step 2 — Assign Package
          </div>
          <p className="mt-1 text-xs text-white/50">Pick the client's email and a package. This creates a paid purchase so it shows in their portal immediately.</p>
          <form onSubmit={assignPackage} className="mt-4 space-y-3">
            <input
              type="email"
              required
              list="client-emails"
              value={assignEmail}
              onChange={(e) => setAssignEmail(e.target.value)}
              placeholder="client@email.com"
              className="w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none"
            />
            <datalist id="client-emails">
              {users.map((u) => <option key={u.id} value={u.email} />)}
            </datalist>
            <select
              value={assignProductId}
              onChange={(e) => setAssignProductId(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-sm text-white focus:border-lime-400 focus:outline-none"
            >
              {ASSIGNABLE.map((p) => (
                <option key={p.productId} value={p.productId}>
                  {p.name} — ${p.price}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={assigning}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
            >
              {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
              {assigning ? "Assigning…" : "Assign Package"}
            </button>
          </form>
          {assignMsg && (
            <div className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs ${
              assignMsg.type === "ok" ? "border-lime-400/40 bg-lime-400/10 text-lime-300" : "border-red-400/40 bg-red-400/10 text-red-300"
            }`}>
              {assignMsg.type === "ok" ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
              {assignMsg.text}
            </div>
          )}
        </div>
      </div>

      {/* Client list */}
      <div className="rounded-xl border border-white/10 bg-zinc-950">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Existing Clients</h2>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60">{users.length}</span>
          <div className="ml-auto relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-48 rounded-lg border border-white/15 bg-black py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none"
            />
          </div>
        </div>
        {loadingUsers ? (
          <div className="flex items-center gap-2 px-4 py-8 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin text-lime-400" /> Loading clients…
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-white/40">No clients found. Invite one above to get started.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((u) => {
              const pkgs = purchasesByEmail[(u.email || "").toLowerCase()] || [];
              return (
                <div key={u.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-white/60">
                    {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white">{u.full_name || u.email}</div>
                    <div className="truncate text-xs text-white/40">{u.email}</div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {pkgs.length === 0 ? (
                      <span className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-white/40">No package</span>
                    ) : pkgs.map((p, i) => (
                      <span key={i} className="rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-1 text-[10px] font-medium text-lime-300">
                        {p.productName}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}