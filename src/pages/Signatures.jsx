import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { FileSignature, Loader2, ShieldCheck, CheckCircle2, X, PenLine, Clock, ArrowRight, RotateCcw, Calendar } from "lucide-react";
import SignaturePad from "@/components/client/SignaturePad";
import PreviewBanner from "@/components/client/PreviewBanner";
import BackButton from "@/components/client/BackButton";
import { usePreviewEmail } from "@/hooks/usePreviewEmail";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientUpdate } from "@/hooks/useClientUpdate";
import { logReceipt } from "@/lib/pipelineUtils";
import { notifyStepComplete } from "@/lib/pipelineNotify";
import { cn } from "@/lib/utils";

const REVISION_LINKS = [
  { to: "/business-profile", label: "Business Profile" },
  { to: "/content-generator", label: "Content" },
  { to: "/logo-generator", label: "Logo" },
  { to: "/brand-generator", label: "Brand" },
  { to: "/design-direction", label: "Website" },
  { to: "/social-media", label: "Social" },
  { to: "/video-generator", label: "Video" },
  { to: "/your-designs", label: "Your Designs" },
];

// Client-facing Signatures page: lists contracts assigned to the logged-in
// user and lets them sign inline on mobile (touch) or desktop (mouse).
export default function Signatures() {
  const navigate = useNavigate();
  const { user } = useClientUser();
  const { update } = useClientUpdate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [sig, setSig] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);
  const [kickoffDate, setKickoffDate] = useState("");
  const [savingKickoff, setSavingKickoff] = useState(false);
  const [kickoffSaved, setKickoffSaved] = useState(false);
  const { effectiveEmail, isPreviewing } = usePreviewEmail(user);

  useEffect(() => { document.title = "Signatures · Lead Gen Near You"; }, []);

  const load = async (email) => {
    const all = await base44.entities.EsignDocument.list("-created_date", 200);
    const mine = (all || []).filter((d) =>
      // G6 — Only show docs that have been sent (not "draft" — those need admin review)
      d.status !== "draft" &&
      (d.signers || []).some((s) => s.email && s.email.toLowerCase() === (email || "").toLowerCase())
    );
    setDocs(mine);
    return mine;
  };

  // D7 — Auto-generate contract when client reaches signatures step with no docs
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [autoGenAttempted, setAutoGenAttempted] = useState(false);
  useEffect(() => {
    if (!effectiveEmail || loading || autoGenerating || autoGenAttempted) return;
    if (docs.length === 0 && !isPreviewing) {
      setAutoGenerating(true);
      setAutoGenAttempted(true);
      (async () => {
        try {
          await base44.functions.invoke("autoGenerateClientContract", {});
          await load(effectiveEmail);
        } catch (e) {
          // best effort
        } finally {
          setAutoGenerating(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveEmail, docs.length, loading, isPreviewing, autoGenAttempted]);

  useEffect(() => {
    if (!effectiveEmail) return;
    load(effectiveEmail).finally(() => setLoading(false));
  }, [effectiveEmail]);

  useEffect(() => {
    if (!user && !loading) setLoading(false);
  }, [user, loading]);

  // Lock body scroll while the signing sheet is open.
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [active]);

  const open = (doc) => { setActive(doc); setSig(null); setError(null); setDone(null); };
  const close = () => { setActive(null); setSig(null); setDone(null); setError(null); };

  const sign = async () => {
    if (!sig) { setError("Please draw your signature first."); return; }
    setBusy(true); setError(null);
    try {
      const r = await base44.functions.invoke("esignPortal", { action: "sign", token: active.share_token, signature: sig, email: user?.email });
      if (r.data?.ok) {
        setDone(active.id);
        await logReceipt({
          action: "Document signed",
          entityType: "EsignDocument",
          entityId: active.id,
          status: "success",
          notes: `Signed: ${active.title}`,
        });
        await load(user.email);
        await notifyStepComplete("signatures", { clientEmail: user?.email || "" });
      } else setError(r.data?.error || "Signing failed");
    } catch (e) { setError("Signing failed"); }
    setBusy(false);
  };

  const saveKickoff = async () => {
    if (!kickoffDate) return;
    setSavingKickoff(true);
    try {
      await update({ kickoffCallDate: kickoffDate });
      try {
        await logReceipt({ action: "Kickoff call scheduled", entityType: "User", entityId: "self", status: "success", notes: `Preferred date: ${kickoffDate}` });
      } catch {}
      setKickoffSaved(true);
    } catch (e) {
      setError("Couldn't save. Please try again.");
    } finally {
      setSavingKickoff(false);
    }
  };

  const fmtDate = (iso) => {
    if (!iso) return "";
    try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
    catch { return ""; }
  };

  const pending = docs.filter((d) => {
    const signer = (d.signers || []).find((s) => s.email?.toLowerCase() === effectiveEmail?.toLowerCase()) || {};
    return !signer.signed && d.status !== "signed";
  });
  const completed = docs.filter((d) => {
    const signer = (d.signers || []).find((s) => s.email?.toLowerCase() === effectiveEmail?.toLowerCase()) || {};
    return signer.signed || d.status === "signed";
  });

  const DocCard = ({ d }) => {
    const signer = (d.signers || []).find((s) => s.email?.toLowerCase() === effectiveEmail?.toLowerCase()) || {};
    const signed = !!signer.signed || d.status === "signed";
    return (
      <div className={cn(
        "flex items-center gap-3 rounded-xl border p-4 transition-colors",
        signed ? "border-white/10 bg-zinc-950" : "border-lime-400/30 bg-zinc-950 hover:border-lime-400/60"
      )}>
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          signed ? "bg-lime-400/10" : "bg-lime-400/10"
        )}>
          {signed ? <CheckCircle2 className="h-5 w-5 text-lime-400" /> : <PenLine className="h-5 w-5 text-lime-400" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-white">{d.title}</h3>
          <p className="truncate text-xs text-white/50">
            {d.account_name || ""}{d.deal_name ? ` · ${d.deal_name}` : ""}
            {signer.signed_at ? ` · signed ${fmtDate(signer.signed_at)}` : ""}
          </p>
        </div>
        {signed ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-lime-400/40 bg-lime-400/10 px-2.5 py-1.5 text-xs font-semibold text-lime-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> Signed
          </span>
        ) : (
          <button onClick={() => open(d)} className="rounded-md bg-lime-400 px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-lime-300">
            Review &amp; Sign
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-3xl px-1 pb-10">
      {/* Header */}
      {isPreviewing && <PreviewBanner />}
      <BackButton to="/enhancements" />
      <div className="flex items-start gap-3 pb-6 pt-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-lime-400/30 bg-lime-400/10">
          <FileSignature className="h-5 w-5 text-lime-400" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-white">Signatures</h1>
          <p className="mt-0.5 text-sm text-white/50">Review and sign your contracts on any device.</p>
        </div>
        <span className="ml-auto hidden rounded-md border border-white/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 sm:inline">E-Sign</span>
      </div>

      {/* Revision navigation — go back to any step to fix something */}
      <div className="mb-6 rounded-xl border border-white/10 bg-zinc-950 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
          <RotateCcw className="h-3.5 w-3.5" /> Need to change something?
        </div>
        <p className="mt-1 text-xs text-white/40">Go back to any step to revise your choices. Revising a step will also reset any steps that depend on it.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {REVISION_LINKS.map((l) => (
            <button key={l.to} onClick={() => navigate(l.to)} className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2.5 py-1.5 text-xs font-medium text-white/60 hover:border-lime-400/50 hover:text-lime-300">
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="h-5 w-5 animate-spin text-lime-400" /> Loading your contracts…
        </div>
      ) : docs.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-10 text-center">
          <FileSignature className="mx-auto mb-3 h-10 w-10 text-white/30" />
          {autoGenAttempted ? (
            <>
              <h2 className="text-sm font-semibold text-white">Your contract is being prepared</h2>
              <p className="mx-auto mt-1 max-w-xs text-xs text-white/50">Our team is reviewing your service agreement. You'll receive an email when it's ready to sign.</p>
            </>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-white">No contracts to sign</h2>
              <p className="mx-auto mt-1 max-w-xs text-xs text-white/50">When a contract is sent to you, it'll appear here for signing on any device.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-7">
          {/* Action needed */}
          {pending.length > 0 && (
            <section>
              <div className="mb-2.5 flex items-center gap-2 px-1">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-400">Action needed</h2>
                <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">{pending.length}</span>
              </div>
              <div className="space-y-3">{pending.map((d) => <DocCard key={d.id} d={d} />)}</div>
            </section>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <section>
              <div className="mb-2.5 flex items-center gap-2 px-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-lime-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-lime-400">Completed</h2>
                <span className="rounded-full bg-lime-400/15 px-1.5 py-0.5 text-[10px] font-bold text-lime-300">{completed.length}</span>
              </div>
              <div className="space-y-3">{completed.map((d) => <DocCard key={d.id} d={d} />)}</div>
            </section>
          )}
        </div>
      )}

      {/* Scheduling + continue — shown when all docs are signed */}
      {pending.length === 0 && docs.length > 0 && (
        <div className="mt-7 space-y-4">
          <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
              <Calendar className="h-4 w-4" /> Schedule Your Kickoff Call
            </div>
            <p className="mt-1 text-sm text-white/60">
              Pick a preferred date for your kickoff call with our team. We'll confirm the time via email.
            </p>
            {kickoffSaved ? (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
                <CheckCircle2 className="h-4 w-4" /> Saved — our team will reach out to confirm.
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={kickoffDate}
                  onChange={(e) => setKickoffDate(e.target.value)}
                  className="rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-lime-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={saveKickoff}
                  disabled={!kickoffDate || savingKickoff}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
                >
                  {savingKickoff ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />}
                  {savingKickoff ? "Saving…" : "Save preference"}
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate("/approvals")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-lime-300"
          >
            Continue to Design Approval <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Signing sheet */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 sm:items-center sm:p-4">
          <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-zinc-900 shadow-2xl sm:rounded-2xl">
            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-2 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime-400/10">
                <FileSignature className="h-4 w-4 text-lime-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-semibold text-white">{active.title}</h2>
                <p className="truncate text-[11px] text-white/40">{active.account_name || ""}{active.deal_name ? ` · ${active.deal_name}` : ""}</p>
              </div>
              <button onClick={close} className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {done === active.id ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-lime-400/10">
                    <CheckCircle2 className="h-9 w-9 text-lime-400" />
                  </div>
                  <h3 className="text-base font-semibold text-white">Document signed</h3>
                  <p className="mx-auto mt-1.5 max-w-xs text-xs text-white/50">Your signature has been recorded. A signed copy is stored securely.</p>
                  <button onClick={close} className="mt-6 rounded-md bg-lime-400 px-4 py-2 text-xs font-semibold text-black hover:bg-lime-300">
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="prose prose-invert mb-5 max-w-none text-sm leading-relaxed text-white/80" dangerouslySetInnerHTML={{ __html: active.body || "<p class='text-white/40'>No content yet.</p>" }} />
                  <div className="rounded-xl border border-white/10 bg-zinc-950 p-3 sm:p-4">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400">
                      <PenLine className="h-3.5 w-3.5" /> Sign here
                    </div>
                    <SignaturePad onChange={setSig} />
                    <p className="mt-3 text-xs text-white/40">By signing, you agree to the terms above. Your signature is legally binding.</p>
                  </div>
                  {error && (
                    <div className="mt-3 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-300">{error}</div>
                  )}
                </>
              )}
            </div>

            {/* Sticky footer */}
            {done !== active.id && (
              <div className="flex items-center justify-end gap-2 border-t border-white/10 bg-zinc-900 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                <button onClick={close} className="rounded-md border border-white/15 px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/5">
                  Cancel
                </button>
                <button
                  onClick={sign}
                  disabled={busy || !sig}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-lime-400 px-4 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50 sm:flex-none"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  {busy ? "Submitting…" : "Sign & Submit"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}