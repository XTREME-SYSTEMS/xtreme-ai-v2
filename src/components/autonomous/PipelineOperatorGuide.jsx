import React from "react";
import { Link } from "react-router-dom";
import { Panel } from "@/components/ui";
import {
  Brain, Eye, Boxes, Rocket, Radar, ShieldCheck, Play, RefreshCw,
  Target, Zap, Globe, TrendingUp, CheckCircle2, ArrowRight, BookOpen,
  Lightbulb, Wrench, Activity,
} from "lucide-react";

const PIPELINE_STEPS = [
  {
    step: 1,
    icon: Brain,
    label: "AI Chief Architect",
    route: "/architect",
    color: "amber",
    purpose: "Your AI command center — chat with an AI that operates the entire system on your behalf.",
    whatItDoes: [
      "Analyzes the current system state and scans the web for emerging tech",
      "Surfaces proactive proposals — what to build, how to build it, new technologies to adopt",
      "Classifies each proposal by type, priority, and time horizon",
      "Acts as your strategic advisor — 10 steps ahead, suggesting directions you may not see",
    ],
    howToOperate: [
      "Open the Architect page and start a conversation",
      "Ask it to scan the system, propose new features, or research a specific technology",
      "Review each proposal's impact score, effort score, and rationale",
      "Approve proposals to send them to the build queue, or dismiss the ones you don't want",
    ],
    output: "Approved proposals and strategic directions fed into the pipeline",
  },
  {
    step: 2,
    icon: Eye,
    label: "Vision Cortex",
    route: "/vision-cortex",
    color: "amber",
    purpose: "The idea engine — scrapes the web to discover and score app, website, and business ideas.",
    whatItDoes: [
      "Scrapes Reddit, Product Hunt, Google Trends, social media, and any URL for emerging ideas",
      "Scores each idea against the YC 10-question framework and autonomous-system criteria",
      "Selects the top 10 ideas and generates exhaustive build summaries (how it works, how to build, financials, brand)",
      "Classifies ideas as 'fully autonomous' when they can be built AND operated with minimal manual work",
    ],
    howToOperate: [
      "Open Vision Cortex and trigger a discovery scan (or wait for the scheduled daily run)",
      "Review discovered ideas — each has a full score breakdown and source link",
      "Filter by industry, product type, or autonomous score",
      "Promote the best ideas directly into the Auto Builder queue",
    ],
    output: "Validated, scored ideas ready to be built",
  },
  {
    step: 3,
    icon: Boxes,
    label: "Queue System",
    route: "/build-queue",
    color: "amber",
    purpose: "The holding area — all approved ideas and proposals wait here before the Auto Builder picks them up.",
    whatItDoes: [
      "Tracks every build in the pipeline with its current status (queued, running, paused, complete, failed)",
      "Shows which step each build is on (profile, names, content, logo, brand, website, social, video, review)",
      "Lets you pause, resume, or cancel any build",
      "Toggles auto-advance so builds move through steps automatically",
    ],
    howToOperate: [
      "Open the Queue to see all builds and their progress",
      "Click any build to walk through its pipeline step-by-step (same experience as the client portal)",
      "Toggle auto-advance on a build to let it run autonomously through all steps",
      "Manually advance or pause builds as needed",
    ],
    output: "Organized, trackable builds ready for the Auto Builder to process",
  },
  {
    step: 4,
    icon: Rocket,
    label: "Auto Builder",
    route: "/auto-builder",
    color: "amber",
    purpose: "The full builder pipeline — takes an idea from queue and generates the complete digital product.",
    whatItDoes: [
      "Supports multiple product types: marketing sites, web apps, e-commerce stores, platforms",
      "Walks through the same guided timeline as the client portal (profile → names → content → logo → brand → website → social → video → review)",
      "For system builds: generates architecture → data model → UI system → code → deploy → review",
      "Auto-heals failed steps and escalates to an operator when it can't self-resolve",
    ],
    howToOperate: [
      "Open the Auto Builder and create a new build (pick a product type and enter a business name)",
      "Walk through each step — the StepCoach guides you from one step to the next",
      "Toggle auto-advance to let the build run through steps automatically",
      "Review the final output and deploy when ready",
    ],
    output: "A complete, deployed digital product (website, app, store, or platform)",
  },
];

const CAPABILITIES = [
  { icon: Radar, label: "Autonomous Discovery", desc: "Scrapes the web for business leads with bad websites and new app/website ideas" },
  { icon: Brain, label: "AI Chief Architect", desc: "Proactive proposals for what to build, how to build it, and strategic direction" },
  { icon: Eye, label: "Vision Cortex", desc: "YC-framework scoring of discovered ideas with exhaustive build summaries" },
  { icon: Rocket, label: "Auto Builder", desc: "Full pipeline from idea to deployed product across multiple product types" },
  { icon: ShieldCheck, label: "Self-Healing", desc: "Auto-retries failed steps, classifies errors, and escalates when stuck" },
  { icon: Activity, label: "Health Monitoring", desc: "Real-time system health scores across 7 dimensions (completeness, correctness, integration, security, performance, autonomy, overall)" },
  { icon: TrendingUp, label: "Forensic Auditing", desc: "Deep system audits that find failures, gaps, and optimization opportunities" },
  { icon: Zap, label: "Scheduled Automation", desc: "Daily discovery, nightly operations, and auto-heal loops run on their own" },
];

