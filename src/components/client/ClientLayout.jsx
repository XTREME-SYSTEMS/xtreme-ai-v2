import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  LogOut, Menu, X, ArrowLeft,
} from "lucide-react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { LOGO_ICON } from "@/lib/brandAssets";
import ThemeToggle from "@/components/ThemeToggle";
import { usePreview } from "@/lib/PreviewContext";
import ClientSidebarTimeline from "@/components/client/ClientSidebarTimeline";
import StepCoach from "@/components/client/StepCoach";
import { CLIENT_NAV } from "@/lib/clientSteps";

export default function ClientLayout({ user }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { setPreview, clearPreview } = usePreview();

  const logout = async () => {
    clearPreview();
    await base44.auth.logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Left menu */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-60 transform border-r border-white/10 bg-black transition-transform md:static md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
          <Image src={LOGO_ICON} alt="Lead Gen Near You" className="h-8 w-8" fittingType="fit" />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">Lead Gen Near You</div>
            <div className="text-[10px] uppercase tracking-wider text-lime-400">Client Portal</div>
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto text-white/50 hover:text-white md:hidden"><X className="h-5 w-5" /></button>
        </div>
        <nav className="h-[calc(100vh-3.5rem)] overflow-y-auto px-2 py-3">
          {CLIENT_NAV.map((item, idx) => {
            const Icon = item.icon;
            const showDivider = idx === 4; // divider before utilities
            return (
              <div key={item.to}>
                {showDivider && <div className="my-2 border-t border-white/10" />}
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    isActive ? "bg-lime-400/10 font-medium text-white" : "text-white/80 hover:bg-white/5"
                  )}
                >
                  {item.step ? (
                    <span className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      "border border-lime-400/40 text-lime-400"
                    )}>
                      {item.step}
                    </span>
                  ) : (
                    <Icon className="h-4 w-4 shrink-0" />
                  )}
                  {item.label}
                </NavLink>
              </div>
            );
          })}
          <ClientSidebarTimeline user={user} />
        </nav>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/70 md:hidden" onClick={() => setOpen(false)} />}

      {/* Middle + Right */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b border-white/10 bg-zinc-950 px-4">
          <button onClick={() => setOpen(true)} className="text-white/60 hover:text-white md:hidden"><Menu className="h-5 w-5" /></button>
          <span className="rounded-md border border-lime-400 bg-lime-400/10 px-2 py-1 text-xs font-semibold text-lime-400">CLIENT PORTAL</span>
          <span className="hidden text-xs text-white/40 sm:inline">Approval-gated workflow</span>
          {user?.role === "admin" && (
            <button onClick={() => { setPreview(false); navigate("/client-portal"); }} className="flex items-center gap-1.5 rounded-md border border-lime-400 px-2.5 py-1.5 text-xs font-semibold text-lime-400 hover:bg-lime-400/10">
              <ArrowLeft className="h-3.5 w-3.5" /> Exit Preview
            </button>
          )}
          <ThemeToggle className="ml-auto flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/5" />
          <span className="hidden text-xs text-white/50 sm:inline">{user?.email || ""}</span>
          <button onClick={logout} className="flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/5">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <StepCoach />
    </div>
  );
}