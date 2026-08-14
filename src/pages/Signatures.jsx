import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { FileSignature, Loader2, ShieldCheck, CheckCircle2, X, PenLine } from "lucide-react";
import SignaturePad from "@/components/client/SignaturePad";

// Client-facing Signatures page: lists contracts assigned to the logged-in
// user and lets them sign inline on mobile (touch) or desktop (mouse).
export default function Signatures() {
  const [user, setUser] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [sig, setSig] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => { document.title = "Signatures · Lead Gen Near You"; }, []);

  const load = async (email) => {
    const all = await base44.entities.EsignDocument.list("-created_date", 200);
    const mine = (all || []).filter((d) =>
      (d.signers || []).some((s) => s.email && s.email.toLowerCase() === (email || "").toLowerCase())
    );
    setDocs(mine);
  };

  useEffect(() => {
    if (!user?.email) return;
    load(user.email).finally(() => setLoading(false));
  }, [user?.email]);

  useEffect(() => {
    if (!user && !loading) setLoading(false);
  }, [user, loading]);

  const open = (doc) => { setActive(doc); setSig(null); setError(null); setDone(null); };
  const close = () => { setActive(null); setSig(null); setDone(null); setError(null); };

  const sign = async () => {
    if (!sig) { setError("Please draw your signature first."); return; }
    setBusy(true); setError(null);
    try {
      const r = await base44.functions.invoke("esignPortal", { action: "sign", token: active.share_token, signature: sig });
      if (r.data?.ok) {
        setDone(active.id);
        await load(user.email);
      } else setError(r.data?.error || "Signing failed");
    } catch (e) { setError("Signing failed"); }
    setBusy(false);
  };

  const fmtDate = (iso) => {
    if (!iso) return "";
    try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
    catch { return ""; }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-2 px-1 pb-4">
        <FileSignature className="h-5 w-5 text-lime-400" />
        <h1 className="text-lg font-semibold text-white">Signatures</h1>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-white/40">E-Sign</span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="h-5 w-5 animate-spin text-lime-400" /> Loading your contracts…
        </div>
      ) : docs.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-8 text-center">
          <FileSignature className="mx-auto mb-3 h-10 w-10 text-white/30" />
          <h2 className="text-sm font-semibold text-white">No contracts to sign</h2>
          <p className="mt-1 text-xs text-white/50">When a contract is sent to you, it'll appear here for signing on any device.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((d) => {
            const signer = (d.signers || []).find((s) => s.email?.toLowerCase() === user?.email?.toLowerCase()) || {};
            const signed = !!signer.signed || d.status === "signed";
            return (
              <div key={d.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-950 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${signed ? "bg-lime-400/10" : "bg-white/5"}`}>
                  {signed ? <CheckCircle2 className="h-5 w-5 text-lime-400" /> : <PenLine className="h-5 w-5 text-white/60" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-white">{d.title}</h3>
                  <p className="truncate text-xs text-white/50">
                    {d.account_name || ""}{d.deal_name ? ` · ${d.deal_name}` : ""}
                    {signer.signed_at ? ` · signed ${fmtDate(signer.signed_at)}` : ""}
                  </p>
                </div>
                {signed ? (
                  <span className="rounded-md border border-lime-400/40 bg-lime-400/10 px-2.5 py-1 text-xs font-semibold text-lime-300">Signed</span>
                ) : (
                  <button onClick={() => open(d)} className="rounded-md bg-lime-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-lime-300">
                    Review & Sign
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Signing modal */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-zinc-900 sm:rounded-2xl">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <FileSignature className="h-4 w-4 text-lime-400" />
              <h2 className="truncate text-sm font-semibold text-white">{active.title}</h2>
              <button onClick={close} className="ml-auto text-white/50 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {done === active.id ? (
                <div className="py-10 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-lime-400" />
                  <h3 className="text-base font-semibold text-white">Document signed</h3>
                  <p className="mt-1 text-xs text-white/50">Your signature has been recorded. A signed copy is stored securely.</p>
                </div>
              ) : (
                <>
                  <div className="prose prose-invert mb-4 max-w-none text-sm leading-relaxed text-white/80" dangerouslySetInnerHTML={{ __html: active.body || "<p class='text-white/40'>No content yet.</p>" }} />
                  <div className="rounded-xl border border-white/10 bg-zinc-950 p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-lime-400">Sign here</div>
                    <SignaturePad onChange={setSig} />
                    <p className="mt-2 text-xs text-white/40">By signing, you agree to the terms above. Your signature is legally binding.</p>
                  </div>
                  {error && <div className="mt-3 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-300">{error}</div>}
                </>
              )}
            </div>

            {done !== active.id && (
              <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
                <button onClick={close} className="rounded-md border border-white/15 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/5">Cancel</button>
                <button onClick={sign} disabled={busy || !sig} className="inline-flex items-center gap-1.5 rounded-md bg-lime-400 px-3 py-2 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-50">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Sign & Submit
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}