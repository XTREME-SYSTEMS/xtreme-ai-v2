import { motion } from "framer-motion";
import { Users, LayoutGrid, Mail, Calendar, Workflow, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const FEATURES = [
  { icon: Users, tag: "CRM", title: "Capture & manage every lead", desc: "A full contact record for every prospect — with tags, custom fields, pipelines, and a complete activity timeline so nothing slips through.", img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80" },
  { icon: LayoutGrid, tag: "Funnels", title: "Funnels & websites that convert", desc: "Drag-and-drop landing pages, full websites, and opt-in forms — built and published in minutes, no code required.", img: "https://images.unsplash.com/photo-1467232007581-a68b07c332a6?auto=format&fit=crop&w=1000&q=80" },
  { icon: Mail, tag: "Marketing", title: "Email & SMS that nurture", desc: "Automated campaigns and broadcasts across email and text, with smart segmentation and a shared unified inbox.", img: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?auto=format&fit=crop&w=1000&q=80" },
  { icon: Calendar, tag: "Bookings", title: "Calendar & scheduling", desc: "Round-robin and class-based booking with automated reminders, rescheduling, and payments at the time of booking.", img: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1000&q=80" },
  { icon: Workflow, tag: "Automation", title: "AI-powered workflows", desc: "Trigger-based automations that follow up instantly, route leads, and even handle inbound calls with AI Voice.", img: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=1000&q=80" },
  { icon: Star, tag: "Reputation", title: "Reviews & reputation", desc: "Automatically request reviews from happy customers and manage your listings across Google and Facebook.", img: "https://images.unsplash.com/photo-1554224155-6726b0148b8c?auto=format&fit=crop&w=1000&q=80" },
];

export default function Services() {
  return (
    <section className="bg-zinc-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lime-600">Platform Features</div>
          <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl lg:text-5xl">One platform. Every tool you need.</h2>
          <p className="mt-4 text-lg text-black/60">Lead Generation Near Me brings CRM, funnels, marketing, bookings, and automations together — so you can run your whole business from a single login.</p>
          <Link to="/register" className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-lime-400 px-6 py-3 text-sm font-bold text-black transition-all hover:bg-lime-300">
            Start 14 Day Free Trial <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div key={f.tag} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }}
              className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition-all hover:border-lime-400 hover:shadow-lg">
              <div className="relative h-44 overflow-hidden">
                <img src={f.img} alt={f.title} className="h-full w-full object-cover" />
                <div className="absolute left-3 top-3 rounded-md bg-lime-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">{f.tag}</div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-black">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-black/60">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}