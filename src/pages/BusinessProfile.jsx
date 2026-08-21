import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Building2, Upload, Loader2, CheckCircle2, X, MapPin, Star, Shield,
  RefreshCw, Sparkles, Rocket, Briefcase, DollarSign,
} from "lucide-react";
import BackButton from "@/components/client/BackButton";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientUpdate } from "@/hooks/useClientUpdate";
import { useClientProject } from "@/hooks/useClientProject";
import { notifyStepComplete } from "@/lib/pipelineNotify";

const DRAFT_KEY = "draft:business-profile";
import {
  BUSINESS_STAGES, BUSINESS_TYPES, INDUSTRIES, RADIUS_OPTIONS, YEARS_OPTIONS,
} from "@/lib/industryData";
import {
  Section, Field, Chips, OptionCard, ProgressDots, NavButtons, inputCls,
} from "@/components/onboarding/WizardUI";
import FinancialIntelligencePanel from "@/components/onboarding/FinancialIntelligencePanel";

const STAGE_ICONS = { RefreshCw, Sparkles, Rocket };

const STEPS = [
  { key: "situation", title: "Your Situation" },
  { key: "details", title: "Business Details" },
  { key: "questions", title: "Industry Questions" },
  { key: "financial", title: "Financial Intelligence" },
  { key: "visuals", title: "Logo & Photos" },
];

