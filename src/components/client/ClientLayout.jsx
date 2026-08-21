import { Outlet, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { LogOut, ArrowLeft } from "lucide-react";
import { Image } from "@/components/ui/image";
import { LOGO_ICON } from "@/lib/brandAssets";
import ThemeToggle from "@/components/ThemeToggle";
import { usePreview } from "@/lib/PreviewContext";
import StepCoach from "@/components/client/StepCoach";
import ClientTimeline from "@/components/client/ClientTimeline";
import MobileBottomNav from "@/components/client/MobileBottomNav";
import ClientErrorBoundary from "@/components/client/ClientErrorBoundary";
import ClientWelcomeModal from "@/components/client/ClientWelcomeModal";

// Distraction-free client shell: no sidebar, no timeline, no manual nav.
// The only thing on screen is the current step's content plus the guided
// StepCoach flow that drives the user from one step to the next. Everything
// else (pipeline state, approvals, etc.) keeps working in the background.
export default function ClientLayout({ user }) {
  const navigate = useNavigate();
  const { setPreview, clearPreview } = usePreview();

  const logout = async () => {
    clearPreview();
    await base44.auth.logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      <header className="flex h-14 items-center gap-3 border-b border-white/10 bg-zinc-950 px-4">
        <Image src={LOGO_ICON} alt="Lead Gen Near You" className="h-8 w-8" fittingType="fit" />
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">Lead Gen Near You</div>
          <div className="text-[10px] uppercase tracking-wider text-lime-400">Client Portal</div>
        </div>
        {user?.role === "admin" && (
          <button
            onClick={() => { setPreview(false); navigate("/client-portal"); }}
            className="ml-2 flex items-center gap-1.5 rounded-md border border-lime-400 px-2.5 py-1.5 text-xs font-semibold text-lime-400 hover:bg-lime-400/10"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Exit Preview
          </button>
        )}
        <ThemeToggle className="ml-auto flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/5" />
        <span className="hidden text-xs text-white/50 sm:inline">{user?.email || ""}</span>
        <button onClick={logout} className="flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/5">
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </header>

      <ClientTimeline />

      <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-28">
        <ClientErrorBoundary>
          <Outlet />
        </ClientErrorBoundary>
      </main>

      <StepCoach />

      {/* Mobile bottom nav — most important quick-access buttons (mobile only) */}
      <MobileBottomNav />

      <ClientWelcomeModal user={user} />
    </div>
  );
}