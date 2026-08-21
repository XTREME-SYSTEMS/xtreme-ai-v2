import { useEffect, useState } from "react";
import { X, Sparkles, Compass, CheckCircle2, Package, ClipboardList, Palette, Monitor, Megaphone } from "lucide-react";
import { LOGO_ICON } from "@/lib/brandAssets";

const STEPS = [
  { icon: Package, title: "Review Your Package", desc: "Confirm what's included in your plan on the My Package page, then approve it." },
  { icon: ClipboardList, title: "Business Profile", desc: "Answer a few questions about your business so our AI can tailor everything to you." },
  { icon: Palette, title: "Generate Your Brand", desc: "Pick from AI-generated logos, brand colors, and content options at each step." },
  { icon: Monitor, title: "Build Your Website", desc: "Choose layouts and images — your site comes together as you go." },
  { icon: Megaphone, title: "Social & Video", desc: "Get social media posts and video content tailored to your brand." },
];

const SYSTEM_TIPS = [
  "Lime-green buttons are your primary actions — click to generate, approve, or continue.",
  "Each step shows AI-generated options. Pick your favorite and move to the next.",
  "Anything that goes live requires your approval first — you're always in control.",
  "Your progress saves automatically. Close and come back anytime — nothing is lost.",
  "Use the timeline at the top to see where you are and what's coming next.",
];

// Shows once per user when they first enter the client portal. Explains the
// workflow journey and how the approval-gated system operates. Dismissal is
// persisted in localStorage so it doesn't nag returning users.
export default function ClientWelcomeModal({ user }) {
  const [open, setOpen] = useState(false);
  const storageKey = `lgny_client_welcome_${user?.id || "guest"}`;

  useEffect(() => {
    if (!user) return;
    try {
      if (!localStorage.getItem(storageKey)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [user, storageKey]);

  const close = () => {
    try { localStorage.setItem(storageKey, "1"); } catch {}
    setOpen(false);
  };

  if (!open) return null;

  const firstName = user?.full_name?.split(" ")[0] || "";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={close}>
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-lime-400/30 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={close} className="absolute right-3 top-3 z-10 text-white/40 hover:text-white">
          <X className="h-5 w-5" />
        </button>

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

        {/* Body */}
        <div className="max-h-[55vh] overflow-y-auto px-6 py-5 space-y-5">
          {/* Next steps */}
          <div>
            <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400">
              <Compass className="h-3.5 w-3.5" /> Your Next Steps
            </div>
            <ol className="space-y-3">
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

          {/* How the system works */}
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
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-black/30 p-4">
          <button
            onClick={close}
            className="w-full rounded-lg bg-lime-400 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300"
          >
            Got it — let's get started
          </button>
        </div>
      </div>
    </div>
  );
}