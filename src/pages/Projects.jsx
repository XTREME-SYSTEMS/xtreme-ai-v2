import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  FolderOpen, Loader2, Play, CheckCircle, Archive, Plus, ArrowLeft, AlertCircle,
} from "lucide-react";
import { useClientUser } from "@/hooks/useClientUser";
import { useClientProject } from "@/hooks/useClientProject";
import { resumeProject } from "@/lib/projectReset";
import StartNewProjectButton from "@/components/client/StartNewProjectButton";
import BackButton from "@/components/client/BackButton";

// Projects page — lists every project for the client (the active one plus all
// archived/saved ones). The user can resume a saved project to pick up where
// they left off, or start a brand-new one (which archives the current).
export default function Projects() {
  const { user } = useClientUser();
  const { project: currentProject, reload } = useClientProject(user);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resuming, setResuming] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    if (!user?.email) { setLoading(false); return; }
    try {
      const list = await base44.entities.ClientProject.filter(
        { client_email: user.email }, "-created_date", 50
      );
      setAll(list || []);
    } catch { setAll([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.email]);
  useEffect(() => { document.title = "My Projects · Lead Gen Near You"; }, []);

  const handleResume = async (target) => {
    setResuming(target.id);
    setError("");
    try {
      await resumeProject(user, currentProject, target);
      await reload();
      navigate("/business-generator");
    } catch (e) {
      setError("Couldn't resume that project. Please try again.");
      setResuming(null);
    }
  };

  const fmtDate = (iso) => {
    if (!iso) return "";
    try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
    catch { return ""; }
  };

  const progressLabel = (p) => {
    if (p?.status === "launched") return "Launched";
    if (p?.vision?.approved && p?.strategy?.approved) return "Building";
    if (p?.vision?.approved) return "Vision set";
    return "Getting started";
  };

  return (
    <div className="space-y-5">
      <BackButton to="/business-generator" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-zinc-950 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/15">
            <FolderOpen className="h-5 w-5 text-lime-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">My Projects</h1>
            <p className="text-sm text-white/50">
              Pick up where you left off, or start a brand-new project. Saved projects keep all your progress.
            </p>
          </div>
        </div>
        <StartNewProjectButton user={user} project={currentProject} />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-300">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-950 p-12 text-sm text-white/50">
          <Loader2 className="h-5 w-5 animate-spin text-lime-400" /> Loading your projects…
        </div>
      ) : all.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-12 text-center">
          <p className="text-sm text-white/50">No projects yet. Start your first one!</p>
          <div className="mt-4 flex justify-center">
            <StartNewProjectButton user={user} project={currentProject} />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {all.map((p) => {
            const isActive = !p.archived;
            const isResuming = resuming === p.id;
            return (
              <div
                key={p.id}
                className={`flex flex-col rounded-xl border p-4 transition-colors ${
                  isActive
                    ? "border-lime-400/50 bg-lime-400/5"
                    : "border-white/10 bg-zinc-950 hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 rounded bg-lime-400/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lime-400">
                          <CheckCircle className="h-3 w-3" /> Current
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/50">
                          <Archive className="h-3 w-3" /> Saved
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1.5 truncate text-sm font-semibold text-white">
                      {p.project_name || p.business_name || "Untitled Project"}
                    </h3>
                    {p.business_name && p.business_name !== p.project_name && (
                      <p className="truncate text-xs text-white/40">{p.business_name}</p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-white/50">
                  {p.industry && <span className="rounded bg-white/5 px-1.5 py-0.5">{p.industry}</span>}
                  {p.profile?.primary_location && (
                    <span className="rounded bg-white/5 px-1.5 py-0.5">{p.profile.primary_location}</span>
                  )}
                  <span className="rounded bg-white/5 px-1.5 py-0.5">{progressLabel(p)}</span>
                </div>

                <div className="mt-2 text-[11px] text-white/30">
                  {p.created_date ? `Started ${fmtDate(p.created_date)}` : ""}
                </div>

                <div className="mt-4 flex-1" />
                <button
                  type="button"
                  onClick={() => handleResume(p)}
                  disabled={isResuming || isActive}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  style={
                    isActive
                      ? { background: "rgba(255,234,0,0.1)", color: "#FFEA00" }
                      : { background: "#FFEA00", color: "#000" }
                  }
                >
                  {isResuming ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Resuming…</>
                  ) : isActive ? (
                    <><CheckCircle className="h-4 w-4" /> Active</>
                  ) : (
                    <><Play className="h-4 w-4" /> Resume</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}