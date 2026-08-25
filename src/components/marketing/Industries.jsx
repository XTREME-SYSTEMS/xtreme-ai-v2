import { motion } from "framer-motion";
import { Home, Layers, Car, Wrench, Scissors, HeartPulse, Building2, Briefcase, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const INDUSTRIES = [
  { icon: Home, title: "Home Services", desc: "Contractors, roofers, HVAC, and remodelers capture local demand and book the job on the first call." },
  { icon: Layers, title: "Flooring & Epoxy", desc: "Garage floor and epoxy specialists turn visual quotes into booked jobs and repeat referrals." },
  { icon: Car, title: "Auto Services", desc: "Detailers, auto repair, and tint shops fill the schedule and follow up automatically." },
  { icon: Wrench, title: "Electricians & Plumbers", desc: "Emergency and booked jobs routed to the right tech with reminders that cut no-shows." },
  { icon: Scissors, title: "Salons & Spas", desc: "Class and individual bookings with automated reminders and review requests." },
  { icon: HeartPulse, title: "Health & Wellness", desc: "Clinics and med-spas manage appointments, intake forms, and rebooking in one place." },
  { icon: Building2, title: "Real Estate", desc: "Agents and brokerages nurture listings, capture leads, and close with automated follow-up." },
  { icon: Briefcase, title: "Agencies", desc: "White-label the whole platform and resell it to your clients as your own branded system." },
];

const STATS = [
  { value: "3x", label: "More booked jobs in 90 days" },
  { value: "68%", label: "Less time spent chasing leads" },
  { value: "4.9★", label: "Average customer rating" },
];

export default function Industries() {
  return (
    <section id="solutions" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-600">Solutions</div>
          <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl lg:text-5xl">Built for local service businesses</h2>
          <p className="mt-4 text-lg text-black/60">From the first click to the fifth repeat sale, Xtreme AI is tuned to the way local service businesses win work.</p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {INDUSTRIES.map((ind, i) => (
            <motion.div key={ind.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-2xl border border-black/10 bg-zinc-50 p-6 transition-all hover:border-amber-400 hover:bg-white hover:shadow-lg">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400">
                <ind.icon className="h-5 w-5 text-black" />
              </div>
              <h3 className="mt-4 text-base font-bold text-black">{ind.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-black/55">{ind.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-bold text-amber-600 sm:text-5xl">{s.value}</div>
              <div className="mt-2 text-sm text-black/60">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/register" className="group inline-flex items-center gap-2 rounded-xl bg-amber-400 px-7 py-4 text-base font-bold text-black transition-all hover:bg-amber-300">
            Try Demo <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}