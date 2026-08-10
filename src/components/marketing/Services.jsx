import { motion } from "framer-motion";
import { Bot, Brain, Globe, Search, MessageSquare, Megaphone, ArrowUpRight } from "lucide-react";

const SERVICES = [
  { icon: Bot, title: "AI Services", desc: "Custom AI chatbots, lead qualification, content generation, and automation tools built for your business.", items: ["AI Chatbots", "Lead Qualification", "Content Automation", "Custom AI Tools"] },
  { icon: Brain, title: "AI Consulting", desc: "Strategy, implementation roadmaps, team training, and full AI integration into your existing operations.", items: ["AI Strategy", "Implementation", "Team Training", "System Integration"] },
  { icon: Globe, title: "Website Creation", desc: "Conversion-focused websites, landing pages, sales funnels, and web apps that generate real leads.", items: ["Custom Websites", "Landing Pages", "Sales Funnels", "Web Apps"] },
  { icon: Search, title: "SEO", desc: "Local SEO, technical SEO, content SEO, and Google Business Profile optimization that ranks you where customers search.", items: ["Local SEO", "Technical SEO", "Content SEO", "GBP Optimization"] },
  { icon: MessageSquare, title: "AEO", desc: "Answer Engine Optimization — get cited by AI search engines, voice assistants, and the next generation of search.", items: ["AI Search Visibility", "Structured Data", "Voice Search", "GEO Optimization"] },
  { icon: Megaphone, title: "Marketing", desc: "Full-stack marketing — paid media, social, email, SMS, branding, and content that compounds into a growth engine.", items: ["Paid Media", "Social & Email", "Brand Strategy", "Content Marketing"] },
];

export default function Services() {
  return (
    <section id="services" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lime-600">What We Do</div>
          <h2 className="text-3xl font-black tracking-tight text-black sm:text-5xl">Everything Under One Roof.</h2>
          <p className="mt-4 text-lg text-black/60">From AI tools to full done-for-you growth systems — virtually everything that falls under AI, websites, SEO, AEO, and marketing.</p>
        </motion.div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-black/10 bg-white p-7 transition-all hover:border-black hover:shadow-2xl hover:shadow-lime-400/10">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-black transition-colors group-hover:bg-lime-400">
                <s.icon className="h-6 w-6 text-lime-400 transition-colors group-hover:text-black" />
              </div>
              <h3 className="text-xl font-bold text-black">{s.title}</h3>
              <p className="mt-2 text-sm text-black/60">{s.desc}</p>
              <ul className="mt-4 space-y-1.5">
                {s.items.map((it) => <li key={it} className="flex items-center gap-2 text-sm text-black/70"><span className="h-1 w-1 rounded-full bg-lime-500" />{it}</li>)}
              </ul>
              <ArrowUpRight className="absolute right-5 top-5 h-5 w-5 text-black/20 transition-all group-hover:text-lime-500 group-hover:translate-x-1" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}