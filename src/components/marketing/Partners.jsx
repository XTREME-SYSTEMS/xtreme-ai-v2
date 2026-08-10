import { motion } from "framer-motion";
import { ExternalLink, Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const FALLBACK = [
  { name: "Xtreme Polishing Systems", url: "https://xtremepolishingsystems.com", anchor_text: "Xtreme Polishing Systems", description: "Concrete polishing systems, tooling, and equipment for contractors nationwide.", category: "Concrete & Polishing" },
  { name: "National Concrete Polishing", url: "https://nationalconcretepolishing.net", anchor_text: "National Concrete Polishing", description: "National network of concrete polishing contractors and educational resources.", category: "Concrete & Polishing" },
  { name: "Xtreme AI Systems", url: "https://xtremeaisystems.com", anchor_text: "Xtreme AI Systems", description: "AI systems and automation built for industrial and contractor operations.", category: "AI Systems" },
];

export default function Partners() {
  const [partners, setPartners] = useState(FALLBACK);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.Backlink.filter({ status: "active" }, "-created_date", 20);
        if (res && res.length) setPartners(res);
      } catch { /* keep fallback */ }
    })();
  }, []);

  return (
    <section id="partners" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-semibold text-lime-700"><Link2 className="h-3.5 w-3.5" /> Strategic Partner Network</div>
          <h2 className="text-3xl font-black tracking-tight text-black sm:text-4xl">Trusted by Industry Leaders</h2>
          <p className="mx-auto mt-3 max-w-2xl text-zinc-600">A strategic backlink network with vetted industry partners — engineered to maximize domain authority, referral traffic, and search visibility.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((p, i) => (
            <motion.a
              key={p.url}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-lime-400 hover:shadow-xl hover:shadow-lime-400/10"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black text-lime-400"><ExternalLink className="h-5 w-5" /></div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-lime-600">{p.category}</div>
              <h3 className="mt-1 text-lg font-bold text-black">{p.name}</h3>
              <p className="mt-2 flex-1 text-sm text-zinc-600">{p.description}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-black group-hover:text-lime-600">
                {p.anchor_text || p.name} <ExternalLink className="h-3.5 w-3.5" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}