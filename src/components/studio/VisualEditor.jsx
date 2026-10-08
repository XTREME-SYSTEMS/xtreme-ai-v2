import React, { useState } from "react";
import {
  CheckCircle2, XCircle, Loader2, FileCode, Sparkles,
  Smartphone, Tablet, Monitor, ClipboardPaste, Inbox, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const AMBER = "#FF8C00";

// Full visual editor — takes the entire right panel.
// Shows the website preview iframe with device toggle, paste-HTML, and approve/reject.
export default function VisualEditor({
  activePack, onApprove, onReject, onPasteHtml, actionLoading,
}) {
  const [device, setDevice] = useState("desktop");
  const [showPaste, setShowPaste] = useState(false);
  const [pasteHtml, setPasteHtml] = useState("");
  const [pasting, setPasting] = useState(false);

  const deviceWidth = device === "mobile" ? "375px" : device === "tablet" ? "768px" : "100%";
  const deviceHeight = device === "mobile" ? "667px" : device === "tablet" ? "900px" : "100%";

  const handlePaste = async () => {
    if (!pasteHtml.trim()) return;
    setPasting(true);
    try {
      await onPasteHtml?.(pasteHtml.trim());
      setPasteHtml("");
      setShowPaste(false);
    } catch (e) { console.error(e); }
    setPasting(false);
  };

  // Paste mode
  if (showPaste) {
    return (
      <div className="flex h-full flex-col bg-[#0a0a0a] p-4">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardPaste className="h-4 w-4" style={{ color: AMBER }} />
          <span className="text-sm font-semibold text-white">Paste GPT-Generated HTML</span>
        </div>
        <textarea
          value={pasteHtml}
          onChange={(e) => setPasteHtml(e.target.value)}
          placeholder="Paste the full HTML mockup here..."
          className="flex-1 w-full resize-none rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-3 font-mono text-xs text-white placeholder:text-white/20 focus:outline-none"
          style={{ borderColor: AMBER + "40" }}
        />
        <div className="mt-3 flex items-center gap-2">
          <button onClick={handlePaste} disabled={!pasteHtml.trim() || pasting}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: AMBER }}>
            {pasting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Preview & Save
          </button>
          <button onClick={() => setShowPaste(false)}
            className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white/60 hover:bg-white/5">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!activePack?.preview_html) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <Inbox className="h-8 w-8 text-white/20" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white/80">No preview yet</h3>
          <p className="mt-1 text-sm text-white/30">
            GPT mockups appear here when synced via the ingest endpoint.
          </p>
          <button onClick={() => setShowPaste(true)}
            className="mt-4 flex items-center gap-1.5 rounded-lg border border-white/10 px-4 py-2 text-xs text-white/70 hover:bg-white/5">
            <ClipboardPaste className="h-3.5 w-3.5" /> Paste HTML
          </button>
        </div>
      </div>
    );
  }

  // Preview mode
  return (
    <div className="flex h-full flex-col bg-[#0a0a0a]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-2.5">
        <FileCode className="h-4 w-4" style={{ color: AMBER }} />
        <span className="truncate text-sm font-medium text-white/80">{activePack.name}</span>
        <span className={cn(
          "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
          activePack.status === "approved" ? "bg-green-500/10 text-green-400" :
          activePack.status === "rejected" ? "bg-red-500/10 text-red-400" :
          "bg-amber-500/10 text-amber-400"
        )}>
          {activePack.status}
        </span>

        {/* Device toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-white/10 p-0.5">
          {[
            { key: "mobile", icon: Smartphone },
            { key: "tablet", icon: Tablet },
            { key: "desktop", icon: Monitor },
          ].map(d => {
            const Icon = d.icon;
            return (
              <button key={d.key} onClick={() => setDevice(d.key)}
                className={cn("flex h-7 w-7 items-center justify-center rounded transition-colors",
                  device === d.key ? "text-white" : "text-white/40 hover:text-white/70")}
                style={device === d.key ? { background: AMBER } : {}}>
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>

        <button onClick={() => setShowPaste(true)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/50 hover:bg-white/5 hover:text-white/80">
          <ClipboardPaste className="h-3.5 w-3.5" /> Paste
        </button>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
        <div style={{ width: deviceWidth, height: deviceHeight, maxWidth: "100%", maxHeight: "100%" }}
          className="overflow-hidden rounded-xl border border-white/10 shadow-2xl">
          <iframe
            srcDoc={activePack.preview_html}
            className="h-full w-full bg-white"
            title={activePack.name}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      {/* Action bar */}
      {activePack.status === "pending" && (
        <div className="flex items-center justify-end gap-2 border-t border-white/5 p-3">
          <button onClick={() => onReject?.(activePack)}
            disabled={actionLoading === activePack.id + "_reject"}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/20 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50">
            {actionLoading === activePack.id + "_reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Reject
          </button>
          <button onClick={() => onApprove?.(activePack)}
            disabled={actionLoading === activePack.id + "_approve"}
            className="flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: AMBER }}>
            {actionLoading === activePack.id + "_approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Approve & Deploy
          </button>
        </div>
      )}
      {activePack.status === "approved" && (
        <div className="flex items-center gap-2 border-t border-white/5 p-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-green-400">
            <CheckCircle2 className="h-4 w-4" /> Approved
          </span>
          {activePack.deployed_url && (
            <a href={activePack.deployed_url} target="_blank" rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs text-white/50 hover:text-white/80">
              <ExternalLink className="h-3.5 w-3.5" /> {activePack.deployed_url}
            </a>
          )}
        </div>
      )}
    </div>
  );
}