import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Package, CheckCircle, MessageSquare, Send, X, Loader2, Rocket } from "lucide-react";
import { getProductDetails } from "@/lib/productDetails";
import PurchaseDetailModal from "@/components/client/PurchaseDetailModal";
import PreviewBanner from "@/components/client/PreviewBanner";
import { usePreviewEmail } from "@/hooks/usePreviewEmail";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientUpdate } from "@/hooks/useClientUpdate";
import { getVisibleSteps } from "@/lib/clientSteps";
import { useClientTrack } from "@/hooks/useClientTrack";
import { useClientProject } from "@/hooks/useClientProject";
import { notifyStepComplete } from "@/lib/pipelineNotify";
import BrandedButton from "@/components/client/BrandedButton";
import ExpandableLineItems from "@/components/client/ExpandableLineItems";
import { useRevisionThreads } from "@/hooks/useRevisionThreads";
import RevisionThreadPanel from "@/components/client/RevisionThreadPanel";
import SystemActivities from "@/components/client/SystemActivities";
import VisionGeneratorPanel from "@/components/client/VisionGeneratorPanel";
import StartNewProjectButton from "@/components/client/StartNewProjectButton";

// The Business Generator — the top-level destination of the client portal.
// Shows the package, the full system capability overview, and the mandatory
// Vision + Strategy generation UI so users define their foundation before
// any building begins.
export default function BusinessGenerator() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePurchase, setActivePurchase] = useState(null);
  const { user } = useClientUser();
  const { productId } = useClientTrack(user);
  const visibleSteps = getVisibleSteps(productId, user);
  const { project } = useClientProject(user);
  const { update } = useClientUpdate();
  const [revising, setRevising] = useState(false);
  const [reviseComment, setReviseComment] = useState("");
  const [sendingRevise, setSendingRevise] = useState(false);
  const [reviseSent, setReviseSent] = useState(false);
  const [reviseError, setReviseError] = useState("");
  const navigate = useNavigate();
  const { effectiveEmail, isScoped, isPreviewing } = usePreviewEmail(user);
  const { threads, sendMessage } = useRevisionThreads(user);

  const visionApproved = !!project?.vision?.approved;
  const strategyApproved = !!project?.strategy?.approved;
  const bothApproved = visionApproved && strategyApproved;

  // Completes the Welcome step and advances to the build pipeline
  // (Business Name Studio). Only available after Vision + Strategy are
  // both approved — they are the mandatory foundation.
  const continueToBuild = () => {
    setActivePurchase(null);
    try { localStorage.setItem("coach:done:/business-generator", "1"); } catch {}
    notifyStepComplete("welcome", { clientEmail: user?.email || "" });
    const idx = visibleSteps.findIndex((s) => s.to === "/business-generator");
    const next = idx >= 0 && idx < visibleSteps.length - 1 ? visibleSteps[idx + 1] : null;
    navigate(next ? next.to : "/business-name-studio");
  };

  const requestRevision = async () => {
    if (!reviseComment.trim()) { setReviseError("Add a note for our team."); return; }
    setSendingRevise(true);
    setReviseError("");
    try {
      await base44.functions.invoke("submitRevisionRequest", {
        comment: reviseComment.trim(),
        purchaseId: purchases[0]?.id || "",
        clientEmail: user?.email || "",
      });
      setReviseSent(true);
      setReviseComment("");
      setRevising(false);
    } catch (e) {
      setReviseError("Couldn't send. Please try again.");
    } finally {
      setSendingRevise(false);
    }
  };

  const load = async () => {
    const query = { status: "paid" };
    if (isScoped) query.buyerEmail = effectiveEmail;
    let paid = await base44.entities.Base44Purchase.filter(query, "-paidAt", 20);
    if ((!paid || paid.length === 0) && (user?.plan === "elite" || user?.plan === "pro" || user?.plan === "demo")) {
      const planProduct = user.plan === "elite" ? "elite-monthly" : user.plan === "pro" ? "pro-monthly" : "demo";
      const planName = user.plan === "elite" ? "Elite Plan (Free Starter)" : user.plan === "pro" ? "Pro Plan (Free Starter)" : "Demo Mode";
      paid = [{
        id: `plan-${user.plan}`,
        productId: planProduct,
        productName: planName,
        buyerEmail: user?.email || "",
        amount: "0",
        currency: "USD",
        quantity: 1,
        paidAt: user?.created_date || new Date().toISOString(),
        status: "paid",
        _synthetic: true,
      }];
    }
    setPurchases(paid);
  };

  useEffect(() => {
    if (isPreviewing && !isScoped) { setLoading(false); return; }
    if (!effectiveEmail && !isPreviewing) { setLoading(false); return; }
    (async () => {
      try {
        await load();
      } catch (e) {}
      setLoading(false);
    })();
  }, [effectiveEmail, isScoped, isPreviewing]);

  useEffect(() => {
    document.title = "Business Generator · Lead Gen Near You";
  }, []);

  const fmtMoney = (p) => {
    if (!p?.amount) return "";
    const sym = p.currency === "USD" ? "$" : "";
    return `${sym}${p.amount}${p.currency ? ` ${p.currency}` : ""}`;
  };
  const fmtDate = (iso) => {
    if (!iso) return "";
    try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
    catch { return ""; }
  };

  return (
    <div className="space-y-5">
      {isPreviewing && <PreviewBanner />}

      {/* ── Current project header — auto-named for organization ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-zinc-950 p-4">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Current Project</div>
          <h2 className="truncate text-base font-semibold text-white">
            {project?.project_name || project?.business_name || "Untitled Project"}
          </h2>
          {project?.created_date && (
            <div className="mt-0.5 text-xs text-white/40">
              Started {fmtDate(project.created_date)}
            </div>
          )}
        </div>
        <StartNewProjectButton user={user} project={project} />
      </div>

      {/* ── Vision Generator — AI-assisted, discovery-driven vision builder ── */}
      <VisionGeneratorPanel />

      {/* System capabilities — orients the user on everything they can do */}
      <SystemActivities />

      {/* What you paid for — the source of truth the whole system keys off */}
      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <Package className="h-4 w-4" /> What You Paid For
        </div>
        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-white/50">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-lime-400" /> Loading your purchase…
          </div>
        ) : purchases.length === 0 ? null : (
          <div className="mt-3 space-y-4">
            {purchases.map((p, idx) => {
              const detail = getProductDetails(p.productId);
              const Icon = detail.icon;
              return (
                <div key={p.id} className="overflow-hidden rounded-lg border border-white/10 bg-zinc-950">
                  <div className="flex items-center gap-4 border-b border-white/10 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-lime-400/40 text-sm font-semibold text-lime-400">
                      {idx + 1}
                    </div>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${detail.accent}`}>
                      <Icon className="h-5 w-5 text-lime-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-white">{p.productName || p.productId}</h3>
                        <span className="rounded bg-lime-400/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lime-400">Active</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-white/50">{detail.tagline}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      {p.amount && <div className="text-lg font-bold text-lime-400">{fmtMoney(p)}</div>}
                      {p.quantity > 1 && <div className="text-xs text-white/40">Qty {p.quantity}</div>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-b border-white/10 bg-black/30 p-3 text-xs sm:grid-cols-4">
                    <Fact label="Status" value="Active" valueClass="text-lime-400" />
                    <Fact label="Paid on" value={fmtDate(p.paidAt) || "—"} />
                    <Fact label="Order" value={`#${String(idx + 1).padStart(3, "0")}`} />
                    <Fact label="Buyer" value={p.buyerEmail || "—"} />
                  </div>

                  <div className="p-4">
                    <p className="text-sm text-white/70">{detail.description}</p>
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      {detail.features.length > 0 && (
                        <ExpandableLineItems features={detail.features} productId={p.productId} />
                      )}
                      {detail.deliverables.length > 0 && (
                        <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                          <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400">
                            <span className="h-1 w-4 rounded-full bg-lime-400" /> Deliverables
                          </h4>
                          <ol className="mt-3 space-y-2">
                            {detail.deliverables.map((d, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-sm text-white/80">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-lime-400/30 bg-lime-400/10 text-[10px] font-bold text-lime-400">
                                  {i + 1}
                                </span>
                                <span className="pt-0.5">{d}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {purchases.length > 0 && (
          <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
            {reviseSent && threads.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
                  <CheckCircle className="h-4 w-4" /> Your revision request was sent. Chat with our team below.
                </div>
                <RevisionThreadPanel
                  thread={threads[0]}
                  onSend={(body) => sendMessage(threads[0].id, body)}
                />
                <button
                  type="button"
                  onClick={() => setRevising(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Request Another Revision
                </button>
              </div>
            ) : reviseSent ? (
              <div className="flex items-center gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
                <CheckCircle className="h-4 w-4" /> Your revision request was sent to our team — we'll be in touch shortly.
              </div>
            ) : revising ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-lime-400">What needs to change?</label>
                <textarea
                  value={reviseComment}
                  onChange={(e) => setReviseComment(e.target.value)}
                  rows={3}
                  placeholder="Tell our team what you'd like revised about your package…"
                  className="w-full resize-none rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
                />
                {reviseError && <p className="text-xs text-red-400">{reviseError}</p>}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={requestRevision}
                    disabled={sendingRevise}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
                  >
                    {sendingRevise ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</> : <><Send className="h-3.5 w-3.5" /> Send to admin</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRevising(false); setReviseError(""); setReviseComment(""); }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-white/30"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setRevising(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Request Revision
              </button>
            )}
          </div>
        )}
      </div>



      {/* ── Continue to Build — only after Vision + Strategy approved ── */}
      <div className="rounded-xl border border-white/10 bg-zinc-950 p-5">
        {bothApproved ? (
          <>
            <div className="flex items-center gap-2 text-sm text-lime-300">
              <CheckCircle className="h-4 w-4" /> Your foundation is set. You're ready to start building!
            </div>
            <div className="mt-4">
              <BrandedButton onClick={continueToBuild} icon={Rocket} trailingIcon={null} showLogo>
                Continue to Build
              </BrandedButton>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-white/50">
            <CheckCircle className="h-4 w-4 text-white/30" />
            Complete your Vision and Strategy above to unlock the build pipeline.
          </div>
        )}
      </div>

      <PurchaseDetailModal
        purchase={activePurchase}
        onClose={() => setActivePurchase(null)}
        onContinue={continueToBuild}
        continueLabel="Continue to Build"
      />
    </div>
  );
}

function Fact({ label, value, valueClass = "text-white" }) {
  return (
    <div className="min-w-0">
      <div className="text-white/40">{label}</div>
      <div className={`truncate font-medium ${valueClass}`}>{value}</div>
    </div>
  );
}