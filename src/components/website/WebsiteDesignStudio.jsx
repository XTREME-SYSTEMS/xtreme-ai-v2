import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { LayoutGrid, Monitor, Smartphone, Check, Loader2, Sparkles, Eye, X, MessageSquare, Send, ArrowRight, AlertCircle, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { logReceipt } from "@/lib/pipelineUtils";
import { PALETTES, WEBSITE_LAYOUTS, buildTheme } from "@/components/website/websiteLayouts";
import WebsitePreview, { ScaledPreview } from "@/components/website/WebsitePreview";

// Website Design Studio: generates location-aware content from the client's
// onboarding profile, then renders 10 distinct live website layouts with their
// logo + brand palette (desktop & mobile). The client picks one and approves —
// that exact layout + content is what gets built.
export default function WebsiteDesignStudio() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [content, setContent] = useState(null);
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
  const [revising, setRevising] = useState(false);
  const [reviseComment, setReviseComment] = useState("");
  const [sendingRevise, setSendingRevise] = useState(false);
  const [reviseSent, setReviseSent] = useState(false);
  const [reviseError, setReviseError] = useState("");

  useEffect(() => { document.title = "Website Design · Lead Gen Near You"; }, []);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setProfile(u?.epoxyProfile || null);
      setLogoUrl(u?.chosenLogoUrl || u?.epoxyProfile?.logoUrl || "");
      if (u?.websiteContent) setContent(u.websiteContent);
      if (u?.chosenPalette) setPaletteId(u.chosenPalette);
      if (u?.chosenWebsiteLayout) setSelectedId(u.chosenWebsiteLayout);
      if (u?.designPacksChosen) setSaved(true);
    }).catch(() => {});
  }, []);

  const generateContent = async (p) => {
    setGenerating(true);
    setGenError("");
    try {
      const res = await base44.functions.invoke("generateWebsiteContent", {
        businessName: p?.businessName || "",
        services: p?.services || [],
        serviceArea: p?.primaryLocation || "",
        city: p?.primaryLocation || "",
        state: "",
        differentiators: p?.differentiators || [],
        yearsInBusiness: p?.yearsInBusiness || "",
        phone: p?.phone || "",
        email: p?.email || "",
      });
      const c = res?.data?.content;
      if (!c) throw new Error("no content");
      setContent(c);
      try { await base44.auth.updateMe({ websiteContent: c }); } catch {}
    } catch (e) {
      setGenError("Couldn't generate your website content. You can retry.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (profile && !content && !generating && !genError) generateContent(profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const palette = PALETTES.find((p) => p.id === paletteId) || PALETTES[0];
  const theme = buildTheme(palette, light);

  const approve = async () => {
    if (!selectedId) { setError("Pick a layout to approve."); return; }
    setSaving(true);
    setError("");
    try {
      await base44.auth.updateMe({
        chosenWebsiteLayout: selectedId,
        chosenPalette: paletteId,
        websiteContent: content,
        designPacksChosen: true,
      });
      try { await logReceipt({ action: "Website layout approved", entityType: "User", entityId: "self", status: "success", notes: `Layout ${selectedId} · palette ${paletteId}` }); } catch {}
      setSaved(true);
      try { localStorage.setItem("coach:done:/design-direction", "1"); } catch {}
      setTimeout(() => navigate("/your-designs"), 800);
    } catch (e) {
      setError("Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const requestRevision = async () => {
    if (!reviseComment.trim()) { setReviseError("Add a note for our team."); return; }
    setSendingRevise(true);
    setReviseError("");
    try {
      await base44.functions.invoke("submitRevisionRequest", {
        comment: reviseComment.trim(),
        pipelineStep: "website",
        clientEmail: user?.email || "",
      });
      setReviseSent(true);
      setReviseComment("");
      setRevising(false);
    } catch (e) {
      setReviseError("Couldn't send. Please try again.");
    } finally {
      setSendingRevise(false);
    }
  };

  const ready = profile && content && !generating;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
            <LayoutGrid className="h-4 w-4" /> Website Design
          </div>
          <span className="ml-auto rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-medium text-white/60">
            {WEBSITE_LAYOUTS.length} layouts · {profile?.businessName || "your business"}
          </span>
        </div>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">See your logo &amp; brand on 10 real website layouts</h1>
        <p className="mt-1 text-sm text-white/60">
          We wrote your site copy from your onboarding answers and real info about {profile?.primaryLocation || "your area"}.
          Pick the layout you love — what you approve is exactly what we build.
        </p>

        {/* Brand palette picker */}
        <div className="mt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-lime-400">Brand colors</div>
          <div className="flex flex-wrap gap-2">
            {PALETTES.map((p) => {
              const on = p.id === paletteId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPaletteId(p.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    on ? "border-lime-400 bg-lime-400/10 text-lime-300" : "border-white/15 text-white/60 hover:border-white/30"
                  )}
                >
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

        {/* Global controls: device + light/dark */}
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

        {/* Generating content */}
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

        {/* Layout grid */}
        {ready && (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {WEBSITE_LAYOUTS.map((L) => {
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
                      <WebsitePreview layout={L} content={content} profile={profile} theme={theme} mobile={isMobile} logoUrl={logoUrl} />
                    </ScaledPreview>
                  </button>
                  <div className="flex items-center gap-2 p-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedId(L.id)}
                      className={cn("inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors", on ? "bg-lime-400 text-black" : "border border-white/15 text-white/70 hover:border-lime-400/50 hover:text-lime-300")}
                    >
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

        {/* Approve / Revise bar */}
        {ready && (
          <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
            {reviseSent ? (
              <div className="flex items-center gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
                <Check className="h-4 w-4" /> Your revision request was sent to our team — we'll be in touch shortly.
              </div>
            ) : revising ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-lime-400">What needs to change?</label>
                <textarea
                  value={reviseComment}
                  onChange={(e) => setReviseComment(e.target.value)}
                  rows={3}
                  placeholder="Tell our team what you'd like revised about your website design…"
                  className="w-full resize-none rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
                />
                {reviseError && <p className="text-xs text-red-400">{reviseError}</p>}
                <div className="flex items-center gap-2">
                  <button type="button" onClick={requestRevision} disabled={sendingRevise} className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-50">
                    {sendingRevise ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</> : <><Send className="h-3.5 w-3.5" /> Send to admin</>}
                  </button>
                  <button type="button" onClick={() => { setRevising(false); setReviseError(""); setReviseComment(""); }} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-white/30">
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
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : saved ? <><Check className="h-4 w-4" /> Update selection</> : <>Approve Website <ArrowRight className="h-4 w-4" /></>}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {preview && (
        <PreviewModal
          layout={preview}
          content={content}
          profile={profile}
          palette={palette}
          logoUrl={logoUrl}
          selected={selectedId === preview.id}
          onSelect={() => setSelectedId(preview.id)}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

function PreviewModal({ layout, content, profile, palette, logoUrl, selected, onSelect, onClose }) {
  const [device, setDevice] = useState("desktop");
  const [light, setLight] = useState(false);
  const theme = buildTheme(palette, light);
  const isMobile = device === "mobile";
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-zinc-950 px-3 py-2.5">
        <LayoutGrid className="h-4 w-4 text-lime-400" />
        <span className="text-sm font-semibold text-white">{layout.name}</span>
        <span className="hidden text-xs text-white/40 sm:inline">{layout.tagline}</span>
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
          <WebsitePreview layout={layout} content={content} profile={profile} theme={theme} mobile={isMobile} logoUrl={logoUrl} />
        </div>
      </div>
    </div>
  );
}