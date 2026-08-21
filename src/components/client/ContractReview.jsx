import { useNavigate } from "react-router-dom";
import {
  Package, Building2, MessageSquareText, PenTool, Shirt, Palette, Share2,
  Video, Sparkles, Camera, CheckCircle2, Pencil,
} from "lucide-react";
import { getProductDetails } from "@/lib/productDetails";
import { getEnhancementById } from "@/lib/dynamicEnhancements";

// Compiles every decision a client made across the portal into a single
// reviewable "digital contract" shown on the Signatures page. Each section
// has an Edit button that jumps back to the relevant step so the client can
// change anything before signing. The legal EsignDocument (signed separately)
// carries the same decisions into the formal record.
function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3 py-1 text-xs">
      <span className="text-white/40">{label}</span>
      <span className="text-right text-white/80">{value}</span>
    </div>
  );
}

function ReviewSection({ icon: Icon, title, editTo, children }) {
  const navigate = useNavigate();
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-lime-400" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {editTo && (
          <button
            type="button"
            onClick={() => navigate(editTo)}
            className="ml-auto inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-[10px] font-medium text-white/50 hover:border-lime-400/50 hover:text-lime-300"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Thumb({ src, alt = "" }) {
  return <img src={src} alt={alt} className="h-14 w-14 rounded-lg border border-white/10 object-cover" />;
}

export default function ContractReview({ user, project, productId }) {
  const profile = user?.epoxyProfile || {};
  const industryAnswers = profile.industryAnswers || {};
  const enhancements = user?.enhancements || [];
  const enhancementsTotal = user?.enhancementsTotal || 0;
  const product = getProductDetails(productId);

  const chosenTemplateId = project?.chosen_content_template;
  const templates = project?.content_templates || [];
  const chosenTemplate = templates.find((t) => t.id === chosenTemplateId || t.name === chosenTemplateId);

  const logoUrl = project?.chosen_logo_url || user?.chosenLogoUrl;
  const brandImages = project?.chosen_brand_images || user?.chosenBrandImages || [];
  const layout = project?.chosen_website_layout;
  const palette = project?.chosen_palette;

  const ownerPhotos = profile.ownerPhotos || [];
  const teamPhotos = profile.teamPhotos || [];
  const workPhotos = profile.workPhotos || profile.galleryUrls || [];
  const otherPhotos = profile.otherPhotos || [];

  const answerEntries = Object.entries(industryAnswers).filter(
    ([, v]) => v && (!Array.isArray(v) || v.length > 0)
  );

  const pending = (label) => <span className="text-xs text-amber-400/80">{label}</span>;
  const done = (label) => <span className="text-xs text-white/60">{label}</span>;

  return (
    <div className="mb-6 space-y-3">
      <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-4">
        <h2 className="text-base font-semibold text-white">Your Service Agreement — Review</h2>
        <p className="mt-1 text-xs text-white/60">
          Below is everything you told us and every decision you made. Review each section — tap <span className="font-semibold text-lime-300">Edit</span> on any section to go back and change it. When everything looks right, sign your agreement below.
        </p>
      </div>

      <ReviewSection icon={Package} title="Package & Plan" editTo="/my-package">
        <p className="text-xs font-semibold text-lime-300">{product.tagline}</p>
        <p className="mt-1 text-xs text-white/60">{product.description}</p>
        <ul className="mt-2 space-y-1">
          {product.features.slice(0, 12).map((f, i) => (
            <li key={i} className="flex gap-1.5 text-[11px] text-white/70">
              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-lime-400/70" />
              {f}
            </li>
          ))}
          {product.features.length > 12 && (
            <li className="text-[11px] text-white/40">+ {product.features.length - 12} more included items</li>
          )}
        </ul>
      </ReviewSection>

      <ReviewSection icon={Building2} title="Business Profile" editTo="/business-profile">
        <Field label="Business name" value={profile.businessName} />
        <Field label="Industry" value={profile.industry} />
        <Field label="Sub-industry" value={profile.subIndustry || profile.customSubIndustry} />
        <Field label="Stage" value={profile.businessStage} />
        <Field
          label="Customer base"
          value={Array.isArray(profile.businessType) ? profile.businessType.join(", ") : profile.businessType}
        />
        <Field label="Primary location" value={profile.primaryLocation} />
        <Field label="Service radius" value={profile.radius} />
        <Field label="Years in business" value={profile.yearsInBusiness} />
        <Field label="Phone" value={profile.phone} />
        <Field label="Email" value={profile.email} />
        <Field label="Current website" value={profile.website} />
      </ReviewSection>

      {answerEntries.length > 0 && (
        <ReviewSection icon={MessageSquareText} title="Industry Question Answers" editTo="/business-profile">
          <div className="space-y-2">
            {answerEntries.map(([k, v]) => (
              <div key={k} className="rounded-lg border border-white/5 bg-black/30 p-2">
                <div className="text-[10px] uppercase tracking-wide text-white/30">
                  {k.replace(/_/g, " ")}
                </div>
                <div className="mt-0.5 text-xs text-white/80">
                  {Array.isArray(v) ? v.join(", ") : String(v)}
                </div>
              </div>
            ))}
          </div>
        </ReviewSection>
      )}

      <ReviewSection icon={MessageSquareText} title="Website Content Tone" editTo="/content-generator">
        {chosenTemplate ? (
          <>
            <p className="text-xs font-semibold text-lime-300">
              {chosenTemplate.name || chosenTemplate.tone || "Selected"}
            </p>
            {chosenTemplate.description && (
              <p className="mt-1 text-[11px] text-white/60">{chosenTemplate.description}</p>
            )}
          </>
        ) : project?.content_templates_chosen || user?.contentTemplatesChosen ? (
          done("Content tone approved.")
        ) : (
          pending("Not yet selected — tap Edit to choose.")
        )}
      </ReviewSection>

      <ReviewSection icon={PenTool} title="Logo" editTo="/logo-generator">
        {logoUrl ? (
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="logo" className="h-16 w-16 rounded-lg border border-white/10 bg-white/5 object-contain p-1" />
            {done("Logo approved.")}
          </div>
        ) : (
          pending("Not yet selected — tap Edit to choose.")
        )}
      </ReviewSection>

      <ReviewSection icon={Shirt} title="Brand Mockups" editTo="/brand-generator">
        {brandImages.length > 0 ? (
          <div>
            {done(`${brandImages.length} brand mockup(s) approved.`)}
            <div className="mt-2 flex flex-wrap gap-2">
              {brandImages.slice(0, 6).map((url, i) => (
                <Thumb key={i} src={url} />
              ))}
            </div>
          </div>
        ) : (
          pending("Not yet selected — tap Edit to choose.")
        )}
      </ReviewSection>

      <ReviewSection icon={Palette} title="Website Design" editTo="/design-direction">
        {layout || palette ? (
          <div className="space-y-1">
            <Field label="Layout" value={layout} />
            <Field label="Color palette" value={palette} />
          </div>
        ) : project?.design_packs_chosen || user?.designPacksChosen ? (
          done("Website design approved.")
        ) : (
          pending("Not yet selected — tap Edit to choose.")
        )}
      </ReviewSection>

      <ReviewSection icon={Share2} title="Social Media Kit" editTo="/social-media">
        {project?.social_media_chosen || user?.socialMediaChosen
          ? done("Social media pack approved — profile, cover, stories, posts & 30-day calendar.")
          : pending("Not yet selected — tap Edit to choose.")}
      </ReviewSection>

      <ReviewSection icon={Video} title="Video Concepts" editTo="/video-generator">
        {project?.video_chosen || user?.videoChosen
          ? done("Video concepts approved.")
          : pending("Not yet selected — tap Edit to choose.")}
      </ReviewSection>

      <ReviewSection icon={Sparkles} title="Enhancements & Add-ons" editTo="/enhancements">
        {enhancements.length > 0 ? (
          <div>
            <ul className="space-y-1">
              {enhancements.map((id) => {
                const e = getEnhancementById(id);
                return (
                  <li key={id} className="flex justify-between gap-2 text-[11px]">
                    <span className="text-white/80">{e?.name || id}</span>
                    <span className="text-white/50">{e ? (e.price === 0 ? "Free" : `$${e.price}`) : ""}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-xs font-semibold">
              <span className="text-white">Enhancements total</span>
              <span className="text-lime-300">${enhancementsTotal}</span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-white/50">No enhancements selected.</span>
        )}
      </ReviewSection>

      <ReviewSection icon={Camera} title="Business Photos Provided" editTo="/business-profile">
        <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
          {[
            { label: "Owner", count: ownerPhotos.length },
            { label: "Team", count: teamPhotos.length },
            { label: "Work", count: workPhotos.length },
            { label: "Other", count: otherPhotos.length },
          ].map((c) => (
            <div key={c.label} className="rounded-lg border border-white/5 bg-black/30 p-2 text-center">
              <div className="text-white/40">{c.label}</div>
              <div className="text-lg font-semibold text-white">{c.count}</div>
            </div>
          ))}
        </div>
      </ReviewSection>
    </div>
  );
}