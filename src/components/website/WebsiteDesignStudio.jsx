import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { LayoutGrid, Monitor, Smartphone, Check, Loader2, Sparkles, Eye, X, MessageSquare, Send, ArrowRight, AlertCircle, Sun, Moon, RefreshCw, Wand2, Images } from "lucide-react";
import { cn } from "@/lib/utils";
import { logReceipt } from "@/lib/pipelineUtils";
import { PALETTES, WEBSITE_LAYOUTS, buildTheme, SECTION_META } from "@/components/website/websiteLayouts";
import WebsitePreview, { ScaledPreview } from "@/components/website/WebsitePreview";
import BackButton from "@/components/client/BackButton";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientUpdate } from "@/hooks/useClientUpdate";
import { useClientProject } from "@/hooks/useClientProject";
import { deriveFoundation } from "@/lib/pipelineFoundation";
import { notifyStepComplete } from "@/lib/pipelineNotify";

const REVISE_CHIPS = ["Different layout", "Different colors", "Different content", "Different images", "Too plain", "Not local enough", "Doesn't match my brand", "Other"];

// Pick N distinct layouts from the pool, preferring ones not in excludeIds.
function shuffle(pool, excludeIds, n) {
  const avail = pool.filter((l) => !excludeIds.includes(l.id));
  const src = avail.length >= n ? avail : pool.slice();
  const copy = [...src];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export default function WebsiteDesignStudio() {
  const navigate = useNavigate();
  const { user: hookUser } = useClientUser();
  const { update } = useClientUpdate();
  const { project } = useClientProject(hookUser);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [content, setContent] = useState(null);
  const [images, setImages] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [paletteId, setPaletteId] = useState("charcoal-lime");
  const [light, setLight] = useState(false);
  const [device, setDevice] = useState("desktop");
  const [selectedId, setSelectedId] = useState("");
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [shownLayouts, setShownLayouts] = useState(() => shuffle(WEBSITE_LAYOUTS, [], 10));
  const [regeneratingLayouts, setRegeneratingLayouts] = useState(false);
  const [enhancingContent, setEnhancingContent] = useState(false);
  const [enhancingImages, setEnhancingImages] = useState(false);
  const [revising, setRevising] = useState(false);
  const [reviseChips, setReviseChips] = useState([]);
  const [reviseComment, setReviseComment] = useState("");
  const [sendingRevise, setSendingRevise] = useState(false);
  const [reviseSent, setReviseSent] = useState(false);
  const [reviseError, setReviseError] = useState("");
  const [sectionBusy, setSectionBusy] = useState("");
  const [sectionMsg, setSectionMsg] = useState("");
  const [imageSource, setImageSource] = useState("uploads"); // "uploads" | "ai"
  const [aiFromUploadsDone, setAiFromUploadsDone] = useState(false);
  const autoPicked = useRef(false);

  useEffect(() => { document.title = "Website Design · Lead Gen Near You"; }, []);

  useEffect(() => {
    if (!hookUser) return;
    setUser(hookUser);
    setProfile(hookUser?.epoxyProfile || null);
    setLogoUrl(hookUser?.chosenLogoUrl || hookUser?.epoxyProfile?.logoUrl || "");
    if (hookUser?.websiteContent) setContent(hookUser.websiteContent);
    if (hookUser?.websiteImages) setImages(hookUser.websiteImages);
    if (hookUser?.chosenPalette) setPaletteId(hookUser.chosenPalette);
    if (hookUser?.chosenWebsiteLayout) setSelectedId(hookUser.chosenWebsiteLayout);
    if (hookUser?.designPacksChosen) setSaved(true);
    // Default the gallery view to the client's uploaded photos when they have
    // them; otherwise fall back to the AI-generated set.
    const hasUploads = hookUser?.epoxyProfile?.galleryUrls && hookUser.epoxyProfile.galleryUrls.length > 0;
    setImageSource(hasUploads ? (hookUser?.chosenImageSource || "uploads") : "ai");
    if (hookUser?.websiteImages && hookUser.websiteImages.length > 0) setAiFromUploadsDone(true);
  }, [hookUser]);

  const callGenerate = async (p) => {
    const foundation = deriveFoundation(project, hookUser);
    const res = await base44.functions.invoke("generateWebsiteContent", {
      businessName: p?.businessName || "", services: p?.services || [],
      serviceArea: p?.primaryLocation || "", city: p?.primaryLocation || "", state: "",
      differentiators: p?.differentiators || [], yearsInBusiness: p?.yearsInBusiness || "",
      phone: p?.phone || "", email: p?.email || "",
      industry: p?.industry || "", subIndustry: p?.subIndustry || "",
      businessType: p?.businessType || "",
      financialIntelligence: hookUser?.financialIntelligence || null,
      industryAnswers: hookUser?.industryAnswers || null,
      vision: foundation.vision,
      strategy: foundation.strategy,
      chosenName: foundation.chosenName,
      tagline: foundation.tagline,
      contentTone: foundation.contentTone,
    });
    return res?.data?.content;
  };

  const generateContent = async (p) => {
    setGenerating(true); setGenError("");
    try {
      const c = await callGenerate(p);
      if (!c) throw new Error("no content");
      setContent(c);
      try { await update({ websiteContent: c }); } catch {}
    } catch (e) { setGenError("Couldn't generate your website content. You can retry."); }
    finally { setGenerating(false); }
  };

  useEffect(() => {
    if (profile && project && !content && !generating && !genError) generateContent(profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, project]);

  // Auto-pick: pre-select the first layout and persist so the step is done.
  useEffect(() => {
    if (content && !selectedId && !saved && !autoPicked.current && shownLayouts[0]) {
      autoPicked.current = true;
      const first = shownLayouts[0];
      setSelectedId(first.id);
      (async () => {
        try {
          await update({
            chosenWebsiteLayout: first.id, chosenPalette: paletteId,
            websiteContent: content, designPacksChosen: true,
          });
          await notifyStepComplete("website", { businessName: profile?.businessName || "" });
          try { localStorage.setItem("coach:done:/design-direction", "1"); } catch {}
        } catch {}
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, selectedId, saved, shownLayouts]);

  // Auto-generate max-quality images when the client did NOT upload any
  // project photos. Uses their full onboarding brief (industry, sub-industry,
  // location, services, answers) to produce ultra-high-quality, trade-specific
  // gallery images. Only runs once, and only if they have no uploads and no
  // previously generated set.
  const uploadedGallery = profile?.galleryUrls && profile.galleryUrls.length > 0;
  useEffect(() => {
    if (!profile || !content) return;
    if (uploadedGallery) return;            // client uploaded their own photos — use those
    if (images && images.length > 0) return; // already have a generated set
    if (enhancingImages) return;
    enhanceImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, content, uploadedGallery]);

  const palette = PALETTES.find((p) => p.id === paletteId) || PALETTES[0];
  const theme = buildTheme(palette, light);

  const enhanceContent = async () => {
    setEnhancingContent(true); setSectionMsg("");
    try {
      const c = await callGenerate(profile);
      if (c) { setContent(c); try { await update({ websiteContent: c }); } catch {} setSectionMsg("Content enhanced."); }
      else setSectionMsg("Couldn't enhance content. Try again.");
    } catch (e) { setSectionMsg("Couldn't enhance content. Try again."); }
    finally { setEnhancingContent(false); }
  };

  const enhanceImages = async () => {
    setEnhancingImages(true); setSectionMsg("");
    try {
      const res = await base44.functions.invoke("regenerateWebsiteImages", {
        businessName: profile?.businessName || "",
        services: profile?.services || [],
        location: profile?.primaryLocation || "",
        count: 6,
        industry: profile?.industry || "",
        subIndustry: profile?.subIndustry || profile?.customSubIndustry || "",
        businessType: Array.isArray(profile?.businessType) ? profile?.businessType.join(", ") : (profile?.businessType || ""),
        differentiators: profile?.differentiators || [],
        yearsInBusiness: profile?.yearsInBusiness || "",
        financialIntelligence: hookUser?.financialIntelligence || null,
        industryAnswers: hookUser?.industryAnswers || null,
      });
      const imgs = res?.data?.images || [];
      if (imgs.length) {
        setImages(imgs);
        try { await update({ websiteImages: imgs }); } catch {}
        setSectionMsg("Images enhanced.");
      } else setSectionMsg("Couldn't generate new images. Try again.");
    } catch (e) { setSectionMsg("Couldn't generate new images. Try again."); }
    finally { setEnhancingImages(false); }
  };

  // Generate a fresh AI image set that matches the STYLE of the client's
  // uploaded photos (vision-analyzed + used as direct visual reference), so
  // the "AI-Generated" view looks like their real work without reusing the
  // exact uploaded photos.
  const generateAiFromUploads = async () => {
    setEnhancingImages(true); setSectionMsg("");
    try {
      const res = await base44.functions.invoke("regenerateWebsiteImages", {
        businessName: profile?.businessName || "",
        services: profile?.services || [],
        location: profile?.primaryLocation || "",
        count: 6,
        industry: profile?.industry || "",
        subIndustry: profile?.subIndustry || profile?.customSubIndustry || "",
        businessType: Array.isArray(profile?.businessType) ? profile?.businessType.join(", ") : (profile?.businessType || ""),
        differentiators: profile?.differentiators || [],
        yearsInBusiness: profile?.yearsInBusiness || "",
        financialIntelligence: hookUser?.financialIntelligence || null,
        industryAnswers: hookUser?.industryAnswers || null,
        referenceImages: profile?.galleryUrls || [],
      });
      const imgs = res?.data?.images || [];
      if (imgs.length) {
        setImages(imgs);
        setAiFromUploadsDone(true);
        try { await update({ websiteImages: imgs }); } catch {}
        setSectionMsg("AI images matched to your photo style.");
      } else setSectionMsg("Couldn't generate style-matched images. Try again.");
    } catch (e) { setSectionMsg("Couldn't generate style-matched images. Try again."); }
    finally { setEnhancingImages(false); }
  };

  // Which image set is currently displayed in the previews.
  const displayImages = imageSource === "uploads" && uploadedGallery
    ? profile.galleryUrls
    : images;

  const regenerateLayouts = () => {
    setRegeneratingLayouts(true);
    setTimeout(() => {
      setShownLayouts(shuffle(WEBSITE_LAYOUTS, shownLayouts.map((l) => l.id), 10));
      setRegeneratingLayouts(false);
    }, 250);
  };

  const submitSectionComment = async (section, comment) => {
    const meta = SECTION_META[section] || { label: section };
    try {
      await base44.functions.invoke("submitRevisionRequest", {
        comment: `[${meta.label}] ${comment}`, pipelineStep: "website", section, clientEmail: user?.email || "",
      });
      setSectionMsg(`Comment sent for ${meta.label} — our team will adjust it.`);
    } catch (e) { setSectionMsg("Couldn't send. Try again."); }
  };

  const regenerateSection = async (section, feedback) => {
    if (section === "gallery") return enhanceImages();
    setSectionBusy(section); setSectionMsg("");
    try {
      const res = await base44.functions.invoke("regenerateWebsiteSection", { section, content, profile, feedback });
      const updates = res?.data?.updates;
      if (updates) {
        const next = { ...content, ...updates };
        setContent(next);
        try { await update({ websiteContent: next }); } catch {}
        setSectionMsg(`${SECTION_META[section]?.label || section} regenerated.`);
      } else setSectionMsg("Couldn't regenerate. Try again.");
    } catch (e) { setSectionMsg("Couldn't regenerate. Try again."); }
    finally { setSectionBusy(""); }
  };

  const approve = async () => {
    if (!selectedId) { setError("Pick a layout to approve."); return; }
    setSaving(true); setError("");
    try {
      await update({
        chosenWebsiteLayout: selectedId, chosenPalette: paletteId,
        websiteContent: content, websiteImages: images, chosenImageSource: imageSource, designPacksChosen: true,
      });
      try { await logReceipt({ action: "Website layout approved", entityType: "User", entityId: "self", status: "success", notes: `Layout ${selectedId} · palette ${paletteId} · images ${imageSource}` }); } catch {}
      await notifyStepComplete("website", { businessName: profile?.businessName || "" });
      setSaved(true);
      try { localStorage.setItem("coach:done:/design-direction", "1"); } catch {}
      setTimeout(() => navigate("/social-media"), 800);
    } catch (e) { setError("Couldn't save. Please try again."); }
    finally { setSaving(false); }
  };

  const requestRevision = async () => {
    const chipText = reviseChips.filter((c) => c !== "Other").join(", ");
    const full = [chipText, reviseComment.trim()].filter(Boolean).join(chipText && reviseComment.trim() ? " — " : "");
    if (!full.trim()) { setReviseError("Add a note or pick an option."); return; }
    setSendingRevise(true); setReviseError("");
    try {
      await base44.functions.invoke("submitRevisionRequest", { comment: full, pipelineStep: "website", clientEmail: user?.email || "" });
      setReviseSent(true); setReviseComment(""); setReviseChips([]);
    } catch (e) { setReviseError("Couldn't send. Please try again."); }
    finally { setSendingRevise(false); }
  };

  const ready = profile && content && !generating;

  return (
    <div className="mx-auto max-w-6xl">
      <BackButton to="/brand-generator" />
      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
            <LayoutGrid className="h-4 w-4" /> Website Design
          </div>
          <span className="ml-auto rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-medium text-white/60">
            {shownLayouts.length} layouts · {profile?.businessName || "your business"}
          </span>
        </div>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">See your logo &amp; brand on real website layouts</h1>
        <p className="mt-1 text-sm text-white/60">
          We wrote your site copy from your onboarding answers and real info about {profile?.primaryLocation || "your area"}.
          We've <span className="text-lime-400 font-semibold">auto-selected a layout</span> — just click Continue, or pick a different one if you prefer.
        </p>

        {/* Brand palette picker */}
        <div className="mt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-lime-400">Brand colors</div>
          <div className="flex flex-wrap gap-2">
            {PALETTES.map((p) => {
              const on = p.id === paletteId;
              return (
                <button key={p.id} type="button" onClick={() => setPaletteId(p.id)}
                  className={cn("inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors", on ? "border-lime-400 bg-lime-400/10 text-lime-300" : "border-white/15 text-white/60 hover:border-white/30")}>
                  <span className="flex">
                    <span className="h-3.5 w-3.5 rounded-full border border-white/20" style={{ backgroundColor: p.dark.bg }} />
                    <span className="-ml-1.5 h-3.5 w-3.5 rounded-full border border-white/20" style={{ backgroundColor: p.dark.accent }} />
                  </span>
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Image source toggle — only when the client uploaded their own photos.
            Lets them compare their real photos vs an AI-generated set that
            matches their style, and pick which to use on the site. */}
        {uploadedGallery && (
          <div className="mt-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-lime-400">Gallery images</div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-900 p-0.5">
                <button type="button" onClick={() => setImageSource("uploads")}
                  className={cn("inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium", imageSource === "uploads" ? "bg-lime-400 text-black" : "text-white/60 hover:text-white")}>
                  <Images className="h-3.5 w-3.5" /> My Photos
                </button>
                <button type="button" onClick={() => { setImageSource("ai"); if (!images.length && !aiFromUploadsDone && !enhancingImages) generateAiFromUploads(); }}
                  className={cn("inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium", imageSource === "ai" ? "bg-lime-400 text-black" : "text-white/60 hover:text-white")}>
                  {enhancingImages && imageSource === "ai" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} AI-Generated
                </button>
              </div>
              <span className="text-[11px] text-white/40">
                {imageSource === "uploads"
                  ? "Showing your uploaded project photos."
                  : enhancingImages
                    ? "Generating images that match your photo style…"
                    : "AI images styled after your photos — pick the set you like best."}
              </span>
            </div>
          </div>
        )}

        {/* Global controls */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-900 p-0.5">
            <button type="button" onClick={() => setDevice("desktop")} className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium", device === "desktop" ? "bg-lime-400 text-black" : "text-white/60 hover:text-white")}>
              <Monitor className="h-3.5 w-3.5" /> Desktop
            </button>
            <button type="button" onClick={() => setDevice("mobile")} className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium", device === "mobile" ? "bg-lime-400 text-black" : "text-white/60 hover:text-white")}>
              <Smartphone className="h-3.5 w-3.5" /> Mobile
            </button>
          </div>
          <button type="button" onClick={() => setLight((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white/80 hover:bg-white/5">
            {light ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />} {light ? "Light" : "Dark"}
          </button>
          {!content && !generating && genError && (
            <button type="button" onClick={() => generateContent(profile)} className="inline-flex items-center gap-1.5 rounded-lg border border-lime-400/50 px-3 py-1.5 text-xs font-medium text-lime-300 hover:bg-lime-400/10">
              <Sparkles className="h-3.5 w-3.5" /> Retry content
            </button>
          )}
        </div>

        {saved && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
            <Check className="h-4 w-4" /> Website design approved — taking you to your designs…
          </div>
        )}

        {generating && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-zinc-950 py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
            <p className="mt-3 text-sm text-white/60">Writing your website copy from your onboarding &amp; {profile?.primaryLocation || "your area"}…</p>
            <p className="text-xs text-white/40">Pulling real local info — about 20 seconds.</p>
          </div>
        )}

        {genError && !generating && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm text-red-300">
            <AlertCircle className="h-4 w-4" /> {genError}
          </div>
        )}

        {ready && (
          <div className={cn("mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 transition-opacity", regeneratingLayouts && "opacity-40")}>
            {shownLayouts.map((L) => {
              const on = selectedId === L.id;
              const isMobile = device === "mobile";
              return (
                <div key={L.id} className={cn("overflow-hidden rounded-xl border-2 bg-zinc-950 transition-all", on ? "border-lime-400 ring-2 ring-lime-400/40" : "border-white/10 hover:border-white/25")}>
                  <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-white">{L.name}</div>
                      <div className="truncate text-[10px] text-white/40">{L.tagline}</div>
                    </div>
                    {on && <span className="rounded-full bg-lime-400/15 px-2 py-0.5 text-[9px] font-bold uppercase text-lime-400">Selected</span>}
                  </div>
                  <button type="button" onClick={() => setPreview(L)} className="block w-full text-left">
                    <ScaledPreview designWidth={isMobile ? 390 : 1280} aspect={isMobile ? 1.5 : 0.62}>
                      <WebsitePreview layout={L} content={content} images={displayImages} profile={profile} theme={theme} mobile={isMobile} logoUrl={logoUrl} />
                    </ScaledPreview>
                  </button>
                  <div className="flex items-center gap-2 p-2.5">
                    <button type="button" onClick={() => setSelectedId(L.id)} className={cn("inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors", on ? "bg-lime-400 text-black" : "border border-white/15 text-white/70 hover:border-lime-400/50 hover:text-lime-300")}>
                      {on ? <><Check className="h-3.5 w-3.5" /> Selected</> : "Select"}
                    </button>
                    <button type="button" onClick={() => setPreview(L)} className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300">
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {/* Enhancement actions */}
        {ready && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            <ActionBtn onClick={regenerateLayouts} loading={regeneratingLayouts} icon={RefreshCw} label="Regenerate layouts" />
            <ActionBtn onClick={enhanceContent} loading={enhancingContent} icon={Wand2} label="Enhance content" />
            <ActionBtn onClick={uploadedGallery ? generateAiFromUploads : enhanceImages} loading={enhancingImages} icon={Images} label={uploadedGallery ? "Regenerate AI images" : "Enhance images"} />
            {sectionMsg && <span className="self-center text-xs text-lime-300">{sectionMsg}</span>}
          </div>
        )}

        {/* Approve / Revise bar */}
        {ready && (
          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            {reviseSent ? (
              <div className="flex items-center gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
                <Check className="h-4 w-4" /> Your revision request was sent to our team — we'll be in touch shortly.
              </div>
            ) : revising ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-lime-400">What needs to change?</label>
                <div className="flex flex-wrap gap-1.5">
                  {REVISE_CHIPS.map((c) => (
                    <button key={c} type="button" onClick={() => setReviseChips((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c])}
                      className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors", reviseChips.includes(c) ? "border-lime-400 bg-lime-400/15 text-lime-300" : "border-white/15 text-white/60 hover:border-white/30")}>
                      {c}
                    </button>
                  ))}
                </div>
                <textarea value={reviseComment} onChange={(e) => setReviseComment(e.target.value)} rows={3} placeholder="Add detail (optional)…"
                  className="w-full resize-none rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none" />
                {reviseError && <p className="text-xs text-red-400">{reviseError}</p>}
                <div className="flex items-center gap-2">
                  <button type="button" onClick={requestRevision} disabled={sendingRevise} className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-50">
                    {sendingRevise ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</> : <><Send className="h-3.5 w-3.5" /> Send to admin</>}
                  </button>
                  <button type="button" onClick={() => { setRevising(false); setReviseError(""); setReviseComment(""); setReviseChips([]); }} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-white/30">
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <button type="button" onClick={() => setRevising(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300">
                    <MessageSquare className="h-3.5 w-3.5" /> Request Revision
                  </button>
                </div>
                <button type="button" onClick={approve} disabled={saving || !selectedId} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <>Continue to Social Media <ArrowRight className="h-4 w-4" /></>}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {preview && (
        <PreviewModal
          layout={preview} content={content} images={displayImages} profile={profile} palette={palette} logoUrl={logoUrl}
          selected={selectedId === preview.id} onSelect={() => setSelectedId(preview.id)} onClose={() => { setPreview(null); setSectionMsg(""); }}
          onSubmitSectionComment={submitSectionComment} onRegenerateSection={regenerateSection}
          sectionBusy={sectionBusy} sectionMsg={sectionMsg}
        />
      )}
    </div>
  );
}

function ActionBtn({ onClick, loading, icon: Icon, label }) {
  return (
    <button type="button" onClick={onClick} disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:border-lime-400/50 hover:text-lime-300 disabled:opacity-50">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />} {label}
    </button>
  );
}

function PreviewModal({ layout, content, images, profile, palette, logoUrl, selected, onSelect, onClose, onSubmitSectionComment, onRegenerateSection, sectionBusy, sectionMsg }) {
  const [device, setDevice] = useState("desktop");
  const [light, setLight] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [chips, setChips] = useState([]);
  const [text, setText] = useState("");
  const theme = buildTheme(palette, light);
  const isMobile = device === "mobile";
  const meta = activeSection ? SECTION_META[activeSection.type] : null;

  const submit = () => {
    const chipText = chips.join(", ");
    const full = [chipText, text.trim()].filter(Boolean).join(chipText && text.trim() ? " — " : "");
    if (!full.trim()) return;
    onSubmitSectionComment(activeSection.type, full);
    setChips([]); setText("");
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-zinc-950 px-3 py-2.5">
        <LayoutGrid className="h-4 w-4 text-lime-400" />
        <span className="text-sm font-semibold text-white">{layout.name}</span>
        <span className="hidden text-xs text-white/40 sm:inline">Hover a section to comment or regenerate it</span>
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-900 p-0.5">
          <button type="button" onClick={() => setDevice("desktop")} className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium", device === "desktop" ? "bg-lime-400 text-black" : "text-white/60 hover:text-white")}>
            <Monitor className="h-3.5 w-3.5" /> Desktop
          </button>
          <button type="button" onClick={() => setDevice("mobile")} className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium", device === "mobile" ? "bg-lime-400 text-black" : "text-white/60 hover:text-white")}>
            <Smartphone className="h-3.5 w-3.5" /> Mobile
          </button>
        </div>
        <button type="button" onClick={() => setLight((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white/80 hover:bg-white/5">
          {light ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />} {light ? "Light" : "Dark"}
        </button>
        <button type="button" onClick={onSelect} className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold", selected ? "border border-lime-400 bg-lime-400/10 text-lime-300" : "bg-lime-400 text-black hover:bg-lime-300")}>
          {selected ? <><Check className="h-3.5 w-3.5" /> Selected</> : "Select this layout"}
        </button>
        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/5 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-zinc-900 p-3 sm:p-6">
        <div className={cn("mx-auto overflow-hidden rounded-xl border shadow-2xl", isMobile ? "w-[390px] rounded-[2rem] border-zinc-700" : "w-full max-w-5xl border-white/10")}>
          {isMobile && (
            <div className="flex justify-center bg-zinc-800 py-2">
              <div className="h-1.5 w-24 rounded-full bg-zinc-600" />
            </div>
          )}
          <WebsitePreview layout={layout} content={content} images={images} profile={profile} theme={theme} mobile={isMobile} logoUrl={logoUrl} annotate onSectionClick={(type) => setActiveSection({ type })} />
        </div>
      </div>

      {activeSection && meta && (
        <div className="border-t border-white/10 bg-zinc-950 p-3 sm:p-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-lime-400">Comment on {meta.label}</span>
              <button type="button" onClick={() => { setActiveSection(null); setChips([]); setText(""); }} className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-white/60 hover:bg-white/5 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {meta.chips.map((c) => (
                <button key={c} type="button" onClick={() => setChips((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c])}
                  className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors", chips.includes(c) ? "border-lime-400 bg-lime-400/15 text-lime-300" : "border-white/15 text-white/60 hover:border-white/30")}>
                  {c}
                </button>
              ))}
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Add detail (optional)…"
              className="mt-2 w-full resize-none rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none" />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button type="button" onClick={submit} className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-xs font-semibold text-black hover:bg-lime-300">
                <Send className="h-3.5 w-3.5" /> Submit comment
              </button>
              {meta.canRegen && (
                <button type="button" onClick={() => onRegenerateSection(activeSection.type, [chips.join(", "), text.trim()].filter(Boolean).join(" — "))} disabled={sectionBusy === activeSection.type}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300 disabled:opacity-50">
                  {sectionBusy === activeSection.type ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Regenerate {meta.label}
                </button>
              )}
              {!meta.canRegen && <span className="text-[11px] text-white/40">Layout-driven section — submit a comment and our team will adjust it.</span>}
              {sectionMsg && <span className="text-xs text-lime-300">{sectionMsg}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}