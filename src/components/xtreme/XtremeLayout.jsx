import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  Zap, LogOut, Menu, X, Package, Compass, Building2, MessageSquareText,
  PenTool, Shirt, Palette, Share2, Video, Sparkles, LayoutTemplate,
  FileSignature, ShieldCheck, Rocket, LayoutDashboard, Settings, Box,
} from "lucide-react";
import { XtremeProvider, useXtreme } from "@/lib/XtremeContext";
import ThemeToggle from "@/components/ThemeToggle";

// Secluded Xtreme AI client-portal shell. Fully isolated from the admin
// Layout — its own branding, its own sidebar, its own route prefix (/xtreme).
// This is the staging surface for the productized portal: refine, brand,
// and harden here, then extract to GitHub as a standalone app.

const NAV_SECTIONS = [
  {
    label: "Build Journey",
    items: [
      { to: "/my-package", label: "Welcome", icon: Package },
      { to: "/business-name-studio", label: "Business Name", icon: Compass },
      { to: "/business-profile", label: "Business Profile", icon: Building2 },
      { to: "/content-generator", label: "Content", icon: MessageSquareText },
      { to: "/logo-generator", label: "Logo", icon: PenTool },
      { to: "/brand-generator", label: "Brand", icon: Shirt },
      { to: "/design-direction", label: "Website", icon: Palette },
      { to: "/social-media", label: "Social Media", icon: Share2 },
      { to: "/video-generator", label: "Video", icon: Video },
      { to: "/enhancements", label: "Enhancements", icon: Sparkles },
      { to: "/your-designs", label: "Your Designs", icon: LayoutTemplate },
      { to: "/signatures", label: "Sign Agreement", icon: FileSignature },
      { to: "/approvals", label: "Design Approval", icon: ShieldCheck },
      { to: "/receipts", label: "Launch", icon: Rocket },
    ],
  },
  {
    label: "Tools",
    items: [
      { to: "/client-portal", label: "Dashboard", icon: LayoutDashboard },
      { to: "/social-media-studio", label: "Social Studio", icon: Share2 },
      { to: "/walkthrough-studio", label: "3D Walkthrough", icon: Box },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function SidebarContent({ onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { xp } = useXtreme();

  const isActive = (to) => location.pathname === xp(to);

  const handleNav = (to) => {
    navigate(xp(to));
    onNavigate?.();
  };

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="mb-6">
          <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">
            {section.label}
          </div>
          {section.items.map((item) => {
            const active = isActive(item.to);
            return (
              <button
                key={item.to}
                onClick={() => handleNav(item.to)}
                className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-lime-400/15 font-medium text-lime-300"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export default function XtremeLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = async () => {
    await base44.auth.logout();
    navigate("/login");
  };

  return (
    <XtremeProvider>
      <div className="flex h-screen bg-black text-white">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-zinc-950 md:flex">
          <div className="flex h-14 items-center gap-2.5 border-b border-white/10 px-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-400/15">
              <Zap className="h-5 w-5 text-lime-400" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-white">Xtreme AI</div>
              <div className="text-[10px] uppercase tracking-wider text-lime-400">Client Portal</div>
            </div>
          </div>
          <SidebarContent />
          <div className="border-t border-white/10 p-3">
            <div className="mb-2 truncate px-3 text-xs text-white/50">{user?.email || ""}</div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>

        {/* Mobile sidebar */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-white/10 bg-zinc-950">
              <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-400/15">
                    <Zap className="h-5 w-5 text-lime-400" />
                  </div>
                  <div className="text-sm font-bold text-white">Xtreme AI</div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center gap-3 border-b border-white/10 bg-zinc-950 px-4">
            <button onClick={() => setMobileOpen(true)} className="text-white/60 hover:text-white md:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 md:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime-400/15">
                <Zap className="h-4 w-4 text-lime-400" />
              </div>
              <span className="text-sm font-bold text-white">Xtreme AI</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle className="flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/5" />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-28">
            <Outlet />
          </main>
        </div>
      </div>
    </XtremeProvider>
  );
}