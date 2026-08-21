import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
  { q: "Is there a free plan?", a: "Yes — our Free Starter plan gives you full Elite access so you can experience the entire workflow end-to-end. No credit card required." },
  { q: "Are contacts and users really unlimited?", a: "Correct. We never tax you for growth — unlimited contacts and unlimited users on every plan." },
  { q: "Can I change plans later?", a: "Absolutely. Upgrade or downgrade anytime; changes apply at the next billing cycle." },
  { q: "What about usage-based charges?", a: "SMS, email, and AI Voice are usage-based. You only pay for what you send, at industry-leading rates." },
  { q: "Do you offer done-for-you services?", a: "Yes — our Elite and Enterprise plans include done-for-you site deployment, SEO, and content. A deposit secures your build slot." },
  { q: "Can I white-label the platform?", a: "Enterprise plans include a white-label dashboard so you can resell the platform under your own brand." },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-black sm:text-4xl">Frequently asked questions</h2>
        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => (
            <motion.div key={f.q} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.05 }}
              className="rounded-xl border border-black/10 bg-zinc-50 overflow-hidden">
              <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between px-5 py-4 text-left">
                <span className="text-base font-semibold text-black">{f.q}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-black/40 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && <div className="px-5 pb-4 text-sm text-black/60">{f.a}</div>}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}