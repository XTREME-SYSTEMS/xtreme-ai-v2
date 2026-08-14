import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Package, CheckCircle, FileText, ScrollText, Settings, Sparkles,
  ArrowRight, LayoutDashboard,
} from "lucide-react";

const TABS = [
  { to: "/my-package", icon: Package, label: "My Package", desc: "Everything you paid for, listed item by item. Review this first to confirm nothing is missing." },
  { to: "/client-portal", icon: LayoutDashboard, label: "Client Portal", desc: "This page — your welcome guide and overview of how the portal works." },
  { to: "/approvals", icon: CheckCircle, label: "Approvals", desc: "Each step of your build laid out in order. The step you're on glows green and flashes — approve or deny it (with a comment) to keep things moving." },
  { to: "/proposals", icon: FileText, label: "My Proposals", desc: "Plans and quotes your team prepares for your review." },
  { to: "/receipts", icon: ScrollText, label: "Activity", desc: "A log of the actions you've taken in the portal." },
  { to: "/settings", icon: Settings, label: "Settings", desc: "Your account details and preferences." },
];

// The landing page of the client portal. Thanks the client, explains how the
// portal works, what each tab does, and points them to My Package and Approvals.
export default function ClientDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    document.title = "Client Portal · Lead Gen Near You";
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Thank you */}
      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <Sparkles className="h-4 w-4" /> Welcome
        </div>
        <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
          Thank you{user?.full_name ? `, ${user.full_name}` : ""}!
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Your build is underway. This portal is your home base — here's how it works and what to do next.
        </p>
      </div>

      {/* How the portal works */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-lime-400">How the portal works</h2>
        <p className="mt-2 text-sm text-white/70">
          We build, you guide. Your team handles every step of your build, and at each gated step we pause for your
          approval — nothing ships until you say so. Two tabs matter most right now:
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Link to="/my-package" className="group flex items-center gap-3 rounded-lg border border-white/10 bg-zinc-950 p-3 transition-colors hover:border-lime-400/50">
            <Package className="h-5 w-5 shrink-0 text-lime-400" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white">Review your package</div>
              <div className="text-xs text-white/50">Confirm everything you paid for is there.</div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-white/30 group-hover:text-lime-400" />
          </Link>
          <Link to="/approvals" className="group flex items-center gap-3 rounded-lg border border-white/10 bg-zinc-950 p-3 transition-colors hover:border-lime-400/50">
            <CheckCircle className="h-5 w-5 shrink-0 text-lime-400" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white">Go to Approvals</div>
              <div className="text-xs text-white/50">Walk through your build step by step.</div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-white/30 group-hover:text-lime-400" />
          </Link>
        </div>
      </section>

      {/* What each tab does */}
      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-lime-400">What each tab does</h2>
        <div className="mt-3 space-y-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.to} className="flex items-start gap-3 rounded-lg border border-white/10 bg-zinc-950 p-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-lime-400" />
                <div>
                  <div className="text-sm font-semibold text-white">{t.label}</div>
                  <div className="text-xs text-white/50">{t.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Next steps */}
      <section className="mt-6 rounded-xl border border-white/10 bg-zinc-900 p-5">
        <h2 className="text-sm font-semibold text-white">Your next steps</h2>
        <ol className="mt-3 space-y-2.5 text-sm text-white/70">
          <li className="flex gap-2">
            <span className="font-semibold text-lime-400">1.</span>
            <span>Open <Link to="/my-package" className="font-medium text-lime-400 hover:underline">My Package</Link> and confirm everything you ordered is listed.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-lime-400">2.</span>
            <span>Head to <Link to="/approvals" className="font-medium text-lime-400 hover:underline">Approvals</Link> — your build steps are laid out in order. The green, flashing step is the one you're on.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-lime-400">3.</span>
            <span>Approve that step to move forward, or deny it with a comment telling us what to change.</span>
          </li>
        </ol>
      </section>
    </div>
  );
}