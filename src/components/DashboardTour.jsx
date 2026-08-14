import { useEffect, useLayoutEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

// Small popup coach-marks that point to key buttons/sections on the client
// dashboard and explain what each is used for. Auto-runs once per user, and
// can be replayed via the "Take tour" button (dispatches `lgny-tour-restart`).
const STEPS = [
  { selector: "#tour-onboarding", title: "AI Onboarding", body: "Tell us about your business so your team can tailor everything to you. Click the chat to answer a few quick questions." },
  { selector: "#tour-stats", title: "Your stats at a glance", body: "Pending approvals, proposals, and recent activity — updated live as your team works." },
  { selector: "#tour-approvals", title: "Pending Approvals", body: "Anything your team wants to ship lands here. Approve to release it, or reject to send it back for revision." },
  { selector: "#tour-activity", title: "Recent Activity", body: "A running log of work your team has completed — a receipt of every action taken." },
  { selector: "#tour-proposals", title: "My Proposals", body: "Plans and packages your team prepares for your review. Open one to see the details." },
];

const POPUP_W = 300;
const POPUP_H = 190;

export default function DashboardTour() {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [box, setBox] = useState(null);
  const [pos, setPos] = useState({ top: 0, left: 0, placement: "below" });

  useEffect(() => {
    try { if (!localStorage.getItem("lgny_tour_done")) setOpen(true); } catch (e) { setOpen(true); }
    const onRestart = () => { setIdx(0); setOpen(true); };
    window.addEventListener("lgny-tour-restart", onRestart);
    return () => window.removeEventListener("lgny-tour-restart", onRestart);
  }, []);

  const step = STEPS[idx];
  const el = open && typeof document !== "undefined" ? document.querySelector(step.selector) : null;

  // Skip any target that isn't currently rendered.
  useEffect(() => {
    if (open && !el) {
      const t = setTimeout(() => {
        if (idx < STEPS.length - 1) setIdx(idx + 1);
        else { try { localStorage.setItem("lgny_tour_done", "1"); } catch (e) {} setOpen(false); }
      }, 50);
      return () => clearTimeout(t);
    }
  }, [open, el, idx]);

  useLayoutEffect(() => {
    if (!open || !el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox(r);
      const spaceBelow = window.innerHeight - r.bottom;
      const placement = spaceBelow < POPUP_H + 24 && r.top > POPUP_H + 24 ? "above" : "below";
      let left = r.left + r.width / 2 - POPUP_W / 2;
      left = Math.max(12, Math.min(left, window.innerWidth - POPUP_W - 12));
      const top = placement === "below" ? r.bottom + 12 : Math.max(12, r.top - POPUP_H - 12);
      setPos({ top, left, placement });
    };
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => { window.removeEventListener("scroll", measure, true); window.removeEventListener("resize", measure); };
  }, [open, idx, el]);

  if (!open || !el || !box) return null;

  const close = () => { try { localStorage.setItem("lgny_tour_done", "1"); } catch (e) {} setOpen(false); };
  const next = () => { if (idx < STEPS.length - 1) setIdx(idx + 1); else close(); };
  const prev = () => { if (idx > 0) setIdx(idx - 1); };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={close} />
      <div
        className="pointer-events-none fixed z-40 rounded-xl ring-4 ring-lime-400"
        style={{
          top: box.top - 4,
          left: box.left - 4,
          width: box.width + 8,
          height: box.height + 8,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
        }}
      />
      <div
        className="fixed z-50 w-[300px] rounded-xl bg-white p-4 shadow-2xl ring-1 ring-lime-400/40"
        style={{ top: pos.top, left: pos.left }}
      >
        {pos.placement === "below" && <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white" />}

        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-400 text-xs font-bold text-black">{idx + 1}</div>
            <h3 className="text-sm font-bold text-zinc-900">{step.title}</h3>
          </div>
          <button onClick={close} className="text-zinc-400 hover:text-zinc-900"><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-zinc-600">{step.body}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Step {idx + 1} of {STEPS.length}</span>
          <div className="flex items-center gap-1.5">
            {idx > 0 && (
              <button onClick={prev} className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}
            <button onClick={next} className="inline-flex items-center gap-1 rounded-md bg-lime-400 px-2.5 py-1 text-xs font-semibold text-black hover:bg-lime-300">
              {idx === STEPS.length - 1 ? (<><CheckCircle2 className="h-3.5 w-3.5" /> Done</>) : (<>Next <ChevronRight className="h-3.5 w-3.5" /></>)}
            </button>
          </div>
        </div>

        {pos.placement === "above" && <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white" />}
      </div>
    </>
  );
}