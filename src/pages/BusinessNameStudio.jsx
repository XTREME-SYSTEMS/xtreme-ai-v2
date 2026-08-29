import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Lightbulb, Loader2, Search, AlertCircle, TrendingUp, Sparkles,
  Brain, Globe, Building2, CheckCircle, Zap, RefreshCw, Edit3, Plus, ArrowRight,
} from "lucide-react";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientProject } from "@/hooks/useClientProject";
import BackButton from "@/components/client/BackButton";
import NameResearchCard from "@/components/names/NameResearchCard";
import ResearchPhases from "@/components/names/ResearchPhases";
import AiAssistInput from "@/components/client/AiAssistInput";

// This system is exclusively focused on epoxy & concrete contracting.
const INDUSTRIES = [
  "epoxy flooring",
  "epoxy coatings",
  "epoxy contractor",
  "polished concrete contractor",
  "decorative concrete contractor",
];

// AI-powered business name + URL generator with deep web research.
// Scrapes Google search results (Browserbase) + US state business registries
// (OpenCorporates) + RDAP domain verification. Only shows 100% available domains.
// Full transparency: shows the 5-phase research pipeline and all scoring data.
export default function BusinessNameStudio() {
  const { user } = useClientUser();
  const { project } = useClientProject(user);
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
  const [showManual, setShowManual] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualChecking, setManualChecking] = useState(false);
  const [manualResult, setManualResult] = useState(null);
  const [manualError, setManualError] = useState("");
  const [genCount, setGenCount] = useState(0);
  const [usingName, setUsingName] = useState(null);
  const [usedName, setUsedName] = useState(null);
  const [domainAdded, setDomainAdded] = useState(null);
  const navigate = useNavigate();
  const [ownName, setOwnName] = useState("");
  const [ownDomain, setOwnDomain] = useState("");
  const [savingOwn, setSavingOwn] = useState(false);

  // Context from prior steps — vision, strategy, profile — fed to the
  // AI-assist so suggestions build on what the user already chose.
  const assistContext = {
    industry: industry || user?.epoxyProfile?.industry || "",
    location: location || user?.epoxyProfile?.primaryLocation || "",
    businessName: user?.epoxyProfile?.businessName || "",
    businessStage: user?.epoxyProfile?.businessStage || "",
    businessType: user?.epoxyProfile?.businessType || [],
    vision: project?.vision?.mission || "",
    strategy: project?.strategy?.competitive_positioning || "",
    priorAnswers: user?.epoxyProfile?.industryAnswers || {},
  };

  const generate = async (append = false) => {
    if (!industry.trim()) {
      setError("Enter your industry to get started.");
      return;
    }
    setLoading(true);
    setError("");
    if (!append) setSuggestions([]);
    setPhases([]);
    // Pass a random seed + excluded names so each round produces fresh,
    // non-duplicate suggestions quickly.
    const seed = Math.floor(Math.random() * 100000);
    const exclude = append ? suggestions.map((s) => s.name) : [];
    try {
      const res = await base44.functions.invoke("recommendBusinessNames", {
        industry: industry.trim(),
        location: location.trim(),
        keywords: keywords.trim(),
        seed,
        exclude,
      });
      const data = res?.data || res;
      if (data?.suggestions?.length > 0) {
        setSuggestions((prev) => append ? [...prev, ...data.suggestions] : data.suggestions);
        setPhases(data.phases || []);
      } else {
        setError(data?.error || "No available .com domains found. Try different keywords.");
        if (data.phases) setPhases(data.phases);
      }
    } catch (e) {
      setError(e?.message || "Could not generate suggestions. Please try again.");
    } finally {
      setLoading(false);
      setGenCount((c) => c + 1);
    }
  };

  // Check a manually-entered business name for domain availability
  const checkManualName = async () => {
    if (!manualName.trim()) {
      setManualError("Enter a business name to check.");
      return;
    }
    setManualChecking(true);
    setManualError("");
    setManualResult(null);
    try {
      const cleanName = manualName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      const domain = `${cleanName}.com`;
      const res = await base44.functions.invoke("checkDomainAvailability", { domain });
      const data = res?.data || res;
      setManualResult({
        name: manualName.trim(),
        domain,
        available: data?.available !== false,
        status: data?.status || (data?.available !== false ? "AVAILABLE" : "TAKEN"),
      });
    } catch (e) {
      setManualError(e?.message || "Could not check domain. Please try again.");
    } finally {
      setManualChecking(false);
    }
  };

  // Save a manually-entered name as a suggestion the user can purchase
  const useManualName = async () => {
    if (!manualResult) return;
    const s = {
      name: manualResult.name,
      domain: manualResult.domain,
      tagline: "",
      overall_score: 0,
      rationale: "Manually entered by user",
      state_registry: { status: "not_checked" },
      google_research: { uniqueness: "not_checked" },
    };
    setSuggestions((prev) => [s, ...prev]);
    setShowManual(false);
    setManualName("");
    setManualResult(null);
  };

  // Save a name the user already has (no generation, no purchase).
  const saveOwnName = async () => {
    if (!ownName.trim()) {
      setError("Enter your business name to continue.");
      return;
    }
    setSavingOwn(true);
    setError("");
    try {
      await base44.auth.updateMe({
        epoxyProfile: {
          ...(user?.epoxyProfile || {}),
          businessName: ownName.trim(),
          domain: ownDomain.trim() || undefined,
        },
      });
      setTimeout(() => navigate("/business-profile"), 600);
    } catch (e) {
      setError(e?.message || "Could not save your name. Please try again.");
    } finally {
      setSavingOwn(false);
    }
  };

  // Use a chosen name WITHOUT buying the domain — saves it to the user's
  // profile and advances to the next step.
  const saveNameOnly = async (s) => {
    setUsingName(s.name);
    try {
      await base44.auth.updateMe({
        epoxyProfile: {
          ...(user?.epoxyProfile || {}),
          businessName: s.name,
          domain: s.domain,
          tagline: s.tagline || "",
        },
      });
      setUsedName(s.name);
      setTimeout(() => navigate("/business-profile"), 900);
    } catch (e) {
      setError(e?.message || "Could not save your name. Please try again.");
    } finally {
      setUsingName(null);
    }
  };

  // Add the domain to the user's enhancements bill ($20) instead of
  // purchasing immediately. The fee is collected at the payment step
  // after contract signing.
  const addDomainToBill = async (s) => {
    setSaving(s.domain);
    setError("");
    try {
      const currentEnhancements = user?.enhancements || [];
      const currentTotal = user?.enhancementsTotal || 0;
      if (!currentEnhancements.includes("domain_purchase")) {
        await base44.auth.updateMe({
          enhancements: [...currentEnhancements, "domain_purchase"],
          enhancementsTotal: currentTotal + 20,
          epoxyProfile: {
            ...(user?.epoxyProfile || {}),
            businessName: s.name,
            domain: s.domain,
            tagline: s.tagline || "",
          },
        });
      } else {
        await base44.auth.updateMe({
          epoxyProfile: {
            ...(user?.epoxyProfile || {}),
            businessName: s.name,
            domain: s.domain,
            tagline: s.tagline || "",
          },
        });
      }
      setDomainAdded(s.domain);
    } catch (e) {
      setError(e?.message || "Could not add domain to bill.");
    } finally {
      setSaving(null);
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
      <BackButton to="/business-generator" />

      {/* Header */}
      <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/15">
            <Lightbulb className="h-5 w-5 text-lime-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Epoxy & Concrete Business Name Generator</h1>
            <p className="text-sm text-white/50">
              AI generates unique epoxy & concrete business names with 100% available .com domains, verified via RDAP + state registries.
            </p>
          </div>
        </div>
      </div>

      {/* Already have a name? — manual entry for existing businesses */}
      <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <CheckCircle className="h-4 w-4" /> Already have a business name?
        </div>
        <p className="mt-1 text-sm text-white/50">
          Skip the generator — enter your existing business name and website URL below and continue.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-white/60">Business name *</label>
            <input
              type="text"
              value={ownName}
              onChange={(e) => setOwnName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveOwnName()}
              placeholder="e.g. Apex Epoxy Floors LLC"
              className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-white/60">Website URL (optional)</label>
            <input
              type="text"
              value={ownDomain}
              onChange={(e) => setOwnDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveOwnName()}
              placeholder="https://apexepoxy.com"
              className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
            />
          </div>
          <button
            onClick={saveOwnName}
            disabled={savingOwn || !ownName.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-lime-400 px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
          >
            {savingOwn ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {savingOwn ? "Saving…" : "Use My Name"}
          </button>
        </div>
      </div>

      {/* Input form */}
      <div className="rounded-xl border border-white/10 bg-zinc-950 p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-white/60">Epoxy/Concrete Niche *</label>
            <AiAssistInput
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. epoxy flooring, polished concrete"
              field="industry"
              context={assistContext}
            />
            <datalist id="industry-list">
              {INDUSTRIES.map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-white/60">Location (city, state)</label>
            <AiAssistInput
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Dallas, TX"
              field="primaryLocation"
              context={assistContext}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-white/60">Keywords / themes (optional)</label>
          <AiAssistInput
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g. metallic, garage, commercial, fast install"
            field="keywords"
            context={assistContext}
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

      {/* Loading state — shows the optimized 4-phase pipeline */}
      {loading && (
        <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-5">
          <div className="flex items-center gap-2 text-sm text-lime-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-medium">Generating names…</span>
          </div>
          <div className="mt-4 space-y-2.5">
            {[
              { icon: Brain, label: "AI generating 15 creative candidate names" },
              { icon: Globe, label: "Verifying domain availability via RDAP (parallel)" },
              { icon: Building2, label: "Checking US state business registries" },
              { icon: Zap, label: "Scoring & ranking by brand strength" },
            ].map((phase, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-white/50">
                <phase.icon className="h-3.5 w-3.5 text-lime-400/60" />
                <span>{phase.label}</span>
                <Loader2 className="ml-auto h-3 w-3 animate-spin text-lime-400/40" />
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-white/30">
            Usually 20-30 seconds. We generate 25+ candidates and only show names with 100% confirmed available .com domains.
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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
              <TrendingUp className="h-3.5 w-3.5" /> AI Recommendations — only 100% available domains, sorted by overall brand score
            </div>
            <span className="text-[10px] text-white/30">Round {genCount}</span>
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
              onUseName={() => saveNameOnly(s)}
              usingName={usingName === s.name}
              usedName={usedName === s.name}
              onAddToBill={() => addDomainToBill(s)}
              domainAdded={domainAdded === s.domain}
            />
          ))}

          {/* Regenerate + Manual input actions */}
          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
            <button
              onClick={() => generate(true)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-lime-400/40 bg-lime-400/10 px-4 py-2 text-sm font-semibold text-lime-300 transition-colors hover:bg-lime-400/20 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" /> Generate More Names
            </button>
            <button
              onClick={() => setShowManual((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:border-lime-400/40 hover:text-lime-300"
            >
              <Edit3 className="h-4 w-4" /> Enter My Own Name
            </button>
          </div>

          {/* Manual name input */}
          {showManual && (
            <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">Enter a business name to check domain availability</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && checkManualName()}
                    placeholder="e.g. Apex Epoxy Coatings"
                    className="flex-1 rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
                  />
                  <button
                    onClick={checkManualName}
                    disabled={manualChecking}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
                  >
                    {manualChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    {manualChecking ? "Checking…" : "Check"}
                  </button>
                </div>
              </div>
              {manualError && <p className="text-xs text-red-400">{manualError}</p>}
              {manualResult && (
                <div className="rounded-lg border border-white/10 bg-black/40 p-3">
                  <div className="flex items-center gap-2">
                    {manualResult.available ? (
                      <CheckCircle className="h-5 w-5 text-lime-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">{manualResult.name}</div>
                      <div className="text-xs text-white/50">
                        {manualResult.domain} —{" "}
                        <span className={manualResult.available ? "text-lime-400 font-semibold" : "text-red-400 font-semibold"}>
                          {manualResult.available ? "AVAILABLE" : "TAKEN"}
                        </span>
                      </div>
                    </div>
                    {manualResult.available && (
                      <button
                        onClick={useManualName}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-lime-400/40 bg-lime-400/10 px-3 py-1.5 text-xs font-semibold text-lime-300 hover:bg-lime-400/20"
                      >
                        <Plus className="h-3.5 w-3.5" /> Use This Name
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}