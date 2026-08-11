import React from "react";
import { LoadingButton } from "@/components/ui";
import { CheckCircle2, Globe, Rocket, TrendingUp, ExternalLink, RotateCcw } from "lucide-react";

export default function StepLiveSite({ project, onRestart }) {
  const vercelUrl = project?.provisioning?.vercel?.url;
  const domain = project?.selected_domain;
  const liveUrl = vercelUrl ? `https://${vercelUrl.replace(/^https?:\/\//, "")}` : `https://${domain}`;
  const score = project?.validation_score || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-lime-400" /> Site is Live!
          </h2>
          <p className="mt-1 text-sm text-white/50">Your rebranded clone is deployed and racing to rank. Here's your new site:</p>
        </div>
        <LoadingButton onClick={onRestart} variant="primary">
          <RotateCcw className="h-4 w-4" /> Start New Clone
        </LoadingButton>
      </div>

      {/* Success banner */}
      <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-lime-400" />
          <div>
            <div className="text-lg font-bold text-white">{project?.selected_name} is live!</div>
            <div className="text-sm text-white/60">Validation score: {score}/100 · Status: Racing to rank</div>
          </div>
        </div>
      </div>

      {/* Key links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/40 mb-1"><Globe className="h-3 w-3" /> Live URL</div>
          <a href={liveUrl} target="_blank" rel="noreferrer" className="text-sm text-lime-400 truncate hover:text-lime-300 flex items-center gap-1">
            {liveUrl.replace(/^https?:\/\//, "")} <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/40 mb-1"><Rocket className="h-3 w-3" /> Vercel</div>
          {vercelUrl ? (
            <a href={`https://${vercelUrl.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer" className="text-sm text-lime-400 truncate hover:text-lime-300 flex items-center gap-1">
              {vercelUrl.replace(/^https?:\/\//, "")} <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          ) : <div className="text-sm text-white/40">—</div>}
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/40 mb-1"><TrendingUp className="h-3 w-3" /> Rank Engine</div>
          <div className="text-sm text-white">{project?.rank_engine_id ? "Campaign Active" : "Pending"}</div>
        </div>
      </div>

      {/* Live site iframe */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500/60" />
            <span className="h-3 w-3 rounded-full bg-amber-500/60" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
          </div>
          <span className="ml-2 text-xs text-white/40 truncate">{liveUrl}</span>
          <a href={liveUrl} target="_blank" rel="noreferrer" className="ml-auto text-white/40 hover:text-white">
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <iframe
          src={liveUrl}
          className="h-[600px] w-full"
          title="Live deployed site"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}