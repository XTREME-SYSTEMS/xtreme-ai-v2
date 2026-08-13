import { Link } from "react-router-dom";
import {
  Search, Users, ClipboardCheck, Target, Globe, BookOpen, Lightbulb, Palette,
  Monitor, Megaphone, Boxes, Factory, Database, Eye, Hammer, ShieldCheck, FileText,
  TrendingUp, FlaskConical, Dna, Network, BookMarked, LayoutDashboard, ScrollText,
  Plug, Settings, Rocket, Bot, LayoutTemplate, Copy, Wand2, Crosshair, Activity,
  Radar, BarChart3, MapPin, Plus, CheckCircle,
} from "lucide-react";

const GROUPS = [
  {
    name: "Discovery",
    items: [
      { to: "/discovery", label: "Business Discovery", icon: Search, desc: "Find prospects by industry + geography" },
      { to: "/prospects", label: "Prospects", icon: Users, desc: "Manage discovered businesses" },
      { to: "/audits", label: "Audits", icon: ClipboardCheck, desc: "Presence & site audits" },
      { to: "/opportunities", label: "Search Opportunities", icon: Target, desc: "Keyword gap opportunities" },
      { to: "/domains", label: "Domains", icon: Globe, desc: "Domain portfolio list" },
    ],
  },
  {
    name: "Strategy",
    items: [
      { to: "/throw-the-book", label: "Throw The Book", icon: BookOpen, desc: "Score the full tactic library" },
      { to: "/concepts", label: "Concepts", icon: Lightbulb, desc: "Lead-gen concept lab" },
      { to: "/brand-lab", label: "Brand Lab", icon: Palette, desc: "Brand positioning & assets" },
      { to: "/website-lab", label: "Website Lab", icon: Monitor, desc: "Site composition lab" },
      { to: "/marketing-lab", label: "Marketing Lab", icon: Megaphone, desc: "Campaign & copy lab" },
    ],
  },
  {
    name: "Registries",
    items: [
      { to: "/capabilities", label: "Capability Registry", icon: Boxes, desc: "System capabilities" },
      { to: "/generators", label: "Generator Registry", icon: Factory, desc: "Generator modules" },
      { to: "/sources", label: "Scraper / Source Registry", icon: Database, desc: "Data source adapters" },
      { to: "/visualizer-hub", label: "Visualizer Hub", icon: Eye, desc: "Visual analysis tools" },
    ],
  },
  {
    name: "Build & QA",
    items: [
      { to: "/build-queue", label: "Build Queue", icon: Hammer, desc: "Compose & run builds" },
      { to: "/preview-factory", label: "Preview Factory", icon: Eye, desc: "Preview generated sites" },
      { to: "/qa-repair", label: "QA & Repair", icon: ShieldCheck, desc: "Quality assurance & fixes" },
      { to: "/proposals", label: "Proposal Factory", icon: FileText, desc: "Build client proposals" },
      { to: "/pipeline", label: "Sales Pipeline", icon: TrendingUp, desc: "Deal pipeline" },
      { to: "/experiments", label: "Experiments", icon: FlaskConical, desc: "A/B & tactic experiments" },
    ],
  },
  {
    name: "Intelligence",
    items: [
      { to: "/industry-dna", label: "Industry DNA", icon: Dna, desc: "Industry pattern library" },
      { to: "/website-genomes", label: "Website Genome", icon: Network, desc: "Site genome analysis" },
      { to: "/playbooks", label: "Playbooks", icon: BookMarked, desc: "Reusable playbooks" },
    ],
  },
  {
    name: "Business Suite",
    items: [
      { to: "/business-suite", label: "Suite Dashboard", icon: LayoutDashboard, desc: "CRM & billing overview" },
      { to: "/crm/contacts", label: "Contacts", icon: Users, desc: "CRM contacts" },
      { to: "/crm/accounts", label: "Accounts", icon: Users, desc: "CRM accounts" },
      { to: "/crm/deals", label: "Deals", icon: TrendingUp, desc: "CRM deals" },
      { to: "/crm/activities", label: "Activities", icon: ClipboardCheck, desc: "CRM activities" },
      { to: "/crm/campaigns", label: "Campaigns", icon: Megaphone, desc: "CRM campaigns" },
      { to: "/crm/quotes", label: "Quotes", icon: FileText, desc: "CRM quotes" },
      { to: "/esign/documents", label: "E-Sign Documents", icon: ShieldCheck, desc: "Document signing" },
      { to: "/billing/invoices", label: "Invoices", icon: ScrollText, desc: "Billing invoices" },
      { to: "/billing/expenses", label: "Expenses", icon: ScrollText, desc: "Billing expenses" },
    ],
  },
  {
    name: "Site Factory",
    items: [
      { to: "/website-factory", label: "Website Factory", icon: Factory, desc: "Generate websites end-to-end" },
      { to: "/template-library", label: "Template Library", icon: LayoutTemplate, desc: "Site templates" },
      { to: "/prompt-library", label: "Prompt Library", icon: BookOpen, desc: "Reusable AI prompts" },
      { to: "/clone-studio", label: "Clone Studio", icon: Copy, desc: "Clone a target site" },
      { to: "/clone-pipeline", label: "Clone Pipeline", icon: Rocket, desc: "Clone → rebrand → deploy" },
      { to: "/rebrand-studio", label: "Rebrand Studio", icon: Wand2, desc: "Rebrand cloned assets" },
    ],
  },
  {
    name: "Ranking & SEO",
    items: [
      { to: "/race-to-rank", label: "Race to Rank", icon: Rocket, desc: "Launch ranking campaigns" },
      { to: "/ranking-monitor", label: "Ranking Monitor", icon: TrendingUp, desc: "Track SERP positions" },
      { to: "/gsc-traffic", label: "GSC Traffic", icon: BarChart3, desc: "Google Search Console data" },
      { to: "/seo-accelerator", label: "Page 1 Accelerator", icon: Crosshair, desc: "Push keywords to page one" },
      { to: "/seo-standard", label: "SEO Standard Checklist", icon: ClipboardCheck, desc: "Standard SEO methods" },
      { to: "/seo-agent", label: "SEO AI Agent", icon: Bot, desc: "Autonomous SEO agent" },
      { to: "/serp-blueprint", label: "SERP Competitor Cloner", icon: Crosshair, desc: "Clone competitor blueprints" },
      { to: "/rank-engine", label: "Rank Engine", icon: TrendingUp, desc: "Ranking campaign engine" },
    ],
  },
  {
    name: "Domains & Markets",
    items: [
      { to: "/domain-acquisition", label: "Domain Acquisition AI", icon: Radar, desc: "Find high-ROI domains" },
      { to: "/domain-portfolio", label: "Domain Portfolio", icon: Globe, desc: "Manage deployed domains" },
      { to: "/pipeline-dashboard", label: "Growth Pipeline", icon: Activity, desc: "Portfolio growth pipeline" },
      { to: "/markets", label: "Markets", icon: MapPin, desc: "Local market sites" },
      { to: "/markets/new", label: "New Market", icon: Plus, desc: "Provision a new market" },
      { to: "/seo-launch-pad", label: "SEO Launch Pad", icon: Rocket, desc: "Launch SEO for a market" },
    ],
  },
  {
    name: "Autonomous & Governance",
    items: [
      { to: "/autonomous-system", label: "Autonomous Engine", icon: Bot, desc: "Autonomous operations engine" },
      { to: "/test-lab", label: "Test Lab", icon: FlaskConical, desc: "Sandbox testing" },
      { to: "/approvals", label: "Approvals", icon: CheckCircle, desc: "Pending operator approvals" },
      { to: "/receipts", label: "Receipts", icon: ScrollText, desc: "Audit trail" },
      { to: "/connectors", label: "Connectors", icon: Plug, desc: "OAuth integrations" },
      { to: "/settings", label: "Settings", icon: Settings, desc: "App settings" },
    ],
  },
];

export default function SystemAccessGrid() {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
      <div className="mb-4 flex items-center gap-2">
        <LayoutDashboard className="h-4 w-4 text-lime-400" />
        <h2 className="text-sm font-semibold text-white">Full System Access</h2>
        <span className="text-xs text-white/40">· every module, one click</span>
      </div>
      <div className="space-y-6">
        {GROUPS.map((group) => (
          <div key={group.name}>
            <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-lime-400/80">{group.name}</div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="group flex items-center gap-3 rounded-lg border border-white/10 bg-zinc-950 p-3 transition-colors hover:border-lime-400/50 hover:bg-white/5"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-lime-400" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-white">{item.label}</div>
                      <div className="truncate text-xs text-white/40">{item.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}