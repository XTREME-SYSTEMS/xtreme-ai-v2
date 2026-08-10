import { MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const COLS = [
  {
    title: "Services",
    links: [
      { label: "AI Services", to: "/#services" },
      { label: "AI Consulting", to: "/#services" },
      { label: "Website Creation", to: "/#services" },
      { label: "SEO Services", to: "/#services" },
      { label: "AEO Services", to: "/#services" },
      { label: "Marketing", to: "/#services" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/#about" },
      { label: "Methodology", to: "/#methodology" },
      { label: "Industries", to: "/#industries" },
      { label: "Process", to: "/#process" },
      { label: "Pricing", to: "/pricing" },
      { label: "FAQ", to: "/#faq" },
      { label: "Contact", to: "/#contact" },
    ],
  },
  {
    title: "Portal",
    links: [
      { label: "Client Login", to: "/dashboard" },
      { label: "Book a Call", to: "/#contact" },
      { label: "AI Tools", to: "/#ai-tools" },
      { label: "Get Started", to: "/pricing" },
    ],
  },
];

export default function MarketingFooter() {
  return (
    <footer className="border-t border-black/10 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black"><MapPin className="h-5 w-5 text-lime-400" /></div>
              <div className="leading-tight"><div className="text-sm font-bold text-black">Lead Generation</div><div className="text-[10px] font-medium uppercase tracking-wider text-black/50">Near You</div></div>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-black/50">AI-powered growth operating system for local businesses. Throw The Book At It.</p>
            <div className="mt-4 space-y-1.5 text-sm text-black/60">
              <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lime-600" /> 2200 NW 32nd St #700, Pompano Beach, FL 33069</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-lime-600" /> (772) 209-0266</div>
            </div>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <div className="text-sm font-bold text-black">{c.title}</div>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => <li key={l.label}><Link to={l.to} className="text-sm text-black/60 transition-colors hover:text-lime-600">{l.label}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-black/10 pt-6">
          <p className="text-center text-xs text-black/40">
            Lead Generation Near You — AI-powered lead generation services, AI consulting, website creation, SEO, and AEO for local businesses in Pompano Beach, Fort Lauderdale, Miami, and nationwide. We throw the book at your growth.
          </p>
          <div className="mt-3 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-black/40">© {new Date().getFullYear()} Lead Generation Near You. All rights reserved.</p>
            <p className="text-xs text-black/40">Powered by AI · Built by Chris Lavin & Jeremy Bensen</p>
          </div>
        </div>
      </div>
    </footer>
  );
}