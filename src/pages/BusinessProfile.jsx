import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Building2, Upload, Loader2, CheckCircle2, X, MapPin, Star, Shield } from "lucide-react";

// Step 2 of the epoxy website build: a constrained, multiple-choice intake.
// No open-ended prose, no AI chat — every field is an exact answer or a
// visual pick so there's no ambiguity and little room for customization.
// Saved to the user record via updateMe and gated by the "profile" step gate.

const SERVICE_OPTIONS = [
  "Epoxy Floor Coatings",
  "Polished Concrete",
  "Garage Floor Coatings",
  "Concrete Sealing",
  "Decorative Concrete",
  "Concrete Repair",
  "Commercial Epoxy",
  "Residential Epoxy",
];

const RANGE_OPTIONS = [
  "Single city",
  "Metro area",
  "Statewide",
  "Multi-state region",
  "Nationwide",
];

const YEARS_OPTIONS = [
  "Just started",
  "1-2 years",
  "3-5 years",
  "6-10 years",
  "10+ years",
];

const DIFFERENTIATOR_OPTIONS = [
  "Family-owned",
  "Veteran-owned",
  "Woman-owned",
  "Licensed & insured",
  "BBB accredited",
  "Free estimates",
  "24/7 emergency service",
  "Same-day service",
  "Weekend availability",
  "5-star rated on Google",
  "Eco-friendly materials",
  "Commercial & residential",
  "Insurance / restoration work",
  "Free consultations",
];

export default function BusinessProfile() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    businessName: "",
    phone: "",
    email: "",
    website: "",
    primaryLocation: "",
  });
  const [services, setServices] = useState([]);
  const [serviceRange, setServiceRange] = useState([]);
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [differentiators, setDifferentiators] = useState([]);
  const [logo, setLogo] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [gallery, setGallery] = useState([]);
  const [galleryUrls, setGalleryUrls] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Business Profile · Lead Gen Near You";
    base44
      .auth.me()
      .then((u) => {
        if (u?.epoxyProfile) {
          const p = u.epoxyProfile;
          setForm({
            businessName: p.businessName || "",
            phone: p.phone || "",
            email: p.email || "",
            website: p.website || "",
            primaryLocation: p.primaryLocation || p.serviceArea || "",
          });
          setServices(p.services || []);
          setServiceRange(p.serviceRange || []);
          setYearsInBusiness(p.yearsInBusiness || "");
          setDifferentiators(p.differentiators || []);
          setLogoUrl(p.logoUrl || "");
          setGalleryUrls(p.galleryUrls || []);
          if (u.epoxyProfileSubmitted) setSaved(true);
        }
      })
      .catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggle = (list, setList, val) =>
    setList((prev) => (prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]));

  const uploadOne = async (file) => {
    const res = await base44.integrations.Core.UploadFile({ file });
    return res.file_url;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.businessName.trim()) {
      setError("Business name is required.");
      return;
    }
    if (services.length === 0) {
      setError("Pick at least one service you offer.");
      return;
    }
    if (!form.primaryLocation.trim()) {
      setError("Enter your primary city & state.");
      return;
    }
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
      const profile = {
        ...form,
        services,
        serviceRange,
        yearsInBusiness,
        differentiators,
        logoUrl: finalLogo,
        galleryUrls: finalGallery,
        submitted: true,
        submittedAt: new Date().toISOString(),
      };
      await base44.auth.updateMe({ epoxyProfile: profile, epoxyProfileSubmitted: true });
      setLogoUrl(finalLogo);
      setGalleryUrls(finalGallery);
      setLogo(null);
      setGallery([]);
      setSaved(true);
      try { localStorage.setItem("coach:done:/business-profile", "1"); } catch {}
      setTimeout(() => navigate("/logo-generator"), 1000);
    } catch (err) {
      setError("Something went wrong saving your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <Building2 className="h-4 w-4" /> Business Profile
        </div>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Tell us about your epoxy business</h1>
        <p className="mt-1 text-sm text-white/60">
          Tap your answers below — no typing essays. Our team builds your site from these exact picks.
        </p>

        {saved && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
            <CheckCircle2 className="h-4 w-4" /> Profile saved — taking you to the next step…
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-6">
          {/* Exact facts */}
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

          {/* Services — visual multi-choice */}
          <Section title="Services you offer" icon={Star} hint="Pick all that apply">
            <Chips options={SERVICE_OPTIONS} selected={services} onToggle={(v) => toggle(services, setServices, v)} />
          </Section>

          {/* Service area — exact + range */}
          <Section title="Where you serve" icon={MapPin}>
            <Field label="Primary city & state" required>
              <input value={form.primaryLocation} onChange={set("primaryLocation")} placeholder="Dallas, TX" className={inputCls} />
            </Field>
            <Field label="How far do you travel?" hint="Pick one">
              <Chips options={RANGE_OPTIONS} selected={serviceRange} onToggle={(v) => toggle(serviceRange, setServiceRange, v)} single />
            </Field>
          </Section>

          {/* Years — exact select */}
          <Section title="Years in business" icon={Shield}>
            <Chips options={YEARS_OPTIONS} selected={yearsInBusiness ? [yearsInBusiness] : []} onToggle={(v) => setYearsInBusiness(v)} single />
          </Section>

          {/* Differentiators — visual multi-choice (replaces open-ended "about") */}
          <Section title="What makes you different" hint="Pick all that apply — we'll write your About section from these">
            <Chips options={DIFFERENTIATOR_OPTIONS} selected={differentiators} onToggle={(v) => toggle(differentiators, setDifferentiators, v)} />
          </Section>

          {/* Visuals */}
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

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40">
            {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>) : saved ? (<><CheckCircle2 className="h-4 w-4" /> Saved — update profile</>) : ("Save & continue")}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400";

function Section({ title, hint, icon: Icon, children }) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-lime-400" />}
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {hint && <span className="text-xs text-white/40">· {hint}</span>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-white">
        {label} {required && <span className="text-lime-400">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
    </div>
  );
}

// Multiple-choice chip picker. `single` restricts to one selection (radio-style).
function Chips({ options, selected, onToggle, single }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = single ? selected[0] === opt : selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors " +
              (on
                ? "border-lime-400 bg-lime-400/15 text-lime-300"
                : "border-white/15 bg-zinc-950 text-white/60 hover:border-white/30")
            }
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}