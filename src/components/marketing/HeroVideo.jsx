import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
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

// Captions that spell out what the avatar is "saying" during her phases.
const CAPTIONS = {
  reveal: [
    "Hi, I'm your Xtreme AI assistant.",
    "I never sleep — so you can.",
    "Leads, bids, bookings, posts… all handled.",
  ],
  loop: [
    "Your leads arrive by 6 AM every day.",
    "Your bids are generated in seconds.",
    "Your phone is always answered.",
    "Your social media never stops.",
    "You work to live. I handle the rest.",
  ],
};

const STATS = [
  { value: "7M+", label: "AI VOICE CALLS" },
  { value: "7.3B", label: "LEADS GENERATED" },
  { value: "179M", label: "APPOINTMENTS BOOKED" },
  { value: "$5.2B+", label: "SALES FACILITATED IN 2025" },
];

// Thin black outline + drop shadow for all hero text so it reads on any frame.
const textOutline = {
  WebkitTextStroke: "1px #000",
  textShadow: "0 2px 6px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.8)",
};

// Typewriter hook — spells out text one character at a time.
function useTypewriter(text, typeSpeed = 42) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    if (!text) return;
    let i = 0;
    const t = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(t);
      }
    }, typeSpeed);
    return () => clearInterval(t);
  }, [text, typeSpeed]);
  return displayed;
}

export default function HeroVideo() {
  const [clipIdx, setClipIdx] = useState(0);
  const [captionIdx, setCaptionIdx] = useState(0);
  const videoRef = useRef(null);
  const clip = CLIPS[clipIdx];
  const captions = CAPTIONS[clip.phase] || [];
  const currentCaption = captions[captionIdx] || "";
  const typedCaption = useTypewriter(currentCaption);

  // When the clip index changes, reset and play the new video.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  }, [clipIdx]);

  // Cycle through captions for the current phase.
  useEffect(() => {
    setCaptionIdx(0);
    if (!captions.length) return;
    const interval = setInterval(() => {
      setCaptionIdx((i) => (i + 1) % captions.length);
    }, 3600);
    return () => clearInterval(interval);
  }, [clip.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnded = () => {
    if (clip.loop) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    } else {
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
          <span className="text-white/70 uppercase tracking-wider" style={textOutline}>
            {clip.phase === "chaos" && "BEFORE"}
            {clip.phase === "transition" && "TRANSITION"}
            {clip.phase === "reveal" && "THE PARTNER"}
            {clip.phase === "loop" && "AFTER"}
          </span>
        </div>
        <div className="text-white/50 uppercase tracking-wider" style={textOutline}>
          {clipIdx + 1} / {CLIPS.length}
        </div>
      </div>

      {/* Headline + subtext — positioned at the TOP so it never covers the avatar's face */}
      <div className="absolute left-0 right-0 top-14 z-10 px-4 text-center sm:top-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={clip.phase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h1
              className="text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl"
              style={textOutline}
            >
              {clip.phase === "transition" || clip.phase === "reveal" || clip.phase === "loop" ? (
                <>
                  {clip.headline.split(" ").slice(0, -1).join(" ")}{" "}
                  <span className="text-amber-400" style={textOutline}>
                    {clip.headline.split(" ").slice(-1)}
                  </span>
                </>
              ) : (
                clip.headline
              )}
            </h1>
            <p
              className="mx-auto mt-4 max-w-xl text-base text-white sm:text-xl"
              style={textOutline}
            >
              {clip.sub}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Captions — what the avatar is "saying", spelled out word by word.
          Positioned in the lower-middle so it doesn't cover her face or lips. */}
      {captions.length > 0 && (
        <div className="absolute bottom-32 left-0 right-0 z-10 flex justify-center px-4 sm:bottom-36">
          <AnimatePresence mode="wait">
            <motion.div
              key={captionIdx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="max-w-2xl rounded-xl border border-amber-400/30 bg-black/70 px-6 py-3 backdrop-blur-md"
            >
              <p className="text-lg font-medium text-white sm:text-2xl" style={textOutline}>
                {typedCaption}
                <span className="animate-pulse text-amber-400">_</span>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* CTA — positioned near the bottom, above the stats bar */}
      <AnimatePresence>
        {clip.showCta && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="absolute bottom-20 left-0 right-0 z-10 flex justify-center px-4 sm:bottom-24"
          >
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-7 py-4 text-base font-bold text-black shadow-2xl shadow-amber-400/30 transition-all hover:bg-amber-300 hover:shadow-amber-400/50"
                style={{ border: "1px solid #000" }}
              >
                Try Demo <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-white px-7 py-4 text-base font-bold text-black shadow-lg transition-all hover:bg-gray-100 hover:shadow-xl"
              >
                View Pricing
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replay button */}
      {clip.phase === "loop" && (
        <button
          onClick={() => setClipIdx(0)}
          className="absolute bottom-14 left-0 right-0 z-10 mx-auto block w-fit font-mono text-xs text-white/40 transition-colors hover:text-amber-400 sm:bottom-16"
        >
          ↻ Replay the story
        </button>
      )}

      {/* Stats bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/10 bg-black/70 py-6 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-amber-400 sm:text-3xl lg:text-4xl" style={textOutline}>
                  {s.value}
                </div>
                <div className="mt-1 text-[9px] font-medium uppercase tracking-wider text-white/50 sm:text-[11px]" style={textOutline}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}