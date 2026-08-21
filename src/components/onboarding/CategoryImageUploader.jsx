import { Upload, X } from "lucide-react";

// Categorized image uploader for the Business Profile step. Each instance
// manages one category (owner, team, work, other) as
// { urls: [already-uploaded], files: [pending local files] }. Pending files
// are uploaded on submit by the parent. Categorizing photos lets the
// downstream generators place each image in the right spot — owner/team on
// the About page, work photos in galleries and social media, etc.
export default function CategoryImageUploader({ label, description, value, onChange, max = 8 }) {
  const { urls = [], files = [] } = value || {};
  const total = urls.length + files.length;
  const full = total >= max;

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;
    onChange({ urls, files: [...files, ...incoming].slice(0, max) });
  };
  const removeUrl = (i) => onChange({ urls: urls.filter((_, idx) => idx !== i), files });
  const removeFile = (i) => onChange({ urls, files: files.filter((_, idx) => idx !== i) });

  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{label}</div>
          <div className="text-[11px] text-white/40">{description}</div>
        </div>
        <span className="shrink-0 text-[10px] text-white/40">{total}/{max}</span>
      </div>

      {(urls.length > 0 || files.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <div key={`u-${i}`} className="relative">
              <img src={url} alt="" className="h-16 w-16 rounded-lg border border-white/10 object-cover" />
              <button type="button" onClick={() => removeUrl(i)} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {files.map((file, i) => (
            <div key={`l-${i}`} className="relative">
              <img src={URL.createObjectURL(file)} alt="" className="h-16 w-16 rounded-lg border border-lime-400/40 object-cover" />
              <button type="button" onClick={() => removeFile(i)} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!full ? (
        <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-2 text-xs text-white/60 hover:border-lime-400/50">
          <Upload className="h-3.5 w-3.5" />
          {total > 0 ? "Add more" : "Upload photos"}
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        </label>
      ) : (
        <p className="mt-2 text-[11px] text-amber-400">Maximum {max} photos reached.</p>
      )}
    </div>
  );
}