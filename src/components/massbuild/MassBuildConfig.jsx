import React, { useState } from "react";
import { Plus, Trash2, Palette, Type, MapPin, Building2, Hash, Sparkles, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const TONE_OPTIONS = ["professional", "friendly", "luxury", "bold", "minimal", "conversational", "authoritative", "energetic"];

export default function MassBuildConfig({ config, onChange }) {
  const update = (field, value) => onChange({ ...config, [field]: value });

  const addListItem = (field, value) => {
    if (!value.trim()) return;
    update(field, [...(config[field] || []), value.trim()]);
  };
  const removeListItem = (field, idx) => update(field, (config[field] || []).filter((_, i) => i !== idx));

  const [cityInput, setCityInput] = useState("");
  const [nameInput, setNameInput] = useState("");

  return (
    <div className="space-y-6">
      {/* Cities */}
      <div className="rounded-xl border border-white/10 bg-zinc-900 p-5">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-5 w-5 text-amber-400" />
          <h3 className="font-bold text-white">Cities</h3>
          <span className="text-xs text-white/40">— all the cities you want websites in</span>
        </div>
        <div className="flex gap-2 mb-3">
          <input
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { addListItem("cities", cityInput); setCityInput(""); } }}
            placeholder="Enter a city and press Enter (e.g. Phoenix, AZ)"
            className="flex-1 rounded-lg bg-black border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-400 outline-none"
          />
          <button onClick={() => { addListItem("cities", cityInput); setCityInput(""); }} className="rounded-lg bg-amber-400 text-black px-4 py-2 text-sm font-bold hover:bg-amber-300">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(config.cities || []).map((city, i) => (
            <span key={i} className="flex items-center gap-1.5 rounded-lg bg-amber-400/10 border border-amber-400/30 px-3 py-1.5 text-sm text-amber-400">
              {city}
              <button onClick={() => removeListItem("cities", i)} className="hover:text-white"><Trash2 className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      </div>

      {/* Website Names */}
      <div className="rounded-xl border border-white/10 bg-zinc-900 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-5 w-5 text-amber-400" />
          <h3 className="font-bold text-white">Website Names</h3>
          <span className="text-xs text-white/40">— business names to use</span>
        </div>
        <div className="flex gap-2 mb-3">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { addListItem("website_names", nameInput); setNameInput(""); } }}
            placeholder="Enter a name and press Enter (e.g. Phoenix Epoxy Pros)"
            className="flex-1 rounded-lg bg-black border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-400 outline-none"
          />
          <button onClick={() => { addListItem("website_names", nameInput); setNameInput(""); }} className="rounded-lg bg-amber-400 text-black px-4 py-2 text-sm font-bold hover:bg-amber-300">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(config.website_names || []).map((name, i) => (
            <span key={i} className="flex items-center gap-1.5 rounded-lg bg-amber-400/10 border border-amber-400/30 px-3 py-1.5 text-sm text-amber-400">
              {name}
              <button onClick={() => removeListItem("website_names", i)} className="hover:text-white"><Trash2 className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="rounded-xl border border-white/10 bg-zinc-900 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="h-5 w-5 text-amber-400" />
          <h3 className="font-bold text-white">Colors</h3>
          <span className="text-xs text-white/40">— background & accent for all sites</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Background Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={config.background_color || "#0A0A0A"} onChange={(e) => update("background_color", e.target.value)} className="h-10 w-14 rounded border border-white/10 bg-black cursor-pointer" />
              <input value={config.background_color || "#0A0A0A"} onChange={(e) => update("background_color", e.target.value)} className="flex-1 rounded-lg bg-black border border-white/10 px-3 py-2 text-sm text-white font-mono focus:border-amber-400 outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Accent Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={config.accent_color || "#C5A059"} onChange={(e) => update("accent_color", e.target.value)} className="h-10 w-14 rounded border border-white/10 bg-black cursor-pointer" />
              <input value={config.accent_color || "#C5A059"} onChange={(e) => update("accent_color", e.target.value)} className="flex-1 rounded-lg bg-black border border-white/10 px-3 py-2 text-sm text-white font-mono focus:border-amber-400 outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Color Strategy</label>
            <select value={config.color_strategy || "fixed"} onChange={(e) => update("color_strategy", e.target.value)} className="w-full rounded-lg bg-black border border-white/10 px-3 py-2 text-sm text-white focus:border-amber-400 outline-none">
              <option value="fixed">Fixed — all sites same colors</option>
              <option value="per_city">Per City — vary accent by city</option>
              <option value="per_site">Per Site — unique per site</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tones */}
      <div className="rounded-xl border border-white/10 bg-zinc-900 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Type className="h-5 w-5 text-amber-400" />
          <h3 className="font-bold text-white">Content Tones</h3>
          <span className="text-xs text-white/40">— select multiple, cycled across sites</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TONE_OPTIONS.map((tone) => (
            <button
              key={tone}
              onClick={() => {
                const tones = config.tones || [];
                update("tones", tones.includes(tone) ? tones.filter((t) => t !== tone) : [...tones, tone]);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium border transition-all",
                (config.tones || []).includes(tone)
                  ? "bg-amber-400 text-black border-amber-400"
                  : "bg-black text-white/60 border-white/10 hover:border-white/30"
              )}
            >
              {tone}
            </button>
          ))}
        </div>
      </div>

      {/* Logo + Count + Strategy */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-white text-sm">Logos Per Site</h3>
          </div>
          <input type="number" min="1" max="10" value={config.logo_count || 1} onChange={(e) => update("logo_count", parseInt(e.target.value) || 1)} className="w-full rounded-lg bg-black border border-white/10 px-3 py-2 text-sm text-white focus:border-amber-400 outline-none" />
          <p className="text-xs text-white/40 mt-2">How many logo options to generate per site</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-white text-sm">Sites to Create</h3>
          </div>
          <select value={config.site_count_target || 1} onChange={(e) => update("site_count_target", parseInt(e.target.value))} className="w-full rounded-lg bg-black border border-white/10 px-3 py-2 text-sm text-white focus:border-amber-400 outline-none">
            {[1, 5, 10, 25, 50, 100, 250, 500].map((n) => <option key={n} value={n}>{n} websites</option>)}
          </select>
          <p className="text-xs text-white/40 mt-2">Total websites in this batch</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-white text-sm">Name Strategy</h3>
          </div>
          <select value={config.name_strategy || "cartesian"} onChange={(e) => update("name_strategy", e.target.value)} className="w-full rounded-lg bg-black border border-white/10 px-3 py-2 text-sm text-white focus:border-amber-400 outline-none">
            <option value="cartesian">Cartesian — every city × every name</option>
            <option value="paired">Paired — city[i] + name[i]</option>
            <option value="cycle_names">Cycle — cycle names across cities</option>
          </select>
          <p className="text-xs text-white/40 mt-2">How to combine cities + names</p>
        </div>
      </div>
    </div>
  );
}