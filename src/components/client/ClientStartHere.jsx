import { useState } from "react";
import { Link } from "react-router-dom";
import { usePortalPipeline } from "@/hooks/usePortalPipeline";
import {
  Sparkles, CheckCircle2, Clock, Lock, ArrowRight, ShieldCheck, PenLine, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// H1 — Now uses the unified portal pipeline (usePortalPipeline) so the
// "Start Here" timeline shows the same product-aware steps as the timeline
// and dashboard, not the old UNIVERSAL_PIPELINE.
export default function ClientStartHere({ user }) {
  const [showAll, setShowAll] = useState(false);
  const { states, currentStep, progress, loading } = usePortalPipeline(user);

  const pendingApprovalCount = states.filter((s) => s.pendingApproval).length;
  const currentIdx = states.findIndex((s) => s.isCurrent);

  return (
    <section className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <Sparkles className="h-4 w-4" /> Start Here
        </div>
        <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/50">
          Step {Math.min(currentIdx + 1, states.length)} of {states.length}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10 sm:w-40">
            <div className="h-full rounded-full bg-lime-400 transition-all" style={{ width: `${progress.percent}%` }} />
          </div>
          <span className="text-[11px] font-medium text-white/50">{progress.percent}%</span>
        </div>
      </div>

      {/* Current action callout */}
      {!loading && currentStep && (
        <CurrentActionCallout
          step={currentStep.step}
          pendingApproval={currentStep.pendingApproval}
          pendingApprovalCount={pendingApprovalCount}
          doneCount={progress.done}
          totalCount={progress.total}
        />
      )}

      {/* Collapsible full timeline */}
      {!loading && (
        <div className="mt-4">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:border-lime-400/40 hover:text-white"
          >
            {showAll ? "Hide steps" : `View all ${states.length} steps`}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAll && "rotate-180")} />
          </button>

          {showAll && (
            <>
              <ol className="mt-3 space-y-2.5">
                {states.map((s, i) => {
                  const Icon = s.step.icon;
                  const status = s.completed
                    ? "done"
                    : s.pendingApproval
                      ? "action"
                      : s.isCurrent
                        ? "current"
                        : s.locked
                          ? "locked"
                          : "upcoming";
                  return (
                    <TimelineRow
                      key={s.step.key}
                      index={i + 1}
                      icon={Icon}
                      label={s.step.label}
                      desc={s.step.body || s.step.desc}
                      gate={s.step.gate}
                      to={s.step.to}
                      status={status}
                      isLast={i === states.length - 1}
                    />
                  );
                })}
              </ol>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/10 pt-3 text-[11px] text-white/50">
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-lime-400" /> Current step</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Action needed</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-white/20" /> Completed</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-white/30" /> Upcoming</span>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

// ── Current action callout ────────────────────────────────────────────────
function CurrentActionCallout({ step, pendingApproval, pendingApprovalCount, doneCount, totalCount }) {
  let title, body, ctaLabel, ctaTo, CtaIcon;
  if (pendingApproval) {
    title = `Action needed: approve your ${step.label}`;
    body = `We've finished this step and are waiting on your sign-off to continue. Open Approvals to review and approve it (or deny with a comment telling us what to change).`;
    ctaLabel = "Open Approvals";
    ctaTo = "/approvals";
    CtaIcon = ShieldCheck;
  } else if (step.to) {
    title = `You're on: ${step.label}`;
    body = step.body || step.desc || "";
    ctaLabel = step.activityLabel || "Open this step";
    ctaTo = step.to;
    CtaIcon = ArrowRight;
  } else {
    title = `You're on: ${step.label}`;
    body = step.body || step.desc || "";
    ctaLabel = null;
    ctaTo = null;
    CtaIcon = null;
  }

  return (
    <div className="mt-4 rounded-lg border border-lime-400/50 bg-zinc-950 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime-400/15">
          {CtaIcon && <CtaIcon className="h-4 w-4 text-lime-400" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-white/60">{body}</p>
          {ctaLabel && ctaTo && (
            <Link
              to={ctaTo}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-lime-300"
            >
              {ctaLabel} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {pendingApprovalCount > 0 && (
            <span className="rounded-full border border-amber-400/50 bg-amber-400/15 px-2.5 py-1 text-[11px] font-bold text-amber-300">
              {pendingApprovalCount} waiting
            </span>
          )}
          <span className="text-[11px] font-medium text-white/40">{doneCount} of {totalCount} done</span>
        </div>
      </div>
    </div>
  );
}

// ── Timeline row ───────────────────────────────────────────────────────────
function TimelineRow({ index, icon: Icon, label, desc, gate, to, status, isLast }) {
  const dotCls = {
    done: "bg-lime-400 border-lime-400 text-black",
    current: "border-lime-400 bg-lime-400/10 text-lime-400 ring-2 ring-lime-400/30",
    action: "border-amber-400 bg-amber-400/15 text-amber-300",
    locked: "border-white/15 bg-zinc-900 text-white/30",
    upcoming: "border-white/20 bg-zinc-900 text-white/60",
  }[status];

  const rowCls = {
    done: "border-white/10 bg-zinc-950",
    current: "border-lime-400/40 bg-lime-400/5",
    action: "border-amber-400/40 bg-amber-400/5",
    locked: "border-white/5 bg-zinc-950 opacity-60",
    upcoming: "border-white/10 bg-zinc-950",
  }[status];

  const Tag = to && status !== "locked" ? Link : "div";
  const tagProps = to && status !== "locked" ? { to } : {};

  return (
    <li>
      <Tag
        {...tagProps}
        className={cn(
          "flex gap-3.5 rounded-lg border p-3.5 transition-colors",
          rowCls,
          to && status !== "locked" && "hover:border-lime-400/50"
        )}
      >
        <div className="flex flex-col items-center">
          <div className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
            dotCls
          )}>
            {status === "done" ? <CheckCircle2 className="h-4 w-4" /> :
             status === "action" ? <Clock className="h-4 w-4" /> :
             status === "locked" ? <Lock className="h-3.5 w-3.5" /> :
             index}
          </div>
          {!isLast && <div className="mt-1 h-full w-px flex-1 bg-white/10" />}
        </div>

        <div className="flex-1 pb-1">
          <div className="flex flex-wrap items-center gap-2">
            <Icon className="h-4 w-4 shrink-0 text-lime-400" />
            <h4 className="text-sm font-semibold text-white">{label}</h4>
            {status === "current" && (
              <span className="rounded-md border border-lime-400/50 bg-lime-400/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-lime-300">
                You are here
              </span>
            )}
            {status === "action" && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/50 bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                <PenLine className="h-3 w-3" /> Action needed
              </span>
            )}
            {gate ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/50">
                <ShieldCheck className="h-3 w-3" /> Approval
              </span>
            ) : (
              <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/40">
                Automatic
              </span>
            )}
            {to && status !== "locked" && (
              <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-white/30" />
            )}
          </div>
          <p className="mt-1 text-xs text-white/55">{desc}</p>
        </div>
      </Tag>
    </li>
  );
}