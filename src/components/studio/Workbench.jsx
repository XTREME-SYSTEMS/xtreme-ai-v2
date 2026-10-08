import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Eye, CheckCircle2, XCircle, Loader2, FileCode, Sparkles,
  Monitor, Smartphone, Tablet, ClipboardPaste, Radar,
  ExternalLink, Inbox, Search, ChevronRight, Zap, Send,
} from "lucide-react";
import { ONBOARDING_QUESTIONS } from "@/lib/onboardingQuestions";
import { cn } from "@/lib/utils";

// Right panel — the workbench.
// Arsenal + ChatGPT control + action chips + tabbed content (Intake, Intelligence, Preview, Packs).
export default function Workbench({
  session, traceResults, setTraceResults,
  packs, onApprove, onReject, onPasteHtml, onPackRefresh,
  actionLoading, previewPack,
}) {
  const [tab, setTab] = useState("intake");
  const [device, setDevice] = useState("desktop");
  const [showPaste, setShowPaste] = useState(false);
  const [pasteHtml, setPasteHtml] = useState("");
  const [pasting, setPasting] = useState(false);
  const [gptInput, setGptInput] = useState("");
  const [gptSending, setGptSending] = useState(false);
  const [intakeValues, setIntakeValues] = useState({});
  const [intakeBusy, setIntakeBusy] = useState(false);

  // Sync intake values from traceResults
  useEffect(() => {
    const vals = {};
    Object.entries(traceResults || {}).forEach(([k, v]) => {
      if (v?.answer_text) vals[k] = v.answer_text;
    });
    setIntakeValues(vals);
  }, [traceResults]);

  const traceEntries = Object.entries(traceResults || {}).filter(([, v]) => v);
  const totalCompetitors = traceEntries.reduce((sum, [, v]) => sum + (v?.trace?.competitors?.length || 0), 0);
  const totalSources = traceEntries.reduce((sum, [, v]) => sum + (v?.trace?.sources?.length || 0), 0);
  const avgConfidence = traceEntries.length > 0
    ? Math.round(traceEntries.reduce((sum, [, v]) => sum + (v?.trace?.confidence_score || 50), 0) / traceEntries.length)
    : 0;

  const activePack = previewPack || packs.find(p => p.preview_html);
  const pendingPacks = packs.filter(p => p.status === "pending");
  const approvedPacks = packs.filter(p => p.status === "approved");

  const deviceWidth = device === "mobile" ? "375px" : device === "tablet" ? "768px" : "100%";

  const handlePaste = async () => {
    if (!pasteHtml.trim()) return;
    setPasting(true);
    try {
      await onPasteHtml?.(pasteHtml.trim());
      setPasteHtml("");
      setShowPaste(false);
      setTab("preview");
    } catch (e) { console.error(e); }
    setPasting(false);
  };

  const submitIntake = async () => {
    if (!session || intakeBusy) return;
    setIntakeBusy(true);
    const newAnswers = { ...traceResults };
    let step = session.current_step || 0;

    for (const q of ONBOARDING_QUESTIONS) {
      const val = intakeValues[q.key];
      if (!val || !val.trim()) continue;
      if (traceResults[q.key]?.answer_text === val.trim()) continue;

      try {
        const context = {};
        Object.entries(newAnswers).forEach(([k, v]) => {
          if (v?.answer_text) context[k] = { answer_text: v.answer_text };
        });

        const res = await base44.functions.invoke("skipTraceAnswer", {
          session_id: session.session_id || session.id,
          question_key: q.key,
          answer_text: val.trim(),
          context,
        });
        const traceData = res.data?.report || res.data;
        newAnswers[q.key] = {
          answer_text: val.trim(),
          skip_trace_id: traceData?.id,
          answered_at: new Date().toISOString(),
          trace: traceData,
        };
        step = Math.max(step, ONBOARDING_QUESTIONS.indexOf(q) + 1);
      } catch (e) {
        newAnswers[q.key] = {
          answer_text: val.trim(),
          answered_at: new Date().toISOString(),
          trace: null,
        };
      }
    }

    setTraceResults(newAnswers);
    const allAnswered = ONBOARDING_QUESTIONS.every(q => newAnswers[q.key]?.answer_text);
    await base44.entities.OnboardingSession.update(session.id, {
      current_step: step,
      answers: newAnswers,
      status: allAnswered ? "strategy_locked" : "onboarding",
    });
    setIntakeBusy(false);
    setTab("intelligence");
  };

  const sendToGpt = async () => {
    if (!gptInput.trim() || !session) return;
    setGptSending(true);
    try {
      const lockRes = await base44.functions.invoke("lockStrategy", {
        session_id: session.session_id || session.id,
      });
      onPackRefresh?.();
    } catch (e) { console.error(e); }
    setGptSending(false);
    setGptInput("");
  };

  const tabs = [
    { key: "intake", label: "Intake" },
    { key: "intelligence", label: "Intel" },
    { key: "preview", label: "Preview" },
    { key: "packs", label: `Packs${pendingPacks.length > 0 ? ` (${pendingPacks.length})` : ""}` },
  ];

  return (
    <div className="flex h-full flex-col bg-[#0f0f0f]">
      {/* Header — search + hide */}
      <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2.5">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 text-white/30" />
          <input
            placeholder="Command"
            className="flex-1 bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none"
          />
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-white/30">Ctrl K</kbd>
        </div>
      </div>

      {/* Arsenal section */}
      <div className="border-b border-white/5 px-3 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">Dominance Arsenal</div>
            <div className="text-[9px] text-white/30">Digital Dominance 2.0 · Apex command</div>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-white/10 p-0.5">
            {[
              { key: "mobile", label: "S", icon: Smartphone },
              { key: "tablet", label: "M", icon: Tablet },
              { key: "desktop", label: "L", icon: Monitor },
            ].map(d => (
              <button
                key={d.key}
                onClick={() => setDevice(d.key)}
                className={cn(
                  "flex h-6 items-center justify-center rounded px-2 text-[10px] font-bold transition-colors",
                  device === d.key ? "bg-primary text-primary-foreground" : "text-white/40 hover:text-white/70"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-0.5 text-[9px] font-semibold text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> LOCAL OFFLINE
          </span>
        </div>
      </div>

      {/* ChatGPT second chat control */}
      <div className="border-b border-white/5 px-3 py-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">ChatGPT · Second Chat</div>
          <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">
            Gateway Fallback
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <input
            value={gptInput}
            onChange={(e) => setGptInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendToGpt()}
            placeholder="Ask ChatGPT independently..."
            className="flex-1 rounded-lg border border-white/10 bg-[#1a1a1a] px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-primary focus:outline-none"
          />
          <button
            onClick={sendToGpt}
            disabled={gptSending || !gptInput.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30"
          >
            {gptSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Action chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-white/5 px-3 py-2 scrollbar-thin">
        {["Apex", "Xtreme Agents", "Cloud Browser", "Fault Line", "Comms"].map((chip) => (
          <span key={chip} className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-[#1a1a1a] px-2.5 py-1 text-[10px] font-medium text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            {chip}
          </span>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-b border-white/5 px-2 py-1.5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors",
              tab === t.key ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "intake" && (
          <IntakeTab
            intakeValues={intakeValues}
            setIntakeValues={setIntakeValues}
            onSubmit={submitIntake}
            busy={intakeBusy}
          />
        )}
        {tab === "intelligence" && (
          <IntelligenceTab
            traceEntries={traceEntries}
            totalCompetitors={totalCompetitors}
            totalSources={totalSources}
            avgConfidence={avgConfidence}
          />
        )}
        {tab === "preview" && (
          <PreviewTab
            activePack={activePack}
            device={device}
            deviceWidth={deviceWidth}
            showPaste={showPaste}
            setShowPaste={setShowPaste}
            pasteHtml={pasteHtml}
            setPasteHtml={setPasteHtml}
            handlePaste={handlePaste}
            pasting={pasting}
            onApprove={onApprove}
            onReject={onReject}
            actionLoading={actionLoading}
          />
        )}
        {tab === "packs" && (
          <PacksTab
            packs={packs}
            pendingPacks={pendingPacks}
            approvedPacks={approvedPacks}
            onApprove={onApprove}
            onReject={onReject}
            actionLoading={actionLoading}
          />
        )}
      </div>
    </div>
  );
}

// ── Intake Tab ──
function IntakeTab({ intakeValues, setIntakeValues, onSubmit, busy }) {
  return (
    <div className="p-3 space-y-3">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">Client Intake</div>
        <div className="mt-0.5 text-[10px] text-white/30">
          Five canonical questions, then anything extra. Fill all fields and submit to run skip-trace on each.
        </div>
      </div>
      {ONBOARDING_QUESTIONS.map((q, i) => (
        <div key={q.key} className="rounded-lg border border-white/10 bg-[#1a1a1a] p-2.5">
          <label className="text-[10px] font-semibold text-white/60">
            {i + 1}. {q.question}
          </label>
          <textarea
            value={intakeValues[q.key] || ""}
            onChange={(e) => setIntakeValues(prev => ({ ...prev, [q.key]: e.target.value }))}
            placeholder={q.placeholder}
            rows={2}
            className="mt-1.5 w-full resize-none rounded-md border border-white/10 bg-[#121212] px-2.5 py-2 text-xs text-white placeholder:text-white/20 focus:border-primary focus:outline-none"
          />
          <div className="mt-1 text-[9px] text-white/20">{q.hint}</div>
        </div>
      ))}
      <button
        onClick={onSubmit}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {busy ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Researching all answers...</> : <><Zap className="h-3.5 w-3.5" /> Submit & Run Skip-Trace</>}
      </button>
    </div>
  );
}

// ── Intelligence Tab ──
function IntelligenceTab({ traceEntries, totalCompetitors, totalSources, avgConfidence }) {
  if (traceEntries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div>
          <Radar className="mx-auto h-10 w-10 text-white/20" />
          <p className="mt-2 text-xs text-white/30">No intelligence yet. Answer onboarding questions to start research.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-3 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <StatBox label="Competitors" value={totalCompetitors} />
        <StatBox label="Sources" value={totalSources} />
        <StatBox label="Confidence" value={`${avgConfidence}%`} />
      </div>
      {traceEntries.map(([key, val]) => {
        if (!val?.trace) return null;
        const trace = val.trace;
        return (
          <div key={key} className="rounded-lg border border-white/10 bg-[#1a1a1a] p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold capitalize text-white/70">{key.replace(/_/g, " ")}</span>
              <span className="truncate text-[10px] text-white/40">{val.answer_text}</span>
            </div>
            {trace.competitors?.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {trace.competitors.slice(0, 6).map((c, i) => (
                  <span key={i} className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-white/40">{c.name}</span>
                ))}
              </div>
            )}
            {trace.market_data && (
              <div className="mt-1.5 space-y-0.5 text-[9px] text-white/30">
                {trace.market_data.market_size && <div>Market: {trace.market_data.market_size}</div>}
                {trace.market_data.trend && <div>Trend: {trace.market_data.trend}</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Preview Tab ──
function PreviewTab({ activePack, device, deviceWidth, showPaste, setShowPaste, pasteHtml, setPasteHtml, handlePaste, pasting, onApprove, onReject, actionLoading }) {
  if (showPaste) {
    return (
      <div className="p-3 space-y-2">
        <textarea
          value={pasteHtml}
          onChange={(e) => setPasteHtml(e.target.value)}
          placeholder="Paste GPT-generated HTML here..."
          rows={6}
          className="w-full resize-none rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 font-mono text-xs text-white placeholder:text-white/20 focus:border-primary focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <button onClick={handlePaste} disabled={!pasteHtml.trim() || pasting}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {pasting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Preview & Save
          </button>
          <button onClick={() => setShowPaste(false)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5">Cancel</button>
        </div>
      </div>
    );
  }

  if (!activePack?.preview_html) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <Inbox className="h-10 w-10 text-white/20" />
        <p className="mt-2 text-xs text-white/30">No preview yet. GPT mockups appear here when synced.</p>
        <button onClick={() => setShowPaste(true)}
          className="mt-3 flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5">
          <ClipboardPaste className="h-3.5 w-3.5" /> Paste HTML
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
        <FileCode className="h-3.5 w-3.5 text-primary" />
        <span className="truncate text-[11px] font-medium text-white/80">{activePack.name}</span>
        <span className={cn(
          "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
          activePack.status === "approved" ? "bg-green-500/10 text-green-400" :
          activePack.status === "rejected" ? "bg-red-500/10 text-red-400" :
          "bg-amber-500/10 text-amber-400"
        )}>{activePack.status}</span>
        <button onClick={() => setShowPaste(true)} className="ml-auto text-white/30 hover:text-white/60">
          <ClipboardPaste className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-[#0a0a0a] p-3 flex justify-center">
        <div style={{ width: deviceWidth, maxWidth: "100%" }} className="h-full">
          <iframe
            srcDoc={activePack.preview_html}
            className="h-full w-full rounded-lg border border-white/10 bg-white"
            style={{ minHeight: "300px" }}
            title={activePack.name}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
      {activePack.status === "pending" && (
        <div className="flex items-center justify-end gap-2 border-t border-white/5 p-2.5">
          <button onClick={() => onReject?.(activePack)} disabled={actionLoading === activePack.id + "_reject"}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50">
            {actionLoading === activePack.id + "_reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />} Reject
          </button>
          <button onClick={() => onApprove?.(activePack)} disabled={actionLoading === activePack.id + "_approve"}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {actionLoading === activePack.id + "_approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Approve
          </button>
        </div>
      )}
    </div>
  );
}

// ── Packs Tab ──
function PacksTab({ packs, pendingPacks, approvedPacks, onApprove, onReject, actionLoading }) {
  if (packs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div>
          <Inbox className="mx-auto h-10 w-10 text-white/20" />
          <p className="mt-2 text-xs text-white/30">No packs yet. Sync from GPT or paste HTML in the Preview tab.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-3 space-y-2">
      {pendingPacks.length > 0 && (
        <>
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Pending ({pendingPacks.length})</div>
          {pendingPacks.map(pack => (
            <PackRow key={pack.id} pack={pack} onApprove={onApprove} onReject={onReject} actionLoading={actionLoading} />
          ))}
        </>
      )}
      {approvedPacks.length > 0 && (
        <>
          <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-green-400">Approved ({approvedPacks.length})</div>
          {approvedPacks.map(pack => <PackRow key={pack.id} pack={pack} approved />)}
        </>
      )}
    </div>
  );
}

function PackRow({ pack, onApprove, onReject, actionLoading, approved }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#1a1a1a] p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] font-semibold text-white/80">{pack.name}</div>
          <div className="text-[9px] text-white/30">{pack.submitted_by_label} · {new Date(pack.created_date).toLocaleDateString()}</div>
        </div>
        {!approved && (
          <div className="flex items-center gap-1">
            <button onClick={() => onReject?.(pack)} disabled={actionLoading === pack.id + "_reject"}
              className="rounded-md border border-red-500/20 p-1.5 text-red-400 hover:bg-red-500/10 disabled:opacity-50">
              {actionLoading === pack.id + "_reject" ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
            </button>
            <button onClick={() => onApprove?.(pack)} disabled={actionLoading === pack.id + "_approve"}
              className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {actionLoading === pack.id + "_approve" ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} Approve
            </button>
          </div>
        )}
        {approved && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-green-400">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </span>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#1a1a1a] p-2.5">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-white/30">{label}</div>
      <div className="mt-0.5 text-lg font-bold text-white">{value}</div>
    </div>
  );
}