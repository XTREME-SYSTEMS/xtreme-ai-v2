import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Box, Upload, Loader2, Sparkles, CheckCircle2, X, Link2, Copy, Eye, Trash2, Image as ImageIcon } from "lucide-react";
import { useClientUser } from "@/hooks/useClientUser";
import BackButton from "@/components/client/BackButton";
import WalkthroughViewer from "@/components/walkthrough/WalkthroughViewer";

// Client portal page for creating AI-powered 3D walkthroughs. Users upload
// images of their space, AI analyzes them, and a 3D walkthrough is generated
// that can be previewed and shared with clients via a public link.
export default function WalkthroughStudio() {
  const { user } = useClientUser();
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Create form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Active project (after generation)
  const [activeProject, setActiveProject] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const all = await base44.entities.WalkthroughProject.list("-created_date", 50);
      setProjects(all || []);
    } catch {}
    setLoadingProjects(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFiles = (newFiles) => {
    const arr = Array.from(newFiles);
    setFiles((prev) => [...prev, ...arr]);
    setPreviews((prev) => [...prev, ...arr.map((f) => URL.createObjectURL(f))]);
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const uploadAll = async () => {
    const urls = [];
    for (const f of files) {
      const res = await base44.integrations.Core.UploadFile({ file: f });
      urls.push(res.file_url);
    }
    return urls;
  };

  const generate = async () => {
    if (files.length === 0) {
      setError("Upload at least one image of your space.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const imageUrls = await uploadAll();
      setUploading(false);
      setGenerating(true);
      const res = await base44.functions.invoke("generateWalkthrough", {
        title: title.trim(),
        description: description.trim(),
        images: imageUrls,
        clientEmail: user?.email || "",
      });
      const data = res?.data || res;
      if (data?.ok) {
        setActiveProject(data);
        setShowViewer(true);
        setTitle("");
        setDescription("");
        setFiles([]);
        setPreviews([]);
        await load();
      } else {
        setError(data?.error || "Failed to generate walkthrough.");
      }
    } catch (e) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setUploading(false);
      setGenerating(false);
    }
  };

  const publish = async (project) => {
    setPublishing(true);
    try {
      await base44.entities.WalkthroughProject.update(project.projectId || activeProject?.projectId, {
        published: true,
        status: "published",
      });
      await load();
      // Refresh active project
      if (activeProject) {
        setActiveProject({ ...activeProject, published: true });
      }
    } catch (e) {
      setError(e?.message || "Could not publish.");
    }
    setPublishing(false);
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}/walkthrough/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openProject = (p) => {
    setActiveProject({
      projectId: p.id,
      shareToken: p.share_token,
      title: p.title,
      description: p.description,
      viewpoints: p.viewpoints,
      published: p.published,
    });
    setShowViewer(true);
  };

  const deleteProject = async (id) => {
    try {
      await base44.entities.WalkthroughProject.delete(id);
      await load();
      if (activeProject?.projectId === id) {
        setShowViewer(false);
        setActiveProject(null);
      }
    } catch {}
  };

  return (
    <div className="space-y-5">
      <BackButton to="/my-package" />

      {/* Header */}
      <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/15">
            <Box className="h-5 w-5 text-lime-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">3D Walkthrough Studio</h1>
            <p className="text-sm text-white/50">
              Upload images of your space — our AI analyzes them and builds an immersive 3D walkthrough your clients can navigate.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-300">
          <X className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Create form */}
      {!showViewer && (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-white/60">Walkthrough Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Modern Home Virtual Tour"
              className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-white/60">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description of the space…"
              className="w-full resize-none rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
            />
          </div>

          {/* Upload area */}
          <div>
            <label className="mb-1 block text-xs font-medium text-white/60">Upload Images of Your Space</label>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-white/20 bg-black px-4 py-8 text-center transition-colors hover:border-lime-400/50">
              <Upload className="h-6 w-6 text-white/40" />
              <span className="text-sm text-white/60">Click to upload photos of your space</span>
              <span className="text-xs text-white/30">PNG, JPG — upload multiple for a full walkthrough</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
          </div>

          {/* Preview thumbnails */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {previews.map((url, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-white/10">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/70">
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={uploading || generating || files.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading images…</>
            ) : generating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> AI analyzing your space…</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate 3D Walkthrough</>
            )}
          </button>
          {generating && (
            <p className="text-xs text-white/40">
              The AI is analyzing your images, identifying each space, and creating an optimal walkthrough flow. This takes 15-30 seconds.
            </p>
          )}
        </div>
      )}

      {/* Viewer + publish */}
      {showViewer && activeProject && (
        <div className="space-y-4">
          <WalkthroughViewer
            viewpoints={activeProject.viewpoints}
            title={activeProject.title}
            description={activeProject.description}
            onClose={() => setShowViewer(false)}
          />

          {/* Publish / share */}
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
            <div className="flex flex-wrap items-center gap-3">
              {activeProject.published ? (
                <>
                  <div className="flex items-center gap-2 rounded-lg border border-lime-400/40 bg-lime-400/10 px-3 py-2 text-sm text-lime-300">
                    <CheckCircle2 className="h-4 w-4" /> Published
                  </div>
                  <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/15 bg-black px-3 py-2">
                    <Link2 className="h-4 w-4 text-white/40" />
                    <input
                      readOnly
                      value={`${window.location.origin}/walkthrough/${activeProject.shareToken}`}
                      className="flex-1 bg-transparent text-sm text-white/70 outline-none"
                    />
                    <button
                      onClick={() => copyLink(activeProject.shareToken)}
                      className="rounded border border-white/15 px-2 py-1 text-xs text-white/60 hover:bg-white/10"
                    >
                      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-lime-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <a
                    href={`${window.location.origin}/walkthrough/${activeProject.shareToken}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-lime-400/40 bg-lime-400/10 px-3 py-2 text-sm text-lime-300 hover:bg-lime-400/20"
                  >
                    <Eye className="h-4 w-4" /> Open
                  </a>
                </>
              ) : (
                <>
                  <p className="text-sm text-white/50">Publish to get a shareable link for your clients.</p>
                  <button
                    onClick={() => publish(activeProject)}
                    disabled={publishing}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
                  >
                    {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                    Publish & Get Link
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Existing projects */}
      {projects.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
            <ImageIcon className="h-3.5 w-3.5" /> Your Walkthrough Projects
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <div key={p.id} className="rounded-xl border border-white/10 bg-zinc-950 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-white">{p.title}</h3>
                    <p className="mt-0.5 text-xs text-white/40">{p.images?.length || 0} images · {p.viewpoints?.length || 0} viewpoints</p>
                  </div>
                  <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                    p.published ? "border-lime-400/40 bg-lime-400/10 text-lime-300" : "border-white/15 bg-white/5 text-white/40"
                  }`}>
                    {p.published ? "PUBLISHED" : "DRAFT"}
                  </span>
                </div>
                {p.description && <p className="mt-2 text-xs text-white/50 line-clamp-2">{p.description}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => openProject(p)}
                    className="inline-flex items-center gap-1 rounded-lg border border-lime-400/30 bg-lime-400/10 px-3 py-1.5 text-xs font-medium text-lime-300 hover:bg-lime-400/20"
                  >
                    <Eye className="h-3 w-3" /> View
                  </button>
                  {p.published && p.share_token && (
                    <button
                      onClick={() => copyLink(p.share_token)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10"
                    >
                      <Copy className="h-3 w-3" /> Copy Link
                    </button>
                  )}
                  <button
                    onClick={() => deleteProject(p.id)}
                    className="ml-auto inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/40 hover:border-red-400/40 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}