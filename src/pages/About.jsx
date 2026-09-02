import { Heart, ArrowRight, HardHat, GraduationCap, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { Image } from "@/components/ui/image";

const STATS = [
  { value: "18+", label: "Years in the industry" },
  { value: "5,000+", label: "Contractors trained" },
  { value: "50", label: "Pro brands supplied" },
  { value: "1", label: "Growth OS built for you" },
];

const VALUES = [
  { icon: HardHat, title: "Built by contractors", desc: "We come from the slab — not a boardroom. Every feature is shaped by real jobsite experience in epoxy, polishing, and decorative concrete." },
  { icon: GraduationCap, title: "Education first", desc: "We've trained thousands of installers through Polished Concrete University. Growth starts with knowing the craft and the business." },
  { icon: Layers, title: "Full-stack supply", desc: "From surface prep equipment to epoxy resin and decorative coatings, we supply the materials and the marketing to grow a flooring business." },
  { icon: Heart, title: "Contractor-obsessed", desc: "Real humans, fast support, and a community of flooring pros that builds the roadmap with us." },
];

const TEAM_IMG = "https://media.base44.com/images/public/6a79444e821211169a147eee/bf28f9b6b_121725747_3705443039488227_8851277793604007373_n.jpg";

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
        {/* Hero */}
        <div className="text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-600">About Us</div>
          <h1 className="text-4xl font-bold tracking-tight text-black sm:text-5xl lg:text-6xl">We power the concrete flooring industry</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-black/60">From the slab to the schedule — Xtreme AI gives epoxy, decorative concrete, and polished concrete contractors the same growth engine the big franchises use.</p>
        </div>

        {/* Team image */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-black/10">
          <Image src={TEAM_IMG} alt="Polished Concrete University training session at Xtreme Polishing Systems" className="h-64 w-full object-cover sm:h-80" fittingType="fill" />
        </div>

        {/* Story — focused on epoxy, decorative concrete, and polished concrete industry */}
        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-black">Our story</h2>
            <p className="mt-4 text-base leading-relaxed text-black/60">
              Our roots are in the concrete. Xtreme Polishing Systems was founded in 2007 in Pompano Beach, Florida, supplying professional-grade surface prep equipment, epoxy resin coatings, and decorative concrete products to contractors across the country. For nearly two decades, we've equipped flooring pros with everything from grinding machines and diamond tooling to polyaspartic kits, metallic epoxies, and vinyl flake systems — the full material stack for residential, commercial, and industrial flooring projects.
            </p>
            <p className="mt-3 text-base leading-relaxed text-black/60">
              Out of that supply business came Polished Concrete University — a hands-on training center in Pompano Beach where installers come for five-day certification courses in epoxy resin and concrete polishing. Students learn surface prep, moisture testing, mixing and pouring, finishes like glitter, paint chip, quartz, and metallic, plus the business side: marketing for jobs, lead generation, and competitive bidding. Every graduate leaves with a certification and lifetime phone support. We've trained thousands of contractors, and we kept hearing the same thing: <em>"I know the craft — I need the leads."</em>
            </p>
            <p className="mt-3 text-base leading-relaxed text-black/60">
              That's why we built Xtreme AI. It's an AI-powered growth operating system designed specifically for the epoxy, decorative concrete, and polished concrete industry — combining AI lead capture, website creation, SEO, AEO (Answer Engine Optimization), CRM, and full-stack marketing into one approval-gated platform. Whether you're a solo installer in Pompano Beach or a multi-crew operation bidding commercial polish jobs across state lines, Xtreme AI gets the phone ringing with the jobs you actually want to do.
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
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Grow your flooring business</h2>
          <Link to="/register" className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-7 py-4 text-base font-bold text-black transition-all hover:bg-amber-300">
            Try Demo <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}