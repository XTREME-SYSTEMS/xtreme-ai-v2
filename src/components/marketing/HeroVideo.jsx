import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Brain, Zap, Sparkles, Radar } from "lucide-react";
import { Link } from "react-router-dom";

// The chaos-to-order story — played as a sequenced video background.
// Each clip plays once (except the final "loop" clip which repeats),
// and the headline/subtext morph to match each phase.
const CLIPS = [
  {
    src: "https://media.base44.com/videos/public/6a79444e821211169a147eee/ae95ea27c_Chaos_Collage.mp4",
    phase: "chaos",
    headline: "Working to live… or living to work?",
    sub: "The phone never stops. The bids pile up. The chaos never ends.",
    showCta: false,
    darken: 0.55,
  },
  {
    src: "https://media.base44.com/videos/public/6a79444e821211169a147eee/b025ef3d3_Golden_Heaven_Transition.mp4",
    phase: "transition",
    headline: "There's a better way.",
    sub: "What if everything was handled — while you sleep?",
    showCta: false,
    darken: 0.25,
  },
  {
    src: "https://media.base44.com/videos/public/6a79444e821211169a147eee/0c2f28efc_Avatar_Reveal_Calm.mp4",
    phase: "reveal",
    headline: "Meet your AI partner.",
    sub: "The future of the epoxy industry — powered by Xtreme AI.",
    showCta: true,
    darken: 0.35,
  },
  {
    src: "https://media.base44.com/videos/public/6a79444e821211169a147eee/136406cda_Order_Restored_AI.mp4",
    phase: "loop",
    headline: "Xtreme AI Systems",
    sub: "America's #1 epoxy super store. The partner you wish you always had.",
    showCta: true,
    loop: true,
    darken: 0.4,
  },
];

const STATS = [
  { value: "7M+", label: "AI VOICE CALLS" },
  { value: "7.3B", label: "LEADS GENERATED" },
  { value: "179M", label: "APPOINTMENTS BOOKED" },
  { value: "$5.2B+", label: "SALES FACILITATED IN 2025" },
];

function TechBadge({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-black/60 px-3 py-1.5 backdrop-blur-sm">
      <Icon className="h-3.5 w-3.5 text-amber-400" />
      <span className="text-[10px] font-bold tracking-wider text-white">{label}</span>
    </div>
  );
}

export default function HeroVideo() {
  const [clipIdx, setClipIdx] = useState(0);
  const videoRef = useRef(null);
  const clip = CLIPS[clipIdx];

  // When the clip index changes, reset and play the new video.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  }, [clipIdx]);

  const handleEnded = () => {
    if (clip.loop) {
      // Loop the final clip forever.
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    } else {
      // Advance to the next clip in the sequence.
      setClipIdx((i) => Math.min(i + 1, CLIPS.length - 1));
    }
  };

  return (
    <section className="relative min-h-[88vh] overflow-hidden bg-black">
      {/* Sequenced video background */}
      <video
        ref={videoRef}
        key={clip.src}
        src={clip.src}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
      />

      {/* Darkening overlay — intensity varies per phase so text stays readable */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-700"
        style={{ opacity: clip.darken }}
      />

      {/* Subtle gold vignette for depth */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />

      {/* Corner HUD brackets */}
      <div className="absolute left-4 top-4 z-20 h-7 w-7 border-l-2 border-t-2 border-amber-400/50" />
      <div className="absolute right-4 top-4 z-20 h-7 w-7 border-r-2 border-t-2 border-amber-400/50" />
      <div className="absolute bottom-4 left-4 z-20 h-7 w-7 border-l-2 border-b-2 border-amber-400/50" />
      <div className="absolute bottom-4 right-4 z-20 h-7 w-7 border-r-2 border-b-2 border-amber-400/50" />

      {/* Phase indicator — top bar */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-6 pt-6 font-mono text-[10px] sm:text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-white/70 uppercase tracking-wider">
            {clip.phase === "chaos" && "BEFORE"}
            {clip.phase === "transition" && "TRANSITION"}
            {clip.phase === "reveal" && "THE PARTNER"}
            {clip.phase === "loop" && "AFTER"}
          </span>
        </div>
        <div className="text-white/50 uppercase tracking-wider">
          {clipIdx + 1} / {CLIPS.length}
        </div>
      </div>

      {/* Centered content */}
      <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-4xl flex-col items-center justify-center px-4 text-center">
        {/* Floating tech badges — only after chaos phase */}
        {clip.phase !== "chaos" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-8 hidden gap-2 sm:flex"
          >
            <TechBadge icon={Brain} label="AI ENGINE" />
            <TechBadge icon={Zap} label="AUTO-PILOT" />
            <TechBadge icon={Radar} label="REAL-TIME" />
            <TechBadge icon={Sparkles} label="NEURAL NET" />
          </motion.div>
        )}

        {/* Phase-changing headline + subtext */}
        <AnimatePresence mode="wait">
          <motion.div
            key={clip.phase}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white drop-shadow-2xl sm:text-5xl lg:text-6xl">
              {clip.phase === "transition" || clip.phase === "reveal" || clip.phase === "loop" ? (
                <>
                  {clip.headline.split(" ").slice(0, -1).join(" ")}{" "}
                  <span className="text-amber-400">{clip.headline.split(" ").slice(-1)}</span>
                </>
              ) : (
                clip.headline
              )}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/80 drop-shadow-lg sm:text-xl">
              {clip.sub}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* CTA — only appears after the chaos phase */}
        <AnimatePresence>
          {clip.showCta && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            >
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-7 py-4 text-base font-bold text-black shadow-2xl shadow-amber-400/30 transition-all hover:bg-amber-300 hover:shadow-amber-400/50"
              >
                Try Demo <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-black/40 px-7 py-4 text-base font-bold text-white backdrop-blur-sm transition-all hover:border-amber-400 hover:bg-black/60"
              >
                View Pricing
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Replay button */}
        {clip.phase === "loop" && (
          <button
            onClick={() => setClipIdx(0)}
            className="mt-6 font-mono text-xs text-white/40 transition-colors hover:text-amber-400"
          >
            ↻ Replay the story
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/10 bg-black/70 py-6 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-amber-400 sm:text-3xl lg:text-4xl">{s.value}</div>
                <div className="mt-1 text-[9px] font-medium uppercase tracking-wider text-white/50 sm:text-[11px]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}