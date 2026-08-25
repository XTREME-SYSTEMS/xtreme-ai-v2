import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Search, Users, ClipboardCheck, Target, Globe, BookOpen,
  Lightbulb, Palette, Monitor, Megaphone, Boxes, Factory, Database, Eye,
  Hammer, ShieldCheck, FileText, TrendingUp, FlaskConical, Dna, Network, BarChart3,
  BookMarked, CheckCircle, ScrollText, Plug, Settings, LogOut, Menu, X,
  MapPin, Plus, Rocket, Bot, LayoutTemplate, Copy, Wand2, Crosshair, Activity, Radar, Package, UserPlus, Tag, Box, ShieldAlert, Sparkles, Brain,
  Archive, ChevronDown, Compass, Building2, MessageSquareText, PenTool, Shirt, Share2, Video,
} from "lucide-react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { LOGO_ICON } from "@/lib/brandAssets";
import { usePreview } from "@/lib/PreviewContext";
import ClientLayout from "@/components/client/ClientLayout";
import PreviewAsClientModal from "@/components/admin/PreviewAsClientModal";
import ThemeToggle from "@/components/ThemeToggle";
import { useAutoBuild } from "@/lib/AutoBuildContext";

// Client portal navigation lives in ClientLayout; this admin NAV is the only
// nav array used by the admin sidebar.

// The focused autonomous pipeline — the only primary navigation.
// Step 1: AI Chief Architect  → AI chat that operates the entire system
// Step 2: Vision Cortex        → Finds ideas for websites & systems
// Step 3: Queue System         → Ideas queued for building
// Step 4: Auto Builder         → Full builder pipeline
const PIPELINE_OVERVIEW = { to: "/autonomous-system", label: "Pipeline Overview", icon: Bot, end: true };

const PIPELINE_STEPS = [
  { to: "/architect",     label: "AI Chief Architect", icon: Brain,  step: 1, desc: "AI chat that operates the system" },
  { to: "/vision-cortex", label: "Vision Cortex",      icon: Eye,   step: 2, desc: "Finds ideas for websites & systems" },
  { to: "/build-queue",   label: "Queue System",       icon: Boxes,  step: 3, desc: "Ideas queued for building" },
  { to: "/auto-builder",  label: "Auto Builder",       icon: Rocket, step: 4, desc: "Full builder pipeline" },
];

// Auto Builder sub-steps — the builder's own pipeline, shown as a nested
// timeline when the user is on the Auto Builder step. Mirrors the client
// portal journey: Welcome → Business Name → Profile → Content → Logo →
// Brand → Website → Social → Video → Review.
const AUTOBUILDER_STEPS = [
  { to: "/my-package",           label: "Welcome",       icon: Package },
  { to: "/business-name-studio", label: "Business Name", icon: Compass },
  { to: "/business-profile",     label: "Profile",       icon: Building2 },
  { to: "/content-generator",    label: "Content",       icon: MessageSquareText },
  { to: "/logo-generator",       label: "Logo",          icon: PenTool },
  { to: "/brand-generator",      label: "Brand",         icon: Shirt },
  { to: "/design-direction",     label: "Website",       icon: Palette },
  { to: "/social-media",         label: "Social",        icon: Share2 },
  { to: "/video-generator",      label: "Video",         icon: Video },
  { to: "/your-designs",         label: "Review",        icon: LayoutTemplate },
];

const AUTOBUILDER_ROUTES = ["/auto-builder", ...AUTOBUILDER_STEPS.map((s) => s.to)];

