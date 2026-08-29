import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import {
  Bug, Play, Activity, AlertTriangle, CheckCircle, Clock,
  TrendingUp, RefreshCw, FileText, Zap, Camera, User,
  Shield, Rocket, ChevronDown, ChevronUp, Image as ImageIcon,
} from "lucide-react";
import { Image as Base44Image } from "@/components/ui/image";

export default function QAAgent() {
  const [tab, setTab] = useState("agents");
  const [qaRunning, setQaRunning] = useState(false);
  const [humanRunning, setHumanRunning] = useState(false);
  const [qaResult, setQaResult] = useState(null);
  const [humanResult, setHumanResult] = useState(null);
  const [testRuns, setTestRuns] = useState([]);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qaTarget, setQaTarget] = useState("full_system");
  const [humanTarget, setHumanTarget] = useState("client_portal");
  const [expandedFinding, setExpandedFinding] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [runs, recentFindings] = await Promise.all([
        base44.entities.QATestRun.list("-created_date", 20),
        base44.entities.QAFinding.filter({ status: "open" }, "-created_date", 30),
      ]);
      setTestRuns(runs || []);
      setFindings(recentFindings || []);
      // Get latest results for each agent
      const latestQa = (runs || []).find((r) => r.agent_type === "qa_agent" && r.status === "complete");
      const latestHuman = (runs || []).find((r) => r.agent_type === "humanized_test" && r.status === "complete");
      if (latestQa) setQaResult(latestQa);
      if (latestHuman) setHumanResult(latestHuman);
    } catch (e) {
      console.error("Failed to load QA data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const runQAAgent = async () => {
    setQaRunning(true);
    try {
      const res = await base44.functions.invoke("qaTestSystem", { target_system: qaTarget });
      setQaResult(res.data);
      await loadData();
    } catch (e) {
      console.error("QA Agent failed:", e);
      alert("QA Agent failed: " + (e?.message || "unknown error"));
    } finally {
      setQaRunning(false);
    }
  };

  const runHumanizedTest = async () => {
    setHumanRunning(true);
    try {
      const res = await base44.functions.invoke("humanizedTestPortal", { target_system: humanTarget });
      setHumanResult(res.data);
      await loadData();
    } catch (e) {
      console.error("Humanized test failed:", e);
      alert("Humanized test failed: " + (e?.message || "unknown error"));
    } finally {
      setHumanRunning(false);
    }
  };

  const qaScore = qaResult?.score;
  const humanScore = humanResult?.score;
  const scoreColor = (s) => s >= 75 ? "text-green-400" : s >= 50 ? "text-amber-400" : "text-red-400";

  const screenshots = testRuns
    .filter((r) => r.status === "complete")
    .flatMap((r) => []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="QA & Test Agents"
        subtitle="Two autonomous agents that test your system — the QA Agent touches every button and function, the Humanized Test Agent walks the portal as a real user."
      />

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border border-white/10 bg-zinc-900 p-1">
        {[
          { id: "agents", label: "Agents", icon: Bug },
          { id: "findings", label: `Findings (${findings.length})`, icon: AlertTriangle },
          { id: "history", label: "History", icon: Clock },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id ? "bg-amber-400 text-black" : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* AGENTS TAB */}
      {tab === "agents" && (
        <div className="space-y-6">
          {/* Two agent cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* QA Agent Card */}
            <div className="rounded-xl border border-white/10 bg-zinc-900 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10">
                  <Shield className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">QA Agent</h3>
                  <p className="text-xs text-white/40">Systematic button & function tester</p>
                </div>
              </div>
              <p className="text-xs text-white/50 mb-4">
                Navigates every page, clicks all safe buttons, tests backend functions, takes screenshots, and scores the system. Reports broken buttons, console errors, and visual bugs.
              </p>

              {/* Score */}
              {qaResult && (
                <div className="mb-4 flex items-center gap-4 rounded-lg border border-white/10 bg-black p-3">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${scoreColor(qaScore)}`}>{qaScore}</div>
                    <div className="text-[10px] uppercase text-white/40">Score</div>
                  </div>
                  <div className="flex-1 space-y-1 text-xs">
                    <Stat label="Pages" value={qaResult.pages_tested} />
                    <Stat label="Buttons" value={qaResult.buttons_clicked} />
                    <Stat label="Functions" value={qaResult.functions_tested} />
                    <Stat label="Screenshots" value={qaResult.screenshots_taken} />
                  </div>
                  <div className="text-right space-y-1 text-xs">
                    <Stat label="Findings" value={qaResult.flaws_count} color={qaResult.flaws_count > 0 ? "text-red-400" : "text-green-400"} />
                    <Stat label="Critical" value={qaResult.critical_count} color={qaResult.critical_count > 0 ? "text-red-400" : "text-green-400"} />
                  </div>
                </div>
              )}

              {/* Target selector */}
              <div className="mb-3">
                <label className="text-xs text-white/40 mb-1 block">Target System</label>
                <select
                  value={qaTarget}
                  onChange={(e) => setQaTarget(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white"
                >
                  <option value="full_system">Full System (Public + Admin)</option>
                  <option value="admin">Admin Dashboard Only</option>
                  <option value="public">Public Pages Only</option>
                </select>
              </div>

              <LoadingButton onClick={runQAAgent} loading={qaRunning} className="w-full">
                <Zap className="h-4 w-4 mr-1.5" /> Run QA Agent
              </LoadingButton>
            </div>

            {/* Humanized Test Agent Card */}
            <div className="rounded-xl border border-white/10 bg-zinc-900 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/10">
                  <User className="h-5 w-5 text-lime-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Humanized Test Agent</h3>
                  <p className="text-xs text-white/40">Real-user journey simulator</p>
                </div>
              </div>
              <p className="text-xs text-white/50 mb-4">
                Walks through the portal as a real client would — fills forms with realistic data, clicks through each step, takes snapshots, and scores the UX. Reports friction points and conversion risks.
              </p>

              {/* Score */}
              {humanResult && (
                <div className="mb-4 flex items-center gap-4 rounded-lg border border-white/10 bg-black p-3">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${scoreColor(humanScore)}`}>{humanScore}</div>
                    <div className="text-[10px] uppercase text-white/40">UX Score</div>
                  </div>
                  <div className="flex-1 space-y-1 text-xs">
                    <Stat label="Steps" value={humanResult.pages_tested} />
                    <Stat label="Buttons" value={humanResult.buttons_clicked} />
                    <Stat label="Screenshots" value={humanResult.screenshots_taken} />
                  </div>
                  <div className="text-right space-y-1 text-xs">
                    <Stat label="Findings" value={humanResult.flaws_count} color={humanResult.flaws_count > 0 ? "text-red-400" : "text-green-400"} />
                    <Stat label="Critical" value={humanResult.critical_count} color={humanResult.critical_count > 0 ? "text-red-400" : "text-green-400"} />
                  </div>
                </div>
              )}

              {/* Target selector */}
              <div className="mb-3">
                <label className="text-xs text-white/40 mb-1 block">Target Portal</label>
                <select
                  value={humanTarget}
                  onChange={(e) => setHumanTarget(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white"
                >
                  <option value="client_portal">Client Portal (Full Journey)</option>
                  <option value="employee_portal">Employee Portal</option>
                </select>
              </div>

              <LoadingButton onClick={runHumanizedTest} loading={humanRunning} className="w-full">
                <User className="h-4 w-4 mr-1.5" /> Run Humanized Test
              </LoadingButton>
            </div>
          </div>

          {/* AI Summaries */}
          {qaResult?.summary && (
            <Panel title="QA Agent — AI Analysis">
              <pre className="whitespace-pre-wrap text-xs text-white/70 font-sans">{qaResult.summary}</pre>
            </Panel>
          )}
          {humanResult?.summary && (
            <Panel title="Humanized Test — UX Analysis">
              <pre className="whitespace-pre-wrap text-xs text-white/70 font-sans">{humanResult.summary}</pre>
            </Panel>
          )}
        </div>
      )}

      {/* FINDINGS TAB */}
      {tab === "findings" && (
        <Panel title={`Open Findings (${findings.length})`}>
          {loading ? (
            <div className="py-8 text-center text-white/30">Loading...</div>
          ) : findings.length === 0 ? (
            <EmptyState icon={CheckCircle} title="No open findings" subtitle="Run an agent to discover flaws and issues." />
          ) : (
            <div className="space-y-2">
              {findings.map((f) => (
                <div key={f.id} className="rounded-lg border border-white/10 bg-black p-3">
                  <div className="flex items-start gap-3">
                    <SeverityBadge severity={f.severity} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50">{f.category.replace(/_/g, " ")}</span>
                        <span className="text-xs text-white/40">{f.page_name}</span>
                      </div>
                      <div className="mt-1 text-sm text-white">{f.description}</div>
                      {f.element_description && (
                        <div className="mt-0.5 text-xs text-white/40">Element: {f.element_description}</div>
                      )}
                      {f.screenshot_url && (
                        <div className="mt-2">
                          <Base44Image
                            src={f.screenshot_url}
                            alt="Screenshot"
                            className="rounded-lg border border-white/10 max-h-40"
                            fittingType="fit"
                          />
                        </div>
                      )}
                      {f.recommended_fix && (
                        <div className="mt-2 rounded-lg border border-amber-400/20 bg-amber-400/5 p-2 text-xs text-amber-300">
                          <span className="font-semibold">Recommended fix:</span> {f.recommended_fix}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => base44.entities.QAFinding.update(f.id, { status: "dismissed" }).then(loadData)}
                      className="shrink-0 rounded-lg border border-white/10 px-2 py-1 text-xs text-white/40 hover:bg-white/5 hover:text-white"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* HISTORY TAB */}
      {tab === "history" && (
        <Panel title="Test Run History">
          {loading ? (
            <div className="py-8 text-center text-white/30">Loading...</div>
          ) : testRuns.length === 0 ? (
            <EmptyState icon={Clock} title="No test runs yet" subtitle="Run an agent to see history here." />
          ) : (
            <div className="space-y-2">
              {testRuns.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black p-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    r.agent_type === "qa_agent" ? "bg-amber-400/10" : "bg-lime-400/10"
                  }`}>
                    {r.agent_type === "qa_agent" ? <Shield className="h-5 w-5 text-amber-400" /> : <User className="h-5 w-5 text-lime-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">
                      {r.agent_type === "qa_agent" ? "QA Agent" : "Humanized Test"} — {r.target_system.replace(/_/g, " ")}
                    </div>
                    <div className="text-xs text-white/40">
                      {r.pages_tested} pages · {r.buttons_clicked} buttons · {r.findings_count || r.flaws_count || 0} findings · {new Date(r.created_date).toLocaleString()}
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${scoreColor(r.score)}`}>{r.score}</div>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                    r.status === "complete" ? "bg-green-500/20 text-green-400" :
                    r.status === "running" ? "bg-amber-400/20 text-amber-400" :
                    r.status === "failed" ? "bg-red-500/20 text-red-400" : "bg-white/5 text-white/50"
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/40">{label}</span>
      <span className={color || "text-white"}>{value ?? "—"}</span>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const colors = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-amber-400/20 text-amber-400 border-amber-400/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    info: "bg-white/5 text-white/50 border-white/10",
  };
  return (
    <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold uppercase ${colors[severity] || colors.info}`}>
      {severity}
    </span>
  );
}