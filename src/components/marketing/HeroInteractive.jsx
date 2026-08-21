import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Zap, Sparkles, Radar } from "lucide-react";
import { Link } from "react-router-dom";
import ParticleNetwork from "@/components/marketing/ParticleNetwork";
import { LOGO_ICON } from "@/lib/brandAssets";

const STATS = [
  { value: 7000000, suffix: "+", label: "AI VOICE CALLS" },
  { value: 7300000000, suffix: "", label: "LEADS GENERATED" },
  { value: 179000000, suffix: "", label: "APPOINTMENTS BOOKED" },
  { value: 5200000000, prefix: "$", suffix: "+", label: "SALES FACILITATED IN 2025" },
];

const STATUS_MESSAGES = [
  "> Initializing AI engine...",
  "> Neural networks online",
  "> Lead sources connected",
  "> Voice AI activated",
  "> Ranking engine deployed",
  "> System ready.",
];

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setCount(Math.floor(eased * target));
            if (p < 1) requestAnimationFrame(tick);
            else setCount(target);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { count, ref };
}

function formatNum(n) {
  if (n >= 1000000000) return (n / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return n.toString();
}

function StatItem({ stat }) {
  const { count, ref } = useCountUp(stat.value);
  return (
    <div className="text-center" ref={ref}>
      <div className="text-3xl font-bold text-black sm:text-4xl lg:text-5xl">
        {stat.prefix || ""}{formatNum(count)}{stat.suffix || ""}
      </div>
      <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-black/40 sm:text-xs">{stat.label}</div>
    </div>
  );
}

function useTypewriter(messages, typeSpeed = 55, pauseSpeed = 1600) {
  const [text, setText] = useState("");
  const [msgIdx, setMsgIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = messages[msgIdx % messages.length];
    let t;
    if (!deleting && charIdx < current.length) {
      t = setTimeout(() => { setText(current.slice(0, charIdx + 1)); setCharIdx(charIdx + 1); }, typeSpeed);
    } else if (!deleting && charIdx === current.length) {
      t = setTimeout(() => setDeleting(true), pauseSpeed);
    } else if (deleting && charIdx > 0) {
      t = setTimeout(() => { setText(current.slice(0, charIdx - 1)); setCharIdx(charIdx - 1); }, typeSpeed / 2);
    } else {
      setDeleting(false);
      setMsgIdx(msgIdx + 1);
    }
    return () => clearTimeout(t);
  }, [text, charIdx, deleting, msgIdx, messages, typeSpeed, pauseSpeed]);

  return text;
}

function TechBadge({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-lime-400/50 bg-white/85 px-3 py-1.5 shadow-md shadow-lime-400/10 backdrop-blur-sm">
      <Icon className="h-3.5 w-3.5 text-lime-600" />
      <span className="text-[10px] font-bold tracking-wider text-black">{label}</span>
    </div>
  );
}

function CornerBracket({ position }) {
  const base = "absolute z-[2] h-7 w-7 border-lime-400/50 pointer-events-none";
  const map = {
    "tl": "top-3 left-3 border-l-2 border-t-2",
    "tr": "top-3 right-3 border-r-2 border-t-2",
    "bl": "bottom-3 left-3 border-l-2 border-b-2",
    "br": "bottom-3 right-3 border-r-2 border-b-2",
  };
  return <div className={`${base} ${map[position]}`} />;
}

