import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { LayoutTemplate, PenTool, Shirt, Globe, ArrowRight, Eye, Sparkles, MessageSquareText, Share2, Video, RefreshCw, AlertCircle, Check, X, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import BackButton from "@/components/client/BackButton";
import { notifyStepComplete } from "@/lib/pipelineNotify";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientUpdate } from "@/hooks/useClientUpdate";
import { WEBSITE_LAYOUTS, PALETTES, buildTheme } from "@/components/website/websiteLayouts";
import WebsitePreview, { ScaledPreview } from "@/components/website/WebsitePreview";
import { BRAND_TYPES } from "@/lib/designPrompts";

// Final compilation step: shows every creative choice the client made —
// content tone, logo, brand mockups, live website design, social media kit,
// and video concepts — together on one page. Each section has a selection
// checkbox (all auto-checked); the continue button is blocked until every
// section is confirmed. Each individual card also has its own checkbox and
// regenerate button for granular control.
export default function YourDesigns() {
  const navigate = useNavigate();
  const { user: hookUser, loading } = useClientUser();
  const { update } = useClientUpdate();
  const [user, setUser] = useState(null);
  const [checks, setChecks] = useState({ content: true, logo: true, brand: true, website: true, social: true, video: true });
  const [showFlag, setShowFlag] = useState(false);
  const [itemChecks, setItemChecks] = useState({ brand: {}, social: {}, video: {} });
  const [regeneratingBrandId, setRegeneratingBrandId] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    document.title = "Your Designs · Lead Gen Near You";
  }, []);

  useEffect(() => {
    if (hookUser) setUser(hookUser);
  }, [hookUser]);

  useEffect(() => {
    if (user) setLogoUrl(user?.chosenLogoUrl || "");
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-white/50">Loading your designs…</div>;
  }

  const profile = user?.epoxyProfile || {};
  const businessName = profile.businessName || "Your epoxy business";

  // Content tone
  const contentTemplates = user?.contentTemplates?.templates || [];
  const chosenContent = contentTemplates.find((t) => t.id === user?.chosenContentTemplate) || contentTemplates[0] || null;

  // Brand — use brandPacks (has id, label, url) for per-item regenerate
  const brandPacks = user?.brandPacks || [];

  // Website — the ACTUAL chosen layout, rendered live
  const chosenLayoutId = user?.chosenWebsiteLayout || "";
  const chosenLayout = WEBSITE_LAYOUTS.find((l) => l.id === chosenLayoutId) || WEBSITE_LAYOUTS[0];
  const chosenPalette = PALETTES.find((p) => p.id === user?.chosenPalette) || PALETTES[0];
  const webTheme = buildTheme(chosenPalette, false);
  const webContent = user?.websiteContent || null;
  const webImages = user?.websiteImages || [];

  // Social media
  const socialTemplates = user?.socialMediaPack?.templates || [];
  const socialPosts = user?.socialMediaPack?.posts || [];

  // Videos
  const videoConcepts = user?.videoPack?.concepts || [];

  const toggle = (key) => {
    setChecks((c) => ({ ...c, [key]: !c[key] }));
    setShowFlag(false);
  };

  const toggleItem = (section, id) => {
    setItemChecks((prev) => ({
      ...prev,
      [section]: { ...prev[section], [id]: prev[section]?.[id] === false ? true : false },
    }));
  };

  const isItemChecked = (section, id) => itemChecks[section]?.[id] !== false;

  // Regenerate a single brand mockup in-place using the client's logo
  const regenerateBrandItem = async (pack) => {
    if (regeneratingBrandId) return;
    const brandType = BRAND_TYPES.find((b) => b.id === pack.id);
    if (!brandType) return;
    setRegeneratingBrandId(pack.id);
    try {
      const res = await base44.integrations.Core.GenerateImage({
        prompt: brandType.prompt(businessName, profile?.industry),
        existing_image_urls: logoUrl ? [logoUrl] : undefined,
      });
      const next = brandPacks.map((p) => (p.id === pack.id ? { ...p, url: res.url } : p));
      const updatedUser = { ...user, brandPacks: next, chosenBrandImages: next.map((p) => p.url) };
      setUser(updatedUser);
      try { await update({ brandPacks: next, chosenBrandImages: next.map((p) => p.url) }); } catch {}
    } catch (e) {
      // best effort
    } finally {
      setRegeneratingBrandId(null);
    }
  };

  const continueToSign = () => {
    const allChecked = Object.values(checks).every(Boolean);
    if (!allChecked) {
      setShowFlag(true);
      return;
    }
    notifyStepComplete("designs", { clientEmail: user?.email || "", businessName: profile?.businessName || "" });
    navigate("/signatures");
  };

  const uncheckedSections = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  const sectionLabels = { content: "Content Tone", logo: "Logo", brand: "Brand Mockups", website: "Website Design", social: "Social Media", video: "Videos" };

  // D4 — Asset download: triggers a browser download for a single URL
  const downloadAsset = (url, filename) => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "asset";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // D4 — Download all brand mockups (opens each in sequence)
  const downloadAllBrand = () => {
    brandPacks.forEach((p, i) => {
      setTimeout(() => downloadAsset(p.url, `${p.label || "brand-" + i}.png`), i * 300);
    });
  };

  // D4 — Download all social templates
  const downloadAllSocial = () => {
    socialTemplates.forEach((t, i) => {
      setTimeout(() => downloadAsset(t.url, `${t.label || "social-" + i}.png`), i * 300);
    });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <BackButton to="/video-generator" />
      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <LayoutTemplate className="h-4 w-4" /> Your Designs
        </div>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Here's your finished brand package</h1>
        <p className="mt-1 text-sm text-white/60">
          Everything you picked for <span className="font-semibold text-white">{businessName}</span> — your content tone, logo, brand, website, social media, and videos. Confirm each section below, then continue to sign.
        </p>

        {showFlag && uncheckedSections.length > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2.5 text-sm text-amber-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Please confirm these sections:</p>
              <p className="mt-0.5 text-xs">{uncheckedSections.map((s) => sectionLabels[s]).join(", ")}. Check the box on each card, or click Regenerate to change it.</p>
            </div>
          </div>
        )}

        {/* Content Tone */}
        <DesignSection
          icon={MessageSquareText} title="Content Tone" count={chosenContent ? 1 : 0}
          checked={checks.content} onToggle={() => toggle("content")}
          onRegenerate={() => navigate("/content-generator")}
          empty={!chosenContent}
          emptyText="No content tone chosen yet."
        >
          {chosenContent && (
            <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-lime-400">{chosenContent.tone}</div>
              <h3 className="mt-1 text-sm font-bold text-white">{chosenContent.name}</h3>
              <p className="mt-1 text-sm text-white/80">{chosenContent.heroHeadline}</p>
              <p className="mt-0.5 text-xs text-white/50">{chosenContent.heroSubhead}</p>
            </div>
          )}
        </DesignSection>

        {/* Logo — plain img for transparent PNG display */}
        <DesignSection
          icon={PenTool} title="Your Logo" count={logoUrl ? 1 : 0}
          checked={checks.logo} onToggle={() => toggle("logo")}
          onRegenerate={() => navigate("/logo-generator")}
          onDownload={logoUrl ? () => downloadAsset(logoUrl, "logo.png") : null}
          empty={!logoUrl}
          emptyText="No logo chosen yet."
        >
          {logoUrl && (
            <div className="overflow-hidden rounded-xl border border-white/10 p-6" style={{ backgroundColor: "#1a1a1a", backgroundImage: "linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)", backgroundSize: "20px 20px", backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px" }}>
              <img src={logoUrl} alt="Chosen logo" className="mx-auto h-32 w-auto object-contain" />
            </div>
          )}
        </DesignSection>

        {/* Brand Mockups — per-item checkbox + regenerate */}
        <DesignSection
          icon={Shirt} title="Brand Mockups" count={brandPacks.length}
          checked={checks.brand} onToggle={() => toggle("brand")}
          onRegenerate={() => navigate("/brand-generator")}
          onDownload={brandPacks.length > 0 ? downloadAllBrand : null}
          empty={brandPacks.length === 0}
          emptyText="No brand mockups chosen yet."
        >
          {brandPacks.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {brandPacks.map((pack) => {
                const itemOn = isItemChecked("brand", pack.id);
                const regen = regeneratingBrandId === pack.id;
                return (
                  <div key={pack.id} className="overflow-hidden rounded-xl border border-white/10 bg-white">
                    <div className="relative">
                      <Image src={pack.url} alt={pack.label} fittingType="fit" className="h-32 w-full" />
                      <button
                        type="button"
                        onClick={() => toggleItem("brand", pack.id)}
                        className={cn("absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded border-2", itemOn ? "border-lime-400 bg-lime-400 text-black" : "border-white/30 bg-transparent")}
                      >
                        {itemOn && <Check className="h-3.5 w-3.5" />}
                      </button>
                      {regen && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                          <Loader2 className="h-6 w-6 animate-spin text-lime-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <div className="truncate text-xs font-semibold text-white">{pack.label}</div>
                      <button
                        type="button"
                        onClick={() => regenerateBrandItem(pack)}
                        disabled={!!regeneratingBrandId}
                        className="mt-1.5 inline-flex w-full items-center justify-center gap-1 rounded-md border border-white/15 px-2 py-1 text-[10px] font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300 disabled:opacity-50"
                      >
                        <RefreshCw className={cn("h-3 w-3", regen && "animate-spin")} /> {regen ? "Regenerating…" : "Regenerate"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DesignSection>

        {/* Website Design — LIVE rendered chosen layout */}
        <DesignSection
          icon={Globe} title="Website Design" count={chosenLayoutId ? 1 : 0}
          checked={checks.website} onToggle={() => toggle("website")}
          onRegenerate={() => navigate("/design-direction")}
          empty={!chosenLayoutId}
          emptyText="No website design chosen yet."
        >
          {chosenLayoutId && (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
              <ScaledPreview designWidth={1280} aspect={0.6}>
                <WebsitePreview layout={chosenLayout} content={webContent} images={webImages} profile={profile} theme={webTheme} mobile={false} logoUrl={logoUrl} />
              </ScaledPreview>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-xs font-semibold text-white">{chosenLayout.name}</span>
                <span className="text-[10px] text-white/40">{chosenPalette.name}</span>
              </div>
            </div>
          )}
        </DesignSection>

        {/* Social Media — per-item checkbox */}
        <DesignSection
          icon={Share2} title="Social Media Kit" count={socialTemplates.length}
          checked={checks.social} onToggle={() => toggle("social")}
          onRegenerate={() => navigate("/social-media")}
          onDownload={socialTemplates.length > 0 ? downloadAllSocial : null}
          empty={socialTemplates.length === 0}
          emptyText="No social media pack chosen yet."
        >
          {socialTemplates.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                {socialTemplates.slice(0, 10).map((t) => {
                  const itemOn = isItemChecked("social", t.id);
                  return (
                    <div key={t.id} className="relative overflow-hidden rounded-lg border border-white/10 bg-white">
                      <Image src={t.url} alt={t.label} fittingType="fit" className="h-20 w-full" />
                      <button
                        type="button"
                        onClick={() => toggleItem("social", t.id)}
                        className={cn("absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded border-2", itemOn ? "border-lime-400 bg-lime-400 text-black" : "border-white/30 bg-transparent")}
                      >
                        {itemOn && <Check className="h-3 w-3" />}
                      </button>
                    </div>
                  );
                })}
              </div>
              {socialPosts.length > 0 && (
                <p className="mt-2 text-xs text-white/50">Includes a {socialPosts.length}-day content calendar with captions &amp; posting times.</p>
              )}
            </>
          )}
        </DesignSection>

        {/* Videos — per-item checkbox */}
        <DesignSection
          icon={Video} title="Video Concepts" count={videoConcepts.length}
          checked={checks.video} onToggle={() => toggle("video")}
          onRegenerate={() => navigate("/video-generator")}
          empty={videoConcepts.length === 0}
          emptyText="No video concepts chosen yet."
        >
          {videoConcepts.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {videoConcepts.slice(0, 10).map((c) => {
                const itemOn = isItemChecked("video", c.id);
                return (
                  <div key={c.id} className="relative overflow-hidden rounded-lg border border-white/10 bg-zinc-900">
                    {c.videoUrl ? (
                      <video src={c.videoUrl} className="aspect-video w-full object-cover" muted />
                    ) : (
                      <Image src={c.thumbnailUrl} alt={c.title} fittingType="fill" className="aspect-video w-full" />
                    )}
                    <button
                      type="button"
                      onClick={() => toggleItem("video", c.id)}
                      className={cn("absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded border-2", itemOn ? "border-lime-400 bg-lime-400 text-black" : "border-white/30 bg-transparent")}
                    >
                      {itemOn && <Check className="h-3 w-3" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </DesignSection>

        {/* Summary */}
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-lime-400/30 bg-lime-400/5 px-4 py-3 text-sm text-white/70">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" />
          <p>Your team now has everything they need to build your epoxy website and brand. Confirm each section above, then continue to sign your service agreement.</p>
        </div>

        <button
          type="button"
          onClick={continueToSign}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-lime-300"
        >
          Continue to Sign Agreement <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// A section card with a selection checkbox (top-left), a regenerate button,
// and an empty state. The checkbox gates the continue button.
function DesignSection({ icon: Icon, title, count, checked, onToggle, onRegenerate, onDownload, empty, emptyText, children }) {
  return (
    <section className={cn("mt-6 rounded-xl border p-4 transition-colors", checked ? "border-white/10 bg-zinc-950/50" : "border-amber-400/40 bg-amber-400/5")}>
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors", checked ? "border-lime-400 bg-lime-400 text-black" : "border-white/30 bg-transparent")}
        >
          {checked && <Check className="h-3.5 w-3.5" />}
        </button>
        <Icon className="h-4 w-4 text-lime-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/80">{title}</h2>
        {count > 0 && <span className="rounded-full bg-lime-400/15 px-1.5 py-0.5 text-[10px] font-bold text-lime-300">{count}</span>}
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            className="ml-auto inline-flex items-center gap-1 rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-1 text-[10px] font-medium text-lime-300 hover:border-lime-400/60 hover:bg-lime-400/20"
          >
            <Download className="h-3 w-3" /> Download
          </button>
        )}
        <button
          type="button"
          onClick={onRegenerate}
          className={cn("inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-[10px] font-medium text-white/60 hover:border-lime-400/50 hover:text-lime-300", onDownload ? "ml-0" : "ml-auto")}
        >
          <RefreshCw className="h-3 w-3" /> Regenerate
        </button>
      </div>
      {empty ? (
        <p className="py-4 text-center text-sm text-white/40">{emptyText}</p>
      ) : (
        children
      )}
    </section>
  );
}