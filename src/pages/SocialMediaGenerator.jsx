import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Share2, Loader2, Check, RefreshCw, ArrowRight, AlertCircle, Eye, X, Send, MessageSquare, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { logReceipt } from "@/lib/pipelineUtils";
import BackButton from "@/components/client/BackButton";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientUpdate } from "@/hooks/useClientUpdate";
import { notifyStepComplete } from "@/lib/pipelineNotify";

// Step: Social Media Generator. Generates 10 on-brand social media template
// images (profile, cover, story, posts, favicon, icons, highlights) using the
// client's approved logo, plus a 30-day content calendar with captions and
// optimal posting times. All included — client approves the whole pack.
export default function SocialMediaGenerator() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [data, setData] = useState(null); // { templates, posts, scheduleSummary }
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [revising, setRevising] = useState(false);
  const [reviseComment, setReviseComment] = useState("");
  const [sendingRevise, setSendingRevise] = useState(false);
  const [reviseSent, setReviseSent] = useState(false);
  const [reviseError, setReviseError] = useState("");

  const { user } = useClientUser();
  const { update } = useClientUpdate();

  useEffect(() => { document.title = "Social Media · Lead Gen Near You"; }, []);

  useEffect(() => {
    if (!user) return;
    setProfile(user?.epoxyProfile || null);
    setLogoUrl(user?.chosenLogoUrl || "");
    if (user?.socialMediaPack) setData(user.socialMediaPack);
    if (user?.socialMediaChosen) setSaved(true);
  }, [user]);

  const generate = async () => {
    if (!profile?.businessName) { setGenError("Complete your Business Profile first."); return; }
    setGenerating(true); setGenError("");
    try {
      const res = await base44.functions.invoke("generateSocialMediaPack", {
        businessName: profile.businessName, primaryLocation: profile.primaryLocation,
        services: profile.services || [], logoUrl,
        industry: profile.industry || "", subIndustry: profile.subIndustry || "",
        businessType: profile.businessType || "",
      });
      const d = res?.data?.data;
      if (!d?.templates?.length) throw new Error("no data");
      setData(d);
      try { await update({ socialMediaPack: d }); } catch {}
    } catch (e) { setGenError("Couldn't generate social media pack. Try again."); }
    finally { setGenerating(false); }
  };

  useEffect(() => {
    if (profile && !data && !generating && !genError) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const save = async () => {
    setSaving(true); setError("");
    try {
      await update({ socialMediaChosen: true });
      try { await logReceipt({ action: "Social media pack approved", entityType: "User", entityId: "self", status: "success", notes: `${data?.templates?.length || 0} templates + ${data?.posts?.length || 0} posts` }); } catch {}
      await notifyStepComplete("social", { businessName: profile?.businessName || "" });
      setSaved(true);
      try { localStorage.setItem("coach:done:/social-media", "1"); } catch {}
      setTimeout(() => navigate("/video-generator"), 800);
    } catch (e) { setError("Couldn't save. Please try again."); }
    finally { setSaving(false); }
  };

  const requestRevision = async () => {
    if (!reviseComment.trim()) { setReviseError("Add a note."); return; }
    setSendingRevise(true); setReviseError("");
    try {
      await base44.functions.invoke("submitRevisionRequest", { comment: reviseComment.trim(), pipelineStep: "social", clientEmail: profile?.email || "" });
      setReviseSent(true); setReviseComment(""); setRevising(false);
    } catch (e) { setReviseError("Couldn't send."); }
    finally { setSendingRevise(false); }
  };

  const templates = data?.templates || [];
  const posts = data?.posts || [];

  return (
    <div className="mx-auto max-w-5xl">
      <BackButton to="/design-direction" />
      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <Share2 className="h-4 w-4" /> Social Media Generator
        </div>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Your social media brand kit + 30-day content</h1>
        <p className="mt-1 text-sm text-white/60">
          We designed {templates.length || 10} on-brand social templates with your logo — profile, cover, stories, posts, favicon, icons —
          plus a full 30-day content calendar with captions and best posting times. All included in your package.
        </p>

        {saved && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
            <Check className="h-4 w-4" /> Social media approved — generating your videos…
          </div>
        )}

        {generating && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-zinc-950 py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
            <p className="mt-3 text-sm text-white/60">Designing your social media kit &amp; 30-day calendar…</p>
            <p className="text-xs text-white/40">About 60 seconds.</p>
          </div>
        )}

        {genError && !generating && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm text-red-300">
            <AlertCircle className="h-4 w-4" /> {genError}
            <button onClick={generate} className="ml-auto rounded-md border border-red-400/40 px-2 py-1 text-xs hover:bg-red-400/10">Retry</button>
          </div>
        )}

        {templates.length > 0 && !generating && (
          <>
            <h2 className="mt-5 text-xs font-semibold uppercase tracking-wider text-lime-400">Brand Templates</h2>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {templates.map((t) => (
                <div key={t.id} className="group relative overflow-hidden rounded-xl border-2 border-lime-400/40 bg-zinc-950">
                  <button type="button" onClick={() => setPreview(t)} className="block w-full text-left">
                    <div className="relative aspect-square w-full overflow-hidden bg-white">
                      <Image src={t.url} alt={t.label} fittingType="fit" className="h-full w-full" />
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-lime-400/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-black">Included</span>
                      <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white/80"><Eye className="h-3.5 w-3.5" /></span>
                    </div>
                  </button>
                  <div className="p-2.5 text-xs font-semibold text-white">{t.label}</div>
                </div>
              ))}
            </div>

            {posts.length > 0 && (
              <>
                <div className="mt-6 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-lime-400" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-lime-400">30-Day Content Calendar</h2>
                </div>
                <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto rounded-xl border border-white/10 bg-zinc-950 p-3">
                  {posts.map((p, i) => (
                    <div key={i} className="flex gap-3 rounded-lg border border-white/5 bg-white/5 p-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime-400/15 text-xs font-bold text-lime-400">{p.day}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-lime-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-lime-400">{p.platform}</span>
                          <span className="text-[10px] text-white/40">{p.type}</span>
                          {p.bestTime && <span className="text-[10px] text-white/40">· {p.bestTime}</span>}
                        </div>
                        <p className="mt-0.5 text-xs text-white/70">{p.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <button type="button" onClick={generate} disabled={generating} className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300">
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate pack
            </button>
          </>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {templates.length > 0 && (
          <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
            {reviseSent ? (
              <div className="flex items-center gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
                <Check className="h-4 w-4" /> Revision sent — we'll be in touch.
              </div>
            ) : revising ? (
              <div className="space-y-2">
                <textarea value={reviseComment} onChange={(e) => setReviseComment(e.target.value)} rows={3} placeholder="What don't you like about the social media pack?" className="w-full resize-none rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none" />
                {reviseError && <p className="text-xs text-red-400">{reviseError}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={requestRevision} disabled={sendingRevise} className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-50">
                    {sendingRevise ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</> : <><Send className="h-3.5 w-3.5" /> Send</>}
                  </button>
                  <button type="button" onClick={() => setRevising(false)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 hover:border-white/30"><X className="h-3.5 w-3.5" /> Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <button type="button" onClick={() => setRevising(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300">
                  <MessageSquare className="h-3.5 w-3.5" /> Request Revision
                </button>
                <button type="button" onClick={save} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : saved ? <><Check className="h-4 w-4" /> Update</> : <>Approve Social Media Pack <ArrowRight className="h-4 w-4" /></>}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="max-h-[90vh] overflow-hidden rounded-xl border border-white/10 bg-zinc-950 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">{preview.label}</h2>
              <button onClick={() => setPreview(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/5"><X className="h-5 w-5" /></button>
            </div>
            <Image src={preview.url} alt={preview.label} fittingType="fit" className="mt-3 max-h-[70vh] w-auto" />
          </div>
        </div>
      )}
    </div>
  );
}