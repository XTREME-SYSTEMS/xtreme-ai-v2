import { useRef, useState, useEffect } from "react";
import { Eraser } from "lucide-react";

// Reusable signature pad — works with mouse (desktop) and touch (mobile).
// Calls onDone(dataUrl) when a signature exists; exposes clear via ref-less internal button.
export default function SignaturePad({ onChange, className }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  // Size the canvas to its container for crisp strokes on retina.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const rect = c.getBoundingClientRect();
      c.width = rect.width * ratio;
      c.height = rect.height * ratio;
      const ctx = c.getContext("2d");
      ctx.scale(ratio, ratio);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const pos = (e) => {
    const c = canvasRef.current;
    const rect = c.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    drawingRef.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasInk) setHasInk(true);
  };

  const stop = () => { drawingRef.current = false; emit(); };

  const emit = () => {
    if (!onChange) return;
    onChange(hasInk ? canvasRef.current.toDataURL("image/png") : null);
  };

  const clear = () => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
    onChange?.(null);
  };

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        className="h-40 w-full touch-none rounded-lg border border-white/15 bg-white"
        onMouseDown={start}
        onMouseMove={draw}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchMove={draw}
        onTouchEnd={stop}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-white/40">{hasInk ? "Signature captured" : "Draw your signature above"}</span>
        <button onClick={clear} className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white">
          <Eraser className="h-3.5 w-3.5" /> Clear
        </button>
      </div>
    </div>
  );
}