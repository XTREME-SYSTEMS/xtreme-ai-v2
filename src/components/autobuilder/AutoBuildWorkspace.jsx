import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Loader2, Play, ArrowRight, Check, AlertCircle, Sparkles, Compass, PenTool, Shirt, Palette, Share2, Video, FileText, Building2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { AUTO_BUILD_STEPS, getStep, getNextStep, stepStatus } from "@/lib/autoBuildSteps";

// The workspace — step navigation bar + current step content + run controls.
// Admin clicks "Run Step" to execute the current step via processAutoBuildStep.
export default function AutoBuildWorkspace({ build, onRefresh, running, setRunning }) {
  const [error, setError] = useState("");
  const [editingProfile, setEditingProfile] = useState(!build?.profile?.primary_location);
  const [pushing, setPushing] = useState(false);
  const [pushEmail, setPushEmail] = useState("");
  const [pushModalOpen, setPushModalOpen] = useState(false);
  const [pushResult, setPushResult] = useState(null);
  const [pushError, setPushError] = useState("");

  if (!build) {
    return (
      <div className="flex h-full items-center justify-center text-white/40">
        <div className="text-center">
          <Sparkles className="mx-auto mb-3 h-10 w-10 text-white/20" />
          <p className="text-sm">Select a build from the queue to start working.</p>
        </div>
      </div>
    );
  }

  const currentStep = build.current_step;
  const stepDef = getStep(currentStep);
  const next = getNextStep(currentStep);
  const isComplete = currentStep === "complete" || build.status === "complete";

  const runStep = async (stepKey, advance = true) => {
    setRunning(true);
    setError("");
    try {
      const res = await base44.functions.invoke("processAutoBuildStep", {
        build_id: build.id,
        step: stepKey,
        advance,
      });
      onRefresh();
    } catch (e) {
      setError(String(e?.response?.data?.error || e?.message || "Step execution failed"));
    } finally {
      setRunning(false);
    }
  };

  const saveProfile = async (data) => {
    try {
      await base44.entities.AutoBuild.update(build.id, { profile: { ...build.profile, ...data } });
      onRefresh();
      setEditingProfile(false);
    } catch {}
  };

  const pushToPortal = async () => {
    if (!pushEmail.trim()) { setPushError("Client email is required."); return; }
    setPushing(true);
    setPushError("");
    setPushResult(null);
    try {
      const res = await base44.functions.invoke("pushAutoBuildToClientPortal", {
        build_id: build.id,
        client_email: pushEmail.trim(),
      });
      setPushResult(res);
      onRefresh();
    } catch (e) {
      setPushError(String(e?.response?.data?.error || e?.message || "Push failed"));
    } finally {
      setPushing(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Step navigation bar */}
      <div className="border-b border-white/10 bg-zinc-950 px-4 py-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-lime-400" />
          <h2 className="text-sm font-semibold text-white">{build.business_name}</h2>
          {build.industry && <span className="text-xs text-white/40">· {build.industry}</span>}
          <span className={cn(
            "ml-auto rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
            build.status === "complete" ? "border-lime-400/50 bg-lime-400/10 text-lime-400" :
            build.status === "running" ? "border-amber-400/50 bg-amber-400/10 text-amber-400" :
            build.status === "failed" ? "border-red-400/50 bg-red-400/10 text-red-400" :
            "border-white/15 text-white/50"
          )}>
            {build.status}
          </span>
        </div>
        {/* Step pills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {AUTO_BUILD_STEPS.map((s, i) => {
            const status = stepStatus(build, s.key);
            const Icon = s.icon;
            return (
              <div
                key={s.key}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition-colors",
                  status === "current" ? "border-lime-400 bg-lime-400/10 text-lime-400" :
                  status === "done" ? "border-lime-400/30 bg-lime-400/5 text-lime-400/70" :
                  "border-white/10 text-white/40"
                )}
              >
                <span className="text-[10px] font-bold opacity-60">{i + 1}</span>
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{s.label}</span>
                {status === "done" && <Check className="h-3 w-3" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {isComplete ? (
          <CompleteView build={build} />
        ) : (
          <div className="mx-auto max-w-4xl">
            {/* Step header */}
            <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-4">
              <div className="flex items-center gap-2">
                {(() => { const Icon = stepDef?.icon; return Icon ? <Icon className="h-5 w-5 text-lime-400" /> : null; })()}
                <h3 className="text-lg font-semibold text-white">{stepDef?.label}</h3>
                <span className="ml-auto text-xs text-white/40">Step {AUTO_BUILD_STEPS.findIndex((s) => s.key === currentStep) + 1} of {AUTO_BUILD_STEPS.length}</span>
              </div>
              <p className="mt-1 text-sm text-white/60">{stepDef?.description}</p>
            </div>

            {/* Step-specific content */}
            <div className="mt-4">
              <StepContent
                build={build}
                stepKey={currentStep}
                editingProfile={editingProfile}
                setEditingProfile={setEditingProfile}
                saveProfile={saveProfile}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm text-red-300">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}
            {build.error && !error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm text-red-300">
                <AlertCircle className="h-4 w-4" /> Last error: {build.error}
              </div>
            )}

            {/* Run controls */}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
              {currentStep === "profile" && !editingProfile && (
                <button
                  type="button"
                  onClick={() => setEditingProfile(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-lime-400/50"
                >
                  Edit Profile
                </button>
              )}
              {currentStep !== "profile" || editingProfile ? (
                <button
                  type="button"
                  onClick={() => runStep(currentStep)}
                  disabled={running || (currentStep === "profile" && !build.business_name)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
                >
                  {running ? <><Loader2 className="h-4 w-4 animate-spin" /> Running…</> : <><Play className="h-4 w-4" /> Run Step</>}
                </button>
              ) : null}
              {next && (
                <button
                  type="button"
                  onClick={() => runStep(currentStep, true)}
                  disabled={running}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-lime-400/40 px-4 py-2 text-sm font-medium text-lime-400 hover:bg-lime-400/10 disabled:opacity-50"
                >
                  Run & Advance <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {build.auto_advance && !isComplete && (
                <span className="inline-flex items-center gap-1.5 text-xs text-lime-400">
                  <Sparkles className="h-3.5 w-3.5" /> Auto-advance ON
                </span>
              )}
              <button
                type="button"
                onClick={() => setPushModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/40 px-3 py-2 text-xs font-medium text-sky-400 hover:bg-sky-400/10"
              >
                <Upload className="h-3.5 w-3.5" /> Push to Client Portal
              </button>
            </div>

            {/* Logs */}
            {build.logs && build.logs.length > 0 && (
              <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-3">
                <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">Execution Log</h4>
                <div className="max-h-32 space-y-1 overflow-y-auto">
                  {build.logs.slice(-8).map((l, i) => (
                    <p key={i} className="font-mono text-[10px] text-white/40">{l}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Push to Client Portal modal */}
        {pushModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => !pushing && setPushModalOpen(false)}>
            <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-950 p-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-sky-400" />
                <h3 className="text-base font-semibold text-white">Push to Client Portal</h3>
              </div>
              <p className="mt-1.5 text-sm text-white/50">
                Copy all generated assets from this build into a client's portal project. Enter the client's email — if they already have a project, it'll be updated; otherwise a new one is created.
              </p>

              {/* Asset summary */}
              <div className="mt-3 grid grid-cols-4 gap-2">
                <PushStat label="Names" value={(build.name_options || []).length} />
                <PushStat label="Logos" value={(build.logo_options || []).length} />
                <PushStat label="Brand" value={(build.brand_packs || []).length} />
                <PushStat label="Social" value={(build.social_media_pack?.posts || build.social_media_pack?.calendar || []).length} />
              </div>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-lime-400">Client Email</label>
              <input
                value={pushEmail}
                onChange={(e) => setPushEmail(e.target.value)}
                type="email"
                placeholder="client@example.com"
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-sky-400 focus:outline-none"
              />

              {pushError && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-300">
                  <AlertCircle className="h-3.5 w-3.5" /> {pushError}
                </div>
              )}
              {pushResult && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-xs text-lime-300">
                  <Check className="h-3.5 w-3.5" /> Pushed! Project {pushResult.action} for {pushResult.client_email}.
                </div>
              )}

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setPushModalOpen(false); setPushEmail(""); setPushResult(null); setPushError(""); }}
                  disabled={pushing}
                  className="rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-white/30 disabled:opacity-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={pushToPortal}
                  disabled={pushing}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-400 px-4 py-2 text-xs font-semibold text-black hover:bg-sky-300 disabled:opacity-50"
                >
                  {pushing ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Pushing…</> : <><Upload className="h-3.5 w-3.5" /> Push Assets</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step content renderer ───────────────────────────────────────────────
function StepContent({ build, stepKey, editingProfile, setEditingProfile, saveProfile }) {
  switch (stepKey) {
    case "profile":
      return <ProfileStep build={build} editing={editingProfile} setEditing={setEditingProfile} onSave={saveProfile} />;
    case "names":
      return <NamesStep build={build} />;
    case "content":
      return <ContentStep build={build} />;
    case "logo":
      return <LogoStep build={build} />;
    case "brand":
      return <BrandStep build={build} />;
    case "website":
      return <WebsiteStep build={build} />;
    case "social":
      return <SocialStep build={build} />;
    case "video":
      return <VideoStep build={build} />;
    case "review":
      return <ReviewStep build={build} />;
    default:
      return null;
  }
}

function ProfileStep({ build, editing, setEditing, onSave }) {
  const [form, setForm] = useState(build.profile || {});
  if (!editing && build.profile?.primary_location) {
    return (
      <div className="rounded-lg border border-white/10 bg-zinc-950 p-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-lime-400">Business Profile</h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Business Name" value={build.business_name} />
          <Field label="Industry" value={build.industry} />
          <Field label="Location" value={build.profile?.primary_location} />
          <Field label="Phone" value={build.profile?.phone} />
          <Field label="Email" value={build.profile?.email} />
          <Field label="Years in Business" value={build.profile?.years_in_business} />
        </div>
        {build.profile?.services?.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-white/40">Services</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {build.profile.services.map((s, i) => (
                <span key={i} className="rounded-full border border-lime-400/20 bg-lime-400/5 px-2 py-0.5 text-xs text-lime-400/80">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950 p-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-lime-400">Business Profile</h4>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Business Name" value={form.businessName || build.business_name || ""} onChange={(v) => setForm({ ...form, businessName: v })} />
        <Input label="Industry" value={form.industry || build.industry || ""} onChange={(v) => setForm({ ...form, industry: v })} />
        <Input label="Primary Location" value={form.primary_location || ""} onChange={(v) => setForm({ ...form, primary_location: v })} />
        <Input label="Phone" value={form.phone || ""} onChange={(v) => setForm({ ...form, phone: v })} />
        <Input label="Email" value={form.email || ""} onChange={(v) => setForm({ ...form, email: v })} />
        <Input label="Years in Business" value={form.years_in_business || ""} onChange={(v) => setForm({ ...form, years_in_business: v })} />
      </div>
      <div className="mt-3">
        <Input label="Services (comma-separated)" value={(form.services || []).join(", ")} onChange={(v) => setForm({ ...form, services: v.split(",").map((s) => s.trim()).filter(Boolean) })} />
      </div>
      <button
        type="button"
        onClick={() => onSave({ ...form, businessName: form.businessName || build.business_name, industry: form.industry || build.industry })}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-xs font-semibold text-black hover:bg-lime-300"
      >
        <Check className="h-3.5 w-3.5" /> Save Profile
      </button>
    </div>
  );
}

function NamesStep({ build }) {
  const ideas = build.name_options || [];
  if (ideas.length === 0) return <EmptyStep icon={Compass} label="No names generated yet. Click Run Step to generate 20 business name ideas." />;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {ideas.map((idea, i) => (
        <div key={i} className="rounded-lg border border-white/10 bg-zinc-950 p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{idea.name}</span>
            {idea.viral_score != null && (
              <span className="ml-auto rounded-full bg-lime-400/15 px-2 py-0.5 text-[10px] font-bold text-lime-400">{idea.viral_score}</span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-lime-400/70">{idea.domain}</div>
          <p className="mt-1.5 text-xs text-white/50">{idea.rationale}</p>
        </div>
      ))}
    </div>
  );
}

function ContentStep({ build }) {
  const templates = build.content_templates || [];
  if (templates.length === 0) return <EmptyStep icon={FileText} label="No content templates yet. Click Run Step to generate 10 tone variations." />;
  return (
    <div className="space-y-2">
      {templates.map((t, i) => (
        <div key={i} className="rounded-lg border border-white/10 bg-zinc-950 p-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-lime-400/15 px-2 py-0.5 text-[10px] font-bold uppercase text-lime-400">{t.tone}</span>
          </div>
          <h4 className="mt-2 text-sm font-semibold text-white">{t.hero_headline}</h4>
          <p className="text-xs text-white/50">{t.hero_subhead}</p>
          {t.about_paragraph && <p className="mt-1.5 text-xs text-white/40 line-clamp-2">{t.about_paragraph}</p>}
        </div>
      ))}
    </div>
  );
}

function LogoStep({ build }) {
  const logos = build.logo_options || [];
  if (logos.length === 0) return <EmptyStep icon={PenTool} label="No logos generated yet. Click Run Step to generate 10 logo concepts." />;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {logos.map((l, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-white/10 bg-zinc-950">
          <div className="relative aspect-square" style={{ backgroundColor: "#f3f4f6" }}>
            <Image src={l.url} alt={l.label} fittingType="fit" className="h-full w-full" />
          </div>
          <div className="p-2 text-xs font-medium text-white/70">{l.label}</div>
        </div>
      ))}
    </div>
  );
}

function BrandStep({ build }) {
  const packs = build.brand_packs || [];
  if (packs.length === 0) return <EmptyStep icon={Shirt} label="No brand mockups yet. Click Run Step to generate 10 mockups." />;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {packs.map((p, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-white/10 bg-zinc-950">
          <div className="relative aspect-square">
            <Image src={p.url} alt={p.label} fittingType="fill" className="h-full w-full" />
          </div>
          <div className="p-2 text-xs font-medium text-white/70">{p.label}</div>
        </div>
      ))}
    </div>
  );
}

function WebsiteStep({ build }) {
  const content = build.website_content || {};
  const images = build.website_images || [];
  if (!content.hero_headline && images.length === 0) return <EmptyStep icon={Palette} label="No website content yet. Click Run Step to generate copy + imagery." />;
  return (
    <div className="space-y-4">
      {content.hero_headline && (
        <div className="rounded-lg border border-white/10 bg-zinc-950 p-4">
          <h4 className="text-base font-semibold text-white">{content.hero_headline}</h4>
          <p className="mt-1 text-sm text-white/60">{content.hero_subhead}</p>
          {content.about_paragraph && <p className="mt-2 text-xs text-white/40">{content.about_paragraph}</p>}
        </div>
      )}
      {content.services?.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {content.services.map((s, i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-zinc-950 p-3">
              <h5 className="text-sm font-medium text-white">{s.title}</h5>
              <p className="mt-0.5 text-xs text-white/50">{s.description}</p>
            </div>
          ))}
        </div>
      )}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-white/10">
              <div className="relative aspect-video">
                <Image src={img.url} alt={img.label} fittingType="fill" className="h-full w-full" />
              </div>
              <div className="bg-zinc-950 p-2 text-xs text-white/60">{img.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SocialStep({ build }) {
  const pack = build.social_media_pack || {};
  const calendar = pack.calendar || [];
  if (calendar.length === 0) return <EmptyStep icon={Share2} label="No social media pack yet. Click Run Step to generate a 30-day calendar." />;
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-white/10 bg-zinc-950 p-3">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-lime-400">30-Day Content Calendar</h4>
        <div className="max-h-64 space-y-1.5 overflow-y-auto">
          {calendar.slice(0, 15).map((c, i) => (
            <div key={i} className="flex items-start gap-2 rounded border border-white/5 p-2">
              <span className="shrink-0 text-xs font-bold text-lime-400">D{c.day}</span>
              <div className="min-w-0">
                <span className="text-[10px] uppercase text-white/40">{c.platform} · {c.post_type}</span>
                <p className="text-xs text-white/60">{c.caption}</p>
              </div>
            </div>
          ))}
          {calendar.length > 15 && <p className="text-center text-xs text-white/30">+ {calendar.length - 15} more days…</p>}
        </div>
      </div>
    </div>
  );
}

function VideoStep({ build }) {
  const concepts = build.video_pack?.concepts || [];
  if (concepts.length === 0) return <EmptyStep icon={Video} label="No video concepts yet. Click Run Step to generate 10 concepts." />;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {concepts.map((c, i) => (
        <div key={i} className="rounded-lg border border-white/10 bg-zinc-950 p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{c.title}</span>
            <span className="ml-auto rounded-full bg-lime-400/15 px-2 py-0.5 text-[10px] font-bold uppercase text-lime-400">{c.style}</span>
          </div>
          <p className="mt-1 text-xs text-white/50">{c.description}</p>
          <p className="mt-1 text-[10px] text-white/30">{c.duration_seconds}s · {c.script_outline}</p>
        </div>
      ))}
    </div>
  );
}

function ReviewStep({ build }) {
  const counts = {
    names: (build.name_options || []).length,
    content: (build.content_templates || []).length,
    logos: (build.logo_options || []).length,
    brand: (build.brand_packs || []).length,
    website: build.website_content?.hero_headline ? 1 : 0,
    social: (build.social_media_pack?.calendar || []).length,
    video: (build.video_pack?.concepts || []).length,
  };
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950 p-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-lime-400">Generated Assets Summary</h4>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Name Ideas" value={counts.names} />
        <Stat label="Content Templates" value={counts.content} />
        <Stat label="Logo Concepts" value={counts.logos} />
        <Stat label="Brand Mockups" value={counts.brand} />
        <Stat label="Website Pages" value={counts.website} />
        <Stat label="Social Posts" value={counts.social} />
        <Stat label="Video Concepts" value={counts.video} />
        <Stat label="Steps Done" value={(build.visited_steps || []).length} />
      </div>
      <p className="mt-3 text-xs text-white/40">Click Run Step to finalize and mark this build complete.</p>
    </div>
  );
}

function CompleteView({ build }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-lime-400/10">
        <Check className="h-8 w-8 text-lime-400" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-white">Build Complete</h2>
      <p className="mt-1 text-sm text-white/50">{build.business_name} has been fully generated through the pipeline.</p>
      <ReviewStep build={build} />
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────
function EmptyStep({ icon: Icon, label }) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950 p-8 text-center">
      <Icon className="mx-auto mb-3 h-8 w-8 text-white/20" />
      <p className="text-sm text-white/40">{label}</p>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-white/40">{label}</div>
      <div className="mt-0.5 truncate text-sm text-white/80">{value || "—"}</div>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-white/40">{label}</label>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
      />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-2.5 text-center">
      <div className="text-lg font-bold text-lime-400">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
    </div>
  );
}

function PushStat({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-2 text-center">
      <div className="text-base font-bold text-sky-400">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
    </div>
  );
}