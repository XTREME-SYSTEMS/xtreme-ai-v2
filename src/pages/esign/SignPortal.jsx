import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Panel, LoadingButton } from "@/components/ui";
import { FileSignature, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";

export default function SignPortal() {
  const { token } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  let drawing = false;

  useEffect(() => {
    base44.functions.invoke("esignPortal", { action: "get", token }).then((r) => {
      if (r.data?.doc) setDoc(r.data.doc);
      else setError(r.data?.error || "Document not found");
    }).catch(() => setError("Unable to load document")).finally(() => setLoading(false));
  }, [token]);

  const pos = (e) => {
    const c = canvasRef.current;
    const rect = c.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  };
  const start = (e) => { drawing = true; const ctx = canvasRef.current.getContext("2d"); const { x, y } = pos(e); ctx.beginPath(); ctx.moveTo(x, y); };
  const draw = (e) => { if (!drawing) return; e.preventDefault(); const ctx = canvasRef.current.getContext("2d"); const { x, y } = pos(e); ctx.lineTo(x, y); ctx.strokeStyle = "#D4FF4D"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.stroke(); };
  const stop = () => { drawing = false; };
  const clear = () => { const c = canvasRef.current; c.getContext("2d").clearRect(0, 0, c.width, c.height); };

  const sign = async () => {
    setBusy(true);
    try {
      const signature = canvasRef.current.toDataURL("image/png");
      const r = await base44.functions.invoke("esignPortal", { action: "sign", token, signature });
      if (r.data?.ok) setDone(true);
      else setError(r.data?.error || "Signing failed");
    } catch (e) { setError("Signing failed"); }
    setBusy(false);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-black text-white"><Loader2 className="h-6 w-6 animate-spin text-lime-400" /></div>;

  if (done) return (
    <div className="flex min-h-screen items-center justify-center bg-black p-6">
      <div className="max-w-md text-center">
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-lime-400" />
        <h1 className="text-xl font-semibold text-white">Document signed</h1>
        <p className="mt-2 text-sm text-white/60">Your signature has been recorded. A signed copy is stored securely.</p>
      </div>
    </div>
  );

  if (error || !doc) return (
    <div className="flex min-h-screen items-center justify-center bg-black p-6">
      <div className="max-w-md text-center">
        <FileSignature className="mx-auto mb-4 h-14 w-14 text-white/30" />
        <h1 className="text-xl font-semibold text-white">{error || "Document not found"}</h1>
        <p className="mt-2 text-sm text-white/60">This signing link may be invalid or expired.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/10"><FileSignature className="h-5 w-5 text-lime-400" /></div>
          <div>
            <h1 className="text-lg font-semibold">{doc.title}</h1>
            <p className="text-xs text-white/50">{doc.account_name || ""} {doc.deal_name ? `· ${doc.deal_name}` : ""}</p>
          </div>
          <span className="ml-auto rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-1 text-xs font-semibold text-lime-300">{doc.status}</span>
        </div>

        <Panel title="Document">
          <div className="prose prose-invert max-w-none text-sm leading-relaxed text-white/80" dangerouslySetInnerHTML={{ __html: doc.body || "<p class='text-white/40'>No content yet. Contact the sender.</p>" }} />
        </Panel>

        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-white">Sign here</h2>
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-3">
            <canvas
              ref={canvasRef}
              width={720}
              height={180}
              className="w-full touch-none rounded-lg border border-white/10 bg-white"
              onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
              onTouchStart={start} onTouchMove={draw} onTouchEnd={stop}
            />
            <div className="mt-3 flex items-center justify-between">
              <button onClick={clear} className="text-xs text-white/50 hover:text-white">Clear</button>
              <LoadingButton loading={busy} onClick={sign}><ShieldCheck className="h-4 w-4" /> Sign & Submit</LoadingButton>
            </div>
          </div>
          <p className="mt-2 text-xs text-white/40">By signing, you agree to the terms above. Your signature is legally binding.</p>
        </div>
      </div>
    </div>
  );
}