const OPERATIONAL_CONTROLS = [
  { icon: Play, label: "Run Cycle", desc: "Triggers one pass of the autonomous build loop — processes queued builds and advances them", color: "amber" },
  { icon: Radar, label: "Run Discovery", desc: "Scrapes the web right now for new business leads and app ideas (normally runs on a daily schedule)", color: "amber" },
  { icon: ShieldCheck, label: "Forensic Audit", desc: "Deep-scans the entire system for failures, gaps, and optimization opportunities — generates repair tasks", color: "amber" },
  { icon: RefreshCw, label: "Refresh", desc: "Reloads all pipeline data — health scores, failures, phases, and repair tasks", color: "amber" },
];

export default function PipelineOperatorGuide() {
  return (
    <div className="mb-6 space-y-6">
      {/* ============================================================
           SECTION 1: What Is This System?
           ============================================================ */}
      <Panel title="What Is This System?">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400/15">
              <Target className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm leading-relaxed text-white/80">
                <span className="font-semibold text-white">Lead Gen Near You</span> is an autonomous growth operating system.
                It researches market opportunities, audits local business presence, and executes high-performance marketing
                strategies to scale lead generation — all with minimal human intervention.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                The system runs on a 4-step pipeline: <span className="text-amber-400">discover ideas → score & validate → queue for building → build & deploy</span>.
                Each step is automated but operator-controllable. Your job is to monitor, approve, and guide — the AI does the heavy lifting.
              </p>
            </div>
          </div>
        </div>
      </Panel>

      {/* ============================================================
           SECTION 2: The 4-Step Pipeline
           ============================================================ */}
      <Panel title="The 4-Step Pipeline">
        <div className="space-y-4">
          {PIPELINE_STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="rounded-xl border border-white/10 bg-black/40 p-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-400 text-sm font-bold text-black shadow-[0_0_12px_2px_rgba(255,234,0,0.4)]">
                    {s.step}
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-amber-400" />
                    <h3 className="text-base font-semibold text-white">{s.label}</h3>
                  </div>
                  <Link
                    to={s.route}
                    className="ml-auto flex items-center gap-1.5 rounded-lg border border-amber-400 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-400/10"
                  >
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Purpose */}
                <div className="mt-3 rounded-lg bg-amber-400/5 px-3 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Purpose</div>
                  <p className="mt-0.5 text-sm text-white/70">{s.purpose}</p>
                </div>

                {/* What it does */}
                <div className="mt-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">What It Does</div>
                  <ul className="mt-1.5 space-y-1">
                    {s.whatItDoes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/60" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* How to operate */}
                <div className="mt-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">How to Operate</div>
                  <ol className="mt-1.5 space-y-1">
                    {s.howToOperate.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-amber-400">{i + 1}</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Output */}
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Output: </span>
                    <span className="text-sm text-white/70">{s.output}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* ============================================================
           SECTION 3: How to Operate the Full Pipeline
           ============================================================ */}
      <Panel title="How to Operate the Full Pipeline">
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg bg-amber-400/5 px-3 py-2.5">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <p className="text-sm text-white/70">
              The pipeline runs automatically on schedules, but as an operator you can trigger, guide, and approve at any point.
              Here's the end-to-end workflow:
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { num: 1, icon: Brain, title: "Start with the Architect", desc: "Chat with the AI Chief Architect to get proposals and strategic direction for what to build next." },
              { num: 2, icon: Eye, title: "Discover Ideas", desc: "Run Vision Cortex (or let the daily scan run) to find and score new app/website ideas from across the web." },
              { num: 3, icon: Boxes, title: "Queue the Best", desc: "Review scored ideas and promote the best ones into the build queue. Organize and prioritize what gets built." },
              { num: 4, icon: Rocket, title: "Build & Deploy", desc: "The Auto Builder processes each queued build through its full pipeline and deploys the finished product." },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.num} className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-400 text-xs font-bold text-black">
                      {s.num}
                    </div>
                    <Icon className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">{s.title}</div>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">{s.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">Operator Tip</span>
            </div>
            <p className="mt-1 text-sm text-white/60">
              You don't need to touch every step. The system runs on schedules (daily discovery, nightly operations, auto-heal loops).
              Your role is to <span className="text-white/80">monitor the dashboard below</span>, approve proposals from the Architect,
              promote the best ideas from Vision Cortex, and intervene only when alerts appear or builds fail.
            </p>
          </div>
        </div>
      </Panel>

      {/* ============================================================
           SECTION 4: Capabilities
           ============================================================ */}
      <Panel title="System Capabilities">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10">
                  <Icon className="h-4.5 w-4.5 text-amber-400" />
                </div>
                <div className="mt-2 text-sm font-semibold text-white">{c.label}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-white/50">{c.desc}</p>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* ============================================================
           SECTION 5: Operational Controls
           ============================================================ */}
      <Panel title="Operational Controls — What Each Button Does">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {OPERATIONAL_CONTROLS.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10">
                    <Icon className="h-4 w-4 text-amber-400" />
                  </div>
                  <span className="text-sm font-semibold text-white">{c.label}</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-white/50">{c.desc}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <Wrench className="h-4 w-4 text-amber-400" />
          <p className="text-xs text-white/50">
            These controls are in the header above. Use <span className="text-amber-400">Run Cycle</span> to process the queue,
            <span className="text-amber-400"> Run Discovery</span> to find new ideas now, and
            <span className="text-amber-400"> Forensic Audit</span> to deep-scan for issues.
          </p>
        </div>
      </Panel>
    </div>
  );
}