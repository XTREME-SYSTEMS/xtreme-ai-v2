import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, User, AlertTriangle, CheckCircle, RefreshCw, Play, Bug } from "lucide-react";
import { Link } from "react-router-dom";

// Compact QA status widget — shows latest test scores and open findings.
// Embedded in the Employee Portal and Client Portal so users can see system health.
// Admins can trigger tests directly from the widget.
export default function QAStatusWidget({ canRun = false }) {
  const [qaRun, setQaRun] = useState(null);
  const [humanRun, setHumanRun] = useState(null);
  const [openFindings, setOpenFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(null);

  const loadData = async () => {
    try {
      const [runs, findings] = await Promise.all([
        base44.entities.QATestRun.list("-created_date", 10),
        base44.entities.QAFinding.filter({ status: "open" }, "-created_date", 5),
      ]);
      const allRuns = runs || [];
      setQaRun(allRuns.find((r) => r.agent_type === "qa_agent" && r.status === "complete"));
      setHumanRun(allRuns.find((r) => r.agent_type === "humanized_test" && r.status === "complete"));
      setOpenFindings(findings || []);
    } catch (e) {
      console.error("QA widget load failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const runAgent = async (agent) => {
    setRunning(agent);
    try {
      const fn = agent === "qa" ? "qaTestSystem" : "humanizedTestPortal";
      const target = agent === "qa" ? "full_system" : "client_portal";
      await base44.functions.invoke(fn, { target_system: target });
      await loadData();
    } catch (e) {
      console.error("Agent run failed:", e);
    } finally {
      setRunning(null);
    }
  };

  const scoreColor = (s) => s >= 75 ? "text-green-400" : s >= 50 ? "text-amber-400" : "text-red-400";

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
        <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Bug className="h-4 w-4 text-amber-400" /> System Health
        </div>
        {canRun && (
          <Link to="/qa-agent" className="text-xs text-amber-400 hover:underline">View Details</Link>
        )}
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 gap-2">
        {/* QA Agent score */}
        <div className="rounded-lg border border-white/10 bg-black p-3">
          <div className="flex items-center gap-1.5 text-xs text-white/40 mb-1">
            <Shield className="h-3 w-3" /> QA Agent
          </div>
          {qaRun ? (
            <>
              <div className={`text-2xl font-bold ${scoreColor(qaRun.score)}`}>{qaRun.score}</div>
              <div className="text-[10px] text-white/30">
                {qaRun.flaws_count || 0} flaws · {qaRun.buttons_clicked || 0} buttons
              </div>
            </>
          ) : (
            <div className="text-sm text-white/30">Not run yet</div>
          )}
        </div>

        {/* Humanized Test score */}
        <div className="rounded-lg border border-white/10 bg-black p-3">
          <div className="flex items-center gap-1.5 text-xs text-white/40 mb-1">
            <User className="h-3 w-3" /> UX Test
          </div>
          {humanRun ? (
            <>
              <div className={`text-2xl font-bold ${scoreColor(humanRun.score)}`}>{humanRun.score}</div>
              <div className="text-[10px] text-white/30">
                {humanRun.flaws_count || 0} issues · {humanRun.pages_tested || 0} steps
              </div>
            </>
          ) : (
            <div className="text-sm text-white/30">Not run yet</div>
          )}
        </div>
      </div>

      {/* Open findings */}
      {openFindings.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-white/40 uppercase tracking-wider">Open Issues</div>
          {openFindings.slice(0, 3).map((f) => (
            <div key={f.id} className="flex items-start gap-2 text-xs text-white/60">
              <AlertTriangle className={`h-3 w-3 shrink-0 mt-0.5 ${
                f.severity === "critical" ? "text-red-400" :
                f.severity === "high" ? "text-orange-400" : "text-amber-400"
              }`} />
              <span className="truncate">{f.description}</span>
            </div>
          ))}
          {openFindings.length > 3 && (
            <div className="text-xs text-white/40">+{openFindings.length - 3} more</div>
          )}
        </div>
      )}

      {/* Admin actions */}
      {canRun && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => runAgent("qa")}
            disabled={running !== null}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-400/20 disabled:opacity-50"
          >
            {running === "qa" ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            Run QA
          </button>
          <button
            onClick={() => runAgent("human")}
            disabled={running !== null}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-lime-400/30 bg-lime-400/10 px-3 py-1.5 text-xs font-medium text-lime-300 hover:bg-lime-400/20 disabled:opacity-50"
          >
            {running === "human" ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            Run UX Test
          </button>
        </div>
      )}

      {/* Last tested */}
      {(qaRun || humanRun) && (
        <div className="text-[10px] text-white/30">
          Last tested: {new Date((qaRun || humanRun)?.created_date).toLocaleString()}
        </div>
      )}
    </div>
  );
}