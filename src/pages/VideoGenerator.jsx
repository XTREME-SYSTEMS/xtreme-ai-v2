import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Video, Loader2, Check, RefreshCw, ArrowRight, AlertCircle, X, Send, MessageSquare, Play, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { logReceipt } from "@/lib/pipelineUtils";
import BackButton from "@/components/client/BackButton";
import { notifyStepComplete } from "@/lib/pipelineNotify";

// Step: Video Generator. Generates 10 video concept cards (thumbnail +
// description + production script) using the client's onboarding, content
// tone, logo, and brand. The client can generate the actual short video for
// any concept on demand (controls cost). All concepts are auto-included.
export default function VideoGenerator() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [contentTone, setContentTone] = useState("");
  const [data, setData] = useState(null); // { concepts: [{id,title,description,thumbnailUrl,script,videoPrompt}] }
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [revising, setRevising] = useState(false);
  const [reviseComment, setReviseComment] = useState("");
  const [sendingRevise, setSendingRevise] = useState(false);
  const [reviseSent, setReviseSent] = useState(false);
  const [reviseError, setReviseError] = useState("");
  const [generatingVideoId, setGeneratingVideoId] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => { document.title = "Video Generator · Lead Gen Near You"; }, []);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setProfile(u?.epoxyProfile || null);
      setLogoUrl(u?.chosenLogoUrl || "");
      setContentTone(u?.chosenContentTone || "");
      if (u?.videoPack) setData(u.videoPack);
      if (u?.videoChosen) setSaved(true);
    }).catch(() => {});
  }, []);

  const generate = async () => {
    if (!profile?.businessName) { setGenError("Complete your Business Profile first."); return; }
    setGenerating(true); setGenError("");
    try {
      const res = await base44.functions.invoke("generateVideoPack", {
        businessName: profile.businessName, primaryLocation: profile.primaryLocation,
        services: profile.services || [], contentTone, logoUrl,
      });
      const d = res?.data?.data;
      if (!d?.concepts?.length) throw new Error("no data");
      setData(d);
      try { await base44.auth.updateMe({ videoPack: d }); } catch {}
    } catch (e) { setGenError("Couldn't generate video concepts. Try again."); }
    finally { setGenerating(false); }
  };

  useEffect(() => {
    if (profile && !data && !generating && !genError) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Generate the actual short video for a single concept (on demand).
  const generateVideo = async (concept) => {
    if (generatingVideoId) return;
    setGeneratingVideoId(concept.id);
    try {
      const res = await base44.integrations.Core.GenerateVideo({
        prompt: concept.videoPrompt || `A short promotional video for ${profile?.businessName || "an epoxy contractor"}. ${concept.description}`,
        duration: 6, aspect_ratio: "16:9", generate_audio: false,
      });
      if (res?.url) {
        const next = { ...data, concepts: data.concepts.map((c) => c.id === concept.id ? { ...c, videoUrl: res.url } : c) };
        setData(next);
        try { await base44.auth.updateMe({ videoPack: next }); } catch {}
      }
    } catch (e) { /* best effort */ }
    finally { setGeneratingVideoId(""); }
  };

  const save = async () => {
    setSaving(true); setError("");
    try {
      await base44.auth.updateMe({ videoChosen: true });
      try { await logReceipt({ action: "Video pack approved", entityType: "User", entityId: "self", status: "success", notes: `${data?.concepts?.length || 0} concepts` }); } catch {}
      await notifyStepComplete("video", { businessName: profile?.businessName || "" });
      setSaved(true);
      try { localStorage.setItem("coach:done:/video-generator", "1"); } catch {}
      setTimeout(() => navigate("/your-designs"), 800);
    } catch (e) { setError("Couldn't save."); }
    finally { setSaving(false); }
  };

  const requestRevision = async () => {
    if (!reviseComment.trim()) { setReviseError("Add a note."); return; }
    setSendingRevise(true); setReviseError("");
    try {
      await base44.functions.invoke("submitRevisionRequest", { comment: reviseComment.trim(), pipelineStep: "video", clientEmail: profile?.email || "" });
      setReviseSent(true); setReviseComment(""); setRevising(false);
    } catch (e) { setReviseError("Couldn't send."); }
    finally { setSendingRevise(false); }
  };

  const concepts = data?.concepts || [];

  return (
    <div className="mx-auto max-w-5xl">
      <BackButton to="/social-media" />
      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <Video className="h-4 w-4" /> Video Generator
        </div>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">10 video concepts for your brand</h1>
        <p className="mt-1 text-sm text-white/60">
          We created 10 video concepts using your onboarding, content tone, logo, and brand. Preview each concept, then generate the
          actual video for any you like. All concepts are included — use them on your website, social media, or YouTube.
        </p>

        {saved && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
            <Check className="h-4 w-4" /> Videos approved — taking you to your designs…
          </div>
        )}

        {generating && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-zinc-950 py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
            <p className="mt-3 text-sm text-white/60">Creating 10 video concepts…</p>
            <p className="text-xs text-white/40">About 60 seconds.</p>
          </div>
        )}

        {genError && !generating && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm text-red-300">
            <AlertCircle className="h-4 w-4" /> {genError}
            <button onClick={generate} className="ml-auto rounded-md border border-red-400/40 px-2 py-1 text-xs hover:bg-red-400/10">Retry</button>
          </div>
        )}

        {concepts.length > 0 && !generating && (
          <>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {concepts.map((c) => {
                const busy = generatingVideoId === c.id;
                return (
                  <div key={c.id} className="overflow-hidden rounded-xl border-2 border-lime-400/40 bg-zinc-950">
                    <button type="button" onClick={() => setPreview(c)} className="block w-full text-left">
                      <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                        {c.videoUrl ? (
                          <video src={c.videoUrl} className="h-full w-full object-cover" muted loop autoPlay />
                        ) : (
                          <Image src={c.thumbnailUrl} alt={c.title} fittingType="fill" className="h-full w-full" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="h-8 w-8 text-white/80" />
                        </div>
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-lime-400/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-black">Included</span>
                        {busy && <div className="absolute inset-0 flex items-center justify-center bg-black/70"><Loader2 className="h-6 w-6 animate-spin text-lime-400" /></div>}
                      </div>
                    </button>
                    <div className="p-2.5">
                      <div className="truncate text-xs font-semibold text-white">{c.title}</div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-white/50">{c.description}</p>
                      <button
                        type="button"
                        onClick={() => generateVideo(c)}
                        disabled={!!generatingVideoId || !!c.videoUrl}
                        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-white/15 px-2 py-1.5 text-[10px] font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300 disabled:opacity-50"
                      >
                        {busy ? <><Loader2 className="h-3 w-3 animate-spin" /> Generating…</> : c.videoUrl ? <><Check className="h-3 w-3" /> Video ready</> : <><Film className="h-3 w-3" /> Generate video</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button type="button" onClick={generate} disabled={generating} className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300">
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate concepts
            </button>
          </>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {concepts.length > 0 && (
          <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
            {reviseSent ? (
              <div className="flex items-center gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
                <Check className="h-4 w-4" /> Revision sent — we'll be in touch.
              </div>
            ) : revising ? (
              <div className="space-y-2">
                <textarea value={reviseComment} onChange={(e) => setReviseComment(e.target.value)} rows={3} placeholder="What don't you like about the videos?" className="w-full resize-none rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none" />
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
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : saved ? <><Check className="h-4 w-4" /> Update</> : <>Approve Videos <ArrowRight className="h-4 w-4" /></>}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-zinc-950 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">{preview.title}</h2>
              <button onClick={() => setPreview(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/5"><X className="h-5 w-5" /></button>
            </div>
            {preview.videoUrl ? (
              <video src={preview.videoUrl} className="mt-3 w-full rounded-lg" controls />
            ) : (
              <Image src={preview.thumbnailUrl} alt={preview.title} fittingType="fill" className="mt-3 aspect-video w-full rounded-lg" />
            )}
            <p className="mt-3 text-sm text-white/70">{preview.description}</p>
            {preview.script && (
              <div className="mt-3 rounded-lg border border-white/10 bg-zinc-900 p-3">
                <div className="text-xs font-semibold text-lime-400">Production Script</div>
                <p className="mt-1 text-xs text-white/60">{preview.script}</p>
              </div>
            )}
            {!preview.videoUrl && (
              <button type="button" onClick={() => { generateVideo(preview); setPreview(null); }} disabled={!!generatingVideoId} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50">
                <Film className="h-4 w-4" /> Generate this video
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}