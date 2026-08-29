import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Search, Users, ClipboardCheck, Target, Globe, BookOpen,
  Lightbulb, Palette, Monitor, Megaphone, Boxes, Factory, Database, Eye,
  Hammer, ShieldCheck, FileText, TrendingUp, FlaskConical, Dna, Network, BarChart3,
  BookMarked, CheckCircle, ScrollText, Plug, Settings, LogOut, Menu, X,
  MapPin, Plus, Rocket, Bot, LayoutTemplate, Copy, Wand2, Crosshair, Activity, Radar, Package, UserPlus, Tag, Box, ShieldAlert, Sparkles, Brain,
  Archive, ChevronDown, Compass, Building2, MessageSquareText, PenTool, Shirt, Share2, Video, Layers,
  ClipboardList, Bug,
} from "lucide-react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { LOGO_ICON } from "@/lib/brandAssets";
import { UNIFIED_BUILD_STEPS } from "@/lib/unifiedSteps";
import { hasAccessToPage } from "@/lib/accessCapabilities";
import BrandLoader from "@/components/BrandLoader";
import { usePreview } from "@/lib/PreviewContext";
import ClientLayout from "@/components/client/ClientLayout";
import PreviewAsClientModal from "@/components/admin/PreviewAsClientModal";
import ThemeToggle from "@/components/ThemeToggle";
import { useAutoBuild } from "@/lib/AutoBuildContext";

// Client portal navigation lives in ClientLayout; this admin NAV is the only
// nav array used by the admin sidebar.

// The focused autonomous pipeline — the only primary navigation.
const PIPELINE_OVERVIEW = { to: "/autonomous-system", label: "Pipeline Overview", icon: Bot, end: true };

const PIPELINE_CATALOG = { to: "/pipeline-catalog", label: "Pipeline Catalog", icon: Layers, end: true };
const PRODUCT_CATALOG = { to: "/product-catalog", label: "Product Catalog", icon: Package, end: true };
const EMPLOYEE_PORTAL = { to: "/employee-portal", label: "Employee Portal", icon: Users, end: true };

const PIPELINE_STEPS = [
  { to: "/architect",        label: "AI Chief Architect", icon: Brain,  step: 1, desc: "AI chat that operates the system" },
  { to: "/vision-cortex",    label: "Vision Cortex",      icon: Eye,    step: 2, desc: "Finds ideas for websites & systems" },
  { to: "/pipeline-catalog", label: "Pipeline Catalog",   icon: Layers, step: 3, desc: "Browse packages, templates & tools" },
  { to: "/build-queue",      label: "Queue System",       icon: Boxes,  step: 4, desc: "Ideas queued for building" },
  { to: "/auto-builder",     label: "Auto Builder",       icon: Rocket, step: 5, desc: "Full builder pipeline" },
];

