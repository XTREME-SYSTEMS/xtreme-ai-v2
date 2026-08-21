import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Search, Users, ClipboardCheck, Target, Globe, BookOpen,
  Lightbulb, Palette, Monitor, Megaphone, Boxes, Factory, Database, Eye,
  Hammer, ShieldCheck, FileText, TrendingUp, FlaskConical, Dna, Network, BarChart3,
  BookMarked, CheckCircle, ScrollText, Plug, Settings, LogOut, Menu, X,
  MapPin, Plus, Rocket, Bot, LayoutTemplate, Copy, Wand2, Crosshair, Activity, Radar, Package, UserPlus,
} from "lucide-react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { LOGO_ICON } from "@/lib/brandAssets";
import { usePreview } from "@/lib/PreviewContext";
import ClientLayout from "@/components/client/ClientLayout";
import PreviewAsClientModal from "@/components/admin/PreviewAsClientModal";
import ThemeToggle from "@/components/ThemeToggle";

// Client portal navigation lives in ClientLayout; this admin NAV is the only
// nav array used by the admin sidebar.

const NAV = [
  { to: "/client-portal", label: "Command Center", icon: LayoutDashboard, end: true },
  { section: "Discovery" },
  { to: "/discovery", label: "Business Discovery", icon: Search },
  { to: "/prospects", label: "Prospects", icon: Users },
  { to: "/audits", label: "Audits", icon: ClipboardCheck },
  { to: "/opportunities", label: "Search Opportunities", icon: Target },
  { to: "/domains", label: "Domains", icon: Globe },
  { section: "Strategy" },
  { to: "/throw-the-book", label: "Throw The Book", icon: BookOpen },
  { to: "/concepts", label: "Concepts", icon: Lightbulb },
  { to: "/brand-lab", label: "Brand Lab", icon: Palette },
  { to: "/website-lab", label: "Website Lab", icon: Monitor },
  { to: "/marketing-lab", label: "Marketing Lab", icon: Megaphone },
  { section: "Registries" },
  { to: "/capabilities", label: "Capability Registry", icon: Boxes },
  { to: "/generators", label: "Generator Registry", icon: Factory },
  { to: "/sources", label: "Scraper / Source Registry", icon: Database },
  { to: "/visualizer-hub", label: "Visualizer Hub", icon: Eye },
  { section: "Build & QA" },
  { to: "/build-queue", label: "Build Queue", icon: Hammer },
  { to: "/preview-factory", label: "Preview Factory", icon: Eye },
  { to: "/qa-repair", label: "QA & Repair", icon: ShieldCheck },
  { to: "/proposals", label: "Proposal Factory", icon: FileText },
  { to: "/pipeline", label: "Sales Pipeline", icon: TrendingUp },
  { to: "/experiments", label: "Experiments", icon: FlaskConical },
  { section: "Intelligence" },
  { to: "/industry-dna", label: "Industry DNA", icon: Dna },
  { to: "/website-genomes", label: "Website Genome", icon: Network },
  { to: "/playbooks", label: "Playbooks", icon: BookMarked },
  { section: "Business Suite" },
  { to: "/business-suite", label: "Suite Dashboard", icon: LayoutDashboard, end: true },
  { to: "/crm/contacts", label: "Contacts", icon: Users },
  { to: "/crm/accounts", label: "Accounts", icon: Users },
  { to: "/crm/deals", label: "Deals", icon: TrendingUp },
  { to: "/crm/activities", label: "Activities", icon: ClipboardCheck },
  { to: "/crm/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/crm/quotes", label: "Quotes", icon: FileText },
  { to: "/esign/documents", label: "E-Sign Documents", icon: ShieldCheck },
  { to: "/billing/invoices", label: "Invoices", icon: ScrollText },
  { to: "/billing/expenses", label: "Expenses", icon: ScrollText },
  { section: "Site Factory" },
  { to: "/website-factory", label: "Website Factory", icon: Factory },
  { to: "/template-library", label: "Template Library", icon: LayoutTemplate },
  { to: "/prompt-library", label: "Prompt Library", icon: BookOpen },
  { to: "/clone-studio", label: "Clone Studio", icon: Copy },
  { to: "/clone-pipeline", label: "Clone Pipeline", icon: Rocket },
  { to: "/rebrand-studio", label: "Rebrand Studio", icon: Wand2 },
  { to: "/race-to-rank", label: "Race to Rank", icon: Rocket },
  { to: "/ranking-monitor", label: "Ranking Monitor", icon: TrendingUp },
  { to: "/gsc-traffic", label: "GSC Traffic", icon: BarChart3 },
  { to: "/seo-accelerator", label: "Page 1 Accelerator", icon: Crosshair },
  { to: "/seo-standard", label: "SEO Standard Checklist", icon: ClipboardCheck },
  { to: "/seo-agent", label: "SEO AI Agent", icon: Bot },
  { to: "/serp-blueprint", label: "SERP Competitor Cloner", icon: Crosshair },
  { to: "/domain-acquisition", label: "Domain Acquisition AI", icon: Radar },
  { to: "/pipeline-dashboard", label: "Growth Pipeline", icon: Activity },
  { to: "/domain-portfolio", label: "Domain Portfolio", icon: Globe },
  { to: "/rank-engine", label: "Rank Engine", icon: TrendingUp },
  { to: "/markets", label: "Markets", icon: MapPin },
  { to: "/markets/new", label: "New Market", icon: Plus },
  { to: "/seo-launch-pad", label: "SEO Launch Pad", icon: Rocket },
  { section: "Autonomous" },
  { to: "/autonomous-system", label: "Autonomous Engine", icon: Bot, end: true },
  { section: "Lab" },
  { to: "/test-lab", label: "Test Lab", icon: FlaskConical },
  { section: "Governance" },
  { to: "/client-setup", label: "Client Setup", icon: UserPlus },
  { to: "/admin-packages", label: "Package Gallery", icon: Package },
  { to: "/approvals", label: "Approvals", icon: CheckCircle },
  { to: "/receipts", label: "Receipts", icon: ScrollText },
  { to: "/connectors", label: "Connectors", icon: Plug },
  { to: "/settings", label: "Settings", icon: Settings },
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

  const { previewAsClient, setPreview, clearPreview } = usePreview();

  if (user === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-lime-400" />
      </div>
    );
  }
  const isAdmin = user?.role === "admin";
  if (!isAdmin || previewAsClient) return <ClientLayout user={user} />;

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-white/10 bg-black transition-transform md:static md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
          <Image
            src={LOGO_ICON}
            alt="Lead Gen Near You"
            className="h-8 w-8"
            fittingType="fit"
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">Lead Gen Near You</div>
            <div className="text-[10px] uppercase tracking-wider text-lime-400">{user?.role === "admin" ? "Growth Factory" : "Client Portal"}</div>
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto md:hidden text-white/50 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <nav className="h-[calc(100vh-3.5rem)] overflow-y-auto px-2 py-3">
          {NAV.map((item, i) => {
            if (item.section) {
              return <div key={i} className="mt-4 mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-white">{item.section}</div>;
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  isActive ? "bg-lime-400/10 text-white font-medium" : "text-white hover:bg-white/5"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/70 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b border-lime-400/40 bg-white px-4 backdrop-blur">
          <button onClick={() => setOpen(true)} className="md:hidden text-black/50 hover:text-black"><Menu className="h-5 w-5" /></button>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-md border border-lime-400 bg-lime-400 px-2 py-1 font-mono text-black font-semibold">{user?.role === "admin" ? "THROW THE BOOK AT IT" : "CLIENT PORTAL"}</span>
            <span className="hidden text-black/50 sm:inline">{user?.role === "admin" ? "Architecture → Preview Build · Production locked" : "Approval-gated workflow"}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-black/60 sm:inline">{user?.email || ""}</span>
            <button onClick={() => setShowPreviewModal(true)} className="flex items-center gap-1.5 rounded-lg border border-lime-400 px-2.5 py-1.5 text-xs text-black font-medium hover:bg-lime-400/10">
              <Eye className="h-3.5 w-3.5" /> Preview as Client
            </button>
            <ThemeToggle className="flex items-center gap-1.5 rounded-lg border border-lime-400 px-2.5 py-1.5 text-xs text-black font-medium hover:bg-lime-400/10" />
            <button onClick={logout} className="flex items-center gap-1.5 rounded-lg border border-lime-400 px-2.5 py-1.5 text-xs text-black font-medium hover:bg-lime-400/10">
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