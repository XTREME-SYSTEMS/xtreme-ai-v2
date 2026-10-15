import { motion } from "framer-motion";
import { Award, Star, TrendingUp, Users, ShieldCheck, ThumbsUp } from "lucide-react";

const BADGES = [
  { icon: Award, label: "Top 50 Agentic AI Products" },
  { icon: Star, label: "Capterra Best Value" },
  { icon: TrendingUp, label: "Best Marketing Software 2026" },
  { icon: Users, label: "Most Recommended Mid-Market" },
  { icon: ShieldCheck, label: "Best Software Products 2026" },
  { icon: ThumbsUp, label: "Easiest To Do Business With" },
];

export default function AwardBadges() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center text-2xl font-bold tracking-tight text-black sm:text-3xl">
          We're in the business of helping you grow your business
        </motion.h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-base text-black/50">
          Xtreme AI is the AI-powered operating system powering the growth of businesses around the world.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {BADGES.map((b, i) => (
            <motion.div key={b.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex flex-col items-center gap-2 rounded-xl border border-black/10 bg-zinc-50 px-3 py-5 text-center">
              <b.icon className="h-6 w-6 text-amber-600" />
              <span className="text-[11px] font-semibold leading-tight text-black/60">{b.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}