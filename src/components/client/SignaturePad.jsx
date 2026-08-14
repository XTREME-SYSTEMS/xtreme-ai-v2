import { useRef, useEffect } from "react";
import { Eraser } from "lucide-react";

// Reusable signature pad — works with mouse (desktop) and touch (mobile).
// Calls onChange(dataUrl) when ink exists, onChange(null) when cleared.
export default function SignaturePad({ onChange, className }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const hasInkRef = useRef(false);

  // Size the canvas to its container for crisp strokes on retina, and keep it
  // in sync when the container resizes (modal open, orientation change, etc.).
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const setup = () => {
      const ratio = window.devicePixelRatio || 1;
      const rect = c.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      // Preserve existing drawing across resizes.
      const snap = document.createElement("canvas");
      snap.width = c.width;
      snap.height = c.height;
      snap.getContext("2d").drawImage(c, 0, 0);
      c.width = rect.width * ratio;
      c.height = rect.height * ratio;
      const ctx = c.getContext("2d");
      ctx.scale(ratio, ratio);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.drawImage(snap, 0, 0, snap.width / ratio, snap.height / ratio);
    };
    setup();
    const ro = new ResizeObserver(setup);
    ro.observe(c);
    return () => ro.disconnect();
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
    if (!hasInkRef.current) {
      hasInkRef.current = true;
      onChange?.(canvasRef.current.toDataURL("image/png"));
    }
  };

  const stop = () => {
    drawingRef.current = false;
    if (hasInkRef.current) onChange?.(canvasRef.current.toDataURL("image/png"));
  };

  const clear = () => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    hasInkRef.current = false;
    onChange?.(null);
  };

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        className="h-36 w-full touch-none rounded-lg border border-white/15 bg-white sm:h-44"
        onMouseDown={start}
        onMouseMove={draw}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchMove={draw}
        onTouchEnd={stop}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-white/40">{hasInkRef.current ? "Signature captured" : "Draw your signature above"}</span>
        <button onClick={clear} className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white">
          <Eraser className="h-3.5 w-3.5" /> Clear
        </button>
      </div>
    </div>
  );
}