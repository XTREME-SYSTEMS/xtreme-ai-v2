import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Package,
} from "lucide-react";
import { UNIVERSAL_PIPELINE } from "@/lib/universalPipeline";
import { cn } from "@/lib/utils";
import { useClientUser } from "@/hooks/useClientUser";

// The landing page of the client portal. A clear, top-down, step-by-step
// walkthrough of how the portal works and the universal build pipeline every
// implementation follows — with approval-gated steps called out explicitly.
export default function ClientDashboard() {
  const { user } = useClientUser();

  useEffect(() => { document.title = "Client Portal · Lead Gen Near You"; }, []);

  const approvalSteps = UNIVERSAL_PIPELINE.filter((s) => s.gate);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      {/* Welcome */}
      <section className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <Sparkles className="h-4 w-4" /> Welcome
        </div>
        <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
          Thank you{user?.full_name ? `, ${user.full_name}` : ""}!
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Your build is underway. This portal is your home base — here's exactly how it works, step by step.
        </p>
      </section>

      {/* How the portal works — 3 short steps */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-lime-400">How the portal works</h2>
        <p className="mt-2 text-sm text-white/70">
          We build, you guide. At each gated step we pause for your approval — nothing ships until you say so.
        </p>
        <ol className="mt-5 space-y-5">
          {[
            {
              title: "Review your package",
              body: "Open My Package to confirm everything you paid for is listed and nothing is missing.",
              to: "/my-package",
              cta: "Go to My Package",
            },
            {
              title: "Walk through your build steps",
              body: "The timeline below shows every step of your build in order. The green, flashing step is the one you're on right now.",
              to: "#pipeline",
              cta: "See the pipeline",
            },
            {
              title: "Approve or deny each step",
              body: "When a step needs your sign-off, it lights up amber in the sidebar. Open Approvals to approve it and keep things moving, or deny it with a comment telling us what to change.",
              to: "/approvals",
              cta: "Open Approvals",
            },
          ].map((s, i) => (
            <li key={i} className="flex gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-lime-400/50 bg-lime-400/10 text-sm font-bold text-lime-400">
                {i + 1}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                <p className="mt-1 text-sm text-white/60">{s.body}</p>
                {s.to.startsWith("#") ? (
                  <a href={s.to} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-lime-400 hover:underline">
                    {s.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <Link to={s.to} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-lime-400 hover:underline">
                    {s.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* The universal pipeline */}
      <section id="pipeline">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-lime-400">Your build pipeline</h2>
          <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/50">
            {approvalSteps.length} approvals
          </span>
        </div>
        <p className="mt-2 text-sm text-white/70">
          Every build follows the same eight steps. Steps marked <span className="font-semibold text-lime-400">Approval</span> pause for your sign-off before we continue.
        </p>

        <div className="mt-6 space-y-3">
          {UNIVERSAL_PIPELINE.map((step, i) => {
            const Icon = step.icon;
            const StepTag = step.to ? Link : "div";
            const stepProps = step.to ? { to: step.to } : {};
            return (
              <StepTag
                key={step.key}
                {...stepProps}
                className={`flex gap-4 rounded-xl border border-white/10 bg-zinc-950 p-4 ${step.to ? "transition-colors hover:border-lime-400/40" : ""}`}
              >
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-zinc-900 text-sm font-bold text-white/80">
                    {i + 1}
                  </div>
                  {i < UNIVERSAL_PIPELINE.length - 1 && (
                    <div className="mt-1 h-full w-px flex-1 bg-white/10" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-lime-400" />
                    <h3 className="text-sm font-semibold text-white">{step.label}</h3>
                    {step.gate ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                        <ShieldCheck className="h-3 w-3" /> Approval
                      </span>
                    ) : (
                      <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/40">
                        Automatic
                      </span>
                    )}
                    {step.to && <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-white/30" />}
                  </div>
                  <p className="mt-1.5 text-sm text-white/60">{step.desc}</p>
                </div>
              </StepTag>
            );
          })}
        </div>
      </section>

      {/* Approval steps summary */}
      <section className="rounded-xl border border-white/10 bg-zinc-900 p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-lime-400" />
          <h2 className="text-sm font-semibold text-white">Steps that need your approval</h2>
        </div>
        <p className="mt-1 text-xs text-white/50">
          These are the moments where we pause and wait for your sign-off. You'll find them all in the Approvals tab.
        </p>
        <ul className="mt-4 space-y-2">
          {approvalSteps.map((s, i) => (
            <li key={s.key} className="flex items-center gap-2.5 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400" />
              <span className="font-medium text-white">{s.label}</span>
              <span className="text-white/40">— {s.desc}</span>
            </li>
          ))}
        </ul>
        <Link
          to="/approvals"
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3.5 py-2 text-sm font-semibold text-black hover:bg-lime-300"
        >
          Go to Approvals <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Quick links */}
      <section className="grid gap-3 sm:grid-cols-2">
        <Link to="/my-package" className="group flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-950 p-4 transition-colors hover:border-lime-400/50">
          <Package className="h-5 w-5 shrink-0 text-lime-400" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white">My Package</div>
            <div className="text-xs text-white/50">Confirm everything you paid for.</div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-white/30 group-hover:text-lime-400" />
        </Link>
        <Link to="/approvals" className="group flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-950 p-4 transition-colors hover:border-lime-400/50">
          <ShieldCheck className="h-5 w-5 shrink-0 text-lime-400" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white">Approvals</div>
            <div className="text-xs text-white/50">Approve or deny your current step.</div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-white/30 group-hover:text-lime-400" />
        </Link>
      </section>
    </div>
  );
}