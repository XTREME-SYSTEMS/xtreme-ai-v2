import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import { Globe, Search, ExternalLink, CheckCircle2, XCircle, Loader2, ShoppingCart, User, RefreshCw, AlertCircle, TrendingUp } from "lucide-react";

const REGISTRARS = [
  { name: "Namecheap", url: (d) => `https://www.namecheap.com/domains/registration/results/?domain=${d}` },
  { name: "GoDaddy", url: (d) => `https://www.godaddy.com/domainsearch/find?domainToCheck=${d}` },
  { name: "Domain.com", url: (d) => `https://www.domain.com/registration/results/?domain=${d}` },
  { name: "Porkbun", url: (d) => `https://porkbun.com/checkout/search?q=${d}` },
];

// Admin tool for purchasing domains on behalf of clients. Shows all client
// domain requests, lets the admin check real-time availability, generate
// buy links to registrars, and record purchases.
export default function AdminDomainPurchase() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchDomain, setSearchDomain] = useState("");
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [assignEmail, setAssignEmail] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await base44.entities.ClientDomain.list("-created_date", 200);
      setRequests(all || []);
    } catch (e) {
      setError(e?.message || "Failed to load requests");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const checkAvailability = async () => {
    if (!searchDomain.trim()) return;
    setChecking(true);
    setCheckResult(null);
    setError("");
    try {
      const clean = searchDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
      const res = await base44.functions.invoke("checkDomainAvailability", { domains: [clean] });
      const data = res?.data || res;
      setCheckResult(data?.results?.[0] || { domain: clean, status: "UNKNOWN" });
    } catch (e) {
      setError(e?.message || "Could not check domain");
    }
    setChecking(false);
  };

  const assignDomain = async () => {
    if (!searchDomain.trim() || !assignEmail.trim()) {
      setError("Enter a domain and client email");
      return;
    }
    setAssigning(true);
    setError("");
    try {
      await base44.entities.ClientDomain.create({
        domain: searchDomain.trim().toLowerCase(),
        client_email: assignEmail.trim(),
        status: "purchasing",
        notes: "Manually added by admin",
      });
      setSearchDomain("");
      setAssignEmail("");
      setCheckResult(null);
      await load();
    } catch (e) {
      setError(e?.message || "Could not assign domain");
    }
    setAssigning(false);
  };

  const markPurchased = async (req, registrar) => {
    setUpdating(req.id);
    try {
      await base44.entities.ClientDomain.update(req.id, {
        status: "purchased",
        registrar,
        buy_url: REGISTRARS.find((r) => r.name === registrar)?.url(req.domain) || "",
        assigned_by: "admin",
      });
      await load();
    } catch (e) {
      setError(e?.message || "Could not update");
    }
    setUpdating(null);
  };

  const markDeployed = async (req) => {
    setUpdating(req.id);
    try {
      await base44.entities.ClientDomain.update(req.id, { status: "deployed" });
      await load();
    } catch (e) {
      setError(e?.message || "Could not update");
    }
    setUpdating(null);
  };

  const stats = {
    total: requests.length,
    requested: requests.filter((r) => r.status === "requested").length,
    purchasing: requests.filter((r) => r.status === "purchasing").length,
    purchased: requests.filter((r) => r.status === "purchased").length,
    deployed: requests.filter((r) => r.status === "deployed").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Domain Purchase Manager"
        subtitle="Buy and assign domains for your clients. Check availability, generate registrar links, and track purchases."
      >
        <LoadingButton onClick={load} loading={loading} variant="ghost">
          <RefreshCw className="h-4 w-4" /> Refresh
        </LoadingButton>
      </PageHeader>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard icon={Globe} label="Total" value={stats.total} />
        <StatCard icon={User} label="Requested" value={stats.requested} color="text-amber-400" />
        <StatCard icon={ShoppingCart} label="Purchasing" value={stats.purchasing} color="text-cyan-400" />
        <StatCard icon={CheckCircle2} label="Purchased" value={stats.purchased} color="text-lime-400" />
        <StatCard icon={TrendingUp} label="Deployed" value={stats.deployed} color="text-lime-400" />
      </div>

      {/* Domain search + assign tool */}
      <Panel title="Domain Search & Assignment">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={searchDomain}
                onChange={(e) => setSearchDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkAvailability()}
                placeholder="Enter a domain (e.g. apexroofing.com)"
                className="w-full rounded-lg border border-white/15 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
              />
            </div>
            <LoadingButton onClick={checkAvailability} loading={checking} variant="primary">
              <Search className="h-4 w-4" /> Check Availability
            </LoadingButton>
          </div>

          {/* Check result */}
          {checkResult && (
            <div className="rounded-lg border border-white/10 bg-zinc-900 p-4">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-white/40" />
                <span className="font-mono text-sm text-white">{checkResult.domain}</span>
                {checkResult.status === "AVAILABLE" && (
                  <span className="rounded border border-lime-400/40 bg-lime-400/10 px-2 py-0.5 text-xs font-bold text-lime-300">
                    <CheckCircle2 className="mr-1 inline h-3 w-3" /> AVAILABLE
                  </span>
                )}
                {checkResult.status === "REGISTERED" && (
                  <span className="rounded border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-300">
                    <XCircle className="mr-1 inline h-3 w-3" /> REGISTERED
                  </span>
                )}
                {checkResult.status === "UNKNOWN" && (
                  <span className="rounded border border-white/20 bg-white/5 px-2 py-0.5 text-xs font-bold text-white/40">UNKNOWN</span>
                )}
              </div>

              {checkResult.status === "AVAILABLE" && (
                <div className="mt-4 space-y-3">
                  {/* Registrar buy links */}
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Buy at registrar</div>
                    <div className="flex flex-wrap gap-2">
                      {REGISTRARS.map((r) => (
                        <a
                          key={r.name}
                          href={r.url(checkResult.domain)}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-lime-400/30 bg-lime-400/10 px-3 py-1.5 text-xs font-medium text-lime-300 transition-colors hover:bg-lime-400/20"
                        >
                          <ExternalLink className="h-3 w-3" /> {r.name}
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Assign to client */}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="email"
                      value={assignEmail}
                      onChange={(e) => setAssignEmail(e.target.value)}
                      placeholder="client@email.com"
                      className="flex-1 rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
                    />
                    <LoadingButton onClick={assignDomain} loading={assigning} variant="primary">
                      <ShoppingCart className="h-4 w-4" /> Assign & Track
                    </LoadingButton>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Panel>

      {/* Client requests */}
      <Panel title={`Client Domain Requests (${requests.length})`}>
        {loading ? (
          <div className="text-sm text-white/40 py-8 text-center">Loading requests…</div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={Globe}
            title="No domain requests yet"
            subtitle="When a client uses the Business Name Studio to request a domain, it appears here for you to purchase."
          />
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <DomainRequestRow
                key={r.id}
                request={r}
                updating={updating === r.id}
                onMarkPurchased={markPurchased}
                onMarkDeployed={markDeployed}
              />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function DomainRequestRow({ request: r, updating, onMarkPurchased, onMarkDeployed }) {
  const STATUS_COLORS = {
    recommended: "border-white/15 bg-white/5 text-white/50",
    requested: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    searching: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
    available: "border-lime-400/30 bg-lime-400/10 text-lime-300",
    purchasing: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
    purchased: "border-lime-400/40 bg-lime-400/10 text-lime-300",
    deployed: "border-lime-400/40 bg-lime-400/20 text-lime-300",
    unavailable: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  };

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lime-400/10">
          <Globe className="h-4 w-4 text-lime-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {r.business_name && <span className="text-sm font-semibold text-white">{r.business_name}</span>}
            <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[r.status] || STATUS_COLORS.recommended}`}>
              {r.status}
            </span>
            {r.viral_score > 0 && (
              <span className="text-[10px] text-white/40">Viral: {r.viral_score}/100</span>
            )}
          </div>
          <div className="mt-1 font-mono text-xs text-white/60">{r.domain}</div>
          <div className="mt-1 flex items-center gap-2 text-xs text-white/40">
            <User className="h-3 w-3" /> {r.client_email}
            {r.industry && <span>· {r.industry}</span>}
          </div>

          {/* Availability badges */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {r.domain_available && (
              <span className="rounded border border-lime-400/30 bg-lime-400/10 px-1.5 py-0.5 text-[10px] text-lime-300">Domain Available</span>
            )}
            {r.state_registry_status === "likely_available" && (
              <span className="rounded border border-lime-400/30 bg-lime-400/10 px-1.5 py-0.5 text-[10px] text-lime-300">Registry Clear</span>
            )}
            {r.google_search_status === "unique" && (
              <span className="rounded border border-lime-400/30 bg-lime-400/10 px-1.5 py-0.5 text-[10px] text-lime-300">Google Unique</span>
            )}
          </div>

          {r.rationale && (
            <p className="mt-2 text-xs text-white/50 leading-relaxed">{r.rationale}</p>
          )}

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {r.status !== "purchased" && r.status !== "deployed" && (
              <>
                {REGISTRARS.map((reg) => (
                  <a
                    key={reg.name}
                    href={reg.url(r.domain)}
                    target="_blank"
                    rel="noopener"
                    onClick={() => onMarkPurchased(r, reg.name)}
                    className="inline-flex items-center gap-1 rounded-lg border border-lime-400/30 bg-lime-400/10 px-2.5 py-1.5 text-[11px] font-medium text-lime-300 transition-colors hover:bg-lime-400/20"
                  >
                    <ExternalLink className="h-3 w-3" /> Buy @ {reg.name}
                  </a>
                ))}
              </>
            )}
            {r.status === "purchased" && (
              <LoadingButton
                onClick={() => onMarkDeployed(r)}
                loading={updating}
                variant="primary"
                className="px-3 py-1.5 text-xs"
              >
                <CheckCircle2 className="h-3 w-3" /> Mark Deployed
              </LoadingButton>
            )}
            {r.registrar && (
              <span className="text-[11px] text-white/40">via {r.registrar}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = "text-white" }) {
  return (
    <div className="rounded-xl border border-white/15 bg-zinc-900 p-4">
      <div className="flex items-center gap-2 text-white/40">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className={`mt-2 text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}