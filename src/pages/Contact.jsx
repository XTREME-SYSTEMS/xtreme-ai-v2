import { MapPin, Phone, Mail, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export default function Contact() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
        {/* Hero */}
        <div className="text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-600">Get In Touch</div>
          <h1 className="text-4xl font-black tracking-tight text-black sm:text-5xl">Contact Xtreme AI</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-black/60">Book a 15-minute strategy call or reach out — we will talk about your business, your goals, and how our AI-powered growth system can get you there faster.</p>
        </div>

        {/* Contact methods */}
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/15"><Phone className="h-5 w-5 text-amber-600" /></div>
            <h2 className="mt-3 text-sm font-bold text-black">Phone</h2>
            <a href="tel:+17722090266" className="mt-1 block text-sm text-black/60 hover:text-amber-600">(772) 209-0266</a>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/15"><Mail className="h-5 w-5 text-amber-600" /></div>
            <h2 className="mt-3 text-sm font-bold text-black">Email</h2>
            <a href="mailto:hello@leadgenerationnearyou.com" className="mt-1 block text-sm text-black/60 hover:text-amber-600">hello@leadgenerationnearyou.com</a>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/15"><MapPin className="h-5 w-5 text-amber-600" /></div>
            <h2 className="mt-3 text-sm font-bold text-black">Office</h2>
            <p className="mt-1 text-sm text-black/60">2200 NW 32nd St #700<br />Pompano Beach, FL 33069</p>
          </div>
        </div>

        {/* CTA cards */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-black/10 bg-amber-400/5 p-8">
            <div className="flex items-center gap-2 text-amber-600"><Calendar className="h-5 w-5" /><h2 className="text-lg font-bold text-black">Book a Strategy Call</h2></div>
            <p className="mt-2 text-sm text-black/60">Schedule a free 15-minute phone consultation. We will review your current marketing, identify gaps, and show you how AI can automate your lead generation.</p>
            <Link to="/pricing" className="group mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-black transition-all hover:bg-amber-300">
              View Pricing <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="rounded-2xl border border-black/10 bg-black p-8">
            <h2 className="text-lg font-bold text-white">Already a client?</h2>
            <p className="mt-2 text-sm text-white/60">Log in to your approval-gated dashboard to track approvals, view brand packs, and get real-time email and SMS updates.</p>
            <Link to="/client-portal" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-white hover:text-black">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}