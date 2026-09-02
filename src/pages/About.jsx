import { Target, MapPin, Zap, Heart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

const STATS = [
  { value: "7M+", label: "Businesses powered" },
  { value: "7.3B", label: "Leads generated" },
  { value: "179M", label: "Appointments booked" },
  { value: "$5.2B+", label: "Sales facilitated" },
];

const VALUES = [
  { icon: Target, title: "Outcomes over features", desc: "We measure success by the jobs you book and the dollars you bank — not the buttons we ship." },
  { icon: MapPin, title: "Local-first", desc: "Every product decision starts with the local service business owner in mind." },
  { icon: Zap, title: "Move fast", desc: "We ship weekly so the platform keeps earning its place in your workflow." },
  { icon: Heart, title: "Customer-obsessed", desc: "Real humans, fast support, and a community that builds the roadmap with us." },
];

const TEAM_IMG = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80";

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
        {/* Hero */}
        <div className="text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-600">About Us</div>
          <h1 className="text-4xl font-bold tracking-tight text-black sm:text-5xl lg:text-6xl">We help local businesses win</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-black/60">Xtreme AI was built to give every local service business the same growth engine the big franchises use — at a price that makes sense.</p>
        </div>

        {/* Team image */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-black/10">
          <img src={TEAM_IMG} alt="Our team" className="h-64 w-full object-cover sm:h-80" />
        </div>

        {/* Story — 150+ words about what the app does, who it's for, who builds it */}
        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-black">Our story</h2>
            <p className="mt-4 text-base leading-relaxed text-black/60">
              Xtreme AI is an AI-powered growth operating system built for local service businesses. We combine AI services, AI consulting, website creation, SEO, AEO (Answer Engine Optimization), and full-stack marketing into one approval-gated platform that captures, qualifies, and converts leads automatically. Instead of duct-taping a dozen tools together, business owners get CRM, funnels, marketing, bookings, and automations in a single system engineered to get the phone ringing.
            </p>
            <p className="mt-3 text-base leading-relaxed text-black/60">
              We serve HVAC, roofing, plumbing, dental, legal, real estate, med spa, landscaping, auto repair, home services, contractors, restaurants, fitness, medical, insurance, financial, e-commerce, and SaaS businesses. Whether you are a solo operator in Pompano Beach or a multi-location franchise across the country, Xtreme AI adapts to your industry and your market.
            </p>
            <p className="mt-3 text-base leading-relaxed text-black/60">
              Founded by Chris Lavin and Jeremy Bensen in Pompano Beach, Florida, Xtreme AI was born from watching local businesses struggle with fragmented software. Today, thousands of businesses across North America use our platform to capture more leads, book more jobs, and turn one-time customers into repeat referrals. Every deliverable flows through an approval-gated client dashboard — nothing ships without your sign-off.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-xl border border-black/10 bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/15">
                  <v.icon className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-black">{v.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-black/55">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-black sm:text-4xl">{s.value}</div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wider text-black/40">{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-3xl bg-black px-8 py-14 text-center sm:px-16">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Come grow with us</h2>
          <Link to="/register" className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-7 py-4 text-base font-bold text-black transition-all hover:bg-amber-300">
            Try Demo <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}