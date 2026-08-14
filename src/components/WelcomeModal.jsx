import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Rocket, Compass, ArrowRight, CheckCircle2, X, Wand2, GitBranch, Palette } from "lucide-react";
import { useClientTrack } from "@/hooks/useClientTrack";
import { LOGO_ICON } from "@/lib/brandAssets";
import Typewriter from "@/components/Typewriter";

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
  const [revealed, setRevealed] = useState(false);
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
  const greeting = isAdmin
    ? "Hey! I'm your launch assistant. I'll point you to the right buttons so you can start building right away."
    : track.greeting;
  const showBadge = !isAdmin && track.title !== "Welcome";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={close}>
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-lime-400/40" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute right-3 top-3 z-10 text-zinc-400 hover:text-zinc-900"><X className="h-5 w-5" /></button>

        <div className="border-b border-zinc-100 bg-gradient-to-br from-lime-50 via-white to-emerald-50 p-6 pb-5">
          <h2 className="text-2xl font-bold text-zinc-900">Hello{user?.full_name ? `, ${user.full_name}` : ""}! 👋</h2>
          <div className="mt-3 flex items-start gap-2">
            <img src={LOGO_ICON} alt="" className="mt-0.5 h-7 w-7 shrink-0 rounded-lg" />
            <div className="flex-1 rounded-2xl rounded-tl-sm border border-lime-200 bg-lime-50 px-3.5 py-2.5">
              <Typewriter text={greeting} className="text-sm leading-relaxed text-zinc-700" onDone={() => setRevealed(true)} />
            </div>
          </div>
          {showBadge && (
            <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full bg-lime-100 px-2.5 py-1 text-xs font-semibold text-lime-700 transition-opacity duration-500 ${revealed ? "opacity-100" : "opacity-0"}`}>
              <CheckCircle2 className="h-3.5 w-3.5" /> {track.title} unlocked
            </div>
          )}
        </div>

        <div className={`max-h-[52vh] overflow-y-auto px-6 py-5 transition-opacity duration-500 ${revealed ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          {!isAdmin && (
            <Link to="/brand-factory" onClick={close} className="group mb-5 flex items-center gap-3 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-400 p-4 text-black transition-all hover:from-lime-300 hover:to-emerald-300 hover:shadow-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/10">
                <Palette className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">Branding Studio</div>
                <div className="text-xs text-black/70">Build your logo, business card, brochure & social posts with AI.</div>
              </div>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          <Section icon={Rocket} title="Where to start">
            <div className="space-y-2">
              {start.map((s) => {
                const Icon = s.icon;
                return (
                  <Link key={s.to} to={s.to} onClick={close} className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition-colors hover:border-lime-400 hover:bg-lime-50">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-lime-500" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-900">{s.label}</div>
                      <div className="text-xs text-zinc-500">{s.desc}</div>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-zinc-300" />
                  </Link>
                );
              })}
            </div>
          </Section>

          <Section icon={Compass} title="How the process works">
            <ol className="space-y-2">
              {steps.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-600">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-100 text-xs font-bold text-lime-700">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </Section>

          <Section icon={CheckCircle2} title="What to expect & key buttons">
            <ul className="space-y-1.5 text-sm text-zinc-600">
              <li className="flex gap-2"><span className="text-lime-500">•</span> Lime-green buttons are your primary actions — click to generate, launch, or approve.</li>
              <li className="flex gap-2"><span className="text-lime-500">•</span> Anything that goes live requires your approval first (Green = auto, Yellow = preview, Red = your sign-off).</li>
              <li className="flex gap-2"><span className="text-lime-500">•</span> AI steps save automatically — close and come back anytime, your progress is kept.</li>
              <li className="flex gap-2"><span className="text-lime-500">•</span> Use the paperclip in any AI chat to attach an inspiration image.</li>
            </ul>
          </Section>
        </div>

        <div className="border-t border-zinc-100 bg-zinc-50 p-4">
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
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-600">
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      {children}
    </div>
  );
}