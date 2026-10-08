import { useState, useRef } from 'react';
import { Upload, X, Loader2, ImagePlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VideoImageUploader({ images, setImages }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const upload = async (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!valid.length) return;
    setUploading(true);
    try {
      const results = await Promise.all(valid.map(file =>
        base44.integrations.Core.UploadPrivateFile({ file }).then(({ file_uri }) => ({
          file_uri,
          name: file.name,
        }))
      ));
      setImages(prev => [...prev, ...results]);
    } catch (e) {
      console.error('Upload failed:', e);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (index) => setImages(prev => prev.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold">Reference images</label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); upload(e.dataTransfer.files); }}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary hover:bg-secondary"
      >
        {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <ImagePlus className="h-6 w-6 text-muted-foreground" />}
        <p className="text-sm text-muted-foreground">{uploading ? 'Uploading…' : 'Click or drop images here (up to 8)'}</p>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => upload(e.target.files)} />
      </div>
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {images.map((img, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary">
              <img src={img.preview || img.file_uri} alt={img.name || `Image ${i + 1}`} className="h-full w-full object-cover" />
              <button onClick={() => remove(i)} className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100" aria-label="Remove image">
                <X className="h-3 w-3" />
              </button>
              <span className="absolute bottom-0 left-0 right-0 truncate bg-background/80 px-1 py-0.5 text-[9px]">{img.name || `Image ${i + 1}`}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">{images.length}/8 images · uploaded images are stored privately — no public URL, so access follows your app's permissions.</p>
    </div>
  );
}