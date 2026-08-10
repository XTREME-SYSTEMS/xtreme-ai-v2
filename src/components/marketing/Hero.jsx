import { motion } from "framer-motion";
import { MapPin, ArrowRight, Phone, Sparkles, ChevronDown } from "lucide-react";

const VIDEO_URL = "https://media.base44.com/videos/public/6a79444e821211169a147eee/c3c9895fd_Lead_Gen_Hero_v2.mp4?v=3";
const POSTER = "https://media.base44.com/images/public/6a79444e821211169a147eee/3ef1d67ff_generated_image.png";

const STATS = [
  { value: "50+", label: "Years Combined Experience" },
  { value: "6", label: "AI Service Categories" },
  { value: "24/7", label: "Client Dashboard Access" },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-black">
      {/* Full-bleed video background */}
      <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" poster={POSTER}>
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      {/* Darkening overlays for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />

      {/* Center content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-4 py-1.5 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-lime-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-lime-400">AI-Powered Growth Operating System</span>
        </motion.div>

        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-400 shadow-2xl shadow-lime-400/40">
          <MapPin className="h-8 w-8 text-black" />
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
          className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
          We Throw The Book<br />
          <span className="relative inline-block">At Your Growth.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-7 max-w-xl text-lg text-white/80 sm:text-xl">
          AI services, website creation, SEO, AEO, and marketing — engineered into one approval-gated operating system that delivers real leads, not vanity metrics.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="#ai-tools" className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lime-400 px-7 py-4 text-base font-bold text-black transition-all hover:bg-lime-300 hover:shadow-xl hover:shadow-lime-400/40 sm:w-auto">
            Explore AI Tools <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </a>
          <a href="#contact" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/20 px-7 py-4 text-base font-bold text-white transition-all hover:border-lime-400 hover:bg-lime-400 hover:text-black sm:w-auto">
            <Phone className="h-5 w-5" /> Book a 15-Min Call
          </a>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-14 flex items-center gap-8 sm:gap-12">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black text-lime-400 sm:text-3xl">{s.value}</div>
              <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-white/50 sm:text-xs">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div className="absolute bottom-6 left-1/2 -translate-x-1/2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
          <ChevronDown className="h-6 w-6 text-white/40" />
        </motion.div>
      </motion.div>
    </section>
  );
}