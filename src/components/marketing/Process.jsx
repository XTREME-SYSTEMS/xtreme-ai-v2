import { motion } from "framer-motion";
import { CreditCard, UserPlus, Mail, LayoutDashboard, Palette, Bell } from "lucide-react";

const STEPS = [
  { icon: CreditCard, title: "Pay Your Deposit", desc: "Choose a done-for-you service and pay your deposit online via Stripe or Wix. Instant confirmation." },
  { icon: UserPlus, title: "Create Your Account", desc: "Set your username and password. Get immediate access to your client dashboard." },
  { icon: Mail, title: "Onboarding Email + SMS", desc: "Receive a detailed introduction explaining our process, timeline, and what to expect — via email and text." },
  { icon: LayoutDashboard, title: "Approval-Gated Dashboard", desc: "Track every step in real time. Approve brand packs, websites, and content before anything goes live." },
  { icon: Palette, title: "Brand Pack: 10 Options", desc: "Get 10 logo and brand options. 2 free iterations. AI-assisted questionnaire tailors recommendations to your business." },
  { icon: Bell, title: "Real-Time Notifications", desc: "Up-to-the-minute updates on where you are in the process — via email, SMS, and dashboard alerts." },
];

export default function Process() {
  return (
    <section id="process" className="bg-zinc-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lime-600">How It Works</div>
          <h2 className="text-3xl font-black tracking-tight text-black sm:text-5xl">From Deposit to Done.<br />Every Step Transparent.</h2>
        </motion.div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}
              className="relative rounded-2xl border border-black/10 bg-white p-6">
              <div className="absolute right-5 top-5 text-5xl font-black text-black/5">{i + 1}</div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-lime-400"><s.icon className="h-6 w-6 text-black" /></div>
              <h3 className="text-lg font-bold text-black">{s.title}</h3>
              <p className="mt-2 text-sm text-black/60">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}