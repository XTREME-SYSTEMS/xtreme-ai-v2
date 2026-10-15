import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import SitePreview from "@/components/rebrand/SitePreview";
import AIChat from "@/components/rebrand/AIChat";
import ColorStudio from "@/components/rebrand/ColorStudio";
import ForensicPanel from "@/components/rebrand/ForensicPanel";
import RebrandChecklist from "@/components/rebrand/RebrandChecklist";
import { Wand2, RefreshCw, Sparkles, ChevronDown, ListChecks, Bot } from "lucide-react";

export default function RebrandStudio() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [project, setProject] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [showSelector, setShowSelector] = useState(false);
  const [tab, setTab] = useState("guided");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.CloneProject.list("-created_date", 50);
      setProjects(list);
      if (list.length && !selectedId) setSelectedId(list[0].id);
    } catch { setProjects([]); }
    setLoading(false);
  }, [selectedId]);

  useEffect(() => { load(); }, [load]);

  const loadProject = useCallback(async (id) => {
    if (!id) return;
    try {
      const p = await base44.entities.CloneProject.get(id);
      setProject(p);
    } catch { setProject(null); }
  }, []);

  useEffect(() => {
    if (selectedId) loadProject(selectedId);
    else setProject(null);
  }, [selectedId, loadProject]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsub = base44.entities.CloneProject.subscribe((event) => {
      if (event.data?.id === selectedId) loadProject(selectedId);
    });
    return unsub;
  }, [selectedId, loadProject]);

  const active = projects.find(p => p.id === selectedId);

  return (
    <div className="space-y-4">
      <PageHeader title="Rebrand Studio" subtitle="AI-guided rebranding with the 12-element minimum-action checklist, real-time preview, and interactive tools.">
        <LoadingButton onClick={load} loading={loading} variant="ghost">
          <RefreshCw className="h-4 w-4" /> Refresh
        </LoadingButton>
      </PageHeader>

      {/* Project selector */}
      <div className="relative">
        <button
          onClick={() => setShowSelector(!showSelector)}
          className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-left hover:bg-white/5"
        >
          <Wand2 className="h-4 w-4 text-lime-400" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">{active?.selected_name || active?.target_url || "Select a project"}</div>
            <div className="text-xs text-white/40">
              {active ? `${active.current_step?.replace(/_/g, " ")} · ${active.validation_score || 0}/100` : "No project selected"}
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${showSelector ? "rotate-180" : ""}`} />
        </button>
        {showSelector && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowSelector(false)} />
            <div className="absolute z-40 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-white/10 bg-zinc-950 shadow-xl">
              {projects.length === 0 ? (
                <div className="p-4 text-sm text-white/40 text-center">No projects yet. Scan a site in Clone Studio first.</div>
              ) : projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedId(p.id); setShowSelector(false); }}
                  className={`flex w-full items-center gap-3 border-b border-white/5 px-4 py-2.5 text-left hover:bg-white/5 ${p.id === selectedId ? "bg-lime-400/5" : ""}`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-lime-400/60" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{p.selected_name || p.target_url}</div>
                    <div className="text-xs text-white/40 truncate">{p.current_step?.replace(/_/g, " ")}</div>
                  </div>
                  {p.validation_score ? <span className="text-xs text-lime-400">{p.validation_score}/100</span> : null}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {!project ? (
        <EmptyState icon={Wand2} title="No project selected" subtitle="Select a clone project above, or scan a new site in Clone Studio to get started." />
      ) : (
        <>
          {/* Tab switcher */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-zinc-950 p-1">
            <button
              onClick={() => setTab("guided")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === "guided" ? "bg-lime-400/10 text-lime-300" : "text-white/50 hover:bg-white/5"
              }`}
            >
              <ListChecks className="h-4 w-4" /> Guided Rebrand
            </button>
            <button
              onClick={() => setTab("studio")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === "studio" ? "bg-lime-400/10 text-lime-300" : "text-white/50 hover:bg-white/5"
              }`}
            >
              <Bot className="h-4 w-4" /> AI Studio
            </button>
          </div>

          {tab === "guided" ? (
            /* Guided Rebrand: checklist + live site preview side by side */
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <RebrandChecklist project={project} onUpdated={() => loadProject(selectedId)} />
              </div>
              <div className="lg:col-span-5">
                <SitePreview project={project} onElementClick={setSelectedElement} />
              </div>
            </div>
          ) : (
            /* AI Studio: chat + preview + color/audit */
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <AIChat
                  project={project}
                  selectedElement={selectedElement}
                  onActionExecuted={() => loadProject(selectedId)}
                />
              </div>
              <div className="lg:col-span-5">
                <SitePreview project={project} onElementClick={setSelectedElement} />
              </div>
              <div className="lg:col-span-3 space-y-4">
                <ColorStudio project={project} onUpdated={() => loadProject(selectedId)} />
                <ForensicPanel project={project} onUpdated={() => loadProject(selectedId)} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}