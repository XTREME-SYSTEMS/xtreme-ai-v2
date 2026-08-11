import { motion } from "framer-motion";
import { UserPlus, Heart, Target, Star, RefreshCw } from "lucide-react";

const MISSION = {
  title: "We're in the business of helping you grow your business",
  body: "Lead Generation Near Me is the AI-powered operating system powering the growth of businesses around the world.",
};

const LIFECYCLE = [
  { icon: UserPlus, title: "Capture", desc: "Attract the right people, turn interest into leads and keep your pipeline full with CRM, Forms, Funnels, Chat Widget, Call Tracking, and Social Planner." },
  { icon: Heart, title: "Nurture", desc: "Build relationships that convert with Conversation AI, Pipelines, Workflows, Calendars, Automated Reminders, and Ringless Voicemail." },
  { icon: Target, title: "Close", desc: "Close deals with less back-and-forth using Lead Scoring, Estimates, Invoicing, Payments, Order Forms, and Text-2-Pay." },
  { icon: Star, title: "Evangelize", desc: "Create fans, not just customers with Reputation Management, Automated Review Requests, Affiliate Manager, and AI Review Reply." },
  { icon: RefreshCw, title: "Reactivate", desc: "Get back on their radar with Broadcast Campaigns, Smart Lists, Birthday & Seasonal Campaigns, and Database Reactivation Templates." },
];

export default function AITools() {
  return (
    <section id="features" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Mission statement */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl lg:text-5xl">{MISSION.title}</h2>
          <p className="mt-5 text-lg text-black/60">{MISSION.body}</p>
        </div>

        {/* All-in-one solution */}
        <div className="mt-20">
          <h3 className="text-center text-2xl font-bold text-black sm:text-3xl">Your all-in-one solution for business growth</h3>
          <p className="mt-3 text-center text-base text-black/50">All the tools you need in one AI-powered platform</p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {LIFECYCLE.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-2xl border border-black/10 bg-white p-7 shadow-sm transition-all hover:border-lime-400 hover:shadow-lg hover:shadow-lime-400/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime-400/15">
                  <item.icon className="h-6 w-6 text-lime-600" />
                </div>
                <h4 className="mt-5 text-lg font-bold text-black">{item.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-black/60">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}