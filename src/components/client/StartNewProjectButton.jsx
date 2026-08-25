import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2, AlertTriangle, X } from "lucide-react";
import { resetCurrentProject } from "@/lib/projectReset";

// "Start New Project" — wipes all pipeline-generated data (vision, strategy,
// content, logo, brand, website, social, video) and the business profile so
// the user can begin a brand-new project without old data leaking in. The
// account, plan, and purchases are untouched.
export default function StartNewProjectButton({ user, project, className = "" }) {
  const [open, setOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const doReset = async () => {
    setResetting(true);
    setError("");
    try {
      await resetCurrentProject(user, project);
      navigate("/business-name-studio");
    } catch (e) {
      setError("Couldn't start a new project. Please try again.");
      setResetting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-lime-400/40 bg-lime-400/10 px-4 py-2 text-sm font-semibold text-lime-300 transition-colors hover:bg-lime-400/20 ${className}`}
      >
        <Plus className="h-4 w-4" /> Start New Project
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-950 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="text-lg font-bold text-white">Start a New Project?</h2>
              </div>
              <button
                onClick={() => !resetting && setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-3 text-sm text-white/70">
              This will <span className="font-semibold text-white">permanently clear</span> your current project —
              your business profile, vision, strategy, content, logo, brand, website, social, and video assets.
              You'll start fresh from the Business Name step.
            </p>
            <p className="mt-2 text-xs text-white/50">
              Your account, plan, and purchases are not affected.
            </p>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <div className="mt-5 flex gap-2">
              <button
                onClick={doReset}
                disabled={resetting}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300 disabled:opacity-50"
              >
                {resetting ? <><Loader2 className="h-4 w-4 animate-spin" /> Resetting…</> : <>Yes, Start Fresh</>}
              </button>
              <button
                onClick={() => setOpen(false)}
                disabled={resetting}
                className="inline-flex items-center justify-center rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-white/70 hover:border-white/30 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}