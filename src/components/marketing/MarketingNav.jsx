import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Menu, X, LogIn, LayoutDashboard } from "lucide-react";
import { LOGO_ICON } from "@/lib/brandAssets";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import AnnouncementBar from "@/components/marketing/AnnouncementBar";

const LINKS = [
  { to: "/#features", label: "Features" },
  { to: "/#pricing", label: "Pricing" },
  { to: "/free-tools", label: "Free Tools" },
  { to: "/#solutions", label: "Solutions" },
  { to: "/#about", label: "About" },
];

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setPortalOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full">
      <AnnouncementBar />
      <nav className={cn("w-full bg-white transition-all duration-300", scrolled ? "border-b border-black/10 shadow-sm" : "border-b border-black/5")}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Image src={LOGO_ICON} alt="Xtreme AI" className="h-10 w-10" fittingType="fit" />
            <div className="leading-tight">
              <div className="text-sm font-bold text-black">Xtreme AI</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Growth Factory</div>
            </div>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {LINKS.map((l) => (
              <a key={l.label} href={l.to} className="text-sm font-medium text-black/70 transition-colors hover:text-amber-600">{l.label}</a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Hamburger dropdown — Client Portal sign-in */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setPortalOpen(!portalOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-sm font-medium text-black/70 transition-colors hover:border-amber-400 hover:text-amber-600"
              >
                <Menu className="h-5 w-5" />
                <span className="hidden sm:inline">Portal</span>
              </button>
              {portalOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl">
                  <Link
                    to="/login"
                    onClick={() => setPortalOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-black/80 transition-colors hover:bg-amber-400/10 hover:text-amber-600"
                  >
                    <LayoutDashboard className="h-4 w-4 text-amber-600" />
                    <div>
                      <div className="font-semibold">Client Portal</div>
                      <div className="text-[11px] text-black/40">Sign in to your portal</div>
                    </div>
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setPortalOpen(false)}
                    className="flex items-center gap-2.5 border-t border-black/5 px-4 py-3 text-sm font-medium text-black/80 transition-colors hover:bg-amber-400/10 hover:text-amber-600"
                  >
                    <LogIn className="h-4 w-4 text-amber-600" />
                    <div>
                      <div className="font-semibold">Sign In</div>
                      <div className="text-[11px] text-black/40">Employee & admin access</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <Link to="/pricing" className="hidden rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-amber-300 hover:shadow-lg hover:shadow-amber-400/40 sm:inline-block">Get Started</Link>

            {/* Mobile hamburger */}
            <button onClick={() => setOpen(!open)} className="md:hidden text-black"><Menu className="h-6 w-6" /></button>
          </div>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 bg-white md:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2">
              <Image src={LOGO_ICON} alt="Xtreme AI" className="h-10 w-10" fittingType="fit" />
              <div className="leading-tight">
                <div className="text-sm font-bold text-black">Xtreme AI</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Growth Factory</div>
              </div>
            </Link>
            <button onClick={() => setOpen(false)} className="text-black"><X className="h-6 w-6" /></button>
          </div>
          <div className="flex flex-col gap-1 px-4 py-6">
            {LINKS.map((l) => <a key={l.label} href={l.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base font-medium text-black/80 hover:bg-amber-400/10 hover:text-amber-600">{l.label}</a>)}
            <Link to="/login" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium text-black/80 hover:bg-amber-400/10">
              <LayoutDashboard className="h-5 w-5 text-amber-600" /> Client Portal
            </Link>
            <Link to="/login" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium text-black/80 hover:bg-amber-400/10">
              <LogIn className="h-5 w-5 text-amber-600" /> Sign In
            </Link>
            <Link to="/pricing" onClick={() => setOpen(false)} className="mt-2 rounded-lg bg-amber-400 px-3 py-3 text-center text-base font-semibold text-black">Get Started</Link>
          </div>
        </div>
      )}
    </header>
  );
}