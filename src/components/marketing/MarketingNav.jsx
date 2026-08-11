import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import AnnouncementBar from "@/components/marketing/AnnouncementBar";

const LINKS = [
  { to: "/#features", label: "Features" },
  { to: "/#pricing", label: "Pricing" },
  { to: "/#solutions", label: "Solutions" },
  { to: "/#about", label: "About" },
];

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full">
      <AnnouncementBar />
      <nav className={cn("w-full bg-black transition-all duration-300", scrolled ? "border-b border-lime-400/40 shadow-lg shadow-lime-400/10" : "border-b border-white/10")}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime-400">
              <MapPin className="h-5 w-5 text-black" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-white">Lead Generation Near Me</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-white/40">LEADGENERATIONNEARME.COM</div>
            </div>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {LINKS.map((l) => (
              <a key={l.label} href={l.to} className="text-sm font-medium text-white/70 transition-colors hover:text-lime-400">{l.label}</a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login" className="text-sm font-medium text-white/70 hover:text-lime-400">Login</Link>
            <Link to="/register" className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-lime-300 hover:shadow-lg hover:shadow-lime-400/40">Start 14-day trial</Link>
          </div>

          <button onClick={() => setOpen(!open)} className="md:hidden text-white"><Menu className="h-6 w-6" /></button>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 bg-black md:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime-400"><MapPin className="h-5 w-5 text-black" /></div><span className="text-sm font-bold text-white">Lead Generation Near Me</span></Link>
            <button onClick={() => setOpen(false)} className="text-white"><X className="h-6 w-6" /></button>
          </div>
          <div className="flex flex-col gap-1 px-4 py-6">
            {LINKS.map((l) => <a key={l.label} href={l.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base font-medium text-white/80 hover:bg-lime-400/10 hover:text-lime-400">{l.label}</a>)}
            <Link to="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base font-medium text-white/80 hover:bg-lime-400/10">Login</Link>
            <Link to="/register" onClick={() => setOpen(false)} className="mt-2 rounded-lg bg-lime-400 px-3 py-3 text-center text-base font-semibold text-black">Start 14-day trial</Link>
          </div>
        </div>
      )}
    </header>
  );
}