import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import StudioTopBar from "@/components/studio/StudioTopBar";
import ChatPanel from "@/components/studio/ChatPanel";
import VisualEditor from "@/components/studio/VisualEditor";
import Workbench from "@/components/studio/Workbench";

// The Studio — two-panel workspace with a top step strip.
// Page "studio": Chat (left) + Visual Editor (right)
// Page "workbench": Arsenal, ChatGPT control, intake form, intelligence, packs (full width)
export default function OnboardingAssistant() {
  const [session, setSession] = useState(null);
  const [traceResults, setTraceResults] = useState({});
  const [creating, setCreating] = useState(true);
  const [packs, setPacks] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [user, setUser] = useState(null);
  const [view, setView] = useState("studio"); // "studio" | "workbench"

  useEffect(() => {
    async function initSession() {
      setCreating(true);
      try {
        const me = await base44.auth.me();
        setUser(me);

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
      } catch (e) { console.error(e); }
      setCreating(false);
    }
    initSession();
  }, []);

  const loadPacks = useCallback(async (email) => {
    try {
      const query = email ? { user_email: email } : {};
      const res = await base44.entities.GptPack.filter(query, { sort: "-created_date", limit: 20 });
      setPacks(res.items || res || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => loadPacks(user.email), 10000);
    return () => clearInterval(interval);
  }, [user, loadPacks]);

  const handleOnboardingComplete = useCallback(() => {
    if (user) loadPacks(user.email);
  }, [user, loadPacks]);

  const approvePack = useCallback(async (pack) => {
    setActionLoading(pack.id + "_approve");
    try {
      const me = await base44.auth.me();
      await base44.entities.GptPack.update(pack.id, {
        status: "approved", approved_by: me.email, approved_at: new Date().toISOString(),
      });
      if (session) {
        await base44.entities.OnboardingSession.update(session.id, {
          status: "pack_approved", approved_pack_id: pack.id,
        });
      }
      if (user) loadPacks(user.email);
    } catch (e) { console.error(e); }
    setActionLoading(null);
  }, [session, user, loadPacks]);

  const rejectPack = useCallback(async (pack) => {
    setActionLoading(pack.id + "_reject");
    try {
      await base44.entities.GptPack.update(pack.id, { status: "rejected" });
      if (user) loadPacks(user.email);
    } catch (e) { console.error(e); }
    setActionLoading(null);
  }, [user, loadPacks]);

  const handlePasteHtml = useCallback(async (html) => {
    if (!session) return;
    try {
      const me = await base44.auth.me();
      await base44.entities.GptPack.create({
        name: `Pasted Mockup ${new Date().toLocaleTimeString()}`,
        kind: "web_pack", preview_html: html, status: "pending",
        source: "manual_paste", submitted_by_label: "You",
        session_id: session.session_id || session.id, user_email: me.email,
      });
      if (user) loadPacks(user.email);
    } catch (e) { console.error(e); throw e; }
  }, [session, user, loadPacks]);

  if (creating) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0d0d0d]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#FF8C00" }} />
      </div>
    );
  }

  const previewPack = packs.find(p => p.preview_html && p.status === "pending") || packs.find(p => p.preview_html);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden bg-[#0d0d0d]">
      {/* Top strip — steps + page toggle + profile */}
      <StudioTopBar user={user} view={view} onToggleView={() => setView(view === "studio" ? "workbench" : "studio")} />

      {/* Main area */}
      {view === "studio" ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Chat */}
          <div className="w-[400px] shrink-0">
            <ChatPanel
              session={session}
              setSession={setSession}
              traceResults={traceResults}
              setTraceResults={setTraceResults}
              onOnboardingComplete={handleOnboardingComplete}
              onPackRefresh={() => user && loadPacks(user.email)}
              previewHtml={previewPack?.preview_html}
            />
          </div>
          {/* Right: Full visual editor */}
          <div className="flex-1 min-w-0">
            <VisualEditor
              activePack={previewPack}
              onApprove={approvePack}
              onReject={rejectPack}
              onPasteHtml={handlePasteHtml}
              actionLoading={actionLoading}
            />
          </div>
        </div>
      ) : (
        /* Workbench page — full width */
        <div className="flex-1 overflow-hidden">
          <Workbench
            session={session}
            traceResults={traceResults}
            setTraceResults={setTraceResults}
            packs={packs}
            onApprove={approvePack}
            onReject={rejectPack}
            onPasteHtml={handlePasteHtml}
            onPackRefresh={() => user && loadPacks(user.email)}
            actionLoading={actionLoading}
            previewPack={previewPack}
          />
        </div>
      )}
    </div>
  );
}