export default function HeroInteractive() {
  const statusText = useTypewriter(STATUS_MESSAGES);

  return (
    <section className="relative overflow-hidden bg-white pt-16">
      {/* Tech grid overlay */}
      <div
        className="absolute inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Neural network particle canvas */}
      <div className="absolute inset-0 z-0">
        <ParticleNetwork className="h-full w-full" />
      </div>

      {/* Scanning sweep line */}
      <motion.div
        className="absolute left-0 right-0 z-[1] h-px bg-gradient-to-r from-transparent via-lime-400 to-transparent"
        initial={{ top: "8%", opacity: 0 }}
        animate={{ top: ["8%", "92%", "8%"], opacity: [0, 0.7, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
      />

      {/* Corner HUD brackets */}
      <CornerBracket position="tl" />
      <CornerBracket position="tr" />
      <CornerBracket position="bl" />
      <CornerBracket position="br" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* HUD status bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between pt-6 font-mono text-[10px] sm:text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-black/50">SYSTEM ONLINE</span>
          </div>
          <div className="text-black/50">AI ENGINE v2.0</div>
        </motion.div>

        {/* Central icon + rings + floating badges */}
        <div className="relative flex items-center justify-center pt-10 sm:pt-12">
          <div className="relative flex h-56 w-72 items-center justify-center sm:h-64 sm:w-[420px]">
            {/* Pulsing radar rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute h-32 w-32 rounded-full border border-lime-400 sm:h-40 sm:w-40"
                initial={{ scale: 1, opacity: 0.45 }}
                animate={{ scale: [1, 2.3], opacity: [0.45, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: "easeOut" }}
              />
            ))}

            {/* Glow halo */}
            <div className="absolute h-32 w-32 rounded-full bg-lime-400/25 blur-2xl sm:h-40 sm:w-40" />

            {/* Rotating dashed ring */}
            <motion.div
              className="absolute h-36 w-36 rounded-full border border-dashed border-lime-400/30 sm:h-48 sm:w-48"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />

            {/* Logo icon */}
            <motion.div
              className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full border-2 border-lime-400 bg-white shadow-lg shadow-lime-400/30 sm:h-36 sm:w-36"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <img src={LOGO_ICON} alt="Lead Generation Near You" className="h-16 w-16 object-contain sm:h-24 sm:w-24" />
            </motion.div>

            {/* Floating tech badges (desktop) */}
            <motion.div
              className="absolute left-0 top-2 hidden sm:flex"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <TechBadge icon={Brain} label="AI ENGINE" />
            </motion.div>
            <motion.div
              className="absolute right-0 top-2 hidden sm:flex"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1, ease: "easeInOut" }}
            >
              <TechBadge icon={Zap} label="AUTO-PILOT" />
            </motion.div>
            <motion.div
              className="absolute bottom-2 left-0 hidden sm:flex"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity, delay: 0.5, ease: "easeInOut" }}
            >
              <TechBadge icon={Sparkles} label="NEURAL NET" />
            </motion.div>
            <motion.div
              className="absolute bottom-2 right-0 hidden sm:flex"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity, delay: 1.5, ease: "easeInOut" }}
            >
              <TechBadge icon={Radar} label="REAL-TIME" />
            </motion.div>
          </div>
        </div>

        {/* Terminal status line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-2 text-center font-mono text-xs text-lime-600 sm:text-sm"
        >
          {statusText}
          <span className="animate-pulse">_</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-6 max-w-3xl text-center text-4xl font-bold leading-[1.1] tracking-tight text-black sm:text-5xl lg:text-6xl mx-auto"
        >
          The AI-powered business <span className="text-lime-600">operating system</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mx-auto mt-6 max-w-xl text-center text-lg text-black/60 sm:text-xl"
        >
          All the tools you need to capture, nurture and close new leads into bookings, sales, reviews and repeat customers!
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-8 flex flex-col items-center gap-3 pb-12 sm:flex-row sm:justify-center"
        >
          <Link to="/register" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-7 py-4 text-base font-bold text-black transition-all hover:bg-lime-300 hover:shadow-xl hover:shadow-lime-400/40">
            Try Demo <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link to="/pricing" className="group inline-flex items-center justify-center gap-2 rounded-xl border border-black/15 bg-white px-7 py-4 text-base font-bold text-black transition-all hover:border-black hover:bg-black hover:text-white">
            View Pricing
          </Link>
        </motion.div>
      </div>

      {/* Stats bar */}
      <div className="relative z-10 border-t border-black/10 bg-zinc-50/80 py-10 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((s) => <StatItem key={s.label} stat={s} />)}
          </div>
        </div>
      </div>
    </section>
  );
}