export default function BusinessProfile() {
  const navigate = useNavigate();
  const { user } = useClientUser();
  const { update } = useClientUpdate();
  const { saveProject } = useClientProject(user);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    businessStage: "",
    industry: "",
    subIndustry: "",
    customSubIndustry: "",
    businessType: "",
    businessName: "",
    phone: "",
    email: "",
    website: "",
    primaryLocation: "",
    address: "",
    zip: "",
    radius: "",
    yearsInBusiness: "",
  });
  const [industryAnswers, setIndustryAnswers] = useState({});
  const [industryQuestions, setIndustryQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [financialIntel, setFinancialIntel] = useState(null);
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const [logo, setLogo] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [gallery, setGallery] = useState([]);
  const [galleryUrls, setGalleryUrls] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [draftData, setDraftData] = useState(null);

  useEffect(() => { document.title = "Business Profile · Lead Gen Near You"; }, []);

  // G7 — Draft restore prompt: instead of silently auto-restoring, ask the
  // user if they want to restore their previous draft or start fresh.
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.form && parsed.form.businessName) {
          setDraftData(parsed);
          setShowDraftPrompt(true);
        }
      }
    } catch {}
  }, []);

  const restoreDraft = () => {
    if (!draftData) return;
    if (draftData.form) setForm((f) => ({ ...f, ...draftData.form }));
    if (draftData.industryAnswers) setIndustryAnswers(draftData.industryAnswers);
    if (draftData.step !== undefined) setStep(draftData.step);
    if (draftData.financialIntel) setFinancialIntel(draftData.financialIntel);
    setShowDraftPrompt(false);
  };

  const discardDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setDraftData(null);
    setShowDraftPrompt(false);
  };

  // Auto-save draft to localStorage on every change (D5 — draft saving)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          form, industryAnswers, step, financialIntel,
        }));
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [form, industryAnswers, step, financialIntel]);

  // Pre-fill from existing profile
  useEffect(() => {
    if (!user) return;
    if (user?.epoxyProfile) {
      const p = user.epoxyProfile;
      setForm((f) => ({
        ...f,
        businessStage: p.businessStage || "",
        industry: p.industry || "",
        subIndustry: p.subIndustry || "",
        customSubIndustry: p.customSubIndustry || "",
        businessType: p.businessType || "",
        businessName: p.businessName || "",
        phone: p.phone || "",
        email: p.email || "",
        website: p.website || "",
        primaryLocation: p.primaryLocation || p.serviceArea || "",
        address: p.address || "",
        zip: p.zip || "",
        radius: p.radius || (p.serviceRange || [])[0] || "",
        yearsInBusiness: p.yearsInBusiness || "",
      }));
      setIndustryAnswers(p.industryAnswers || {});
      setFinancialIntel(p.financialIntelligence || null);
      setLogoUrl(p.logoUrl || "");
      setGalleryUrls(p.galleryUrls || []);
      if (user.epoxyProfileSubmitted) setSaved(true);
    }
  }, [user]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggle = (list, setList, val) =>
    setList((prev) => (prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]));

  // Clear stale questions when industry context changes so they re-fetch fresh
  useEffect(() => {
    setIndustryQuestions([]);
  }, [form.industry, form.subIndustry, form.customSubIndustry, form.businessType]);

  // Fetch dynamic industry questions when entering the questions step
  const fetchQuestions = useCallback(async () => {
    if (!form.industry || !form.businessType) return;
    if (industryQuestions.length > 0) return;
    setLoadingQuestions(true);
    try {
      const res = await base44.functions.invoke("getIndustryOnboarding", {
        industry: form.industry,
        subIndustry: form.subIndustry || form.customSubIndustry || "",
        businessType: form.businessType,
        businessStage: form.businessStage,
      });
      setIndustryQuestions(res.data?.questions || []);
    } catch (e) {
      setIndustryQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  }, [form.industry, form.subIndustry, form.customSubIndustry, form.businessType, form.businessStage, industryQuestions.length]);

  // Fetch financial intelligence
  const fetchFinancial = async () => {
    setLoadingFinancial(true);
    try {
      const res = await base44.functions.invoke("getFinancialIntelligence", {
        address: form.address,
        zip: form.zip,
        radius: form.radius,
        industry: form.industry,
        subIndustry: form.subIndustry || form.customSubIndustry || "",
        businessType: form.businessType,
      });
      setFinancialIntel(res.data);
    } catch (e) {
      setFinancialIntel(null);
    } finally {
      setLoadingFinancial(false);
    }
  };

  // Step validation
  const canNext = () => {
    switch (step) {
      case 0: return !!(form.businessStage && form.industry && form.businessType);
      case 1: return !!(form.businessName.trim() && form.primaryLocation.trim());
      case 2: return !loadingQuestions;
      case 3: return true; // financial intel is optional
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    setError("");
    if (step === 0 && !form.subIndustry && !form.customSubIndustry) {
      const ind = INDUSTRIES.find((i) => i.id === form.industry);
      if (ind && ind.subIndustries.length > 0) {
        setError("Please select or enter your sub-industry.");
        return;
      }
    }
    if (step === 1) {
      // Auto-trigger question fetch when moving to questions step
      fetchQuestions();
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const uploadOne = async (file) => {
    const res = await base44.integrations.Core.UploadFile({ file });
    return res.file_url;
  };

  const submit = async () => {
    if (!form.businessName.trim()) { setError("Business name is required."); return; }
    if (!form.primaryLocation.trim()) { setError("Enter your primary city & state."); return; }
    setSaving(true);
    setError("");
    try {
      let finalLogo = logoUrl;
      if (logo) finalLogo = await uploadOne(logo);
      const finalGallery = [...galleryUrls];
      for (const f of gallery) {
        const url = await uploadOne(f);
        finalGallery.push(url);
      }

      // Extract services + differentiators from dynamic answers for backward compat
      const services = industryAnswers.services_offered || [];
      const differentiators = industryAnswers.differentiators || [];
      const effectiveSubIndustry = form.subIndustry || form.customSubIndustry || "";

      const profile = {
        ...form,
        subIndustry: effectiveSubIndustry,
        services,
        differentiators,
        serviceRange: form.radius ? [form.radius] : [],
        industryAnswers,
        financialIntelligence: financialIntel,
        logoUrl: finalLogo,
        galleryUrls: finalGallery,
        submitted: true,
        submittedAt: new Date().toISOString(),
      };

      await update({ epoxyProfile: profile, epoxyProfileSubmitted: true, financialIntelligence: financialIntel, industryAnswers });
      // D1 — also create/update ClientProject to offload creative work from User
      try {
        await saveProject({
          client_email: user?.email || "",
          business_name: form.businessName,
          industry: form.industry,
          sub_industry: effectiveSubIndustry,
          business_type: form.businessType,
          business_stage: form.businessStage,
          profile,
          status: "onboarding",
        });
      } catch {}
      // D5 — clear draft since profile is saved
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      setLogoUrl(finalLogo);
      setGalleryUrls(finalGallery);
      setLogo(null);
      setGallery([]);
      setSaved(true);
      try { localStorage.setItem("coach:done:/business-profile", "1"); } catch {}
      await notifyStepComplete("profile", { businessName: form.businessName || "" });
      setTimeout(() => navigate("/content-generator"), 1000);
    } catch (err) {
      setError("Something went wrong saving your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const ind = INDUSTRIES.find((i) => i.id === form.industry);
  const hasLocation = !!(form.address.trim() && form.zip.trim());

  return (
    <div className="mx-auto max-w-2xl">
      <BackButton to="/my-package" />

      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <Building2 className="h-4 w-4" /> Business Profile
        </div>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Tell us about your business</h1>
        <p className="mt-1 text-sm text-white/60">
          Answer a few quick questions and our system will tailor everything — your website, brand, content, and recommendations — to your industry.
        </p>

        {saved && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
            <CheckCircle2 className="h-4 w-4" /> Profile saved — taking you to the next step…
          </div>
        )}

        {/* G7 — Draft restore prompt */}
        {showDraftPrompt && (
          <div className="mt-4 rounded-lg border border-amber-400/40 bg-amber-400/10 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
              <RefreshCw className="h-4 w-4" /> Restore previous draft?
            </div>
            <p className="mt-1 text-xs text-white/60">
              We found an unsaved draft from <span className="font-semibold text-white">{draftData?.form?.businessName}</span>.
              Would you like to continue where you left off, or start fresh?
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={restoreDraft}
                className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-xs font-semibold text-black hover:bg-lime-300"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Restore draft
              </button>
              <button
                type="button"
                onClick={discardDraft}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-white/30"
              >
                Start fresh
              </button>
            </div>
          </div>
        )}

        <ProgressDots steps={STEPS} current={step} />

        {/* ─── Step 0: Your Situation ─── */}
        {step === 0 && (
          <div className="space-y-5">
            <Section title="What's your situation?" icon={Briefcase}>
              <div className="grid gap-2.5">
                {BUSINESS_STAGES.map((s) => {
                  const Icon = STAGE_ICONS[s.icon] || Briefcase;
                  return (
                    <OptionCard
                      key={s.id}
                      label={s.label}
                      desc={s.desc}
                      icon={Icon}
                      selected={form.businessStage === s.id}
                      onClick={() => setForm((f) => ({ ...f, businessStage: s.id }))}
                    />
                  );
                })}
              </div>
            </Section>

            <Section title="What industry are you in?" icon={Building2}>
              <div className="grid gap-2 sm:grid-cols-2">
                {INDUSTRIES.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, industry: i.id, subIndustry: "", customSubIndustry: "" }))}
                    className={
                      "flex items-center gap-2.5 rounded-lg border p-3 text-left transition-colors " +
                      (form.industry === i.id
                        ? "border-lime-400 bg-lime-400/10"
                        : "border-white/10 bg-zinc-950 hover:border-white/25")
                    }
                  >
                    <span className="text-xl">{i.icon}</span>
                    <span className={"text-xs font-medium " + (form.industry === i.id ? "text-lime-300" : "text-white/70")}>{i.label}</span>
                  </button>
                ))}
              </div>
            </Section>

            {ind && ind.subIndustries.length > 0 && (
              <Section title="What's your sub-industry?" icon={Star} hint="Pick the closest match">
                <Chips
                  options={ind.subIndustries}
                  selected={form.subIndustry ? [form.subIndustry] : []}
                  onToggle={(v) => setForm((f) => ({ ...f, subIndustry: v, customSubIndustry: "" }))}
                  single
                />
                <Field label="Or type your own" hint="If none of the above fit exactly">
                  <input
                    value={form.customSubIndustry}
                    onChange={set("customSubIndustry")}
                    placeholder="e.g. Epoxy Floor Coatings"
                    className={inputCls}
                  />
                </Field>
              </Section>
            )}

            {ind && ind.subIndustries.length === 0 && (
              <Section title="What's your sub-industry?" icon={Star}>
                <Field label="Describe your specific business type" required>
                  <input
                    value={form.customSubIndustry}
                    onChange={set("customSubIndustry")}
                    placeholder="e.g. Mobile detailing service"
                    className={inputCls}
                  />
                </Field>
              </Section>
            )}

            <Section title="Who do you serve?" icon={Shield} hint="Commercial, residential, or both?">
              <div className="grid gap-2.5">
                {BUSINESS_TYPES.map((t) => (
                  <OptionCard
                    key={t.id}
                    label={t.label}
                    desc={t.desc}
                    selected={form.businessType === t.id}
                    onClick={() => setForm((f) => ({ ...f, businessType: t.id }))}
                  />
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ─── Step 1: Business Details ─── */}
        {step === 1 && (
          <div className="space-y-5">
            <Section title="Your business" icon={Building2}>
              <Field label="Business name" required>
                <input value={form.businessName} onChange={set("businessName")} placeholder="Acme Epoxy Floors LLC" className={inputCls} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone">
                  <input value={form.phone} onChange={set("phone")} placeholder="(555) 123-4567" className={inputCls} />
                </Field>
                <Field label="Email">
                  <input value={form.email} onChange={set("email")} placeholder="info@acmeepoxy.com" className={inputCls} />
                </Field>
              </div>
              <Field label="Current website (if any)">
                <input value={form.website} onChange={set("website")} placeholder="https://acmeepoxy.com" className={inputCls} />
              </Field>
            </Section>

            <Section title="Where you're located" icon={MapPin}>
              <Field label="Primary city & state" required>
                <input value={form.primaryLocation} onChange={set("primaryLocation")} placeholder="Dallas, TX" className={inputCls} />
              </Field>
              <Field label="Street address" hint="Used for financial intelligence & local SEO">
                <input value={form.address} onChange={set("address")} placeholder="123 Main St, Dallas, TX 75201" className={inputCls} />
              </Field>
              <Field label="ZIP code">
                <input value={form.zip} onChange={set("zip")} placeholder="75201" className={inputCls} />
              </Field>
              <Field label="How far do you travel?" hint="Pick one">
                <Chips
                  options={RADIUS_OPTIONS}
                  selected={form.radius ? [form.radius] : []}
                  onToggle={(v) => setForm((f) => ({ ...f, radius: v }))}
                  single
                />
              </Field>
            </Section>

            <Section title="Years in business" icon={Shield}>
              <Chips
                options={YEARS_OPTIONS}
                selected={form.yearsInBusiness ? [form.yearsInBusiness] : []}
                onToggle={(v) => setForm((f) => ({ ...f, yearsInBusiness: v }))}
                single
              />
            </Section>
          </div>
        )}

        {/* ─── Step 2: Industry Questions ─── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="rounded-lg border border-lime-400/30 bg-lime-400/5 p-3 text-xs text-white/60">
              <span className="font-semibold text-lime-400">Tailored questions:</span> Based on your {ind?.label || form.industry}
              {form.subIndustry || form.customSubIndustry ? ` · ${form.subIndustry || form.customSubIndustry}` : ""} business.
            </div>

            {loadingQuestions ? (
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950 p-6 text-sm text-white/50">
                <Loader2 className="h-5 w-5 animate-spin text-lime-400" /> Generating industry-specific questions…
              </div>
            ) : industryQuestions.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-zinc-950 p-6 text-center text-sm text-white/50">
                No questions generated. You can continue to the next step.
              </div>
            ) : (
              industryQuestions.map((q) => {
                const ans = industryAnswers[q.id];
                return (
                  <Section key={q.id} title={q.question} hint={q.why ? `· ${q.why}` : ""}>
                    {q.type === "text" ? (
                      <input
                        value={ans || ""}
                        onChange={(e) => setIndustryAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                        placeholder="Type your answer…"
                        className={inputCls}
                      />
                    ) : q.type === "single" ? (
                      <Chips
                        options={q.options || []}
                        selected={ans ? [ans] : []}
                        onToggle={(v) => setIndustryAnswers((a) => ({ ...a, [q.id]: v }))}
                        single
                      />
                    ) : (
                      <Chips
                        options={q.options || []}
                        selected={ans || []}
                        onToggle={(v) => setIndustryAnswers((a) => {
                          const cur = a[q.id] || [];
                          return { ...a, [q.id]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] };
                        })}
                      />
                    )}
                  </Section>
                );
              })
            )}
          </div>
        )}

        {/* ─── Step 3: Financial Intelligence ─── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
              <DollarSign className="h-4 w-4" /> Financial Intelligence
            </div>
            <p className="text-sm text-white/60">
              We research your local competitors, standard retail pricing, and market opportunities — then use that data to power smarter recommendations across your website, proposals, and marketing.
            </p>
            <FinancialIntelligencePanel
              data={financialIntel}
              loading={loadingFinancial}
              onResearch={fetchFinancial}
              hasLocation={hasLocation}
            />
          </div>
        )}

        {/* ─── Step 4: Logo & Photos ─── */}
        {step === 4 && (
          <div className="space-y-5">
            <Section title="Your logo & project photos" icon={Upload}>
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Logo</label>
                {logoUrl && !logo && (
                  <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white/60">
                    <CheckCircle2 className="h-3.5 w-3.5 text-lime-400" /> Logo uploaded
                  </div>
                )}
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 bg-zinc-950 px-4 py-3 text-sm text-white/60 hover:border-lime-400/50">
                  <Upload className="h-4 w-4" />
                  {logo ? logo.name : logoUrl ? "Replace logo" : "Upload logo (PNG/SVG)"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogo(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Project photos</label>
                {galleryUrls.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {galleryUrls.map((url, i) => (
                      <div key={i} className="relative">
                        <img src={url} alt="" className="h-16 w-16 rounded-lg border border-white/10 object-cover" />
                        <button type="button" onClick={() => setGalleryUrls((g) => g.filter((_, idx) => idx !== i))} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 bg-zinc-950 px-4 py-3 text-sm text-white/60 hover:border-lime-400/50">
                  <Upload className="h-4 w-4" />
                  {gallery.length ? `${gallery.length} photo(s) selected` : "Upload project photos"}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setGallery(Array.from(e.target.files || []))} />
                </label>
              </div>
            </Section>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <NavButtons
          step={step}
          total={STEPS.length}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={submit}
          canNext={canNext()}
          saving={saving}
          isLast={step === STEPS.length - 1}
        />
      </div>
    </div>
  );
}