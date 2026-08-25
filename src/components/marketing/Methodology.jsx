import { motion } from "framer-motion";
import { Layers, Cpu, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const VALUES = [
  { icon: Layers, title: "All-in-one", desc: "A truly all-in-one platform built for operators, not just marketers" },
  { icon: Cpu, title: "AI as the foundation", desc: "Deep AI integration across the full business lifecycle" },
  { icon: Users, title: "Community-driven", desc: "A community-led ecosystem focused on execution and outcomes" },
];

export default function Methodology() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl lg:text-5xl">
            We exist to remove friction from growth and give business owners the systems they need to operate, scale and win
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {VALUES.map((v, i) => (
            <motion.div key={v.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-2xl border border-black/10 bg-zinc-50 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400">
                <v.icon className="h-7 w-7 text-black" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-black">{v.title}</h3>
              <p className="mt-2 text-sm text-black/60">{v.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA banner */}
        <div className="mt-16 rounded-3xl bg-black px-8 py-14 text-center sm:px-16">
          <h3 className="text-2xl font-bold text-white sm:text-3xl">Everything you need to grow your business; even on the go!</h3>
          <Link to="/register" className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-7 py-4 text-base font-bold text-black transition-all hover:bg-amber-300">
            Try Demo <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}