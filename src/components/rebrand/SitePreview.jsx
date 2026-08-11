import React, { useState, useEffect, useMemo } from "react";
import { Panel } from "@/components/ui";
import { ExternalLink, MousePointer, Globe, AlertCircle } from "lucide-react";

export default function SitePreview({ project, onElementClick }) {
  const [mode, setMode] = useState("inspector");
  const [iframeKey, setIframeKey] = useState(0);

  const vercelUrl = project?.provisioning?.vercel?.url;
  const scrapedHtml = project?.scrape?.html_snapshot;

  const inspectorHtml = useMemo(() => {
    if (!scrapedHtml) return null;
    const base = project?.target_url || "";
    const inject = `
<base href="${base}">
<style>
  * { cursor: crosshair !important; }
  [data-rb-sel] { outline: 3px solid #D4FF4D !important; outline-offset: 2px !important; }
  [data-rb-hov] { outline: 2px dashed #D4FF4D80 !important; outline-offset: 1px !important; }
</style>
<script>
document.addEventListener('click', function(e) {
  e.preventDefault(); e.stopPropagation();
  const p = document.querySelector('[data-rb-sel]'); if (p) p.removeAttribute('data-rb-sel');
  e.target.setAttribute('data-rb-sel', '1');
  const path = []; let n = e.target;
  while (n && n.nodeType === 1 && n.tagName !== 'HTML') {
    let s = n.tagName.toLowerCase();
    if (n.id) s += '#' + n.id; else if (n.className) s += '.' + String(n.className).split(' ').slice(0,2).join('.');
    path.unshift(s); n = n.parentNode;
  }
  window.parent.postMessage({ type: 'rb_click', tag: e.target.tagName, text: (e.target.textContent||'').slice(0,300), classes: e.target.className||'', html: (e.target.outerHTML||'').slice(0,800), path: path.join(' > ') }, '*');
}, true);
document.addEventListener('mouseover', function(e) {
  const p = document.querySelector('[data-rb-hov]'); if (p) p.removeAttribute('data-rb-hov');
  if (!e.target.hasAttribute('data-rb-sel')) e.target.setAttribute('data-rb-hov', '1');
}, true);
document.addEventListener('mouseout', function(e) { if (e.target.hasAttribute('data-rb-hov')) e.target.removeAttribute('data-rb-hov'); }, true);
</script>`;
    if (scrapedHtml.includes("<head>")) return scrapedHtml.replace("<head>", `<head>${inject}`);
    if (scrapedHtml.includes("<html")) return scrapedHtml.replace("<html", `${inject}<html`);
    return `${inject}${scrapedHtml}`;
  }, [scrapedHtml, project?.target_url]);

  useEffect(() => {
    const handler = (e) => { if (e.data?.type === "rb_click") onElementClick?.(e.data); };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onElementClick]);

  useEffect(() => {
    if (vercelUrl && !scrapedHtml) setMode("live");
    if (scrapedHtml && !vercelUrl) setMode("inspector");
  }, [vercelUrl, scrapedHtml]);

  if (!project) return <Panel title="Site Preview"><div className="text-sm text-white/40 py-8 text-center">Select a project to view its site.</div></Panel>;

  return (
    <Panel
      title="Site Preview"
      action={
        <div className="flex items-center gap-1">
          {scrapedHtml && (
            <button onClick={() => setMode("inspector")} className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${mode === "inspector" ? "bg-lime-400/20 text-lime-300" : "text-white/50 hover:bg-white/5"}`}>
              <MousePointer className="h-3 w-3" /> Inspector
            </button>
          )}
          {vercelUrl && (
            <button onClick={() => setMode("live")} className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${mode === "live" ? "bg-lime-400/20 text-lime-300" : "text-white/50 hover:bg-white/5"}`}>
              <Globe className="h-3 w-3" /> Live
            </button>
          )}
          <button onClick={() => setIframeKey(k => k + 1)} className="rounded-md px-2 py-1 text-xs text-white/50 hover:bg-white/5">↻</button>
        </div>
      }
    >
      {/* URL bar */}
      <div className="mb-2 flex items-center gap-2 rounded-lg border border-white/10 bg-black px-3 py-1.5">
        <Globe className="h-3.5 w-3.5 text-white/30" />
        <span className="flex-1 truncate text-xs text-white/50 font-mono">
          {mode === "live" ? vercelUrl : project.target_url}
        </span>
        {mode === "live" && vercelUrl && (
          <a href={vercelUrl} target="_blank" rel="noreferrer" className="text-white/40 hover:text-lime-400">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white" style={{ height: "500px" }}>
        {mode === "inspector" && !scrapedHtml && (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <AlertCircle className="h-8 w-8 text-white/30" />
            <p className="text-sm text-white/60">No scraped HTML yet.</p>
            <p className="text-xs text-white/40">Run a legal scan from Clone Studio first to enable point-and-click inspector mode.</p>
          </div>
        )}
        {mode === "live" && !vercelUrl && (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <AlertCircle className="h-8 w-8 text-white/30" />
            <p className="text-sm text-white/60">Not provisioned yet.</p>
            <p className="text-xs text-white/40">Approve & launch from Clone Studio to provision the Vercel site.</p>
          </div>
        )}
        {mode === "inspector" && scrapedHtml && (
          <iframe
            key={`insp-${iframeKey}`}
            srcDoc={inspectorHtml}
            className="h-full w-full"
            sandbox="allow-scripts allow-same-origin"
            title="Inspector Preview"
          />
        )}
        {mode === "live" && vercelUrl && (
          <>
            <iframe key={`live-${iframeKey}`} src={vercelUrl} className="h-full w-full" title="Live Preview" />
            <div className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/80 px-2 py-1 text-[10px] text-white/50">
              If blank, site blocks embedding — use ↗ to open
            </div>
          </>
        )}
      </div>

      {mode === "inspector" && scrapedHtml && (
        <p className="mt-2 text-xs text-white/40 flex items-center gap-1">
          <MousePointer className="h-3 w-3 text-lime-400" />
          Click any element to analyze it with AI — legal compliance, replacement suggestions, SEO notes.
        </p>
      )}
    </Panel>
  );
}