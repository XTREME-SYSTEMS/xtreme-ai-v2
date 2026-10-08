import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Copy, Check, Inbox, ArrowRight, MessageSquare } from "lucide-react";

// Skip & Sync with ChatGPT — a shortcut for users who want to bypass the
// 4-card onboarding and just send their website brief straight to ChatGPT.
// GPT builds the mockup and POSTs it back via the ingestPack sync endpoint;
// the user reviews it in the Pack Inbox.
export default function SkipToGptSync() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const syncUrl = "https://autobuilder.base44.app/functions/ingestPack";

  const copyUrl = () => {
    navigator.clipboard.writeText(syncUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime-400 text-black">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Skip Onboarding — Sync Directly with ChatGPT</h3>
            <p className="text-xs text-white/50">
              Already know what you want? Skip the questions and let ChatGPT build your website mockup, then sync it back here.
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-xs font-semibold text-lime-400 transition-colors hover:bg-lime-400/20"
        >
          {expanded ? "Hide steps" : "Show me how"} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
          {/* Step 1: Copy the sync URL */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-lime-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime-400/20 text-[10px]">1</span>
              Give ChatGPT this sync endpoint
            </div>
            <p className="mt-1 pl-6 text-[11px] text-white/40">
              ChatGPT will POST its finished HTML mockup to this URL. It lands in your Pack Inbox for review.
            </p>
            <div className="mt-1.5 flex items-center gap-2 pl-6">
              <code className="flex-1 truncate rounded-lg border border-white/10 bg-black px-3 py-2 text-[11px] text-lime-400">
                {syncUrl}
              </code>
              <button
                onClick={copyUrl}
                className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-black/30 px-2.5 py-2 text-[11px] font-medium text-white/70 hover:bg-white/5"
              >
                {copied ? <><Check className="h-3 w-3 text-lime-400" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
              </button>
            </div>
          </div>

          {/* Step 2: Tell ChatGPT what to build */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-lime-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime-400/20 text-[10px]">2</span>
              Tell ChatGPT what to build
            </div>
            <p className="mt-1 pl-6 text-[11px] text-white/40">
              Paste this prompt into ChatGPT, then customize it with your business details:
            </p>
            <pre className="mt-1.5 ml-6 overflow-x-auto rounded-lg border border-white/10 bg-black p-3 text-[10px] leading-relaxed text-white/60">
{`Build me a complete, responsive single-page website for my business.
Include: hero section, services, about, testimonials, FAQ, and contact form.
Use modern, clean design with good conversion practices.

When done, POST the full HTML to this URL:
${syncUrl}

Use this JSON format:
{
  "sync_token": "YOUR_PACK_SYNC_TOKEN",
  "name": "My Website Mockup",
  "kind": "web_pack",
  "preview_html": "<!-- your full HTML here -->"
}

Replace YOUR_PACK_SYNC_TOKEN with the sync token
from your system settings.`}
            </pre>
          </div>

          {/* Step 3: Review in Pack Inbox */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-lime-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime-400/20 text-[10px]">3</span>
              Review & approve in your Pack Inbox
            </div>
            <p className="mt-1 pl-6 text-[11px] text-white/40">
              When ChatGPT sends the mockup, it appears here for your review. Approve it to deploy.
            </p>
            <button
              onClick={() => navigate("/pack-inbox")}
              className="mt-1.5 ml-6 inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2 text-xs font-bold text-black transition-colors hover:bg-lime-300"
            >
              <Inbox className="h-3.5 w-3.5" /> Go to Pack Inbox
            </button>
          </div>

          {/* Full MCP setup link */}
          <div className="flex items-center gap-2 border-t border-white/10 pt-3">
            <MessageSquare className="h-3.5 w-3.5 text-white/40" />
            <span className="text-[11px] text-white/40">Want ChatGPT connected automatically?</span>
            <button
              onClick={() => navigate("/connect")}
              className="text-[11px] font-semibold text-lime-400 hover:underline"
            >
              Set up MCP connection →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}