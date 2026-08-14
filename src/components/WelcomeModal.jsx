import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Rocket, Compass, ArrowRight, CheckCircle2, X, Wand2, GitBranch } from "lucide-react";
import { useClientTrack } from "@/hooks/useClientTrack";
import { LOGO_ICON } from "@/lib/brandAssets";

const ADMIN_START = [
  { to: "/dashboard", icon: Compass, label: "Command Center", desc: "Your mission control — portfolio, traffic, and quick actions." },
  { to: "/brand-factory", icon: Wand2, label: "Brand Factory", desc: "AI concept-to-reality brand pipeline." },
  { to: "/clone-pipeline", icon: GitBranch, label: "Clone Pipeline", desc: "Clone → rebrand → deploy a site end-to-end." },
];
const ADMIN_STEPS = [
  "Start in the Command Center — it's your hub for every tool.",
  "Use Brand Factory to generate a brand, or Clone Pipeline to clone & deploy a site.",
  "Watch the GSC Traffic panel as your sites get indexed and ranked.",
  "Approve anything production-bound in the Approvals queue (Red = needs your sign-off).",
];

export default function WelcomeModal({ user, role }) {
  const [open, setOpen] = useState(false);
  const { track } = useClientTrack(role === "admin" ? null : user);
  const storageKey = `lgny_welcome_${user?.id || "guest"}`;

  useEffect(() => {
    if (!user) return;
    try {
      if (!localStorage.getItem(storageKey)) setOpen(true);
    } catch (e) {
      setOpen(true);
    }
  }, [user, storageKey]);

  const close = () => {
    try { localStorage.setItem(storageKey, "1"); } catch (e) {}
    setOpen(false);
  };

  if (!open) return null;

  const isAdmin = role === "admin";
  const start = isAdmin ? ADMIN_START : track.start;
  const steps = isAdmin ? ADMIN_STEPS : track.steps;
  const subtitle = isAdmin ? "Welcome aboard. Here's a quick tour to get you moving." : track.subtitle;
  const showBadge = !isAdmin && track.title !== "Welcome";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={close}>
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-lime-400/30 bg-zinc-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute right-3 top-3 z-10 text-white/40 hover:text-white"><X className="h-5 w-5" /></button>

        <div className="bg-gradient-to-br from-lime-400/15 to-transparent p-6 pb-4">
          <img src={LOGO_ICON} alt="Lead Generation Near You" className="mb-3 h-12 w-12" />
          <h2 className="text-2xl font-bold text-white">Hello{user?.full_name ? `, ${user.full_name}` : ""}! 👋</h2>
          <p className="mt-1 text-sm text-white/60">{subtitle}</p>
          {showBadge && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-lime-400/15 px-2.5 py-1 text-xs font-medium text-lime-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> {track.title} unlocked
            </div>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
          <Section icon={Rocket} title="Where to start">
            <div className="space-y-2">
              {start.map((s) => {
                const Icon = s.icon;
                return (
                  <Link key={s.to} to={s.to} onClick={close} className="flex items-start gap-3 rounded-lg border border-white/10 bg-zinc-950 p-3 hover:border-lime-400/40 hover:bg-white/5">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-lime-400" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white">{s.label}</div>
                      <div className="text-xs text-white/50">{s.desc}</div>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-white/30" />
                  </Link>
                );
              })}
            </div>
          </Section>

          <Section icon={Compass} title="How the process works">
            <ol className="space-y-2">
              {steps.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-400/15 text-xs font-semibold text-lime-400">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </Section>

          <Section icon={CheckCircle2} title="What to expect & key buttons">
            <ul className="space-y-1.5 text-sm text-white/70">
              <li className="flex gap-2"><span className="text-lime-400">•</span> Lime-green buttons are your primary actions — click to generate, launch, or approve.</li>
              <li className="flex gap-2"><span className="text-lime-400">•</span> Anything that goes live requires your approval first (Green = auto, Yellow = preview, Red = your sign-off).</li>
              <li className="flex gap-2"><span className="text-lime-400">•</span> AI steps save automatically — close and come back anytime, your progress is kept.</li>
              <li className="flex gap-2"><span className="text-lime-400">•</span> Use the paperclip in any AI chat to attach an inspiration image.</li>
            </ul>
          </Section>
        </div>

        <div className="border-t border-white/10 p-4">
          <button onClick={close} className="w-full rounded-lg bg-lime-400 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300">
            Got it — let's go
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400/80">
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      {children}
    </div>
  );
}