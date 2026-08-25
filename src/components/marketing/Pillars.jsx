import { motion } from "framer-motion";
import { Layers, Cpu, Users } from "lucide-react";

const PILLARS = [
  { icon: Layers, title: "All-in-one", desc: "A truly all-in-one platform built for operators, not just marketers" },
  { icon: Cpu, title: "AI as the foundation", desc: "Deep AI integration across the full business lifecycle" },
  { icon: Users, title: "Community-driven", desc: "A community-led ecosystem focused on execution and outcomes" },
];

export default function Pillars() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="mx-auto max-w-2xl text-2xl font-bold tracking-tight text-black sm:text-3xl">
            We exist to remove friction from growth and give business owners the systems they need to operate, scale and win
          </h2>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15">
                <p.icon className="h-7 w-7 text-amber-600" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-black">{p.title}</h3>
              <p className="mt-2 max-w-xs text-sm text-black/55">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}