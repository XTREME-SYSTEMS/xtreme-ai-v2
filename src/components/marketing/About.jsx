import { motion } from "framer-motion";
import { MapPin, Phone, Award, Users } from "lucide-react";

export default function About() {
  return (
    <section id="about" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lime-600">Our Story</div>
            <h2 className="text-3xl font-black tracking-tight text-black sm:text-5xl">50+ Years of Combined Experience.<br />Powered by the Latest AI.</h2>
            <p className="mt-5 text-lg text-black/60">
              Founded by <span className="font-semibold text-black">Chris Lavin</span> and <span className="font-semibold text-black">Jeremy Bensen</span>, Lead Generation Near You combines over five decades of business, marketing, sales, and AI expertise into one operating system.
            </p>
            <p className="mt-4 text-base text-black/60">
              We don't sell vanity metrics. We build AI-powered growth engines — configured for each client's highest customer experience and success. Every system is approval-gated, transparent, and built on the "Throw The Book At It" methodology.
            </p>

            <div className="mt-7 flex gap-5">
              <div className="flex items-center gap-2.5"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black"><Award className="h-5 w-5 text-lime-400" /></div><div><div className="text-sm font-bold text-black">Chris Lavin</div><div className="text-xs text-black/50">Co-Founder</div></div></div>
              <div className="flex items-center gap-2.5"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black"><Users className="h-5 w-5 text-lime-400" /></div><div><div className="text-sm font-bold text-black">Jeremy Bensen</div><div className="text-xs text-black/50">Co-Founder</div></div></div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="relative">
            <div className="grid grid-cols-2 gap-4">
              {[{ v: "50+", l: "Years Combined Experience" }, { v: "100%", l: "Approval-Gated Process" }, { v: "AI", l: "Powered Every Step" }, { v: "24/7", l: "Dashboard Access" }].map((s, i) => (
                <div key={s.l} className={`rounded-2xl border border-black/10 p-6 ${i % 2 === 1 ? "bg-black text-white" : "bg-white"}`}>
                  <div className={`text-4xl font-black ${i % 2 === 1 ? "text-lime-400" : "text-black"}`}>{s.v}</div>
                  <div className={`mt-1 text-sm ${i % 2 === 1 ? "text-white/60" : "text-black/50"}`}>{s.l}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-black/10 bg-lime-400/10 p-5">
              <MapPin className="h-8 w-8 shrink-0 text-lime-600" />
              <div><div className="text-sm font-bold text-black">Pompano Beach, FL</div><div className="text-xs text-black/60">2200 NW 32nd St #700, Pompano Beach, FL 33069</div></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}