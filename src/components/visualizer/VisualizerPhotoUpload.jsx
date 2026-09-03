import React, { useState, useRef } from "react";
import { Upload, Camera, X } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";

export default function VisualizerPhotoUpload({ photoUrl, onPhotoUploaded }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      onPhotoUploaded(res.file_url);
      toast({ title: "Photo uploaded", description: "Your floor photo is ready." });
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {!photoUrl ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-8 text-white/60 transition-colors hover:border-amber-400 hover:bg-amber-400/5 hover:text-amber-400 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
              <span className="text-sm font-medium">Uploading...</span>
            </>
          ) : (
            <>
              <Camera className="h-10 w-10" />
              <span className="text-sm font-semibold">Upload a photo of your floor</span>
              <span className="text-xs text-white/40">Take a photo or choose from your gallery</span>
            </>
          )}
        </button>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-white/10">
          <Image src={photoUrl} alt="Your floor" className="h-48 w-full object-cover" fittingType="fill" />
          <button
            onClick={() => onPhotoUploaded("")}
            className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-red-500"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-400 hover:text-black"
          >
            <Upload className="h-3.5 w-3.5" /> Replace
          </button>
        </div>
      )}
    </div>
  );
}