import { motion } from "framer-motion";
import { Target, MapPin, Zap, Heart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

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
    <section id="about" className="bg-zinc-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-600">About Us</div>
          <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl lg:text-5xl">We help local businesses win</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-black/60">Xtreme AI was built to give every local service business the same growth engine the big franchises use — at a price that makes sense.</p>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-black/10">
          <img src={TEAM_IMG} alt="Our team" className="h-64 w-full object-cover sm:h-80" />
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="text-2xl font-bold text-black">Our story</h3>
            <p className="mt-4 text-base leading-relaxed text-black/60">
              We watched local businesses duct-tape a dozen tools together just to keep up. So we built one platform — CRM, funnels, marketing, bookings, and automations — that replaces all of them and actually gets the phone to ring.
            </p>
            <p className="mt-3 text-base leading-relaxed text-black/60">
              Today, thousands of businesses across North America use Xtreme AI to capture more leads, book more jobs, and turn one-time customers into repeat referrals.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-xl border border-black/10 bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/15">
                  <v.icon className="h-5 w-5 text-amber-600" />
                </div>
                <h4 className="mt-3 text-sm font-bold text-black">{v.title}</h4>
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

        {/* Final CTA */}
        <div className="mt-16 rounded-3xl bg-black px-8 py-14 text-center sm:px-16">
          <h3 className="text-2xl font-bold text-white sm:text-3xl">Come grow with us</h3>
          <Link to="/register" className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-7 py-4 text-base font-bold text-black transition-all hover:bg-amber-300">
            Try Demo <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}