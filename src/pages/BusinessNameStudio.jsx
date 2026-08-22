import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Lightbulb, Loader2, Search, CheckCircle2, XCircle, AlertCircle, TrendingUp, Globe, Building2, Sparkles, ArrowRight } from "lucide-react";
import { useClientUser } from "@/hooks/useClientUser";
import BackButton from "@/components/client/BackButton";

const INDUSTRIES = [
  "roofing", "hvac", "plumbing", "epoxy flooring", "water damage restoration",
  "mold remediation", "solar installation", "pest control", "tree removal",
  "fencing", "concrete", "electrician", "garage door repair", "foundation repair",
  "junk removal", "moving company", "cleaning services", "landscaping",
  "chiropractor", "dentist", "med spa", "personal injury lawyer", "dui lawyer",
];

// AI-powered business name + domain recommender. The user enters their
// industry and location, the system generates 10 scored name suggestions,
// checks Google + state registries for existing businesses, and verifies
// .com availability in real-time. The user picks a favorite to request.
export default function BusinessNameStudio() {
  const { user } = useClientUser();
  const [industry, setIndustry] = useState(user?.epoxyProfile?.industry || user?.industry || "");
  const [location, setLocation] = useState(user?.epoxyProfile?.primaryLocation || user?.epoxyProfile?.location || "");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [saving, setSaving] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [purchasing, setPurchasing] = useState(null);
  const [purchased, setPurchased] = useState(null);
  const [purchaseError, setPurchaseError] = useState({});

  const generate = async () => {
    if (!industry.trim()) {
      setError("Enter your industry to get started.");
      return;
    }
    setLoading(true);
    setError("");
    setSuggestions([]);
    try {
      const res = await base44.functions.invoke("recommendBusinessNames", {
        industry: industry.trim(),
        location: location.trim(),
        keywords: keywords.trim(),
      });
      const data = res?.data || res;
      if (data?.suggestions?.length > 0) {
        setSuggestions(data.suggestions);
      } else {
        setError(data?.error || "No suggestions generated. Try again.");
      }
    } catch (e) {
      setError(e?.message || "Could not generate suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const requestDomain = async (s) => {
    setSaving(s.domain);
    try {
      const created = await base44.entities.ClientDomain.create({
        domain: s.domain,
        client_email: user?.email || "",
        business_name: s.name,
        tagline: s.tagline || "",
        industry: industry.trim(),
        status: s.domain_available ? "purchasing" : "requested",
        viral_score: s.viral_score || 0,
        domain_available: s.domain_available || false,
        domain_status: s.domain_status || "UNKNOWN",
        state_registry_status: s.state_registry_status || "",
        google_search_status: s.google_search_status || "",
        rationale: s.rationale || "",
      });
      setSavedId(s.domain);
      // Available domains are purchased automatically via Vercel in the
      // background — the client never fills out a form. Unavailable domains
      // fall back to a manual request for our team.
      if (s.domain_available && created?.id) {
        setPurchasing(s.domain);
        try {
          const res = await base44.functions.invoke("purchaseDomainViaVercel", { clientDomainId: created.id });
          const d = res?.data || res;
          if (d?.ok) setPurchased(s.domain);
          else setPurchaseError((prev) => ({ ...prev, [s.domain]: d?.error || "Couldn't purchase right now." }));
        } catch (e) {
          setPurchaseError((prev) => ({ ...prev, [s.domain]: e?.message || "Couldn't purchase right now." }));
        } finally {
          setPurchasing(null);
        }
      }
    } catch (e) {
      setError(e?.message || "Could not save your request.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-5">
      <BackButton to="/my-package" />

      {/* Header */}
      <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/15">
            <Lightbulb className="h-5 w-5 text-lime-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Business Name & Domain Studio</h1>
            <p className="text-sm text-white/50">
              AI scans Google & state registries to find available, potentially viral business names with matching .com domains.
            </p>
          </div>
        </div>
      </div>

      {/* Input form */}
      <div className="rounded-xl border border-white/10 bg-zinc-950 p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-white/60">Industry *</label>
            <input
              type="text"
              list="industry-list"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. roofing, hvac, plumbing"
              className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
            />
            <datalist id="industry-list">
              {INDUSTRIES.map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-white/60">Location (city, state)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Dallas, TX"
              className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-white/60">Keywords / themes (optional)</label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g. fast, affordable, premium, 24/7"
            className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
          />
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Scanning Google & registries…" : "Generate Names"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-300">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Results */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
            <TrendingUp className="h-3.5 w-3.5" /> AI Recommendations — sorted by viral potential
          </div>
          {suggestions.map((s, i) => (
            <NameCard
              key={i}
              suggestion={s}
              rank={i + 1}
              saving={saving === s.domain}
              saved={savedId === s.domain}
              purchasing={purchasing === s.domain}
              purchased={purchased === s.domain}
              purchaseError={purchaseError[s.domain]}
              onRetry={() => requestDomain(s)}
              onRequest={() => requestDomain(s)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NameCard({ suggestion: s, rank, saving, saved, purchasing, purchased, purchaseError, onRetry, onRequest }) {
  const score = s.viral_score || 0;
  const scoreColor = score >= 80 ? "text-lime-400" : score >= 60 ? "text-amber-400" : "text-white/60";
  const scoreBg = score >= 80 ? "bg-lime-400" : score >= 60 ? "bg-amber-400" : "bg-white/30";

  return (
    <div className={`rounded-xl border bg-zinc-950 p-4 transition-colors ${
      s.domain_available ? "border-lime-400/40" : "border-white/10"
    }`}>
      <div className="flex items-start gap-3">
        {/* Rank */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-lime-400/30 bg-lime-400/10 text-sm font-bold text-lime-400">
          {rank}
        </div>

        <div className="min-w-0 flex-1">
          {/* Name + domain */}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-white">{s.name}</h3>
            {s.tagline && <span className="text-xs text-white/40">— {s.tagline}</span>}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-white/40" />
            <span className="text-sm font-mono text-white/70">{s.domain}</span>
            {s.domain_available && (
              <span className="rounded border border-lime-400/40 bg-lime-400/10 px-1.5 py-0.5 text-[10px] font-bold text-lime-300">
                <CheckCircle2 className="mr-0.5 inline h-2.5 w-2.5" /> AVAILABLE
              </span>
            )}
            {s.domain_status === "REGISTERED" && (
              <span className="rounded border border-red-400/40 bg-red-400/10 px-1.5 py-0.5 text-[10px] font-bold text-red-300">
                <XCircle className="mr-0.5 inline h-2.5 w-2.5" /> TAKEN
              </span>
            )}
            {s.domain_status === "UNKNOWN" && (
              <span className="rounded border border-white/20 bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-white/40">UNKNOWN</span>
            )}
          </div>

          {/* Viral score */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Viral Potential</span>
                <span className={`font-mono font-semibold ${scoreColor}`}>{score}/100</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-white/10">
                <div className={`h-full rounded-full ${scoreBg}`} style={{ width: `${score}%` }} />
              </div>
            </div>
          </div>

          {/* Status checks */}
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <StatusCheck
              icon={Building2}
              label="State Registry"
              status={s.state_registry_status}
              notes={s.state_registry_notes}
            />
            <StatusCheck
              icon={Search}
              label="Google Search"
              status={s.google_search_status}
              notes={s.google_search_notes}
            />
          </div>

          {/* Rationale */}
          {s.rationale && (
            <div className="mt-3 rounded-lg border border-lime-400/10 bg-lime-400/5 p-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-lime-400/60 mb-1">Why it could go viral</div>
              <p className="text-xs text-lime-300/70 leading-relaxed">{s.rationale}</p>
            </div>
          )}

          {/* Action */}
          <div className="mt-3">
            {purchased ? (
              <div className="flex items-center gap-2 rounded-lg border border-lime-400/40 bg-lime-400/10 px-3 py-2 text-xs text-lime-300">
                <CheckCircle2 className="h-4 w-4" /> Purchased! We're securing <span className="font-mono">{s.domain}</span> for you now.
              </div>
            ) : purchasing ? (
              <div className="flex items-center gap-2 rounded-lg border border-lime-400/30 bg-lime-400/5 px-3 py-2 text-xs text-lime-300">
                <Loader2 className="h-4 w-4 animate-spin" /> Purchasing your domain…
              </div>
            ) : saved && s.domain_available && purchaseError ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
                  <AlertCircle className="h-4 w-4" /> {purchaseError}
                </div>
                <button onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2 text-xs font-semibold text-black hover:bg-lime-300">
                  <ArrowRight className="h-3.5 w-3.5" /> Try again
                </button>
              </div>
            ) : saved ? (
              <div className="flex items-center gap-2 rounded-lg border border-lime-400/40 bg-lime-400/10 px-3 py-2 text-xs text-lime-300">
                <CheckCircle2 className="h-4 w-4" /> Request sent! Our team will secure this domain for you.
              </div>
            ) : (
              <button
                onClick={onRequest}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                {saving ? "Working…" : s.domain_available ? "Buy This Domain" : "Request This Domain"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusCheck({ icon: Icon, label, status, notes }) {
  const isAvailable = status === "likely_available" || status === "unique";
  const isTaken = status === "likely_taken" || status === "exists";
  const color = isAvailable ? "text-lime-400" : isTaken ? "text-red-400" : "text-white/40";
  const badgeColor = isAvailable
    ? "border-lime-400/30 bg-lime-400/10 text-lime-300"
    : isTaken
    ? "border-red-400/30 bg-red-400/10 text-red-300"
    : "border-white/15 bg-white/5 text-white/40";
  const badgeText = isAvailable ? "CLEAR" : isTaken ? "TAKEN" : "UNKNOWN";

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-2.5">
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</span>
        <span className={`ml-auto rounded border px-1.5 py-0.5 text-[10px] font-bold ${badgeColor}`}>{badgeText}</span>
      </div>
      {notes && <p className="mt-1.5 text-[11px] text-white/50 leading-relaxed">{notes}</p>}
    </div>
  );
}