import { motion } from "framer-motion";
import { MapPin, ArrowRight, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const STATS = [
  { value: "50+", label: "Years Combined Experience" },
  { value: "AI", label: "Powered Growth Engine" },
  { value: "24/7", label: "Client Dashboard Access" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Animated background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-lime-400/20 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }} transition={{ duration: 8, repeat: Infinity }} />
        <motion.div className="absolute top-40 -left-40 h-80 w-80 rounded-full bg-lime-400/10 blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 10, repeat: Infinity }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-lime-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-black/70">AI-Powered Growth Operating System</span>
          </div>

          <div className="mb-6 flex justify-center">
            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex h-20 w-20 items-center justify-center rounded-2xl bg-black shadow-2xl shadow-lime-400/30">
              <MapPin className="h-10 w-10 text-lime-400" />
            </motion.div>
          </div>

          <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-black sm:text-6xl lg:text-7xl">
            We Throw The Book<br />
            <span className="relative inline-block">
              <span className="relative z-10">At Your Growth.</span>
              <motion.span className="absolute bottom-1 left-0 h-4 w-full bg-lime-400 sm:h-6"
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.6, duration: 0.5 }} style={{ originX: 0 }} />
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg text-black/60 sm:text-xl">
            Full-stack AI services, website creation, SEO, AEO, and marketing — engineered into one approval-gated operating system that delivers real leads, not vanity metrics.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/pricing" className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lime-400 px-7 py-4 text-base font-bold text-black transition-all hover:bg-lime-300 hover:shadow-xl hover:shadow-lime-400/40 sm:w-auto">
              Start Growing Today <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#contact" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black/15 px-7 py-4 text-base font-bold text-black transition-all hover:border-black hover:bg-black hover:text-white sm:w-auto">
              <Zap className="h-5 w-5 text-lime-500 group-hover:text-lime-400" /> Book a 15-Min Call
            </a>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.6 }}
          className="mx-auto mt-16 flex max-w-3xl flex-col items-center justify-center gap-8 sm:flex-row sm:gap-12">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black text-black sm:text-4xl">{s.value}</div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wider text-black/50">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}