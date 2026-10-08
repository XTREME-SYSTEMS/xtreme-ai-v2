import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import ChatPanel from "@/components/studio/ChatPanel";
import VisualEditor from "@/components/studio/VisualEditor";

// The Studio — a split-screen workspace.
// Left: chat UI for onboarding Q&A + GPT website commands.
// Right: visual editor showing live intelligence + website previews.
export default function OnboardingAssistant() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [traceResults, setTraceResults] = useState({});
  const [creating, setCreating] = useState(true);
  const [packs, setPacks] = useState([]);
  const [previewPack, setPreviewPack] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Create or load session on mount
  useEffect(() => {
    async function initSession() {
      setCreating(true);
      try {
        const me = await base44.auth.me();
        const existing = await base44.entities.OnboardingSession.filter(
          { user_email: me.email, status: { $in: ["onboarding", "strategy_locked", "pack_pending"] } },
          { sort: "-created_date", limit: 1 }
        );
        const items = existing.items || existing;
        if (items.length > 0) {
          setSession(items[0]);
          if (items[0].answers) setTraceResults(items[0].answers);
        } else {
          const newSession = await base44.entities.OnboardingSession.create({
            user_email: me.email,
            status: "onboarding",
            current_step: 0,
            answers: {},
          });
          setSession(newSession);
        }
        loadPacks(me.email);
      } catch (e) {
        console.error(e);
      }
      setCreating(false);
    }
    initSession();
  }, []);

  const loadPacks = useCallback(async (email) => {
    try {
      const query = email ? { user_email: email } : {};
      const res = await base44.entities.GptPack.filter(query, { sort: "-created_date", limit: 20 });
      const items = res.items || res || [];
      setPacks(items);
      // Auto-select the latest pending or approved pack for preview
      const latest = items.find(p => p.preview_html);
      if (latest) setPreviewPack(latest);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Poll for new packs every 10 seconds (GPT sends mockups async)
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      base44.auth.me().then(me => loadPacks(me.email)).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [session, loadPacks]);

  const handleOnboardingComplete = useCallback((sessionId) => {
    loadPacks();
  }, [loadPacks]);

  const approvePack = useCallback(async (pack) => {
    setActionLoading(pack.id + "_approve");
    try {
      const me = await base44.auth.me();
      await base44.entities.GptPack.update(pack.id, {
        status: "approved",
        approved_by: me.email,
        approved_at: new Date().toISOString(),
      });
      // Update session to pack_approved
      if (session) {
        await base44.entities.OnboardingSession.update(session.id, {
          status: "pack_approved",
          approved_pack_id: pack.id,
        });
      }
      loadPacks();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  }, [session, loadPacks]);

  const rejectPack = useCallback(async (pack) => {
    setActionLoading(pack.id + "_reject");
    try {
      await base44.entities.GptPack.update(pack.id, { status: "rejected" });
      setPreviewPack(null);
      loadPacks();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  }, [loadPacks]);

  const handlePasteHtml = useCallback(async (html) => {
    if (!session) return;
    try {
      const me = await base44.auth.me();
      const pack = await base44.entities.GptPack.create({
        name: `Pasted Mockup ${new Date().toLocaleTimeString()}`,
        kind: "web_pack",
        preview_html: html,
        status: "pending",
        source: "manual_paste",
        submitted_by_label: "You",
        session_id: session.session_id || session.id,
        user_email: me.email,
      });
      loadPacks(me.email);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, [session, loadPacks]);

  if (creating) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] gap-0 overflow-hidden rounded-xl border border-border">
      {/* Left: Chat panel */}
      <div className="w-[420px] shrink-0 border-r border-border">
        <ChatPanel
          session={session}
          setSession={setSession}
          traceResults={traceResults}
          setTraceResults={setTraceResults}
          onOnboardingComplete={handleOnboardingComplete}
          onPackRefresh={() => base44.auth.me().then(me => loadPacks(me.email))}
          previewHtml={previewPack?.preview_html}
        />
      </div>

      {/* Right: Visual editor */}
      <div className="flex-1 min-w-0">
        <VisualEditor
          traceResults={traceResults}
          packs={packs}
          previewPack={previewPack}
          setPreviewPack={setPreviewPack}
          onApprove={approvePack}
          onReject={rejectPack}
          onPasteHtml={handlePasteHtml}
          actionLoading={actionLoading}
        />
      </div>
    </div>
  );
}