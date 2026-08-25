import { Outlet, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { XTREME_AI_LOGO } from "@/lib/brandAssets";
import ThemeToggle from "@/components/ThemeToggle";
import { usePortalStudio } from "@/lib/PortalStudioContext";
import PortalStudioTimeline from "@/components/portalstudio/PortalStudioTimeline";
import PortalStudioCoach from "@/components/portalstudio/PortalStudioCoach";

// Full-screen Portal Studio workspace — no admin sidebar, no distraction.
// The admin enters here from the sidebar and gets the exact same guided
// timeline + coach experience as the client portal, but against an isolated
// PortalStudioProject sandbox record.
export default function PortalStudioLayout() {
  const navigate = useNavigate();
  const { project, isActive, clearActiveProject } = usePortalStudio();

  const exit = () => {
    clearActiveProject();
    navigate("/client-portal");
  };

  const logout = async () => {
    clearActiveProject();
    await base44.auth.logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      <header className="flex h-14 items-center gap-3 border-b border-white/10 bg-zinc-950 px-4">
        <Image src={XTREME_AI_LOGO} alt="Xtreme AI" className="h-8 w-8 rounded" fittingType="fit" />
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">Xtreme AI</div>
          <div className="text-[10px] uppercase tracking-wider text-amber-400">
            {isActive ? project?.name || "Sandbox Build" : "No project selected"}
          </div>
        </div>
        <button
          onClick={exit}
          className="ml-2 flex items-center gap-1.5 rounded-md border border-amber-400 px-2.5 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-400/10"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Exit to Admin
        </button>
        <ThemeToggle className="ml-auto flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/5" />
        <button onClick={logout} className="flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/5">
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </header>

      {isActive && <PortalStudioTimeline />}

      <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-28">
        <Outlet />
      </main>

      {isActive && <PortalStudioCoach />}
    </div>
  );
}