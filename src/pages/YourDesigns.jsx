import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { LayoutTemplate, PenTool, Shirt, Globe, ArrowRight, Eye, Sparkles } from "lucide-react";
import { DESIGN_PACKS } from "@/components/client/DesignPackPicker";
import DesignPackPreview from "@/components/client/DesignPackPreview";

// Final compilation step: shows every creative choice the client made — their
// chosen logo, brand mockups, and website design direction — together on one
// page so they can see their finished product before signing off.
export default function YourDesigns() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [webPreview, setWebPreview] = useState(null);

  useEffect(() => {
    document.title = "Your Designs · Lead Gen Near You";
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-white/50">Loading your designs…</div>;
  }

  const logoUrl = user?.chosenLogoUrl || "";
  const brandImages = user?.chosenBrandImages || [];
  const webPackIds = user?.designPacks || [];
  const webPacks = DESIGN_PACKS.filter((p) => webPackIds.includes(p.id));
  const profile = user?.epoxyProfile || {};
  const businessName = profile.businessName || "Your epoxy business";

  const webPreviewPack = webPacks[0] || null;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <LayoutTemplate className="h-4 w-4" /> Your Designs
        </div>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Here's your finished brand package</h1>
        <p className="mt-1 text-sm text-white/60">
          Everything you picked for <span className="font-semibold text-white">{businessName}</span> — your logo, brand mockups, and website look — all in one place.
        </p>

        {/* Logo */}
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <PenTool className="h-4 w-4 text-lime-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/80">Your Logo</h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white p-6">
            {logoUrl ? (
              <Image src={logoUrl} alt="Chosen logo" fittingType="fit" className="mx-auto h-40 w-auto" />
            ) : (
              <p className="py-8 text-center text-sm text-white/40">No logo chosen yet.</p>
            )}
          </div>
        </section>

        {/* Brand mockups */}
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Shirt className="h-4 w-4 text-lime-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/80">Brand Mockups</h2>
            <span className="rounded-full bg-lime-400/15 px-1.5 py-0.5 text-[10px] font-bold text-lime-300">{brandImages.length}</span>
          </div>
          {brandImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {brandImages.map((url) => (
                <div key={url} className="overflow-hidden rounded-xl border border-white/10 bg-white">
                  <Image src={url} alt="Brand mockup" fittingType="fit" className="h-40 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-white/10 bg-zinc-950 p-6 text-center text-sm text-white/40">No brand mockups chosen yet.</p>
          )}
        </section>

        {/* Website design */}
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-lime-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/80">Website Design</h2>
            <span className="rounded-full bg-lime-400/15 px-1.5 py-0.5 text-[10px] font-bold text-lime-300">{webPacks.length}</span>
          </div>
          {webPacks.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {webPacks.map((p) => (
                <div key={p.id} className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image src={p.img} alt={p.name} fittingType="fill" className="h-full w-full" />
                  </div>
                  <div className="flex items-center justify-between p-2.5">
                    <span className="text-xs font-semibold text-white">{p.name}</span>
                    <button
                      type="button"
                      onClick={() => setWebPreview(p)}
                      className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-[10px] font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300"
                    >
                      <Eye className="h-3 w-3" /> Preview
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-white/10 bg-zinc-950 p-6 text-center text-sm text-white/40">No website design chosen yet.</p>
          )}
        </section>

        {/* Summary */}
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-lime-400/30 bg-lime-400/5 px-4 py-3 text-sm text-white/70">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" />
          <p>
            Your team now has everything they need to build your epoxy website. Continue to review and sign your service agreement —
            work begins the moment it's signed.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/signatures")}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-lime-300"
        >
          Continue to Sign Agreement <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {webPreview && (
        <DesignPackPreview
          pack={webPreview}
          profile={profile}
          selected={true}
          onSelect={() => {}}
          onClose={() => setWebPreview(null)}
        />
      )}
    </div>
  );
}