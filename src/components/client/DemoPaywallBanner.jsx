import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight, Sparkles } from "lucide-react";

// Shown on the YourDesigns page when a demo-mode user reaches the finalization
// step. Explains that they've completed the demo workflow and must choose a
// plan to finalize, sign, and export their project.
export default function DemoPaywallBanner({ businessName }) {
  const navigate = useNavigate();

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-lime-400/40 bg-gradient-to-br from-lime-400/10 via-zinc-950 to-zinc-950">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-400/15">
            <Lock className="h-5 w-5 text-lime-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-white">
              {businessName ? `${businessName} is ready!` : "Your project is ready!"}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-white/70">
              You've completed the full demo workflow — content, logo, brand mockups, website design, social media, and videos.
              To finalize, sign your agreement, and export everything, choose a plan below.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => navigate("/pricing")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-300"
              >
                <Sparkles className="h-4 w-4" /> Choose a Plan to Finalize <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}