import { motion } from "framer-motion";
import { Search, ClipboardCheck, Target, Lightbulb, Palette, Monitor, Megaphone, ShieldCheck, TrendingUp } from "lucide-react";

const PHASES = [
  { icon: Search, title: "1. Discovery", desc: "We research your market, find local businesses, and map the competitive landscape so we know exactly where the lead opportunities are." },
  { icon: ClipboardCheck, title: "2. Presence Audit", desc: "We audit your website, SEO, local SEO, AEO, conversion, brand, and reputation across 12 dimensions — scoring every gap." },
  { icon: Target, title: "3. Opportunity Engine", desc: "We score search opportunities by intent and SERP weakness, prioritizing the fastest paths to first-page visibility on Google and AI engines." },
  { icon: Lightbulb, title: "4. Lead-Gen Concepts", desc: "We design lead-generation tools and microsites — calculators, estimators, chatbots — built to capture high-intent leads." },
  { icon: Palette, title: "5. Brand Lab", desc: "We generate 10 brand pack options with AI-assisted questionnaires, tailored to your business and audience." },
  { icon: Monitor, title: "6. Website Lab", desc: "We build conversion-focused websites, landing pages, and web apps engineered to turn traffic into leads." },
  { icon: Megaphone, title: "7. Marketing Lab", desc: "We assemble full marketing packs — paid, social, email, SMS, content — tuned to your industry DNA." },
  { icon: ShieldCheck, title: "8. Build, QA & Approve", desc: "Every asset is built, validated against 10 QA dimensions, and routed through your approval-gated dashboard." },
  { icon: TrendingUp, title: "9. Experiment & Scale", desc: "We run structured experiments, measure what wins, and scale the tactics that deliver real leads — fast." },
];

export default function Methodology() {
  return (
    <section id="methodology" className="bg-black py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lime-400">The Methodology</div>
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">We Throw The Book At It.</h2>
          <p className="mt-4 text-lg text-white/60">A 9-phase AI-powered growth engine — discovery, audit, opportunity, concept, brand, website, marketing, QA, and scale — engineered to get you on the first page of Google and every AI search engine as fast as technologically possible.</p>
        </motion.div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PHASES.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-lime-400/40">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-lime-400/10"><p.icon className="h-5 w-5 text-lime-400" /></div>
              <h3 className="text-base font-bold text-white">{p.title}</h3>
              <p className="mt-2 text-sm text-white/60">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}