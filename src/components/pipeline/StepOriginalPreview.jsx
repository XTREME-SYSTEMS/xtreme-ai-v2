import React from "react";
import { LoadingButton } from "@/components/ui";
import { Scan, Globe, AlertCircle, ExternalLink } from "lucide-react";

export default function StepOriginalPreview({ targetUrl, industry, onClone, scanning }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Original Site Preview</h2>
          <p className="mt-1 text-sm text-white/50">Here's the site you're about to clone. Review it, then start the legal scan.</p>
        </div>
        <LoadingButton onClick={onClone} loading={scanning} variant="primary">
          <Scan className="h-4 w-4" /> Clone & Audit This Site
        </LoadingButton>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950 px-4 py-3">
        <Globe className="h-4 w-4 text-lime-400 shrink-0" />
        <span className="text-sm text-white truncate">{targetUrl}</span>
        {industry && <span className="ml-auto rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-0.5 text-xs text-lime-300 shrink-0">{industry}</span>}
        <a href={targetUrl} target="_blank" rel="noreferrer" className="ml-2 text-white/40 hover:text-white shrink-0">
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500/60" />
            <span className="h-3 w-3 rounded-full bg-amber-500/60" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
          </div>
          <span className="ml-2 text-xs text-white/40 truncate">{targetUrl}</span>
        </div>
        <iframe
          src={targetUrl}
          className="h-[600px] w-full"
          title="Original site preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>

      {scanning && (
        <div className="flex items-center gap-3 rounded-lg border border-lime-400/30 bg-lime-400/5 px-4 py-3">
          <Scan className="h-5 w-5 animate-pulse text-lime-400" />
          <div>
            <div className="text-sm font-medium text-white">Scanning & auditing site…</div>
            <div className="text-xs text-white/50">Scraping HTML, extracting images, analyzing legal must-change items, generating 20 name recommendations. This takes ~30 seconds.</div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-zinc-950 px-4 py-3 text-xs text-white/50">
        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <p>The scan identifies ONLY what legally must change (business name, logo, trademarked terms, proprietary images/content) and what can safely be kept (layout, general industry content, color scheme). You'll review everything before any changes are made.</p>
      </div>
    </div>
  );
}