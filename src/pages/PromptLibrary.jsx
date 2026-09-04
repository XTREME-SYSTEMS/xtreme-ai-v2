import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  BookOpen, Loader2, RefreshCw, Search, Brain, Wrench, ShieldCheck,
  Rocket, Activity, Zap, Eye, ChevronDown, ChevronUp, Copy, Check
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "audit", label: "Audit", icon: Eye, color: "text-blue-400" },
  { key: "heal", label: "Heal", icon: Wrench, color: "text-emerald-400" },
  { key: "harden", label: "Harden", icon: ShieldCheck, color: "text-amber-400" },
  { key: "optimize", label: "Optimize", icon: Zap, color: "text-lime-400" },
  { key: "manage", label: "Manage", icon: Activity, color: "text-cyan-400" },
  { key: "launch", label: "Launch", icon: Rocket, color: "text-rose-400" },
  { key: "preflight", label: "Preflight", icon: Brain, color: "text-violet-400" },
  { key: "daily_ops", label: "Daily Ops", icon: Activity, color: "text-orange-400" },
];

const PRIORITY_COLORS = {
  critical: "text-red-400 border-red-400/40 bg-red-400/10",
  high: "text-amber-400 border-amber-400/40 bg-amber-400/10",
  medium: "text-blue-400 border-blue-400/40 bg-blue-400/10",
  low: "text-white/40 border-white/10 bg-white/5",
};

export default function PromptLibrary() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [copied, setCopied] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => { document.title = "Prompt Library · Xtreme AI"; loadPrompts(); }, []);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.SystemPrompt.list("sort_order", 500);
      setPrompts(res || []);
    } catch (err) {
      // If no prompts yet, show empty state
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  };

  const seedPrompts = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke("seedPromptLibrary", {});
      await loadPrompts();
    } catch (err) {
      console.error("Seed failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyPrompt = async (id, text) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = prompts.filter(p => {
    const matchCat = activeCategory === "all" || p.category === activeCategory;
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.prompt_text?.toLowerCase().includes(search.toLowerCase()) || p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const counts = CATEGORIES.reduce((acc, c) => {
    acc[c.key] = prompts.filter(p => p.category === c.key).length;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lime-400">
              <Brain className="h-4 w-4" /> System Optimization Prompt Library
            </div>
            <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Self-Healing · Self-Hardening · Self-Optimizing Prompts</h1>
            <p className="mt-1 text-sm text-white/60">
              Curated prompts designed to make the system fully operational, self-managing, and launch-ready.
              Used by the System Operator agent and daily management workflows.
            </p>
          </div>
          <button
            onClick={seedPrompts}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {prompts.length === 0 ? "Seed Library" : "Re-seed"}
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts by title, text, or tags…"
            className="w-full rounded-lg border border-white/10 bg-zinc-950 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-lime-400/50 focus:outline-none"
          />
        </div>

        {/* Category filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
              activeCategory === "all" ? "border-lime-400 bg-lime-400/15 text-lime-300" : "border-white/10 text-white/60 hover:border-white/25"
            )}
          >
            All ({prompts.length})
          </button>
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                onClick={() => setActiveCategory(c.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                  activeCategory === c.key ? "border-lime-400 bg-lime-400/15 text-lime-300" : "border-white/10 text-white/60 hover:border-white/25"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", c.color)} />
                {c.label} ({counts[c.key] || 0})
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompt cards */}
      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-zinc-950 py-16 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-white/20" />
            <p className="mt-3 text-sm text-white/50">No prompts yet. Click "Seed Library" to populate.</p>
          </div>
        ) : (
          filtered.map((prompt) => {
            const cat = CATEGORIES.find(c => c.key === prompt.category);
            const CatIcon = cat?.icon || BookOpen;
            const isExpanded = expanded === prompt.id;
            return (
              <div key={prompt.id} className="overflow-hidden rounded-lg border border-white/10 bg-zinc-950">
                <button
                  onClick={() => setExpanded(isExpanded ? null : prompt.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
                >
                  <CatIcon className={cn("h-5 w-5 shrink-0", cat?.color || "text-white/50")} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{prompt.title}</span>
                      {prompt.priority && (
                        <span className={cn("rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase", PRIORITY_COLORS[prompt.priority] || PRIORITY_COLORS.low)}>
                          {prompt.priority}
                        </span>
                      )}
                    </div>
                    {prompt.target_system && (
                      <div className="mt-0.5 text-xs text-white/40">Target: {prompt.target_system}</div>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-white/10 px-4 py-3">
                    {prompt.description && (
                      <p className="mb-2 text-xs text-white/60">{prompt.description}</p>
                    )}
                    <div className="relative">
                      <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black p-3 text-xs text-white/70">
                        {prompt.prompt_text}
                      </pre>
                      <button
                        onClick={() => copyPrompt(prompt.id, prompt.prompt_text)}
                        className="absolute right-2 top-2 rounded-lg border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-white/60 hover:border-lime-400/50 hover:text-lime-400"
                      >
                        {copied === prompt.id ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                      </button>
                    </div>
                    {prompt.expected_output && (
                      <div className="mt-2 text-xs text-white/40">
                        <span className="font-semibold text-white/60">Expected output:</span> {prompt.expected_output}
                      </div>
                    )}
                    {prompt.tags && prompt.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {prompt.tags.map((tag) => (
                          <span key={tag} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}