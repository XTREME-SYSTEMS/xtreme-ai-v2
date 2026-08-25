import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Video, Loader2, Check, RefreshCw, ArrowRight, AlertCircle, X, Send, MessageSquare, Play, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { logReceipt } from "@/lib/pipelineUtils";
import BackButton from "@/components/client/BackButton";
import VideoClipPlayer from "@/components/video/VideoClipPlayer";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientUpdate } from "@/hooks/useClientUpdate";
import { useClientProject } from "@/hooks/useClientProject";
import { deriveFoundation } from "@/lib/pipelineFoundation";
import { notifyStepComplete } from "@/lib/pipelineNotify";

// Duration options for generated videos. The platform generates up to 8
// seconds per clip, so longer videos are composed of multiple 8-second clips
// played back-to-back as one continuous video.
const DURATION_OPTIONS = [
  { value: "15", label: "15s", clips: 2, note: "2 scenes" },
  { value: "30", label: "30s", clips: 4, note: "4 scenes" },
  { value: "45", label: "45s", clips: 6, note: "6 scenes" },
  { value: "8", label: "8s", clips: 1, note: "1 scene" },
];

// Step: Video Generator. Generates 10 video concept cards (thumbnail +
// description + production script) using the client's onboarding, content
// tone, logo, and brand. The client can generate the actual video for any
// concept on demand at their chosen length (8s, 15s, 30s, or 45s).
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
  const [genProgress, setGenProgress] = useState("");
  const [videoDuration, setVideoDuration] = useState("15");
  const [preview, setPreview] = useState(null);

  const { user } = useClientUser();
  const { update } = useClientUpdate();
  const { project } = useClientProject(user);

  useEffect(() => { document.title = "Video Generator · Lead Gen Near You"; }, []);

  useEffect(() => {
    if (!user) return;
    setProfile(user?.epoxyProfile || null);
    setLogoUrl(user?.chosenLogoUrl || "");
    setContentTone(user?.chosenContentTone || "");
    if (user?.videoPack) setData(user.videoPack);
    if (user?.videoChosen) setSaved(true);
  }, [user]);

  const generate = async () => {
    if (!profile?.businessName) { setGenError("Complete your Business Profile first."); return; }
    const foundation = deriveFoundation(project, user);
    setGenerating(true); setGenError("");
    try {
      const res = await base44.functions.invoke("generateVideoPack", {
        businessName: profile.businessName, primaryLocation: profile.primaryLocation,
        services: profile.services || [], contentTone, logoUrl,
        industry: profile.industry || "", subIndustry: profile.subIndustry || "",
        businessType: profile.businessType || "",
        industryAnswers: profile.industryAnswers || profile.industry_answers || {},
        differentiators: profile.differentiators || [],
        vision: foundation.vision,
        strategy: foundation.strategy,
        chosenName: foundation.chosenName,
        tagline: foundation.tagline,
      });
      const d = res?.data?.data;
      if (!d?.concepts?.length) throw new Error("no data");
      setData(d);
      try { await update({ videoPack: d }); } catch {}
    } catch (e) { setGenError("Couldn't generate video concepts. Try again."); }
    finally { setGenerating(false); }
  };

  useEffect(() => {
    if (profile && project && !data && !generating && !genError) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, project]);

  // Auto-pick: all concepts included — pre-approve so the step is done.
  const autoPicked = useRef(false);
  useEffect(() => {
    if (data && !saved && !autoPicked.current) {
      autoPicked.current = true;
      (async () => {
        try {
          await update({ videoChosen: true });
          await notifyStepComplete("video", { businessName: profile?.businessName || "" });
          try { localStorage.setItem("coach:done:/video-generator", "1"); } catch {}
        } catch {}
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, saved]);

  // Generate the actual video for a single concept at the selected duration.
  // Longer videos (15s/30s/45s) are composed of multiple 8-second clips
  // generated sequentially and played back-to-back as one continuous video.
  const generateVideo = async (concept, durationValue = videoDuration) => {
    if (generatingVideoId) return;
    setGeneratingVideoId(concept.id);
    const opt = DURATION_OPTIONS.find((o) => o.value === durationValue) || DURATION_OPTIONS[0];
    try {
      const clips = [];
      for (let i = 0; i < opt.clips; i++) {
        setGenProgress(`Scene ${i + 1} of ${opt.clips}…`);
        const res = await base44.integrations.Core.GenerateVideo({
          prompt: `${concept.videoPrompt || `A promotional video for ${profile?.businessName || "a local business"}. ${concept.description}`} Scene ${i + 1} of ${opt.clips}.`,
          duration: 8, aspect_ratio: "16:9", generate_audio: false,
        });
        if (res?.url) clips.push({ url: res.url, duration: 8, label: `Scene ${i + 1}` });
      }
      if (clips.length) {
        const next = { ...data, concepts: data.concepts.map((c) => c.id === concept.id ? { ...c, videoClips: clips, videoUrl: clips[0].url } : c) };
        setData(next);
        try { await update({ videoPack: next }); } catch {}
      }
    } catch (e) { /* best effort */ }
    finally { setGeneratingVideoId(""); setGenProgress(""); }
  };

  const save = async () => {
    setSaving(true); setError("");
    try {
      await update({ videoChosen: true });
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
  const selDur = DURATION_OPTIONS.find((o) => o.value === videoDuration) || DURATION_OPTIONS[0];

  return (
    <div className="mx-auto max-w-5xl">
      <BackButton to="/social-media" />
      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <Video className="h-4 w-4" /> Video Generator
        </div>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">10 video concepts for your brand</h1>
        <p className="mt-1 text-sm text-white/60">
          We created 10 video concepts using your onboarding, content tone, logo, and brand. All concepts are included and
          <span className="text-lime-400 font-semibold"> auto-approved</span> — just click Continue. Generate actual videos for any you like, or use them on your website, social media, or YouTube.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-white/50">Video length:</span>
          {DURATION_OPTIONS.map((o) => (
            <button key={o.value} type="button" onClick={() => setVideoDuration(o.value)}
              className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                videoDuration === o.value ? "border-lime-400 bg-lime-400 text-black" : "border-white/15 text-white/70 hover:border-lime-400/50 hover:text-lime-300")}>
              {o.label} <span className="opacity-60">· {o.note}</span>
            </button>
          ))}
        </div>

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
                        {(c.videoClips?.length || c.videoUrl) ? (
                          <VideoClipPlayer clips={c.videoClips || [{ url: c.videoUrl }]} className="h-full w-full" />
                        ) : (
                          <>
                            <Image src={c.thumbnailUrl} alt={c.title} fittingType="fill" className="h-full w-full" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Play className="h-8 w-8 text-white/80" />
                            </div>
                          </>
                        )}
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-lime-400/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-black">Included</span>
                        {(c.videoClips?.length || c.videoUrl) && (
                          <span className="absolute right-1.5 top-1.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-lime-300">{c.videoClips ? `${c.videoClips.length} scenes` : "ready"}</span>
                        )}
                        {busy && <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/80"><Loader2 className="h-6 w-6 animate-spin text-lime-400" /><span className="text-[10px] text-white/70">{genProgress}</span></div>}
                      </div>
                    </button>
                    <div className="p-2.5">
                      <div className="truncate text-xs font-semibold text-white">{c.title}</div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-white/50">{c.description}</p>
                      <button
                        type="button"
                        onClick={() => generateVideo(c)}
                        disabled={!!generatingVideoId}
                        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-white/15 px-2 py-1.5 text-[10px] font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300 disabled:opacity-50"
                      >
                        {busy ? <><Loader2 className="h-3 w-3 animate-spin" /> {genProgress || "Generating…"}</> : (c.videoClips?.length || c.videoUrl) ? <><RefreshCw className="h-3 w-3" /> Regenerate {selDur.label}</> : <><Film className="h-3 w-3" /> Generate {selDur.label}</>}
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
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <>Continue to Enhancements <ArrowRight className="h-4 w-4" /></>}
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
            {(preview.videoClips?.length || preview.videoUrl) ? (
              <VideoClipPlayer clips={preview.videoClips || [{ url: preview.videoUrl }]} className="mt-3 aspect-video w-full rounded-lg overflow-hidden" />
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
                <Film className="h-4 w-4" /> Generate {selDur.label} video
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}