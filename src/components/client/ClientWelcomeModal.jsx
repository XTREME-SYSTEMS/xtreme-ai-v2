import { useEffect, useState } from "react";
import {
  Sparkles, Compass, CheckCircle2, Package, ClipboardList, Palette,
  Monitor, Megaphone, ShieldCheck, FileText, Lock, ArrowRight, Loader2,
} from "lucide-react";
import { LOGO_ICON } from "@/lib/brandAssets";
import { base44 } from "@/api/base44Client";
import SignaturePad from "@/components/client/SignaturePad";

const STEPS = [
  { icon: Package, title: "Review Your Package", desc: "Confirm what's included in your plan, then approve it." },
  { icon: Compass, title: "Business Name & Domain", desc: "Our AI finds a viral business name with an available .com domain." },
  { icon: ClipboardList, title: "Business Profile", desc: "Answer a few questions so our AI can tailor everything to you." },
  { icon: Palette, title: "Generate Your Brand", desc: "Pick from AI-generated logos, brand colors, and content options." },
  { icon: Monitor, title: "Build Your Website", desc: "Choose layouts and images — your site comes together as you go." },
  { icon: Megaphone, title: "Social & Video", desc: "Get social media posts and video content tailored to your brand." },
];

const SYSTEM_TIPS = [
  "Lime-green buttons are your primary actions — click to generate, approve, or continue.",
  "Each step shows AI-generated options. Pick your favorite and move to the next.",
  "Anything that goes live requires your approval first — you're always in control.",
  "Your progress saves automatically. Close and come back anytime — nothing is lost.",
];

const TERMS = [
  {
    icon: ShieldCheck,
    title: "Data Access & Authorization",
    body: "I authorize Lead Gen Near You to access my business data, website, Google Business Profile, social media accounts, and other integrated services to generate, deploy, and manage marketing assets on my behalf.",
  },
  {
    icon: Sparkles,
    title: "AI-Generated Content",
    body: "I understand that AI generates marketing content, logos, images, and copy. While we strive for quality, AI content may contain inaccuracies. I am responsible for reviewing all deliverables before they go live.",
  },
  {
    icon: CheckCircle2,
    title: "Approval-Based Workflow",
    body: "I understand that nothing goes live without my approval. I am responsible for reviewing and approving or rejecting deliverables in a timely manner to keep my project moving.",
  },
  {
    icon: FileText,
    title: "Ownership & Usage Rights",
    body: "I own the final deliverables created for my business. I grant Lead Gen Near You the right to use generated work in its portfolio and marketing materials.",
  },
  {
    icon: Package,
    title: "Payment & Refunds",
    body: "I understand payments are processed securely. One-time purchases are non-refundable once work has begun. Monthly subscriptions can be canceled at any time.",
  },
];

// Shows once per user when they first enter the client portal. Explains the
// workflow journey, presents key terms & conditions, and captures a signature
// + agreement before the user can proceed. Dismissal is persisted in
// localStorage so it doesn't nag returning users.
export default function ClientWelcomeModal({ user }) {
  const [open, setOpen] = useState(false);
  const [signature, setSignature] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const storageKey = `lgny_client_welcome_${user?.id || "guest"}`;

  useEffect(() => {
    if (!user) return;
    try {
      if (!localStorage.getItem(storageKey)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [user, storageKey]);

  const canProceed = signature && agreed && !saving;

  const close = async () => {
    if (!canProceed) return;
    setSaving(true);
    try {
      // Persist the T&C acceptance timestamp on the user profile so we have a
      // verifiable record that this user acknowledged the terms.
      await base44.auth.updateMe({
        termsAcceptedAt: new Date().toISOString(),
      });
    } catch (e) {
      // Non-blocking — the localStorage key still prevents re-showing.
    }
    try { localStorage.setItem(storageKey, "1"); } catch {}
    setSaving(false);
    setOpen(false);
  };

  if (!open) return null;

  const firstName = user?.full_name?.split(" ")[0] || "";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-lime-400/30 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-white/10 bg-gradient-to-br from-lime-400/10 via-zinc-950 to-zinc-950 p-6">
          <div className="flex items-center gap-3">
            <img src={LOGO_ICON} alt="" className="h-10 w-10 rounded-lg" />
            <div>
              <h2 className="text-2xl font-bold text-white">
                Welcome{firstName ? `, ${firstName}` : ""}! 👋
              </h2>
              <p className="text-sm text-white/60">Your client portal is ready. Here's how it works.</p>
            </div>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="max-h-[58vh] overflow-y-auto px-6 py-5 space-y-5">
          {/* How the system works — quick tips */}
          <div>
            <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400">
              <Sparkles className="h-3.5 w-3.5" /> How The System Works
            </div>
            <ul className="space-y-2">
              {SYSTEM_TIPS.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Your next steps */}
          <div>
            <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400">
              <Compass className="h-3.5 w-3.5" /> Your Next Steps
            </div>
            <ol className="space-y-2.5">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <li key={i} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-lime-400/30 bg-lime-400/10">
                      <Icon className="h-4 w-4 text-lime-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-lime-400">{i + 1}</span>
                        <span className="text-sm font-semibold text-white">{s.title}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-white/50">{s.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Terms & Conditions */}
          <div className="rounded-lg border border-white/10 bg-black/30 p-4">
            <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Terms &amp; Conditions — Please Acknowledge
            </div>
            <div className="space-y-3">
              {TERMS.map((t, i) => {
                const Icon = t.icon;
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" />
                    <div>
                      <span className="text-sm font-semibold text-white">{t.title}: </span>
                      <span className="text-sm text-white/60">{t.body}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Signature */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400">
              <FileText className="h-3.5 w-3.5" /> Sign Here To Acknowledge
            </label>
            <SignaturePad onChange={setSignature} />
          </div>

          {/* Agreement checkbox */}
          <label className="flex items-start gap-2.5 rounded-lg border border-white/10 bg-black/20 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-lime-400"
            />
            <span className="text-sm text-white/70">
              I have read and agree to the Terms &amp; Conditions above. I authorize Lead Gen Near You to access my data and generate marketing assets on my behalf.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-black/30 p-4">
          <button
            onClick={close}
            disabled={!canProceed}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-lime-400 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : !signature ? (
              <><Lock className="h-4 w-4" /> Sign above to continue</>
            ) : !agreed ? (
              <><Lock className="h-4 w-4" /> Check the box to agree</>
            ) : (
              <>I Agree — Let's Get Started <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}