import { MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const COLS = [
  { title: "Services", links: ["AI Services", "AI Consulting", "Website Creation", "SEO", "AEO", "Marketing"] },
  { title: "Company", links: ["About", "Process", "Pricing", "Contact", "Careers"] },
  { title: "Portal", links: ["Client Login", "Book a Call", "Support", "Approvals"] },
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
                {c.links.map((l) => <li key={l}><a href="#" className="text-sm text-black/60 transition-colors hover:text-lime-600">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-black/10 pt-6 sm:flex-row">
          <p className="text-xs text-black/40">© {new Date().getFullYear()} Lead Generation Near You. All rights reserved.</p>
          <p className="text-xs text-black/40">Powered by AI · Built by Chris Lavin & Jeremy Bensen</p>
        </div>
      </div>
    </footer>
  );
}