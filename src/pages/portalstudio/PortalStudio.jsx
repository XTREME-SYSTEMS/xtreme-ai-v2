import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Plus, Box,
  Loader2, Trash2, Hammer, Rocket,
} from "lucide-react";
import { usePortalStudio } from "@/lib/PortalStudioContext";
import { usePortalStudioPipeline } from "@/hooks/usePortalStudioPipeline";

export default function PortalStudio() {
  const navigate = useNavigate();
  const { isActive, project, setActiveProjectId, clearActiveProject } = usePortalStudio();
  const { states, progress } = usePortalStudioPipeline();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showNew, setShowNew] = useState(false);

  useEffect(() => { document.title = "Xtreme AI · Build Studio"; }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.PortalStudioProject.list("-created_date", 50);
      setProjects(list || []);
    } catch { setProjects([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadProjects(); }, []);

  const createProject = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const created = await base44.entities.PortalStudioProject.create({
        name: newName.trim(),
        product_type: "marketing_site",
        status: "draft",
        current_step: "welcome",
        visited_steps: ["/portal-studio/welcome"],
        brand_config: {
          app_name: "Xtreme AI",
          primary_color: "#fde047",
          tagline: "Build anything. Launch everything.",
        },
        logs: [`[Xtreme AI] Project created: ${newName.trim()}`],
      });
      setActiveProjectId(created.id);
      setShowNew(false);
      setNewName("");
      navigate("/portal-studio/welcome");
    } catch (e) {
      console.error("Failed to create studio project:", e);
    } finally {
      setCreating(false);
    }
  };

  const deleteProject = async (id, e) => {
    e.stopPropagation();
    try {
      await base44.entities.PortalStudioProject.delete(id);
      loadProjects();
    } catch {}
  };

  // ── Project picker (no active project) ──
  if (!isActive) {
    return (
      <div className="space-y-5 p-4">
        <section className="rounded-2xl border border-yellow-300/30 bg-gradient-to-br from-yellow-300/8 to-transparent p-5">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-yellow-300">
            <Hammer className="h-4 w-4" /> Xtreme AI
          </div>
          <h1 className="mt-2 text-xl font-bold text-white">Build · Refine · Brand · Deploy</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">
            Your AI-guided system for building businesses, apps, brands, and websites. Pick a project or start a new one.
          </p>
        </section>

        <section>
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-yellow-300">Projects</h2>
            <button
              onClick={() => setShowNew((v) => !v)}
              className="inline-flex items-center gap-1 rounded-lg bg-yellow-300 px-2.5 py-1.5 text-xs font-bold text-black"
            >
              <Plus className="h-3.5 w-3.5" /> New
            </button>
          </div>

          {showNew && (
            <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-zinc-950 p-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Project name…"
                className="w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-yellow-300 focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && createProject()}
                autoFocus
              />
              <button
                onClick={createProject}
                disabled={creating || !newName.trim()}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-yellow-300 px-4 py-2.5 text-sm font-bold text-black disabled:opacity-50"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                Create & Open
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-yellow-300" />
            </div>
          ) : projects.length === 0 ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-zinc-950 p-6 text-center">
              <Box className="mx-auto h-8 w-8 text-white/30" />
              <p className="mt-2 text-[13px] text-white/50">No projects yet. Tap "New" to start.</p>
            </div>
          ) : (
            <div className="mt-3 space-y-2.5">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setActiveProjectId(p.id); navigate("/portal-studio/welcome"); }}
                  className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-zinc-950 p-3.5 text-left transition-colors hover:border-yellow-300/50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-300/10">
                    <Hammer className="h-4 w-4 text-yellow-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{p.name}</div>
                    <div className="text-[11px] text-white/50">
                      {p.product_type || "marketing_site"} · {p.visited_steps?.length || 0} steps
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-white/30 group-hover:text-yellow-300" />
                  <button
                    onClick={(e) => deleteProject(p.id, e)}
                    className="shrink-0 rounded-md p-1 text-white/30 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  // ── Dashboard (active project) ──
  return (
    <div className="space-y-5 p-4">
      <section className="rounded-2xl border border-yellow-300/30 bg-gradient-to-br from-yellow-300/8 to-transparent p-5">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-yellow-300">
          <Sparkles className="h-4 w-4" /> {project?.name || "Sandbox Build"}
        </div>
        <h1 className="mt-2 text-xl font-bold text-white">Build Studio</h1>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] text-white/50">
              <span>Progress</span>
              <span>{progress.done} / {progress.total}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-yellow-300 transition-all" style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
          <button
            onClick={() => { clearActiveProject(); navigate("/portal-studio"); }}
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-2 text-[11px] font-medium text-white/70"
          >
            Switch
          </button>
        </div>
      </section>

      <section>
        <h2 className="px-1 text-[11px] font-bold uppercase tracking-wider text-yellow-300">Pipeline</h2>
        <div className="mt-3 space-y-2.5">
          {states.map((s, i) => {
            const step = s.step;
            const Icon = step.icon;
            const StepTag = step.to ? Link : "div";
            const stepProps = step.to ? { to: step.to } : {};
            return (
              <StepTag
                key={step.key}
                {...stepProps}
                className={`flex gap-3 rounded-xl border border-white/10 bg-zinc-950 p-3 ${step.to ? "transition-colors hover:border-yellow-300/40" : ""}`}
              >
                <div className="flex flex-col items-center">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold ${
                    s.completed ? "border-yellow-300 bg-yellow-300/10 text-yellow-300" :
                    s.isCurrent ? "border-yellow-300 bg-yellow-300/15 text-yellow-300" :
                    "border-white/15 bg-zinc-900 text-white/60"
                  }`}>
                    {s.completed ? <CheckCircle2 className="h-4 w-4 text-yellow-300" /> : i + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-yellow-300" />
                    <h3 className="text-[13px] font-semibold text-white">{step.label}</h3>
                    {step.gate && step.gate !== "auto" && (
                      <ShieldCheck className="h-3 w-3 text-rose-400" />
                    )}
                    {s.completed && (
                      <CheckCircle2 className="ml-auto h-3 w-3 text-yellow-300" />
                    )}
                    {step.to && !s.completed && <ArrowRight className="ml-auto h-3 w-3 shrink-0 text-white/30" />}
                  </div>
                  <p className="mt-1 text-[12px] leading-snug text-white/50">{step.body}</p>
                </div>
              </StepTag>
            );
          })}
        </div>
      </section>
    </div>
  );
}