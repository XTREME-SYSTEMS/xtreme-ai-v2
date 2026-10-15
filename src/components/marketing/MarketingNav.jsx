import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown, LogIn, Home, DollarSign, Search, Wrench, Ticket, Heart, Mail } from "lucide-react";
import { LOGO_ICON } from "@/lib/brandAssets";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import AnnouncementBar from "@/components/marketing/AnnouncementBar";

const CENTER_LINKS = [
  { to: "/#features", label: "Features" },
  { to: "/#pricing", label: "Pricing" },
  { to: "/free-tools", label: "Free Tools" },
  { to: "/#solutions", label: "Solutions" },
  { to: "/#about", label: "About" },
];

// All public pages in preferred user flow order (top-down).
// Client Portal Sign In is rendered separately at the bottom of the dropdown.
const DROPDOWN_PAGES = [
  { to: "/", label: "Home", icon: Home },
  { to: "/pricing", label: "Pricing", icon: DollarSign },
  { to: "/free-audit", label: "Free Audit", icon: Search },
  { to: "/free-tools", label: "Free Tools", icon: Wrench },
  { to: "/coupon", label: "Coupon", icon: Ticket },
  { to: "/about", label: "About", icon: Heart },
  { to: "/contact", label: "Contact", icon: Mail },
];

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full">
      <AnnouncementBar />
      <nav className={cn("w-full bg-white transition-all duration-300", scrolled ? "border-b border-black/10 shadow-sm" : "border-b border-black/5")}>
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo left — 2x size (was h-10 w-10, now h-16 w-16) */}
          <Link to="/" className="flex items-center gap-2">
            <Image src={LOGO_ICON} alt="Xtreme AI" className="h-16 w-16" fittingType="fit" />
            <div className="leading-tight">
              <div className="text-base font-bold text-black">Xtreme AI</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Growth Factory</div>
            </div>
          </Link>

          {/* Center navigation */}
          <div className="hidden items-center gap-7 md:flex">
            {CENTER_LINKS.map((l) => (
              <a key={l.label} href={l.to} className="text-sm font-medium text-black/70 transition-colors hover:text-amber-600">{l.label}</a>
            ))}
          </div>

          {/* Right — Get Started dropdown with all public pages */}
          <div className="flex items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-amber-300 hover:shadow-lg hover:shadow-amber-400/40"
              >
                Get Started
                <ChevronDown className={cn("h-4 w-4 transition-transform", dropdownOpen && "rotate-180")} />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl">
                  {DROPDOWN_PAGES.map((page) => {
                    const Icon = page.icon;
                    return (
                      <Link
                        key={page.to}
                        to={page.to}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-black/80 transition-colors hover:bg-amber-400/10 hover:text-amber-600"
                      >
                        <Icon className="h-4 w-4 text-amber-600" />
                        {page.label}
                      </Link>
                    );
                  })}
                  {/* Divider */}
                  <div className="border-t border-black/10" />
                  {/* Client Portal Sign In — at bottom, highlighted */}
                  <Link
                    to="/login"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 bg-black px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
                  >
                    <LogIn className="h-4 w-4 text-amber-400" />
                    Client Portal Sign In
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-black"><Menu className="h-6 w-6" /></button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-white md:hidden">
          <div className="flex h-20 items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2">
              <Image src={LOGO_ICON} alt="Xtreme AI" className="h-16 w-16" fittingType="fit" />
              <div className="leading-tight">
                <div className="text-base font-bold text-black">Xtreme AI</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Growth Factory</div>
              </div>
            </Link>
            <button onClick={() => setMobileOpen(false)} className="text-black"><X className="h-6 w-6" /></button>
          </div>
          <div className="flex flex-col gap-1 overflow-y-auto px-4 py-6">
            {CENTER_LINKS.map((l) => <a key={l.label} href={l.to} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 text-base font-medium text-black/80 hover:bg-amber-400/10 hover:text-amber-600">{l.label}</a>)}
            <div className="my-2 border-t border-black/10" />
            {DROPDOWN_PAGES.map((p) => {
              const Icon = p.icon;
              return (
                <Link key={p.to} to={p.to} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium text-black/80 hover:bg-amber-400/10">
                  <Icon className="h-5 w-5 text-amber-600" /> {p.label}
                </Link>
              );
            })}
            <Link to="/login" onClick={() => setMobileOpen(false)} className="mt-2 flex items-center gap-2 rounded-lg bg-black px-3 py-3 text-base font-semibold text-white">
              <LogIn className="h-5 w-5 text-amber-400" /> Client Portal Sign In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}