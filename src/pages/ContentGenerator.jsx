import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MessageSquareText, Loader2, Check, RefreshCw, ArrowRight, AlertCircle, ThumbsUp, Eye, X, Send, MessageSquare, Flame, TrendingUp, RotateCcw, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { logReceipt } from "@/lib/pipelineUtils";
import BackButton from "@/components/client/BackButton";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientUpdate } from "@/hooks/useClientUpdate";
import { useClientProject } from "@/hooks/useClientProject";
import { deriveFoundation } from "@/lib/pipelineFoundation";
import { notifyStepComplete } from "@/lib/pipelineNotify";

// Step: Content Generator. Scrapes the client's market (location, industry,
// competitors, pricing, social) and generates 10 distinct content/tone
// templates for their website messaging. The system recommends the best one
// with a factual reason and estimated outcome. The client picks one — that
// tone flows through the rest of the build.
export default function ContentGenerator() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [data, setData] = useState(null); // { marketFindings, templates, recommendedIndex, recommendationReason }
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [revising, setRevising] = useState(false);
  const [reviseComment, setReviseComment] = useState("");
  const [sendingRevise, setSendingRevise] = useState(false);
  const [reviseSent, setReviseSent] = useState(false);
  const [reviseError, setReviseError] = useState("");
  const { user } = useClientUser();
  const { update } = useClientUpdate();
  const { project } = useClientProject(user);

  useEffect(() => { document.title = "Content Generator · Lead Gen Near You"; }, []);

  useEffect(() => {
    if (!user) return;
    setProfile(user?.epoxyProfile || null);
    if (user?.contentTemplates) setData(user.contentTemplates);
    if (user?.chosenContentTemplate) setSelectedId(user.chosenContentTemplate);
    if (user?.contentTemplatesChosen) setSaved(true);
  }, [user]);

  const generate = async () => {
    if (!profile?.businessName) { setGenError("Complete your Business Profile first."); return; }
    const foundation = deriveFoundation(project, user);
    setGenerating(true); setGenError("");
    try {
      const res = await base44.functions.invoke("generateContentTemplates", {
        businessName: profile.businessName, services: profile.services || [],
        primaryLocation: profile.primaryLocation, website: profile.website || "",
        differentiators: profile.differentiators || [], yearsInBusiness: profile.yearsInBusiness || "",
        phone: profile.phone || "", email: profile.email || "",
        industry: profile.industry || "", subIndustry: profile.subIndustry || "",
        businessType: profile.businessType || "",
        financialIntelligence: user?.financialIntelligence || null,
        industryAnswers: user?.industryAnswers || null,
        vision: foundation.vision,
        strategy: foundation.strategy,
        chosenName: foundation.chosenName,
        tagline: foundation.tagline,
        contentTone: foundation.contentTone,
      });
      const d = res?.data?.data;
      if (!d?.templates?.length) throw new Error("no templates");
      setData(d);
      setSelectedId(d.templates[d.recommendedIndex]?.id || "");
      try { await update({ contentTemplates: d }); } catch {}
    } catch (e) { setGenError("Couldn't generate content templates. Try again."); }
    finally { setGenerating(false); }
  };

  // Restart: clears all step state so the user can re-run generation from scratch.
  const restart = () => {
    setData(null);
    setSelectedId("");
    setGenError("");
    setSaved(false);
    try {
      localStorage.removeItem("coach:done:/content-generator");
      localStorage.removeItem("coach:intro:/content-generator");
    } catch {}
    setTimeout(() => generate(), 100);
  };

  // Skip: escape hatch for when the system is jammed — marks the step done and
  // moves to the next step so the user is never trapped.
  const skip = () => {
    try {
      localStorage.setItem("coach:done:/content-generator", "1");
      localStorage.setItem("coach:intro:/content-generator", "1");
    } catch {}
    navigate("/logo-generator");
  };

  useEffect(() => {
    if (profile && project && !data && !generating && !genError) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, project]);

  // Auto-pick: pre-select and persist the recommended tone so the step is
  // already done — the user just clicks "Continue" to proceed.
  useEffect(() => {
    if (data && !selectedId && !saved) {
      const rec = data.templates[data.recommendedIndex];
      if (rec) {
        setSelectedId(rec.id);
        (async () => {
          try {
            await update({ chosenContentTemplate: rec.id, chosenContentTone: rec.tone || "", contentTemplatesChosen: true });
            await notifyStepComplete("content", { businessName: profile?.businessName || "" });
            try { localStorage.setItem("coach:done:/content-generator", "1"); } catch {}
          } catch {}
        })();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, selectedId, saved]);

  const save = async () => {
    if (!selectedId) { setError("Pick a content tone to continue."); return; }
    setSaving(true); setError("");
    try {
      const chosen = data.templates.find((t) => t.id === selectedId);
      await update({
        chosenContentTemplate: selectedId,
        chosenContentTone: chosen?.tone || "",
        contentTemplatesChosen: true,
      });
      try { await logReceipt({ action: "Content tone chosen", entityType: "User", entityId: "self", status: "success", notes: chosen?.name || selectedId }); } catch {}
      await notifyStepComplete("content", { businessName: profile?.businessName || "" });
      setSaved(true);
      try { localStorage.setItem("coach:done:/content-generator", "1"); } catch {}
      setTimeout(() => navigate("/logo-generator"), 800);
    } catch (e) { setError("Couldn't save. Please try again."); }
    finally { setSaving(false); }
  };

  const requestRevision = async () => {
    if (!reviseComment.trim()) { setReviseError("Add a note for our team."); return; }
    setSendingRevise(true); setReviseError("");
    try {
      await base44.functions.invoke("submitRevisionRequest", { comment: reviseComment.trim(), pipelineStep: "content", clientEmail: profile?.email || "" });
      setReviseSent(true); setReviseComment(""); setRevising(false);
    } catch (e) { setReviseError("Couldn't send. Please try again."); }
    finally { setSendingRevise(false); }
  };

  const templates = data?.templates || [];
  const recIdx = data?.recommendedIndex ?? -1;
  // Recommended card always renders first in the gallery
  const sortedTemplates = recIdx >= 0 && templates[recIdx]
    ? [templates[recIdx], ...templates.filter((_, i) => i !== recIdx)]
    : templates;

  return (
    <div className="mx-auto max-w-5xl">
      <BackButton to="/business-profile" />
      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
          <MessageSquareText className="h-4 w-4" /> Content Generator
        </div>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Choose your website's voice</h1>
        <p className="mt-1 text-sm text-white/60">
          We researched {profile?.primaryLocation || "your area"} — your competitors, pricing, and what local customers respond to —
          then wrote 10 different messaging tones. We've <span className="text-lime-400 font-semibold">auto-selected the recommended one</span> —
          just click Continue, or pick a different tone if you prefer.
        </p>

        {data?.marketFindings && (
          <div className="mt-3 rounded-lg border border-white/10 bg-zinc-950 p-3 text-xs text-white/60">
            <span className="font-semibold text-lime-400">Market findings: </span>{data.marketFindings}
          </div>
        )}

        {saved && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-lime-400/50 bg-lime-400/10 px-3 py-2.5 text-sm text-lime-300">
            <Check className="h-4 w-4" /> Content tone saved — generating your logos…
          </div>
        )}

        {generating && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-zinc-950 py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
            <p className="mt-3 text-sm text-white/60">Researching your market &amp; writing 10 tones…</p>
            <p className="text-xs text-white/40">Pulling real local data — this can take up to 90 seconds. Please don't close this page.</p>
          </div>
        )}

        {genError && !generating && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm text-red-300">
              <AlertCircle className="h-4 w-4" /> {genError}
              <button onClick={generate} className="ml-auto rounded-md border border-red-400/40 px-2 py-1 text-xs hover:bg-red-400/10">Retry</button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={restart} className="inline-flex items-center gap-1.5 rounded-lg border border-lime-400/40 bg-lime-400/10 px-3 py-2 text-xs font-semibold text-lime-300 hover:bg-lime-400/20">
                <RotateCcw className="h-3.5 w-3.5" /> Restart Step
              </button>
              <button type="button" onClick={skip} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-white/30">
                <SkipForward className="h-3.5 w-3.5" /> Skip &amp; Continue
              </button>
            </div>
          </div>
        )}

        {templates.length > 0 && !generating && (
          <>
            {/* Recommendation banner */}
            {recIdx >= 0 && (
              <div className="mt-4 flex items-start gap-3 rounded-lg border border-lime-400/40 bg-lime-400/10 p-3">
                <Flame className="mt-0.5 h-5 w-5 shrink-0 text-lime-400" />
                <div>
                  <p className="text-sm font-semibold text-lime-300">Most likely to go viral: {templates[recIdx]?.name}</p>
                  <p className="mt-0.5 text-xs text-white/70">{data?.recommendationReason}</p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {templates[recIdx]?.viralScore != null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-lime-400/15 px-2 py-0.5 text-[10px] font-bold text-lime-300">
                        <Flame className="h-3 w-3" /> Viral {templates[recIdx].viralScore}/100
                      </span>
                    )}
                    {templates[recIdx]?.conversionScore != null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-lime-400/15 px-2 py-0.5 text-[10px] font-bold text-lime-300">
                        <TrendingUp className="h-3 w-3" /> Convert {templates[recIdx].conversionScore}/100
                      </span>
                    )}
                    {templates[recIdx]?.estimatedOutcome && (
                      <span className="text-xs text-lime-300/80">📈 {templates[recIdx].estimatedOutcome}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sortedTemplates.map((t, i) => {
                const on = selectedId === t.id;
                const isRec = t.id === templates[recIdx]?.id;
                return (
                  <div key={t.id} className={cn("relative overflow-hidden rounded-xl border-2 bg-zinc-950 transition-all", on ? "border-lime-400 ring-2 ring-lime-400/40" : "border-white/10 hover:border-white/25")}>
                    {isRec && (
                      <div className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-lime-400 px-2 py-0.5 text-[9px] font-bold uppercase text-black">
                        <ThumbsUp className="h-2.5 w-2.5" /> Recommended
                      </div>
                    )}
                    <button type="button" onClick={() => setPreview(t)} className="block w-full p-4 text-left">
                      <div className="text-xs font-semibold uppercase tracking-wider text-lime-400">{t.tone}</div>
                      <h3 className="mt-1.5 text-sm font-bold text-white">{t.name}</h3>
                      <p className="mt-1.5 text-sm font-semibold text-white/90">{t.heroHeadline}</p>
                      <p className="mt-1 text-xs text-white/50 line-clamp-2">{t.heroSubhead}</p>
                      {(t.viralScore != null || t.conversionScore != null) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {t.viralScore != null && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-white/60">
                              <Flame className="h-2.5 w-2.5 text-orange-400" /> {t.viralScore}
                            </span>
                          )}
                          {t.conversionScore != null && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-white/60">
                              <TrendingUp className="h-2.5 w-2.5 text-lime-400" /> {t.conversionScore}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                    <div className="flex items-center gap-2 p-2.5">
                      <button type="button" onClick={() => setSelectedId(t.id)} className={cn("inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors", on ? "bg-lime-400 text-black" : "border border-white/15 text-white/70 hover:border-lime-400/50 hover:text-lime-300")}>
                        {on ? <><Check className="h-3.5 w-3.5" /> Selected</> : "Select"}
                      </button>
                      <button type="button" onClick={() => setPreview(t)} className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button type="button" onClick={generate} disabled={generating} className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-lime-400/50 hover:text-lime-300">
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate tones
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
                <textarea value={reviseComment} onChange={(e) => setReviseComment(e.target.value)} rows={3} placeholder="What don't you like about the content tones?" className="w-full resize-none rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none" />
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
                <button type="button" onClick={save} disabled={saving || !selectedId} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <>Continue to Logo <ArrowRight className="h-4 w-4" /></>}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-zinc-950 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-lime-400">{preview.tone}</div>
                <h2 className="text-lg font-bold text-white">{preview.name}</h2>
              </div>
              <button onClick={() => setPreview(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/5"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 space-y-3">
              <div><div className="text-xs font-semibold text-white/40">Headline</div><p className="text-sm font-semibold text-white">{preview.heroHeadline}</p></div>
              <div><div className="text-xs font-semibold text-white/40">Subhead</div><p className="text-sm text-white/80">{preview.heroSubhead}</p></div>
              <div><div className="text-xs font-semibold text-white/40">About</div><p className="text-sm text-white/80">{preview.aboutSummary}</p></div>
              <div><div className="text-xs font-semibold text-white/40">Call to Action</div><p className="text-sm text-lime-300">{preview.cta}</p></div>
              {preview.whyRecommended && <div className="rounded-lg border border-lime-400/30 bg-lime-400/5 p-3"><div className="text-xs font-semibold text-lime-400">Why this works</div><p className="mt-1 text-xs text-white/70">{preview.whyRecommended}</p></div>}
              {preview.estimatedOutcome && <div className="rounded-lg border border-lime-400/30 bg-lime-400/5 p-3"><div className="text-xs font-semibold text-lime-400">Estimated outcome</div><p className="mt-1 text-xs text-white/70">{preview.estimatedOutcome}</p></div>}
            </div>
            <button type="button" onClick={() => { setSelectedId(preview.id); setPreview(null); }} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-lime-300">
              <Check className="h-4 w-4" /> Select this tone
            </button>
          </div>
        </div>
      )}
    </div>
  );
}