import { motion } from "framer-motion";
import { MapPin, Phone, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Contact() {
  return (
    <section id="contact" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-black p-8 sm:p-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-lime-400/20 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lime-400">Get In Touch</div>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Book a 15-Minute<br />Strategy Call.</h2>
              <p className="mt-4 max-w-md text-lg text-white/60">Let's talk about your business, your goals, and how our AI-powered growth system can get you there faster.</p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-400"><MapPin className="h-5 w-5 text-black" /></div>
                  <div><div className="text-sm font-semibold text-white">Office</div><div className="text-sm text-white/60">2200 NW 32nd St #700<br />Pompano Beach, FL 33069</div></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-400"><Phone className="h-5 w-5 text-black" /></div>
                  <div><div className="text-sm font-semibold text-white">Phone</div><a href="tel:+17722090266" className="text-sm text-white/60 hover:text-lime-400">(772) 209-0266</a></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-400"><Calendar className="h-5 w-5 text-black" /></div>
                  <div><div className="text-sm font-semibold text-white">Schedule</div><div className="text-sm text-white/60">15-minute phone consultation</div></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-4">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
                <div className="text-sm font-semibold text-white">Ready to grow?</div>
                <p className="mt-1 text-sm text-white/60">Choose a plan, pay your deposit, and get instant access to your approval-gated client dashboard.</p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link to="/pricing" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-3 text-sm font-bold text-black transition-all hover:bg-lime-300">
                    View Pricing <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link to="/client-portal" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-white hover:text-black">
                    Client Portal
                  </Link>
                </div>
              </div>
              <div className="rounded-2xl border border-lime-400/30 bg-lime-400/10 p-6">
                <div className="text-sm font-semibold text-lime-400">Already a client?</div>
                <p className="mt-1 text-sm text-white/70">Log in to your dashboard to track approvals, view brand packs, and get real-time updates.</p>
                <Link to="/client-portal" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-lime-400 hover:text-lime-300">Go to Dashboard <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}