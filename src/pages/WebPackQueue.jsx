import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, ExternalLink, Trash2, Zap, Image as ImageIcon, Boxes, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  queued: { label: "Queued", cls: "bg-zinc-700 text-zinc-200" },
  analyzing: { label: "Analyzing", cls: "bg-blue-500/20 text-blue-300 border border-blue-400/40" },
  generating: { label: "Generating", cls: "bg-purple-500/20 text-purple-300 border border-purple-400/40" },
  deploying: { label: "Deploying", cls: "bg-amber-500/20 text-amber-300 border border-amber-400/40" },
  deployed: { label: "Deployed", cls: "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" },
  failed: { label: "Failed", cls: "bg-red-500/20 text-red-300 border border-red-400/40" },
};

export default function WebPackQueue() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.WebPack.list("-created_date", 50);
      setPacks(list);
    } catch (e) {
      toast({ title: "Error loading packs", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (!name) setName(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 40));
  };

  const handleUpload = async () => {
    if (!file || !name.trim()) {
      toast({ title: "Name and image required", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.WebPack.create({
        name: name.trim(),
        image_url: file_url,
        status: "queued",
      });
      toast({ title: "Web pack uploaded", description: "Ready to build." });
      setName("");
      setFile(null);
      setPreview(null);
      load();
    } catch (e) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleProcess = async (id, packName) => {
    setProcessingId(id);
    try {
      const res = await base44.functions.invoke("processWebPack", { webpack_id: id });
      const data = res?.data || res;
      toast({
        title: "Site deployed!",
        description: data?.vercel_url ? `Live at ${data.vercel_url}` : "Check the live URL.",
      });
      load();
    } catch (e) {
      toast({ title: `Build failed for "${packName}"`, description: e.message, variant: "destructive" });
      load();
    }
    setProcessingId(null);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.WebPack.delete(id);
      load();
    } catch (e) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-black p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/30">
            <Boxes className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Web Pack Queue</h1>
            <p className="text-sm text-white/50">Upload design mockups → vision AI builds pixel-perfect sites → auto-deploys to Vercel</p>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-amber-400">Upload a Web Pack</h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {/* File drop */}
            <label className="group flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-black/40 transition-colors hover:border-amber-400/50 hover:bg-amber-400/5 sm:w-64">
              {preview ? (
                <img src={preview} alt="Preview" className="h-full w-full rounded-lg object-contain p-2" />
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-white/30 group-hover:text-amber-400/60" />
                  <span className="text-xs text-white/40 group-hover:text-white/60">Click to select a design image</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>

            {/* Name + upload button */}
            <div className="flex flex-1 flex-col gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Design Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Roofing Homepage"
                  className="border-white/10 bg-black/40 text-white placeholder:text-white/30"
                />
              </div>
              <Button
                onClick={handleUpload}
                disabled={uploading || !file || !name.trim()}
                className="w-fit bg-amber-400 text-black hover:bg-amber-300"
              >
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {uploading ? "Uploading..." : "Upload to Queue"}
              </Button>
              <p className="text-xs text-white/40">
                Upload any design mockup (PNG, JPG). The vision AI will analyze it and generate a pixel-perfect website, then deploy it to Vercel automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Queue List */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/60">Queue ({packs.length})</h2>
          <Button variant="ghost" size="sm" onClick={load} className="text-white/50 hover:text-white">
            <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          </div>
        ) : packs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
            <ImageIcon className="mb-3 h-10 w-10 text-white/20" />
            <p className="text-sm text-white/40">No web packs yet. Upload a design mockup to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packs.map((pack) => {
              const st = STATUS_STYLES[pack.status] || STATUS_STYLES.queued;
              const isProcessing = processingId === pack.id;
              const isBusy = ["analyzing", "generating", "deploying"].includes(pack.status);
              return (
                <div
                  key={pack.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 transition-all hover:border-amber-400/30"
                >
                  {/* Image thumbnail */}
                  <div className="relative aspect-video overflow-hidden bg-black">
                    {pack.image_url && (
                      <Image src={pack.image_url} alt={pack.name} className="h-full w-full" fittingType="fit" />
                    )}
                    <div className="absolute right-2 top-2">
                      <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", st.cls)}>
                        {st.label}
                      </span>
                    </div>
                  </div>

                  {/* Info + actions */}
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div>
                      <h3 className="truncate text-sm font-bold text-white">{pack.name}</h3>
                      {pack.vercel_url && pack.status === "deployed" && (
                        <a
                          href={pack.vercel_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {pack.vercel_url.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                      {pack.error && (
                        <p className="mt-1 text-xs text-red-400 line-clamp-2">{pack.error}</p>
                      )}
                    </div>

                    <div className="mt-auto flex items-center gap-2">
                      {pack.status === "queued" || pack.status === "failed" ? (
                        <Button
                          size="sm"
                          onClick={() => handleProcess(pack.id, pack.name)}
                          disabled={isProcessing}
                          className="bg-amber-400 text-black hover:bg-amber-300"
                        >
                          {isProcessing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-1.5 h-3.5 w-3.5" />}
                          {isProcessing ? "Building..." : "Build & Deploy"}
                        </Button>
                      ) : isBusy ? (
                        <Button size="sm" disabled className="bg-white/5 text-white/40">
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          {st.label}...
                        </Button>
                      ) : pack.status === "deployed" ? (
                        <Button size="sm" variant="outline" asChild>
                          <a href={pack.vercel_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                            View Live Site
                          </a>
                        </Button>
                      ) : null}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(pack.id)}
                        className="ml-auto text-white/30 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}