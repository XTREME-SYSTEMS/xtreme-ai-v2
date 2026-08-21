import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { LayoutTemplate, PenTool, Shirt, Globe, ArrowRight, Eye, Sparkles, MessageSquareText, Share2, Video, RefreshCw, AlertCircle, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import BackButton from "@/components/client/BackButton";
import { notifyStepComplete } from "@/lib/pipelineNotify";
import { WEBSITE_LAYOUTS, PALETTES, buildTheme } from "@/components/website/websiteLayouts";
import WebsitePreview, { ScaledPreview } from "@/components/website/WebsitePreview";

// Final compilation step: shows every creative choice the client made —
// content tone, logo, brand mockups, live website design, social media kit,
// and video concepts — together on one page. Each section has a selection
// checkbox (all auto-checked); the continue button is blocked until every
// section is confirmed, with a clear flag for anything unchecked.
export default function YourDesigns() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState({ content: true, logo: true, brand: true, website: true, social: true, video: true });
  const [showFlag, setShowFlag] = useState(false);

  useEffect(() => {
    document.title = "Your Designs · Lead Gen Near You";
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-white/50">Loading your designs…</div>;
  }

  const profile = user?.epoxyProfile || {};
  const businessName = profile.businessName || "Your epoxy business";

  // Content tone
  const contentTemplates = user?.contentTemplates?.templates || [];
  const chosenContent = contentTemplates.find((t) => t.id === user?.chosenContentTemplate) || contentTemplates[0] || null;

  // Logo
  const logoUrl = user?.chosenLogoUrl || "";

  // Brand
  const brandImages = user?.chosenBrandImages || [];

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

        {/* Logo — checkerboard background to show transparency */}
        <DesignSection
          icon={PenTool} title="Your Logo" count={logoUrl ? 1 : 0}
          checked={checks.logo} onToggle={() => toggle("logo")}
          onRegenerate={() => navigate("/logo-generator")}
          empty={!logoUrl}
          emptyText="No logo chosen yet."
        >
          {logoUrl && (
            <div className="overflow-hidden rounded-xl border border-white/10 p-6" style={{ backgroundColor: "#1a1a1a", backgroundImage: "linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)", backgroundSize: "20px 20px", backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px" }}>
              <Image src={logoUrl} alt="Chosen logo" fittingType="fit" className="mx-auto h-32 w-auto" />
            </div>
          )}
        </DesignSection>

        {/* Brand Mockups */}
        <DesignSection
          icon={Shirt} title="Brand Mockups" count={brandImages.length}
          checked={checks.brand} onToggle={() => toggle("brand")}
          onRegenerate={() => navigate("/brand-generator")}
          empty={brandImages.length === 0}
          emptyText="No brand mockups chosen yet."
        >
          {brandImages.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {brandImages.map((url) => (
                <div key={url} className="overflow-hidden rounded-xl border border-white/10 bg-white">
                  <Image src={url} alt="Brand mockup" fittingType="fit" className="h-32 w-full" />
                </div>
              ))}
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

        {/* Social Media */}
        <DesignSection
          icon={Share2} title="Social Media Kit" count={socialTemplates.length}
          checked={checks.social} onToggle={() => toggle("social")}
          onRegenerate={() => navigate("/social-media")}
          empty={socialTemplates.length === 0}
          emptyText="No social media pack chosen yet."
        >
          {socialTemplates.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                {socialTemplates.slice(0, 10).map((t) => (
                  <div key={t.id} className="overflow-hidden rounded-lg border border-white/10 bg-white">
                    <Image src={t.url} alt={t.label} fittingType="fit" className="h-20 w-full" />
                  </div>
                ))}
              </div>
              {socialPosts.length > 0 && (
                <p className="mt-2 text-xs text-white/50">Includes a {socialPosts.length}-day content calendar with captions &amp; posting times.</p>
              )}
            </>
          )}
        </DesignSection>

        {/* Videos */}
        <DesignSection
          icon={Video} title="Video Concepts" count={videoConcepts.length}
          checked={checks.video} onToggle={() => toggle("video")}
          onRegenerate={() => navigate("/video-generator")}
          empty={videoConcepts.length === 0}
          emptyText="No video concepts chosen yet."
        >
          {videoConcepts.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {videoConcepts.slice(0, 10).map((c) => (
                <div key={c.id} className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900">
                  {c.videoUrl ? (
                    <video src={c.videoUrl} className="aspect-video w-full object-cover" muted />
                  ) : (
                    <Image src={c.thumbnailUrl} alt={c.title} fittingType="fill" className="aspect-video w-full" />
                  )}
                </div>
              ))}
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
function DesignSection({ icon: Icon, title, count, checked, onToggle, onRegenerate, empty, emptyText, children }) {
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
        <button
          type="button"
          onClick={onRegenerate}
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-[10px] font-medium text-white/60 hover:border-lime-400/50 hover:text-lime-300"
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