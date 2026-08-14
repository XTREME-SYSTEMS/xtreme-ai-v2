import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Check, ArrowRight, Mail, UserPlus, LayoutDashboard } from "lucide-react";
import MarketingNav from "@/components/marketing/MarketingNav";

export default function ThankYou() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <section className="flex min-h-[80vh] items-center justify-center px-4 py-20 pt-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-lime-400">
            <Check className="h-10 w-10 text-black" strokeWidth={3} />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight text-black sm:text-5xl">Payment Received.</h1>
          <p className="mt-4 text-lg text-black/60">Welcome to Lead Generation Near You. Here's what happens next:</p>

          <div className="mt-10 grid gap-4 text-left">
            {[
              { icon: Mail, title: "Check Your Email & SMS", desc: "You'll receive an onboarding introduction explaining our process, timeline, and what to expect." },
              { icon: UserPlus, title: "Create Your Account", desc: "Set your username and password to access your approval-gated client dashboard." },
              { icon: LayoutDashboard, title: "Track Everything in Real Time", desc: "Approve brand packs, websites, and content. Get up-to-the-minute notifications at every step." },
            ].map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-start gap-4 rounded-2xl border border-black/10 bg-white p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black"><s.icon className="h-5 w-5 text-lime-400" /></div>
                <div><div className="font-bold text-black">{s.title}</div><div className="text-sm text-black/60">{s.desc}</div></div>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/my-package" className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lime-400 px-7 py-4 text-base font-bold text-black transition-all hover:bg-lime-300 hover:shadow-xl hover:shadow-lime-400/40 sm:w-auto">
              Go to My Package <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black/15 px-7 py-4 text-base font-bold text-black transition-all hover:border-black hover:bg-black hover:text-white sm:w-auto">
              Back to Home
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-black/40">
            <MapPin className="h-4 w-4 text-lime-600" /> 2200 NW 32nd St #700, Pompano Beach, FL 33069 · (772) 209-0266
          </div>
        </motion.div>
      </section>
    </div>
  );
}