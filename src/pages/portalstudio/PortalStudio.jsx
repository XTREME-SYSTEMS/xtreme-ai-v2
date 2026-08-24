import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Plus, Box,
  Loader2, Trash2, Hammer, Rocket,
} from "lucide-react";
import { usePortalStudio } from "@/lib/PortalStudioContext";
import { usePortalStudioPipeline } from "@/hooks/usePortalStudioPipeline";
import { getVisibleStudioSteps } from "@/lib/portalStudioSteps";

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
          primary_color: "#fbbf24",
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
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-xl border border-amber-400/40 bg-amber-400/5 p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Hammer className="h-4 w-4" /> Xtreme AI
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Build · Refine · Brand · Deploy</h1>
          <p className="mt-2 text-sm text-white/70">
            Xtreme AI is your AI-guided system for building businesses, apps, brands, websites, and automated social media. Pick a project to walk the full build journey, or create a new one.
          </p>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-400">Build Projects</h2>
            <button
              onClick={() => setShowNew((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-300"
            >
              <Plus className="h-3.5 w-3.5" /> New Project
            </button>
          </div>

          {showNew && (
            <div className="mt-4 flex gap-2 rounded-xl border border-white/10 bg-zinc-950 p-4">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Project name (e.g. Acme Roofing — Refinement Build)"
                className="flex-1 rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder-white/30 focus:border-amber-400 focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && createProject()}
                autoFocus
              />
              <button
                onClick={createProject}
                disabled={creating || !newName.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300 disabled:opacity-50"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                Create & Open
              </button>
            </div>
          )}

          {loading ? (
            <div className="mt-6 flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
            </div>
          ) : projects.length === 0 ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-zinc-950 p-8 text-center">
              <Box className="mx-auto h-8 w-8 text-white/30" />
              <p className="mt-3 text-sm text-white/50">No build projects yet. Create one to start building with Xtreme AI.</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setActiveProjectId(p.id); navigate("/portal-studio/welcome"); }}
                  className="group flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-950 p-4 text-left transition-colors hover:border-amber-400/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-400/10">
                    <Hammer className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{p.name}</div>
                    <div className="text-xs text-white/50">
                      {p.product_type || "marketing_site"} · {p.visited_steps?.length || 0} steps visited
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-white/30 group-hover:text-amber-400" />
                  <button
                    onClick={(e) => deleteProject(p.id, e)}
                    className="shrink-0 rounded-md p-1.5 text-white/30 hover:text-red-400"
                    title="Delete"
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
  const approvalSteps = states.filter((s) => s.step.gate && s.step.gate !== "auto");

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <section className="rounded-xl border border-amber-400/40 bg-amber-400/5 p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <Sparkles className="h-4 w-4" /> {project?.name || "Sandbox Build"}
        </div>
        <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Xtreme AI — Build Studio</h1>
        <p className="mt-2 text-sm text-white/70">
          This is the Xtreme AI build experience. Walk every step, refine the UX, harden the flows, and brand it for launch.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>Progress</span>
              <span>{progress.done} / {progress.total} steps</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
          <button
            onClick={() => { clearActiveProject(); navigate("/portal-studio"); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-white/30"
          >
            Switch Project
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-400">Your build pipeline</h2>
        <p className="mt-2 text-sm text-white/70">
          Every build follows the same steps. Steps marked <span className="font-semibold text-amber-400">Approval</span> pause for sign-off in the real portal — here they auto-complete so you can move fast.
        </p>
        <div className="mt-6 space-y-3">
          {states.map((s, i) => {
            const step = s.step;
            const Icon = step.icon;
            const StepTag = step.to ? Link : "div";
            const stepProps = step.to ? { to: step.to } : {};
            return (
              <StepTag
                key={step.key}
                {...stepProps}
                className={`flex gap-4 rounded-xl border border-white/10 bg-zinc-950 p-4 ${step.to ? "transition-colors hover:border-amber-400/40" : ""}`}
              >
                <div className="flex flex-col items-center">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold ${
                    s.completed ? "border-amber-400 bg-amber-400/10 text-amber-400" :
                    s.isCurrent ? "border-amber-400 bg-amber-400/15 text-amber-400" :
                    "border-white/15 bg-zinc-900 text-white/80"
                  }`}>
                    {s.completed ? <CheckCircle2 className="h-5 w-5 text-amber-400" /> : i + 1}
                  </div>
                  {i < states.length - 1 && <div className="mt-1 h-full w-px flex-1 bg-white/10" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-amber-400" />
                    <h3 className="text-sm font-semibold text-white">{step.label}</h3>
                    {step.gate && step.gate !== "auto" ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-rose-400/40 bg-rose-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-300">
                        <ShieldCheck className="h-3 w-3" /> Approval
                      </span>
                    ) : (
                      <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/40">Automatic</span>
                    )}
                    {s.completed && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-amber-400">
                        <CheckCircle2 className="h-3 w-3" /> Done
                      </span>
                    )}
                    {step.to && !s.completed && <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-white/30" />}
                  </div>
                  <p className="mt-1.5 text-sm text-white/60">{step.body}</p>
                </div>
              </StepTag>
            );
          })}
        </div>
      </section>
    </div>
  );
}