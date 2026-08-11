import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const STATS = [
  { value: "7M+", label: "AI VOICE CALLS" },
  { value: "7.3B", label: "LEADS GENERATED" },
  { value: "179M", label: "APPOINTMENTS BOOKED" },
  { value: "$5.2B+", label: "SALES FACILITATED" },
];

const DASHBOARD_IMG = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#000914] pt-16">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#000914] via-[#001220] to-black" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center pt-20 pb-12 text-center sm:pt-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-4 py-1.5">
            <Zap className="h-3.5 w-3.5 text-lime-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-lime-400">Power up your business with AI</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
            className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            The AI-powered business <span className="text-lime-400">operating system</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-6 max-w-xl text-lg text-white/70 sm:text-xl">
            All the tools you need to capture, nurture and close new leads into bookings, sales, reviews and repeat customers!
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-8">
            <Link to="/register" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-7 py-4 text-base font-bold text-black transition-all hover:bg-lime-300 hover:shadow-xl hover:shadow-lime-400/40">
              Start 14 Day Free Trial <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* Dashboard image */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.7 }}
          className="mx-auto max-w-4xl pb-16">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1.5 shadow-2xl shadow-lime-400/10">
            <img src={DASHBOARD_IMG} alt="Platform dashboard" className="w-full rounded-xl" />
          </div>
        </motion.div>
      </div>

      {/* Stats bar */}
      <div className="relative z-10 border-t border-white/10 bg-black py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-white sm:text-4xl">{s.value}</div>
                <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-white/40 sm:text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}