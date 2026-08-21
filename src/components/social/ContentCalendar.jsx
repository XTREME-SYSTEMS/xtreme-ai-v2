import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Calendar, Loader2, Save, Check, ImagePlus, X, Filter } from "lucide-react";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientUpdate } from "@/hooks/useClientUpdate";
import { cn } from "@/lib/utils";

const STATUS = [
  { id: "draft", label: "Draft", style: "border-white/15 bg-white/5 text-white/60" },
  { id: "scheduled", label: "Scheduled", style: "border-amber-400/40 bg-amber-400/10 text-amber-300" },
  { id: "posted", label: "Posted", style: "border-lime-400/40 bg-lime-400/10 text-lime-300" },
];

const PLATFORM_COLORS = {
  Instagram: "text-pink-400", Facebook: "text-blue-400", "Google Business": "text-red-400",
};

export default function ContentCalendar({ pack }) {
  const { user } = useClientUser();
  const { update } = useClientUpdate();
  const [assets, setAssets] = useState([]);
  const [posts, setPosts] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const p = (pack?.posts || []).map((x, i) => ({ day: i + 1, status: "draft", assignedImageUrl: "", ...x }));
    setPosts(p);
    setDirty(false);
  }, [pack]);

  const loadAssets = async () => {
    if (!user?.email) return;
    try {
      const list = await base44.entities.SocialMediaAsset.filter({ client_email: user.email }, "-created_date", 200);
      setAssets(list || []);
    } catch { setAssets([]); }
  };
  useEffect(() => { loadAssets(); }, [user?.email]);

  const templates = pack?.templates || [];
  const imageOptions = useMemo(() => [
    ...templates.map((t) => ({ url: t.url, label: `AI: ${t.label}` })),
    ...assets.map((a) => ({ url: a.url, label: a.caption ? `Upload: ${a.caption}` : "Upload" })),
  ], [templates, assets]);

  const updatePost = (day, patch) => {
    setPosts((prev) => prev.map((p) => (p.day === day ? { ...p, ...patch } : p)));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await update({ socialMediaPack: { ...pack, posts: posts.map(({ day, status, assignedImageUrl, platform, caption, type, bestTime }) => ({ day, platform, caption, type, bestTime, status, assignedImageUrl })) } });
      setDirty(false);
      setSavedAt(true);
      setTimeout(() => setSavedAt(false), 2000);
    } catch {}
    finally { setSaving(false); }
  };

  const counts = useMemo(() => ({
    draft: posts.filter((p) => p.status === "draft").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    posted: posts.filter((p) => p.status === "posted").length,
  }), [posts]);

  const shown = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-8 text-center">
        <Calendar className="mx-auto h-8 w-8 text-white/30" />
        <p className="mt-2 text-sm text-white/50">No content calendar yet. Generate your social media pack to create a 30-day calendar.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">30-Day Content Calendar</h2>
          <p className="text-sm text-white/50">Edit captions, assign images, and track each post's status.</p>
        </div>
        <button onClick={save} disabled={!dirty || saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-50">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : savedAt ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? "Saving…" : savedAt ? "Saved" : "Save Calendar"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-white/40" />
        <button onClick={() => setFilter("all")} className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium", filter === "all" ? "border-lime-400/50 bg-lime-400/10 text-lime-300" : "border-white/10 text-white/50")}>All ({posts.length})</button>
        {STATUS.map((s) => (
          <button key={s.id} onClick={() => setFilter(s.id)} className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium", filter === s.id ? "border-lime-400/50 bg-lime-400/10 text-lime-300" : "border-white/10 text-white/50")}>
            {s.label} ({counts[s.id]})
          </button>
        ))}
      </div>

      <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
        {shown.map((p) => (
          <div key={p.day} className="rounded-xl border border-white/10 bg-zinc-950 p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime-400/15 text-xs font-bold text-lime-400">{p.day}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase", PLATFORM_COLORS[p.platform] || "text-white/60")}>{p.platform}</span>
                  <span className="text-[10px] text-white/40">{p.type}</span>
                  {p.bestTime && <span className="text-[10px] text-white/40">· {p.bestTime}</span>}
                </div>
                <p className={cn("mt-1 text-xs", editing === p.day ? "hidden" : "text-white/70")}>{p.caption}</p>

                {editing === p.day && (
                  <div className="mt-1 space-y-2">
                    <textarea value={p.caption} onChange={(e) => updatePost(p.day, { caption: e.target.value })} rows={3}
                      className="w-full resize-none rounded-lg border border-white/15 bg-zinc-900 px-2.5 py-2 text-xs text-white focus:border-lime-400 focus:outline-none" />
                    <div>
                      <span className="text-[10px] font-medium text-white/50">Assign image:</span>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <button onClick={() => updatePost(p.day, { assignedImageUrl: "" })}
                          className={cn("rounded-lg border px-2 py-1 text-[10px]", !p.assignedImageUrl ? "border-lime-400/50 text-lime-300" : "border-white/10 text-white/40")}>None</button>
                        {imageOptions.map((o) => (
                          <button key={o.url} onClick={() => updatePost(p.day, { assignedImageUrl: o.url })}
                            className={cn("overflow-hidden rounded-lg border-2", p.assignedImageUrl === o.url ? "border-lime-400" : "border-white/10")}>
                            <Image src={o.url} alt={o.label} fittingType="fill" className="h-9 w-9" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <div className="flex gap-1">
                  {STATUS.map((s) => (
                    <button key={s.id} onClick={() => updatePost(p.day, { status: s.id })}
                      className={cn("rounded-full border px-2 py-0.5 text-[9px] font-semibold transition-all", p.status === s.id ? s.style : "border-white/10 text-white/30 hover:text-white/60")}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setEditing(editing === p.day ? null : p.day)} className="text-[10px] text-white/40 hover:text-lime-300">
                  {editing === p.day ? "Done" : "Edit"}
                </button>
              </div>
            </div>

            {p.assignedImageUrl && editing !== p.day && (
              <div className="mt-2 flex items-center gap-2">
                <Image src={p.assignedImageUrl} alt="assigned" fittingType="fill" className="h-12 w-12 rounded border border-white/10" />
                <button onClick={() => updatePost(p.day, { assignedImageUrl: "" })} className="text-white/30 hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}