import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { LoadingButton } from "@/components/ui";
import { Search, Globe, Sparkles, ExternalLink } from "lucide-react";

export default function StepSearch({ onSelect }) {
  const [mode, setMode] = useState("search"); // "search" | "url"
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [directUrl, setDirectUrl] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchIndustry = async () => {
    if (!industry.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Find 10 real ${industry} businesses${location ? ` in ${location}` : " in the United States"} that have live websites. For each, return the business name, their website URL (full URL starting with https://), and a 1-sentence description of what they do. Return JSON: { "businesses": [{ "name": string, "url": string, "description": string }] }`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            businesses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  url: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
      });
      setResults(res.businesses || []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const pickUrl = (url, name) => {
    let clean = url.trim();
    if (!clean.startsWith("http")) clean = "https://" + clean;
    onSelect(clean, industry, name);
  };

  const handleDirect = () => {
    if (!directUrl.trim()) return;
    pickUrl(directUrl, "");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Search for a Site to Clone</h2>
        <p className="mt-1 text-sm text-white/50">Search by industry to find real businesses, or paste a URL directly.</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("search")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${mode === "search" ? "bg-lime-400 text-black" : "border border-white/15 text-white/70 hover:bg-white/5"}`}
        >
          <Search className="inline h-4 w-4 mr-1.5" /> Search by Industry
        </button>
        <button
          onClick={() => setMode("url")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${mode === "url" ? "bg-lime-400 text-black" : "border border-white/15 text-white/70 hover:bg-white/5"}`}
        >
          <Globe className="inline h-4 w-4 mr-1.5" /> Enter URL Directly
        </button>
      </div>

      {mode === "search" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Industry *</label>
              <input
                className="pipeline-input"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchIndustry()}
                placeholder="roofing, hvac, dental, landscaping…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Location (optional)</label>
              <input
                className="pipeline-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchIndustry()}
                placeholder="Austin, TX or United States"
              />
            </div>
          </div>
          <LoadingButton onClick={searchIndustry} loading={loading} variant="primary">
            <Search className="h-4 w-4" /> Search for Businesses
          </LoadingButton>

          {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{error}</div>}

          {results.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-white/70">{results.length} businesses found — click one to clone</div>
              {results.map((b, i) => (
                <button
                  key={i}
                  onClick={() => pickUrl(b.url, b.name)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-zinc-950 p-4 text-left transition-colors hover:border-lime-400/40 hover:bg-lime-400/5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-400/10 text-lime-400">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white">{b.name}</div>
                    <div className="text-xs text-lime-400/70 truncate">{b.url}</div>
                    <div className="text-xs text-white/40 truncate mt-0.5">{b.description}</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-white/30 group-hover:text-lime-400 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Sparkles className="mx-auto h-8 w-8 animate-pulse text-lime-400" />
                <div className="mt-3 text-sm text-white/50">Searching the web for {industry} businesses…</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">Website URL *</label>
            <input
              className="pipeline-input"
              value={directUrl}
              onChange={(e) => setDirectUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDirect()}
              placeholder="https://competitor-site.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">Industry (optional — auto-detected)</label>
            <input
              className="pipeline-input"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="roofing, hvac, dental…"
            />
          </div>
          <LoadingButton onClick={handleDirect} variant="primary" disabled={!directUrl.trim()}>
            <Globe className="h-4 w-4" /> Preview This Site
          </LoadingButton>
        </div>
      )}
    </div>
  );
}