// Archived items — still accessible but collapsed out of the way.
const ARCHIVE_ITEMS = [
  { to: "/client-portal", label: "Command Center", icon: LayoutDashboard, end: true },
  { section: "Xtreme AI" },
  { to: "/portal-studio", label: "Xtreme AI Studio", icon: Hammer, end: true },
  { section: "Discovery" },
  { to: "/idea-discovery", label: "Autonomous Discovery", icon: Radar },
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
  { section: "Lab" },
  { to: "/test-lab", label: "Test Lab", icon: FlaskConical },
  { section: "Governance" },
  { to: "/client-setup", label: "Client Setup", icon: UserPlus },
  { to: "/admin-packages", label: "Package Gallery", icon: Package },
  { to: "/admin-promo-codes", label: "Promo Codes", icon: Tag },
  { to: "/admin-domain-purchase", label: "Domain Purchaser", icon: Globe },
  { to: "/walkthrough-studio", label: "3D Walkthroughs", icon: Box },
  { to: "/system-alerts", label: "System Alerts", icon: ShieldAlert },
  { to: "/system-optimization", label: "System Optimization", icon: Sparkles },
  { to: "/approvals", label: "Approvals", icon: CheckCircle },
  { to: "/receipts", label: "Receipts", icon: ScrollText },
  { to: "/connectors", label: "Connectors", icon: Plug },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const showAutoBuilderSub = AUTOBUILDER_ROUTES.includes(location.pathname);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const logout = async () => {
    clearPreview();
    await base44.auth.logout();
    navigate("/login");
  };

  const { previewAsClient, setPreview, clearPreview } = usePreview();
  const autoBuild = useAutoBuild();

  if (user === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-amber-400" />
      </div>
    );
  }
  const isAdmin = user?.role === "admin";
  // AutoBuild mode: render the client portal shell so the admin walks the
  // same guided timeline + StepCoach as a real client.
  if (isAdmin && autoBuild.isActive) return <ClientLayout user={user} />;
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
            alt="Xtreme AI"
            className="h-8 w-8"
            fittingType="fit"
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">Xtreme AI</div>
            <div className="text-[10px] uppercase tracking-wider text-amber-400">{user?.role === "admin" ? "Growth Factory" : "Client Portal"}</div>
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto md:hidden text-white/50 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <nav className="h-[calc(100vh-3.5rem)] overflow-y-auto px-2 py-3">
          {/* Pipeline Overview — home base */}
          <NavLink
            to={PIPELINE_OVERVIEW.to}
            end={PIPELINE_OVERVIEW.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) => cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
              isActive ? "bg-amber-400/10 text-amber-400 font-semibold" : "text-white hover:bg-white/5"
            )}
          >
            <Bot className="h-4 w-4 shrink-0" />
            {PIPELINE_OVERVIEW.label}
          </NavLink>

          {/* Timeline header */}
          <div className="mt-5 mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Autonomous Pipeline
          </div>

          {/* Vertical step-by-step timeline */}
          <div className="relative mt-2">
            {/* Thin connecting line */}
            <div className="absolute left-[26px] top-6 bottom-6 w-px bg-white/10" />
            {PIPELINE_STEPS.map((step) => {
              const Icon = step.icon;
              const isAutoBuilder = step.to === "/auto-builder";
              return (
                <div key={step.to}>
                  <NavLink
                    to={step.to}
                    end={step.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => cn(
                      "relative flex items-center gap-3.5 rounded-lg px-1 py-2.5 transition-colors",
                      isActive ? "" : "hover:bg-white/5"
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        <div className={cn(
                          "relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-200",
                          isActive || (isAutoBuilder && showAutoBuilderSub)
                            ? "border-amber-400 bg-amber-400 text-black shadow-[0_0_12px_2px_rgba(255,255,0,0.5)]"
                            : "border-white/15 bg-zinc-900 text-white/50"
                        )}>
                          {step.step}
                        </div>
                        <div>
                          <div className={cn(
                            "flex items-center gap-1.5 text-sm font-medium transition-colors",
                            isActive || (isAutoBuilder && showAutoBuilderSub) ? "text-amber-400" : "text-white"
                          )}>
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            {step.label}
                          </div>
                          <div className="text-[11px] leading-tight text-white/40">{step.desc}</div>
                        </div>
                      </>
                    )}
                  </NavLink>
                  {/* Auto Builder sub-timeline — expands when active */}
                  {isAutoBuilder && showAutoBuilderSub && (
                    <div className="relative ml-[26px] mt-1 mb-2 border-l border-white/10 pl-5">
                      {AUTOBUILDER_STEPS.map((sub, j) => {
                        const SubIcon = sub.icon;
                        const subActive = location.pathname === sub.to;
                        return (
                          <NavLink
                            key={sub.to}
                            to={sub.to}
                            onClick={() => setOpen(false)}
                            className="relative flex items-center gap-2.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-white/5"
                          >
                            <div className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-all",
                              subActive
                                ? "border-amber-400 bg-amber-400 text-black shadow-[0_0_8px_1px_rgba(255,255,0,0.4)]"
                                : "border-white/15 bg-zinc-900 text-white/40"
                            )}>
                              {j + 1}
                            </div>
                            <span className={cn(
                              "flex items-center gap-1.5 text-[13px] font-medium",
                              subActive ? "text-amber-400" : "text-white/60"
                            )}>
                              <SubIcon className="h-3 w-3 shrink-0" />
                              {sub.label}
                            </span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Archive — collapsed by default, still accessible */}
          <div className="mt-6 border-t border-white/10 pt-3">
            <button
              onClick={() => setArchiveOpen((v) => !v)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-white/40 transition-colors hover:bg-white/5 hover:text-white/70"
            >
              <Archive className="h-4 w-4 shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Archive</span>
              <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", archiveOpen && "rotate-180")} />
            </button>
            {archiveOpen && (
              <div className="mt-1 space-y-0.5">
                {ARCHIVE_ITEMS.map((item, i) => {
                  if (item.section) {
                    return <div key={i} className="mt-3 mb-1 px-2.5 text-[9px] font-semibold uppercase tracking-wider text-white/25">{item.section}</div>;
                  }
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) => cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors",
                        isActive ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white/70"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/70 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b border-amber-400/40 bg-white px-4 backdrop-blur">
          <button onClick={() => setOpen(true)} className="md:hidden text-black/50 hover:text-black"><Menu className="h-5 w-5" /></button>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-md border border-amber-400 bg-amber-400 px-2 py-1 font-mono text-black font-semibold">{user?.role === "admin" ? "THROW THE BOOK AT IT" : "CLIENT PORTAL"}</span>
            <span className="hidden text-black/50 sm:inline">{user?.role === "admin" ? "Architecture → Preview Build · Production locked" : "Approval-gated workflow"}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-black/60 sm:inline">{user?.email || ""}</span>
            <button onClick={() => setShowPreviewModal(true)} className="flex items-center gap-1.5 rounded-lg border border-amber-400 px-2.5 py-1.5 text-xs text-black font-medium hover:bg-amber-400/10">
              <Eye className="h-3.5 w-3.5" /> Preview as Client
            </button>
            <ThemeToggle className="flex items-center gap-1.5 rounded-lg border border-amber-400 px-2.5 py-1.5 text-xs text-black font-medium hover:bg-amber-400/10" />
            <button onClick={logout} className="flex items-center gap-1.5 rounded-lg border border-amber-400 px-2.5 py-1.5 text-xs text-black font-medium hover:bg-amber-400/10">
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