import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Plays a sequence of generated video clips back-to-back as one continuous
// video. Longer videos (15s, 30s, 45s) are composed of multiple 8-second
// generated clips, since the platform generates up to 8 seconds per clip.
// Shows a small scene-progress indicator when there is more than one clip.
export default function VideoClipPlayer({ clips, className, autoPlay = true, muted = true, loop = true }) {
  const [idx, setIdx] = useState(0);
  const videoRef = useRef(null);

  // Reset to the first clip whenever the clip set changes.
  useEffect(() => { setIdx(0); }, [clips]);

  // Auto-play the current clip when it becomes active.
  useEffect(() => {
    const v = videoRef.current;
    if (v && autoPlay) v.play().catch(() => {});
  }, [idx, autoPlay, clips]);

  const onEnded = () => {
    if (idx < clips.length - 1) setIdx(idx + 1);
    else if (loop) setIdx(0);
  };

  if (!clips || clips.length === 0) return null;
  return (
    <div className={cn("relative h-full w-full", className)}>
      <video
        ref={videoRef}
        src={clips[idx]?.url}
        className="h-full w-full object-cover"
        muted={muted}
        playsInline
        onEnded={onEnded}
      />
      {clips.length > 1 && (
        <div className="absolute bottom-1.5 left-1.5 flex gap-1">
          {clips.map((c, i) => (
            <span
              key={i}
              className={cn("h-1 rounded-full transition-all", i === idx ? "w-5 bg-lime-400" : "w-2 bg-white/40")}
            />
          ))}
        </div>
      )}
    </div>
  );
}