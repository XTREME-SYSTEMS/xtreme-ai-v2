import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import {
  Sparkles, Brain, Inbox, Rocket, Activity,
  Menu, X, LogOut, Globe, Eye,
} from "lucide-react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { LOGO_ICON } from "@/lib/brandAssets";
import BrandLoader from "@/components/BrandLoader";
import { usePreview } from "@/lib/PreviewContext";
import ClientLayout from "@/components/client/ClientLayout";
import PreviewAsClientModal from "@/components/admin/PreviewAsClientModal";
import { useAutoBuild } from "@/lib/AutoBuildContext";

// The 5-step growth pipeline — the only navigation.
const PIPELINE_STEPS = [
  { to: "/onboarding", label: "AI Onboarding", icon: Sparkles, step: 1, desc: "Answer questions — we skip-trace everything",
    color: { ring: "border-emerald-400 bg-emerald-400 text-white shadow-[0_0_14px_3px_rgba(52,211,153,0.45)]", text: "text-emerald-400", icon: "text-emerald-400", idle: "text-emerald-400/40" } },
  { to: "/strategy-review", label: "Strategy Lock", icon: Brain, step: 2, desc: "Review & lock your strategy",
    color: { ring: "border-amber-400 bg-amber-400 text-white shadow-[0_0_14px_3px_rgba(0,71,255,0.45)]", text: "text-amber-600", icon: "text-amber-600", idle: "text-amber-600/40" } },
  { to: "/pack-inbox", label: "Pack Inbox", icon: Inbox, step: 3, desc: "GPT mockups land here for review",
    color: { ring: "border-cyan-400 bg-cyan-400 text-white shadow-[0_0_14px_3px_rgba(34,211,238,0.45)]", text: "text-cyan-400", icon: "text-cyan-400", idle: "text-cyan-400/40" } },
  { to: "/mass-website-factory", label: "Mass Deploy", icon: Rocket, step: 4, desc: "Spin up hundreds of sites",
    color: { ring: "border-rose-400 bg-rose-400 text-white shadow-[0_0_14px_3px_rgba(251,113,133,0.45)]", text: "text-rose-400", icon: "text-rose-400", idle: "text-rose-400/40" } },
  { to: "/ranking-monitor", label: "Monitor", icon: Activity, step: 5, desc: "Track traffic & leads across all sites",
    color: { ring: "border-violet-400 bg-violet-400 text-white shadow-[0_0_14px_3px_rgba(167,139,250,0.45)]", text: "text-violet-400", icon: "text-violet-400", idle: "text-violet-400/40" } },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const logout = async () => {
    clearPreview();
    await base44.auth.logout();
    navigate("/login");
  };

  const { previewAsClient, clearPreview } = usePreview();
  const autoBuild = useAutoBuild();

  if (user === null) {
    return <BrandLoader />;
  }
  const isAdmin = user?.role === "admin";
  const isEmployee = user?.role === "employee";

  // Admins work in the client portal by default — the clean, distraction-free
  // UI with the growth pipeline timeline. The admin sidebar is accessible via
  // the "Admin Panel" button in the client portal header when needed.
  if (autoBuild.isActive) return <ClientLayout user={user} />;
  if ((!isAdmin && !isEmployee) || previewAsClient) return <ClientLayout user={user} />;
  if (isAdmin && new URLSearchParams(window.location.search).get('view') !== 'admin') {
    return <ClientLayout user={user} />;
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-card transition-transform md:static md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-14 items-center gap-2 border-b border-black/10 px-4">
          <Image src={LOGO_ICON} alt="Xtreme AI" className="h-10 w-10" fittingType="fit" />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-black">Xtreme AI</div>
            <div className="text-[10px] uppercase tracking-wider text-amber-600">Growth Factory</div>
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto md:hidden text-black/50 hover:text-black"><X className="h-5 w-5" /></button>
        </div>
        <nav className="h-[calc(100vh-3.5rem)] overflow-y-auto px-2 py-3">
          {/* Start Growth Pipeline — the only primary action */}
          <NavLink
            to="/onboarding"
            onClick={() => setOpen(false)}
            className={({ isActive }) => cn(
              "flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90",
              isActive && "ring-2 ring-primary ring-offset-2"
            )}
          >
            <Sparkles className="h-4 w-4" />
            Start Growth Pipeline
          </NavLink>

          {/* Timeline header */}
          <div className="mt-5 mb-2 flex items-center gap-2 px-1">
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">Growth Pipeline</span>
            <div className="h-px flex-1 bg-gradient-to-r from-amber-400/40 via-black/10 to-transparent" />
          </div>

          {/* Vertical step-by-step timeline */}
          <div className="relative mt-2">
            <div className="absolute left-[28px] top-7 bottom-7 w-0.5 rounded-full bg-gradient-to-b from-violet-400/30 via-black/10 to-rose-400/30" />
            {PIPELINE_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <NavLink
                  key={step.to}
                  to={step.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => cn(
                    "relative flex items-center gap-3.5 rounded-lg px-1 py-2.5 transition-colors",
                    isActive ? "" : "hover:bg-black/5"
                  )}
                >
                  {({ isActive }) => {
                    const c = step.color;
                    return (
                      <>
                        <div className={cn(
                          "relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-base font-bold transition-all duration-200",
                          isActive ? c.ring : cn("border-black/15 bg-white", c.idle)
                        )}>
                          {step.step}
                        </div>
                        <div>
                          <div className={cn(
                            "flex items-center gap-2 text-sm font-semibold transition-colors",
                            isActive ? c.text : "text-black"
                          )}>
                            <Icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? c.icon : "text-black/50")} />
                            {step.label}
                          </div>
                          <div className="text-[11px] leading-tight text-black/40">{step.desc}</div>
                        </div>
                      </>
                    );
                  }}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/70 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 backdrop-blur">
          <button onClick={() => setOpen(true)} className="md:hidden text-black/50 hover:text-black"><Menu className="h-5 w-5" /></button>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-md bg-black px-2 py-1 font-mono text-white font-semibold">XTREME AI PIPELINE</span>
            <span className="hidden text-black/50 sm:inline">Autonomous growth factory · AI-driven pipeline</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-black/60 sm:inline">{user?.email || ""}</span>
            <a href="/?view=site" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-black/15 px-2.5 py-1.5 text-xs text-black font-medium hover:bg-black/5">
              <Globe className="h-3.5 w-3.5" /> View Public Site
            </a>
            <button onClick={() => setShowPreviewModal(true)} className="flex items-center gap-1.5 rounded-lg border border-black/15 px-2.5 py-1.5 text-xs text-black font-medium hover:bg-black/5">
              <Eye className="h-3.5 w-3.5" /> Preview as Client
            </button>
            <button onClick={logout} className="flex items-center gap-1.5 rounded-lg border border-black/15 px-2.5 py-1.5 text-xs text-black font-medium hover:bg-black/5">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
      {showPreviewModal && <PreviewAsClientModal onClose={() => setShowPreviewModal(false)} />}
    </div>
  );
}