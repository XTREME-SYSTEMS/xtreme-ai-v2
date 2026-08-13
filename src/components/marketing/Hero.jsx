import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const STATS = [
  { value: 7000000, suffix: "+", label: "AI VOICE CALLS" },
  { value: 7300000000, suffix: "", label: "LEADS GENERATED" },
  { value: 179000000, suffix: "", label: "APPOINTMENTS BOOKED" },
  { value: 5200000000, prefix: "$", suffix: "+", label: "SALES FACILITATED IN 2025" },
];

const DASHBOARD_IMG = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80";

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

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-16">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center pt-16 pb-12 text-center sm:pt-24">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
            className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-black sm:text-5xl lg:text-6xl">
            The AI-powered business <span className="text-lime-600">operating system</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-6 max-w-xl text-lg text-black/60 sm:text-xl">
            All the tools you need to capture, nurture and close new leads into bookings, sales, reviews and repeat customers!
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-8">
            <Link to="/register" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-7 py-4 text-base font-bold text-black transition-all hover:bg-lime-300 hover:shadow-xl hover:shadow-lime-400/40">
              Start 14 Day Free Trial <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.7 }}
          className="mx-auto max-w-4xl pb-16">
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white p-1.5 shadow-2xl shadow-black/10">
            <img src={DASHBOARD_IMG} alt="Platform dashboard" className="w-full rounded-xl" />
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 border-t border-black/10 bg-zinc-50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((s) => <StatItem key={s.label} stat={s} />)}
          </div>
        </div>
      </div>
    </section>
  );
}