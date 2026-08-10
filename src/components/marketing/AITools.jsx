import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Calculator, Search, FileText, CalendarClock, Palette, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { startCheckout } from "@/lib/checkout";

const TOOLS = [
  { icon: Bot, name: "AI Lead Chatbot", desc: "24/7 conversational lead capture that qualifies prospects and books calls while you sleep.", price: "$99" },
  { icon: Calculator, name: "AI Quote Estimator", desc: "Instant pricing calculators that turn website visitors into qualified leads with real numbers.", price: "$149" },
  { icon: Search, name: "AI SEO Auditor", desc: "Full presence audit — scores your website, SEO, local SEO, AEO, and conversion in minutes.", price: "$99" },
  { icon: FileText, name: "AI Content Generator", desc: "Generate SEO-optimized blogs, ads, emails, and social posts tuned to your brand voice.", price: "$129" },
  { icon: CalendarClock, name: "AI Call Scheduler", desc: "Smart 15-minute call booking with automated SMS + email reminders to reduce no-shows.", price: "$119" },
  { icon: Palette, name: "AI Brand Designer", desc: "10 logo and brand pack options with 2 free iterations, guided by an AI questionnaire.", price: "$199" },
];

export default function AITools() {
  const [loading, setLoading] = useState(null);

  const handleBuy = async (name) => {
    setLoading(name);
    try { await startCheckout("ai-tool"); } catch (e) { alert(e.message || "Checkout failed."); }
    setLoading(null);
  };

  return (
    <section id="ai-tools" className="relative overflow-hidden bg-white py-20 sm:py-28">
      <div className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-lime-400/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lime-600">
            <Sparkles className="h-3.5 w-3.5" /> AI Tools Marketplace
          </div>
          <h2 className="text-3xl font-black tracking-tight text-black sm:text-5xl">Buy AI Tools. <span className="text-lime-500">Instant Access.</span></h2>
          <p className="mt-4 text-lg text-black/60">Pick the AI tool you need, pay online, and get instant dashboard access. Each tool is built to generate leads — not vanity metrics.</p>
        </motion.div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}
              className="group relative overflow-hidden rounded-2xl border border-black/10 bg-white p-6 transition-all hover:-translate-y-1 hover:border-lime-400 hover:shadow-2xl hover:shadow-lime-400/20">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 scale-x-0 bg-lime-400 transition-transform group-hover:scale-x-100" />
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black transition-colors group-hover:bg-lime-400">
                  <t.icon className="h-6 w-6 text-lime-400 transition-colors group-hover:text-black" />
                </div>
                <div className="rounded-full bg-lime-400/15 px-3 py-1 text-sm font-bold text-lime-600">From {t.price}</div>
              </div>
              <h3 className="text-lg font-bold text-black">{t.name}</h3>
              <p className="mt-2 text-sm text-black/60">{t.desc}</p>
              <button onClick={() => handleBuy(t.name)} disabled={loading === t.name}
                className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-black px-4 py-3 text-sm font-bold text-white transition-all hover:bg-lime-400 hover:text-black disabled:opacity-50">
                {loading === t.name ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Get This Tool <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
              </button>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-black/10 bg-black p-7 text-center sm:flex-row sm:text-left">
          <div>
            <h3 className="text-xl font-bold text-white">Need a custom AI tool?</h3>
            <p className="mt-1 text-sm text-white/60">We build custom AI chatbots, calculators, visualizers, and lead tools tailored to your business.</p>
          </div>
          <a href="#contact" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-lime-400 px-6 py-3 text-sm font-bold text-black transition-all hover:bg-lime-300">
            Talk to Us <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}