import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Lightbulb, Loader2, Search, AlertCircle, TrendingUp, Sparkles,
  Brain, Globe, Building2, CheckCircle, Zap,
} from "lucide-react";
import { useClientUser } from "@/hooks/useClientUser";
import BackButton from "@/components/client/BackButton";
import NameResearchCard from "@/components/names/NameResearchCard";
import ResearchPhases from "@/components/names/ResearchPhases";

const INDUSTRIES = [
  "roofing", "hvac", "plumbing", "epoxy flooring", "water damage restoration",
  "mold remediation", "solar installation", "pest control", "tree removal",
  "fencing", "concrete", "electrician", "garage door repair", "foundation repair",
  "junk removal", "moving company", "cleaning services", "landscaping",
  "chiropractor", "dentist", "med spa", "personal injury lawyer", "dui lawyer",
];

// AI-powered business name + URL generator with deep web research.
// Scrapes Google search results (Browserbase) + US state business registries
// (OpenCorporates) + RDAP domain verification. Only shows 100% available domains.
// Full transparency: shows the 5-phase research pipeline and all scoring data.
export default function BusinessNameStudio() {
  const { user } = useClientUser();
  const [industry, setIndustry] = useState(user?.epoxyProfile?.industry || user?.industry || "");
  const [location, setLocation] = useState(user?.epoxyProfile?.primaryLocation || user?.epoxyProfile?.location || "");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [phases, setPhases] = useState([]);
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
    setPhases([]);
    try {
      const res = await base44.functions.invoke("recommendBusinessNames", {
        industry: industry.trim(),
        location: location.trim(),
        keywords: keywords.trim(),
      });
      const data = res?.data || res;
      if (data?.suggestions?.length > 0) {
        setSuggestions(data.suggestions);
        setPhases(data.phases || []);
      } else {
        setError(data?.error || "No 100% available domains found. Try different keywords.");
        if (data.phases) setPhases(data.phases);
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
        status: "purchasing",
        viral_score: s.overall_score || s.viral_score || 0,
        domain_available: true,
        domain_status: "AVAILABLE",
        state_registry_status: s.state_registry?.status || "",
        google_search_status: s.google_research?.uniqueness || "",
        rationale: s.rationale || "",
      });
      setSavedId(s.domain);
      if (created?.id) {
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
            <h1 className="text-xl font-semibold text-white">Business Name & URL Generator</h1>
            <p className="text-sm text-white/50">
              AI scrapes Google + US state registries to find unique, viral names with 100% available .com domains.
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
          {loading ? "Researching names…" : "Generate Names"}
        </button>
      </div>

      {/* Loading state — shows the 5-phase research pipeline */}
      {loading && (
        <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-5">
          <div className="flex items-center gap-2 text-sm text-lime-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-medium">Deep research in progress…</span>
          </div>
          <div className="mt-4 space-y-2.5">
            {[
              { icon: Brain, label: "AI generating 10 candidate names with web search" },
              { icon: Globe, label: "Verifying domain availability via RDAP registry" },
              { icon: Search, label: "Scraping Google search results for name uniqueness" },
              { icon: Building2, label: "Checking US state business registries (OpenCorporates)" },
              { icon: Zap, label: "AI re-scoring with real research data" },
            ].map((phase, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-white/50">
                <phase.icon className="h-3.5 w-3.5 text-lime-400/60" />
                <span>{phase.label}</span>
                <Loader2 className="ml-auto h-3 w-3 animate-spin text-lime-400/40" />
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-white/30">
            This takes 30-60 seconds. We only show names with 100% confirmed available .com domains.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-300">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Research phases transparency */}
      {!loading && phases.length > 0 && <ResearchPhases phases={phases} />}

      {/* Results */}
      {!loading && suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
            <TrendingUp className="h-3.5 w-3.5" /> AI Recommendations — only 100% available domains, sorted by overall brand score
          </div>
          {suggestions.map((s, i) => (
            <NameResearchCard
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

      {/* Info footer */}
      {!loading && suggestions.length === 0 && !error && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
          <div className="flex items-start gap-2 text-xs text-white/50">
            <CheckCircle className="h-4 w-4 shrink-0 text-lime-400" />
            <div>
              <p className="font-medium text-white/70">How it works:</p>
              <p className="mt-1">Our AI generates 15 candidate names, then verifies each one through a 5-phase research pipeline — Google search scraping, US state business registry checks, and RDAP domain verification. We only show names with <span className="text-lime-400">100% confirmed available .com domains</span>, scored across 8 dimensions including viral potential, local SEO, searchability, and trademark safety.</p>
              <p className="mt-2 text-white/30">Click "Research" on any result to see the full Google search data and state registry findings.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}