import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Panel, LoadingButton } from "@/components/ui";
import { Check } from "lucide-react";

const PRESETS = [
  { name: "Neon Lime", primary: "#D4FF4D", accent: "#A3E635" },
  { name: "Electric Blue", primary: "#0066FF", accent: "#3B82F6" },
  { name: "Hot Pink", primary: "#FF0066", accent: "#EC4899" },
  { name: "Sunset Orange", primary: "#FF6600", accent: "#F97316" },
  { name: "Royal Purple", primary: "#9933FF", accent: "#A855F7" },
  { name: "Cyan", primary: "#00FFFF", accent: "#06B6D4" },
  { name: "Crimson", primary: "#DC143C", accent: "#EF4444" },
  { name: "Emerald", primary: "#10B981", accent: "#34D399" },
  { name: "Gold", primary: "#FFD700", accent: "#FCD34D" },
  { name: "Magenta", primary: "#FF00FF", accent: "#E879F9" },
];

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export default function ColorStudio({ project, onUpdated }) {
  const [activeColor, setActiveColor] = useState("primary");
  const [hsl, setHsl] = useState({ h: 84, s: 100, l: 59 });
  const [saving, setSaving] = useState(false);

  const currentColors = project?.rebrand_package?.new_brand?.colors || { primary: "#D4FF4D", accent: "#A3E635" };

  useEffect(() => {
    const hex = currentColors[activeColor];
    if (hex) {
      const [h, s, l] = hexToHsl(hex);
      setHsl({ h, s, l });
    }
  }, [activeColor, currentColors[activeColor]]);

  const liveColor = hslToHex(hsl.h, hsl.s, hsl.l);

  const applyColor = async () => {
    setSaving(true);
    const newColors = { ...currentColors, [activeColor]: liveColor };
    try {
      await base44.functions.invoke("rebrandAssistant", {
        action: "update_colors",
        project_id: project.id,
        colors: newColors,
      });
      onUpdated?.();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const applyPreset = async (preset) => {
    setSaving(true);
    try {
      await base44.functions.invoke("rebrandAssistant", {
        action: "update_colors",
        project_id: project.id,
        colors: { primary: preset.primary, accent: preset.accent },
      });
      onUpdated?.();
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const updateHsl = (key, val) => {
    setHsl(prev => ({ ...prev, [key]: val }));
  };

  return (
    <Panel title="Color Studio" action={<span className="text-xs text-white/40">Real-time spectrum</span>}>
      {/* Active color toggle */}
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => setActiveColor("primary")}
          className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${activeColor === "primary" ? "bg-lime-400/20 text-lime-300" : "text-white/50 hover:bg-white/5"}`}
        >
          <div className="h-3 w-3 rounded" style={{ background: currentColors.primary }} /> Primary
        </button>
        <button
          onClick={() => setActiveColor("accent")}
          className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${activeColor === "accent" ? "bg-lime-400/20 text-lime-300" : "text-white/50 hover:bg-white/5"}`}
        >
          <div className="h-3 w-3 rounded" style={{ background: currentColors.accent }} /> Accent
        </button>
      </div>

      {/* Hue slider — full spectrum */}
      <div className="mb-3">
        <label className="text-xs text-white/40 mb-1 block">Hue Spectrum</label>
        <input
          type="range" min="0" max="360" value={hsl.h}
          onChange={e => updateHsl("h", +e.target.value)}
          className="w-full h-6 rounded-lg appearance-none cursor-pointer"
          style={{ background: "linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))" }}
        />
      </div>

      {/* Saturation + Lightness */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/40 mb-1 block">Saturation: {hsl.s}%</label>
          <input type="range" min="0" max="100" value={hsl.s} onChange={e => updateHsl("s", +e.target.value)} className="w-full h-2 rounded appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, hsl(${hsl.h},0%,${hsl.l}%), hsl(${hsl.h},100%,${hsl.l}%))` }} />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Lightness: {hsl.l}%</label>
          <input type="range" min="0" max="100" value={hsl.l} onChange={e => updateHsl("l", +e.target.value)} className="w-full h-2 rounded appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #000, hsl(${hsl.h},${hsl.s}%,50%), #fff)` }} />
        </div>
      </div>

      {/* Current hex display */}
      <div className="mb-3 flex items-center justify-between rounded-lg border border-white/10 bg-black px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded" style={{ background: liveColor }} />
          <span className="font-mono text-sm text-white">{liveColor.toUpperCase()}</span>
        </div>
        <span className="text-xs text-white/40">hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</span>
      </div>

      {/* Real-time mini preview */}
      <div className="mb-3 rounded-lg border border-white/10 overflow-hidden">
        <div className="p-3" style={{ background: currentColors.primary }}>
          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "#000" }}>Your Brand</div>
          <div className="mt-1 text-[10px]" style={{ color: "#000", opacity: 0.7 }}>Hero headline preview</div>
          <button className="mt-2 rounded px-2 py-1 text-[10px] font-medium" style={{ background: currentColors.accent, color: "#000" }}>Get Quote</button>
        </div>
        <div className="p-3 bg-black">
          <div className="flex items-center gap-2">
            <div className="h-2 w-12 rounded" style={{ background: currentColors.accent }} />
            <div className="h-1 w-20 rounded bg-white/20" />
          </div>
          <div className="mt-1 h-1 w-16 rounded bg-white/10" />
        </div>
      </div>

      {/* Presets */}
      <div className="mb-3">
        <label className="text-xs text-white/40 mb-1.5 block">Quick Presets</label>
        <div className="grid grid-cols-5 gap-1.5">
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => applyPreset(p)} disabled={saving} title={p.name} className="group relative rounded-md border border-white/10 p-1 hover:border-white/30 disabled:opacity-50">
              <div className="flex h-6 items-center gap-0.5 rounded">
                <div className="h-4 flex-1 rounded-l" style={{ background: p.primary }} />
                <div className="h-4 w-2 rounded-r" style={{ background: p.accent }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      <LoadingButton onClick={applyColor} loading={saving} variant="primary" className="w-full justify-center">
        <Check className="h-3.5 w-3.5" /> Apply {activeColor} color
      </LoadingButton>
    </Panel>
  );
}