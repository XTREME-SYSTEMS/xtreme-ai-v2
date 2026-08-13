import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";

const TABS = [
  {
    key: "capture", label: "Capture", title: "Get more leads in the door",
    desc: "Attract the right people, turn interest into leads and keep your pipeline full.",
    img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
    features: [
      "CRM", "Voice AI", "Forms, Surveys & Quizzes", "Websites, Funnels & Landing Pages",
      "Webinar Funnels", "Chat Widget / Conversation AI", "Call Tracking",
      "Inbound SMS & Social DMs", "Social Planner", "Missed Call Text-Back",
      "AI Biz Card Scanner", "QR Codes", "Prospecting Tool", "Ad Manager (Google/FB/Insta Ads)",
    ],
  },
  {
    key: "nurture", label: "Nurture", title: "Build relationships that convert",
    desc: "The tools you need to follow up, stay relevant and build trust.",
    img: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?auto=format&fit=crop&w=900&q=80",
    features: [
      "Conversation AI", "Consolidated conversation stream (SMS, Messenger, Instagram DM, Whatsapp, Livechat)",
      "Sales Pipelines", "Workflows & Automations", "Calendars", "Text Snippets",
      "Appointment Reminders", "Ringless Voicemail", "Mobile App (with video messages)",
      "Automated Outbound Call Connect",
    ],
  },
  {
    key: "close", label: "Close", title: "Close deals with less back-and-forth",
    desc: "Remove friction and turn conversations into paying customers.",
    img: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80",
    features: [
      "Lead Scoring", "Estimate & Proposals", "Invoicing", "Payment Integrations",
      "Paid Calendars", "Order Forms / Upsells / Downsells",
      "Membership Offers / Courses (paid content access)", "One-click Upsell Funnels",
      "Text-2-Pay", "Tap-2-Pay", "Gift Cards", "Loyalty programs",
    ],
  },
  {
    key: "evangelize", label: "Evangelize", title: "Create fans, not just customers",
    desc: "Everything you need to turn happy customers into reviews, referrals and buzz.",
    img: "https://images.unsplash.com/photo-1554224155-6726b0148b8c?auto=format&fit=crop&w=900&q=80",
    features: [
      "Reputation Management", "Automated Review Requests", "Affiliate Manager (for referral tracking)",
      "Website Review Widgets", "Video Review Capture", "Video Review Widgets",
      "Workflow Automations for Recommendation Requests", "AI Review Reply",
      "Social Planner Auto-Review Posts", "Communities", "Loyalty Programs",
    ],
  },
  {
    key: "reactivate", label: "Reactivate", title: "Get back on their radar",
    desc: "Re-engage past leads and customers with timely messages that drive repeat sales.",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
    features: [
      "Broadcast Campaigns - Email/SMS/Whatsapp/Messenger", "Smart Lists / Segmentation",
      "Automated Birthday Campaigns", "Automated Seasonal Campaigns",
      "Database Reactivation Templates", "Newsletter Automation", "Content AI", "Loyalty Programs",
    ],
  },
];

export default function AllInOneTabs() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  return (
    <section id="features" className="bg-zinc-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl lg:text-5xl">Your all-in-one solution for business growth</h2>
          <p className="mt-4 text-lg text-black/60">All the tools you need in one AI-powered platform</p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2 sm:gap-3">
          {TABS.map((t, i) => (
            <button key={t.key} onClick={() => setActive(i)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                active === i ? "bg-lime-400 text-black shadow-lg shadow-lime-400/30" : "bg-white text-black/60 border border-black/10 hover:border-lime-400 hover:text-black"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
            className="mt-12 grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h3 className="text-2xl font-bold text-black sm:text-3xl">{tab.title}</h3>
              <p className="mt-3 text-base text-black/60">{tab.desc}</p>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {tab.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-black/70">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime-600" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-lime-400 px-6 py-3 text-sm font-bold text-black transition-all hover:bg-lime-300">
                Start 14 Day Free Trial <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl shadow-black/5">
              <img src={tab.img} alt={tab.title} className="h-full w-full object-cover" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}