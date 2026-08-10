import { motion } from "framer-motion";
import { Building2, MapPin } from "lucide-react";

const INDUSTRIES = [
  "HVAC", "Roofing", "Plumbing", "Dental", "Legal", "Real Estate", "Med Spa", "Landscaping",
  "Auto Repair", "Home Services", "Contractors", "Restaurants", "Fitness", "Medical",
  "Insurance", "Financial", "E-Commerce", "SaaS",
];

const LOCATIONS = [
  "Pompano Beach, FL", "Fort Lauderdale, FL", "Miami, FL", "Boca Raton, FL",
  "West Palm Beach, FL", "Deerfield Beach, FL", "Coral Springs, FL", "Hollywood, FL",
  "Sunrise, FL", "Davie, FL", "Plantation, FL", "Tamarac, FL",
];

export default function Industries() {
  return (
    <section id="industries" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lime-600"><Building2 className="h-3.5 w-3.5" /> Industries & Locations</div>
          <h2 className="text-3xl font-black tracking-tight text-black sm:text-5xl">Lead Generation For Your Industry, In Your City.</h2>
          <p className="mt-4 text-lg text-black/60">Our Industry DNA engine maps the winning intents, tools, and tactics for your vertical — then we deploy them locally so you rank where your customers search.</p>
        </motion.div>

        <div className="mt-12">
          <h3 className="text-sm font-bold uppercase tracking-wider text-black/50">Industries We Serve</h3>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {INDUSTRIES.map((ind) => (
              <span key={ind} className="rounded-full border border-black/10 bg-zinc-50 px-4 py-2 text-sm font-medium text-black/80 transition-colors hover:border-lime-400 hover:bg-lime-400/10 hover:text-lime-600">{ind}</span>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-sm font-bold uppercase tracking-wider text-black/50"><MapPin className="mr-1 inline h-3.5 w-3.5" /> Locations We Serve</h3>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {LOCATIONS.map((loc) => (
              <span key={loc} className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-zinc-50 px-4 py-2 text-sm font-medium text-black/80 transition-colors hover:border-lime-400 hover:bg-lime-400/10 hover:text-lime-600"><MapPin className="h-3.5 w-3.5 text-lime-500" />{loc}</span>
            ))}
            <span className="inline-flex items-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">+ Nationwide</span>
          </div>
        </div>
      </div>
    </section>
  );
}