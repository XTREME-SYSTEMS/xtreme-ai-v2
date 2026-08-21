import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Upload, Trash2, Loader2, Image as ImageIcon, Sparkles, Eye, X } from "lucide-react";
import { useClientUser } from "@/hooks/useClientUser";
import { cn } from "@/lib/utils";

export default function MediaLibrary({ pack }) {
  const { user } = useClientUser();
  const fileRef = useRef(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const templates = pack?.templates || [];

  const load = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const list = await base44.entities.SocialMediaAsset.filter({ client_email: user.email }, "-created_date", 200);
      setAssets(list || []);
    } catch { setAssets([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.email]);
  useEffect(() => { const u = base44.entities.SocialMediaAsset.subscribe(() => load()); return () => u && u(); }, [user?.email]);

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !user?.email) return;
    setUploading(true);
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        await base44.entities.SocialMediaAsset.create({
          client_email: user.email,
          type: file.type?.startsWith("video") ? "video" : "image",
          url: file_url,
          source: "upload",
          caption: "",
          tags: [],
        });
      } catch {}
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    load();
  };

  const remove = async (id) => {
    try { await base44.entities.SocialMediaAsset.delete(id); load(); } catch {}
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Media Library</h2>
          <p className="text-sm text-white/50">Upload your own photos and reuse AI-generated templates for your posts.</p>
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-50">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload Images
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={onFiles} className="hidden" />
      </div>

      {templates.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400">
            <Sparkles className="h-3.5 w-3.5" /> AI-Generated Templates
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {templates.map((t) => (
              <div key={t.id} className="group relative overflow-hidden rounded-lg border border-lime-400/30 bg-zinc-950">
                <button type="button" onClick={() => setPreview({ url: t.url, label: t.label })} className="block w-full">
                  <div className="relative aspect-square w-full bg-white">
                    <Image src={t.url} alt={t.label} fittingType="fit" className="h-full w-full" />
                  </div>
                </button>
                <div className="flex items-center justify-between p-2">
                  <span className="truncate text-[11px] font-medium text-white/70">{t.label}</span>
                  <Eye className="h-3 w-3 text-white/30" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/50">
          <ImageIcon className="h-3.5 w-3.5" /> Your Uploads
        </div>
        {loading ? (
          <div className="mt-3 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>
        ) : assets.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-white/5 p-8 text-center">
            <p className="text-sm text-white/50">No uploads yet. Click "Upload Images" to add photos from your device.</p>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {assets.map((a) => (
              <div key={a.id} className="group relative overflow-hidden rounded-lg border border-white/10 bg-zinc-950">
                <button type="button" onClick={() => setPreview({ url: a.url, label: a.caption || "Uploaded asset" })} className="block w-full">
                  <div className="relative aspect-square w-full bg-white">
                    <Image src={a.url} alt={a.caption || "asset"} fittingType="fit" className="h-full w-full" />
                  </div>
                </button>
                <div className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => remove(a.id)} className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white/80 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {a.type === "video" && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Video</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="max-h-[90vh] overflow-hidden rounded-xl border border-white/10 bg-zinc-950 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">{preview.label}</h3>
              <button onClick={() => setPreview(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/5"><X className="h-5 w-5" /></button>
            </div>
            <Image src={preview.url} alt={preview.label} fittingType="fit" className="mt-3 max-h-[70vh] w-auto" />
          </div>
        </div>
      )}
    </div>
  );
}