// Auto Builder sub-steps — derived from the unified build journey so the
// admin sub-timeline shows the exact same numbered steps as the client
// portal and employee portal (single source of truth: unifiedSteps.js).
const AUTOBUILDER_STEPS = UNIFIED_BUILD_STEPS.map((s) => ({
  to: s.to, label: s.label, icon: s.icon, number: s.number,
}));

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
  { to: "/employee-management", label: "Employee Management", icon: Users },
  { to: "/walkthrough-studio", label: "3D Walkthroughs", icon: Box },
  { to: "/qa-agent", label: "QA Agent", icon: Bug },
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
    return <BrandLoader />;
  }
  const isAdmin = user?.role === "admin";
  const isEmployee = user?.role === "employee";
  const userCaps = user?.access_capabilities || [];
  const hasFullAccess = isAdmin || !userCaps.length || userCaps.includes("all");
  const filterNav = (items) => hasFullAccess ? items : items.filter((item) => !item.to || hasAccessToPage(userCaps, item.to));
  // AutoBuild mode: render the client portal shell so the admin walks the
  // same guided timeline + StepCoach as a real client.
  if (isAdmin && autoBuild.isActive) return <ClientLayout user={user} />;
  if ((!isAdmin && !isEmployee) || previewAsClient) return <ClientLayout user={user} />;

  return (
    <div className="flex h-screen bg-gray-50 text-black">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-200 bg-white transition-transform md:static md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-4">
          <Image
            src={LOGO_ICON}
            alt="Xtreme AI"
            className="h-10 w-10"
            fittingType="fit"
          />
          <div className="leading-tight">
            <div className="text-sm font-bold text-black">Xtreme AI</div>
            <div className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold">{user?.role === "admin" ? "Growth Factory" : "Business Generator"}</div>
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto md:hidden text-gray-500 hover:text-black"><X className="h-5 w-5" /></button>
        </div>
        <nav className="h-[calc(100vh-3.5rem)] overflow-y-auto px-2 py-3">
          {/* Pipeline Overview — home base */}
          <NavLink
            to={PIPELINE_OVERVIEW.to}
            end={PIPELINE_OVERVIEW.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) => cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
              isActive ? "xa-gold text-black font-bold shadow-sm" : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <Bot className="h-4 w-4 shrink-0" />
            {PIPELINE_OVERVIEW.label}
          </NavLink>

          {/* Product Catalog — finished, validated products ready for deployment */}
          {(hasFullAccess || hasAccessToPage(userCaps, PRODUCT_CATALOG.to)) && (
          <NavLink
            to={PRODUCT_CATALOG.to}
            end={PRODUCT_CATALOG.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) => cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
              isActive ? "xa-gold text-black font-bold shadow-sm" : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <Package className="h-4 w-4 shrink-0" />
            {PRODUCT_CATALOG.label}
          </NavLink>
          )}

          {/* Employee Portal — for employees; admins see it too for oversight */}
          <NavLink
            to={EMPLOYEE_PORTAL.to}
            end={EMPLOYEE_PORTAL.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) => cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
              isActive ? "xa-gold text-black font-bold shadow-sm" : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <Users className="h-4 w-4 shrink-0" />
            {EMPLOYEE_PORTAL.label}
          </NavLink>

          {/* Timeline header */}
          <div className="mt-5 mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-black">
            Autonomous Pipeline
          </div>

          {/* Vertical step-by-step timeline */}
          <div className="relative mt-2">
            {/* Thin connecting line */}
            <div className="absolute left-[26px] top-6 bottom-6 w-px bg-gray-200" />
            {filterNav(PIPELINE_STEPS).map((step) => {
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
                      isActive ? "" : "hover:bg-gray-100"
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        <div className={cn(
                          "relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-200",
                          isActive || (isAutoBuilder && showAutoBuilderSub)
                            ? "xa-gold border-amber-400 text-black shadow-[0_0_12px_2px_rgba(255,234,0,0.5)]"
                            : "border-gray-300 bg-white text-gray-400"
                        )}>
                          {step.step}
                        </div>
                        <div>
                          <div className={cn(
                            "flex items-center gap-1.5 text-sm font-medium transition-colors",
                            isActive || (isAutoBuilder && showAutoBuilderSub) ? "text-black font-semibold" : "text-gray-700"
                          )}>
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            {step.label}
                          </div>
                          <div className="text-[11px] leading-tight text-gray-400">{step.desc}</div>
                        </div>
                      </>
                    )}
                  </NavLink>
                  {/* Auto Builder sub-timeline — expands when active */}
                  {isAutoBuilder && showAutoBuilderSub && (
                    <div className="relative ml-[26px] mt-1 mb-2 border-l border-gray-200 pl-5">
                      {AUTOBUILDER_STEPS.map((sub, j) => {
                        const SubIcon = sub.icon;
                        const subActive = location.pathname === sub.to;
                        return (
                          <NavLink
                            key={sub.to}
                            to={sub.to}
                            onClick={() => setOpen(false)}
                            className="relative flex items-center gap-2.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-gray-100"
                          >
                            <div className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-all",
                              subActive
                                ? "xa-gold border-amber-400 text-black shadow-[0_0_8px_1px_rgba(255,234,0,0.4)]"
                                : "border-gray-300 bg-white text-gray-400"
                            )}>
                              {sub.number}
                            </div>
                            <span className={cn(
                              "flex items-center gap-1.5 text-[13px] font-medium",
                              subActive ? "text-black font-semibold" : "text-gray-500"
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
          <div className="mt-6 border-t border-gray-200 pt-3">
            <button
              onClick={() => setArchiveOpen((v) => !v)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <Archive className="h-4 w-4 shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Archive</span>
              <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", archiveOpen && "rotate-180")} />
            </button>
            {archiveOpen && (
              <div className="mt-1 space-y-0.5">
                {filterNav(ARCHIVE_ITEMS).map((item, i) => {
                  if (item.section) {
                    return <div key={i} className="mt-3 mb-1 px-2.5 text-[9px] font-semibold uppercase tracking-wider text-gray-400">{item.section}</div>;
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
                        isActive ? "bg-gray-100 text-black font-medium" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
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

      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4">
          <button onClick={() => setOpen(true)} className="md:hidden text-gray-500 hover:text-black"><Menu className="h-5 w-5" /></button>
          <div className="flex items-center gap-2 text-xs">
            <span className="hidden text-gray-500 sm:inline">{user?.role === "admin" ? "Autonomous growth factory · AI-driven pipeline" : "AI-powered business generation workflow"}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-gray-600 sm:inline">{user?.email || ""}</span>
            <button onClick={() => setShowPreviewModal(true)} className="xa-gold flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold">
              <Eye className="h-3.5 w-3.5" /> Preview as Client
            </button>
            <ThemeToggle className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 font-medium hover:bg-gray-100" />
            <button onClick={logout} className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 font-medium hover:bg-gray-100">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
      {showPreviewModal && <PreviewAsClientModal onClose={() => setShowPreviewModal(false)} />}
    </div>
  );
}