import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Eye, CheckCircle2, XCircle, Loader2, FileCode, Sparkles,
  Monitor, Smartphone, Tablet, Copy, ClipboardPaste, Radar,
  ExternalLink, Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

// The visual editor — right side of the studio.
// Shows live intelligence during onboarding, then the GPT website preview.
export default function VisualEditor({
  traceResults, packs, onApprove, onReject, onPasteHtml,
  actionLoading, previewPack, setPreviewPack,
}) {
  const [device, setDevice] = useState("desktop");
  const [showPaste, setShowPaste] = useState(false);
  const [pasteHtml, setPasteHtml] = useState("");
  const [pasting, setPasting] = useState(false);

  const hasPack = previewPack || (packs.length > 0 && packs[0]?.preview_html);
  const activePack = previewPack || packs.find(p => p.preview_html);

  // Intelligence summary from trace results
  const traceEntries = Object.entries(traceResults || {});
  const totalCompetitors = traceEntries.reduce((sum, [, v]) => sum + (v?.trace?.competitors?.length || 0), 0);
  const totalSources = traceEntries.reduce((sum, [, v]) => sum + (v?.trace?.sources?.length || 0), 0);
  const avgConfidence = traceEntries.length > 0
    ? Math.round(traceEntries.reduce((sum, [, v]) => sum + (v?.trace?.confidence_score || 50), 0) / traceEntries.length)
    : 0;

  const handlePaste = async () => {
    if (!pasteHtml.trim()) return;
    setPasting(true);
    try {
      await onPasteHtml?.(pasteHtml.trim());
      setPasteHtml("");
      setShowPaste(false);
    } catch (e) {
      console.error(e);
    }
    setPasting(false);
  };

  const deviceWidth = device === "mobile" ? "375px" : device === "tablet" ? "768px" : "100%";

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Eye className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">Visual Editor</div>
          <div className="text-[11px] text-muted-foreground">
            {activePack ? "Live GPT preview" : traceEntries.length > 0 ? "Intelligence gathering" : "Waiting for input"}
          </div>
        </div>

        {/* Device toggle */}
        <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
          {[
            { key: "desktop", icon: Monitor },
            { key: "tablet", icon: Tablet },
            { key: "mobile", icon: Smartphone },
          ].map(d => {
            const Icon = d.icon;
            return (
              <button
                key={d.key}
                onClick={() => setDevice(d.key)}
                className={cn(
                  "flex h-6 w-7 items-center justify-center rounded transition-colors",
                  device === d.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowPaste(!showPaste)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-muted"
        >
          <ClipboardPaste className="h-3.5 w-3.5" /> Paste HTML
        </button>
      </div>

      {/* Paste HTML bar */}
      {showPaste && (
        <div className="border-b border-border bg-muted/30 p-3 space-y-2">
          <textarea
            value={pasteHtml}
            onChange={(e) => setPasteHtml(e.target.value)}
            placeholder="Paste GPT-generated HTML here to preview it..."
            rows={3}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handlePaste}
              disabled={!pasteHtml.trim() || pasting}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {pasting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Preview & Save
            </button>
            <button
              onClick={() => setShowPaste(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {activePack?.preview_html ? (
          /* Live website preview */
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
              <FileCode className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground truncate">{activePack.name}</span>
              <span className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                activePack.status === "approved" ? "bg-green-500/10 text-green-600" :
                activePack.status === "rejected" ? "bg-destructive/10 text-destructive" :
                "bg-amber-500/10 text-amber-600"
              )}>
                {activePack.status}
              </span>
              {activePack.deployed_url && (
                <a href={activePack.deployed_url} target="_blank" rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" /> Live
                </a>
              )}
            </div>
            <div className="flex-1 overflow-auto bg-zinc-900 p-4 flex justify-center">
              <div style={{ width: deviceWidth, maxWidth: "100%" }} className="h-full">
                <iframe
                  srcDoc={activePack.preview_html}
                  className="h-full w-full rounded-lg border border-border bg-white"
                  style={{ minHeight: "400px" }}
                  title={activePack.name}
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
            {/* Approve / Reject bar */}
            {activePack.status === "pending" && (
              <div className="flex items-center justify-end gap-3 border-t border-border p-3">
                <button
                  onClick={() => onReject?.(activePack)}
                  disabled={actionLoading === activePack.id + "_reject"}
                  className="flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  {actionLoading === activePack.id + "_reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Reject
                </button>
                <button
                  onClick={() => onApprove?.(activePack)}
                  disabled={actionLoading === activePack.id + "_approve"}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {actionLoading === activePack.id + "_approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Approve
                </button>
              </div>
            )}
          </div>
        ) : traceEntries.length > 0 ? (
          /* Intelligence dashboard during onboarding */
          <div className="h-full overflow-y-auto p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Radar className="h-4 w-4 text-primary" />
              Live Intelligence ({traceEntries.length} traces)
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Competitors" value={totalCompetitors} icon={FileCode} />
              <StatCard label="Sources" value={totalSources} icon={ExternalLink} />
              <StatCard label="Confidence" value={`${avgConfidence}%`} icon={Sparkles} />
            </div>

            {/* Trace details */}
            {traceEntries.map(([key, val]) => {
              if (!val?.trace) return null;
              const trace = val.trace;
              return (
                <div key={key} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground capitalize">{key.replace(/_/g, " ")}</span>
                    <span className="text-xs text-muted-foreground">{val.answer_text}</span>
                  </div>
                  {trace.competitors?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {trace.competitors.slice(0, 6).map((c, i) => (
                        <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {trace.market_data && (
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      {trace.market_data.market_size && <div>Market: {trace.market_data.market_size}</div>}
                      {trace.market_data.trend && <div>Trend: {trace.market_data.trend}</div>}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Waiting hint */}
            <div className="rounded-xl border border-dashed border-border p-4 text-center">
              <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-xs text-muted-foreground">
                Answer all onboarding questions in the chat, then tell GPT to generate your website.
                Mockups will appear here for review.
              </p>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex h-full items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground">Visual Editor Ready</h3>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Start answering onboarding questions in the chat on the left.
                Intelligence and website previews will appear here in real time.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1 text-lg font-bold text-foreground">{value}</div>
    </div>
  );
}