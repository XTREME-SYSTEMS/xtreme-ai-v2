import { MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { LOGO_HORIZONTAL } from "@/lib/brandAssets";

const COLS = [
  {
    title: "Features",
    links: [
      { label: "CRM", to: "/#features" },
      { label: "Funnels", to: "/#features" },
      { label: "Marketing", to: "/#features" },
      { label: "Bookings", to: "/#features" },
      { label: "Automation", to: "/#features" },
      { label: "Reputation", to: "/#features" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/#about" },
      { label: "Solutions", to: "/#solutions" },
      { label: "Pricing", to: "/pricing" },
      { label: "FAQ", to: "/#faq" },
      { label: "Contact", to: "/#contact" },
    ],
  },
  {
    title: "Portal",
    links: [
      { label: "Login", to: "/login" },
      { label: "Try Demo", to: "/register" },
      { label: "Client Dashboard", to: "/client-portal" },
      { label: "Free Audit", to: "/free-audit" },
    ],
  },
];

export default function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <Image src={LOGO_HORIZONTAL} alt="Xtreme AI" className="h-10 w-10 rounded-lg" fittingType="fit" />
              <div className="leading-tight"><div className="text-sm font-bold text-white">Xtreme AI</div><div className="text-[10px] font-medium uppercase tracking-wider text-white/40">INTELLIGENCE FOR GROWTH</div></div>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-white/50">The AI-powered business operating system for local service businesses. Capture, nurture, close, and reactivate — all in one platform.</p>
            <div className="mt-4 space-y-1.5 text-sm text-white/60">
              <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" /> 2200 NW 32nd St #700, Pompano Beach, FL 33069</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-amber-400" /> (772) 209-0266</div>
            </div>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <div className="text-sm font-bold text-white">{c.title}</div>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => <li key={l.label}><Link to={l.to} className="text-sm text-white/50 transition-colors hover:text-amber-400">{l.label}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="text-center text-xs text-white/40">
            Xtreme AI — AI-powered CRM, funnels, marketing, bookings, and automations for local service businesses in Pompano Beach, Fort Lauderdale, Miami, and nationwide.
          </p>
          <div className="mt-3 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-white/40">© {new Date().getFullYear()} Xtreme AI. All rights reserved.</p>
            <p className="text-xs text-white/40">Powered by AI · Built by Chris Lavin & Jeremy Bensen</p>
          </div>
        </div>
      </div>
    </footer>
  );
}