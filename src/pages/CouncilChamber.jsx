import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Users, FlaskConical, Loader2, Brain, AlertTriangle, Shield, TrendingUp,
  MessageSquare, ChevronDown, ChevronRight, Target, Dice5, Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CouncilChamber() {
  const [tab, setTab] = useState("council");
  const [decisions, setDecisions] = useState([]);
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Council form state
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [decisionType, setDecisionType] = useState("strategic");
  const [debating, setDebating] = useState(false);
  const [currentDecision, setCurrentDecision] = useState(null);

  // Simulation form state
  const [simName, setSimName] = useState("");
  const [simType, setSimType] = useState("business_model");
  const [scenario, setScenario] = useState("expected");
  const [horizon, setHorizon] = useState("12_months");
  const [simInputs, setSimInputs] = useState({ customers: 0, price: 100, conversion_rate: 0.03, churn_rate: 0.05, gross_margin: 0.7, monthly_cost: 5000 });
  const [running, setRunning] = useState(false);
  const [currentSim, setCurrentSim] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [decs, sims] = await Promise.all([
        base44.entities.CouncilDecision.list("-created_date", 20),
        base44.entities.SimulationResult.list("-created_date", 20),
      ]);
      setDecisions(decs || []);
      setSimulations(sims || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const runCouncil = async () => {
    if (!question.trim()) return;
    setDebating(true);
    try {
      const res = await base44.functions.invoke("runCouncilDecision", {
        question: question.trim(),
        context: context.trim(),
        decision_type: decisionType,
        triggered_by: "manual",
      });
      setCurrentDecision(res?.data || res);
      loadData();
    } catch (err) {
      alert("Council debate failed: " + (err?.message || "unknown error"));
    } finally {
      setDebating(false);
    }
  };

  const runSimulation = async () => {
    if (!simName.trim()) return;
    setRunning(true);
    try {
      const res = await base44.functions.invoke("runBusinessSimulation", {
        simulation_name: simName.trim(),
        simulation_type: simType,
        scenario,
        time_horizon: horizon,
        iterations: 1000,
        input_variables: simInputs,
        triggered_by: "manual",
      });
      setCurrentSim(res?.data || res);
      loadData();
    } catch (err) {
      alert("Simulation failed: " + (err?.message || "unknown error"));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-lime-400/30 bg-gradient-to-br from-lime-400/5 to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/15">
            <Brain className="h-5 w-5 text-lime-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Council Chamber</h1>
            <p className="text-sm text-white/50">
              Multi-agent council debate (11-round protocol) + Monte Carlo simulation laboratory. Dissent preserved. Confidence scored. No agent has authority merely because it is called "Chief."
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: "council", label: "Council Debate", icon: Users },
          { id: "simulation", label: "Simulation Lab", icon: FlaskConical },
          { id: "history", label: "History", icon: MessageSquare },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                tab === t.id ? "bg-lime-400 text-black" : "border border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Council Tab */}
      {tab === "council" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Pose question */}
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-lime-400">Pose a Question to the Council</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-white/50">Decision Type</label>
                <select
                  value={decisionType}
                  onChange={(e) => setDecisionType(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white focus:border-lime-400 focus:outline-none"
                >
                  {["strategic", "architectural", "build", "investment", "product", "market", "technical", "operational", "research"].map(t => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50">Question</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Should we build a vertical AI agent for construction permit discovery?"
                  rows={3}
                  className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50">Context (data, constraints, background)</label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Provide any data, constraints, or background the council should consider..."
                  rows={4}
                  className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
                />
              </div>
              <button
                onClick={runCouncil}
                disabled={debating || !question.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
              >
                {debating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                {debating ? "Council Debating (11 rounds)..." : "Convene the Council"}
              </button>
            </div>
          </div>

          {/* Current decision result */}
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-lime-400">Council Decision</h2>
            {currentDecision ? (
              <DecisionResult decision={currentDecision} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Brain className="h-10 w-10 text-white/20 mb-3" />
                <p className="text-sm text-white/40">Convene the council to see the 11-round debate, dissent, and confidence-scored decision.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Simulation Tab */}
      {tab === "simulation" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Simulation inputs */}
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-lime-400">Configure Simulation</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-white/50">Simulation Name</label>
                <input
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  placeholder="e.g. Epoxy Flooring SaaS — 12 month projection"
                  className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-white/50">Type</label>
                  <select value={simType} onChange={(e) => setSimType(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white focus:border-lime-400 focus:outline-none">
                    {["business_model", "strategy", "revenue", "market_entry", "product_launch", "cost_optimization", "growth"].map(t => (
                      <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/50">Scenario</label>
                  <select value={scenario} onChange={(e) => setScenario(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white focus:border-lime-400 focus:outline-none">
                    {["baseline", "conservative", "expected", "optimistic", "adverse", "black_swan"].map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50">Time Horizon</label>
                <select value={horizon} onChange={(e) => setHorizon(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white focus:border-lime-400 focus:outline-none">
                  {["1_week", "1_month", "3_months", "6_months", "12_months", "2_years", "3_years", "5_years", "10_years", "15_years"].map(h => (
                    <option key={h} value={h}>{h.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Input Variables</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(simInputs).map(([key, val]) => (
                    <div key={key}>
                      <label className="mb-0.5 block text-[10px] text-white/40">{key.replace(/_/g, " ")}</label>
                      <input
                        type="number"
                        step="any"
                        value={val}
                        onChange={(e) => setSimInputs({ ...simInputs, [key]: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded border border-white/15 bg-black px-2 py-1 text-xs text-white focus:border-lime-400 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={runSimulation}
                disabled={running || !simName.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
              >
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Dice5 className="h-4 w-4" />}
                {running ? "Running Monte Carlo (1000 iterations)..." : "Run Simulation"}
              </button>
            </div>
          </div>

          {/* Simulation result */}
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-lime-400">Simulation Result</h2>
            {currentSim ? (
              <SimulationResult result={currentSim} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FlaskConical className="h-10 w-10 text-white/20 mb-3" />
                <p className="text-sm text-white/40">Run a simulation to see probabilistic projections (p10/p50/p90), break-even, probability of success, and expected value.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === "history" && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-white/30" /></div>
          ) : (
            <>
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-lime-400">Past Council Decisions ({decisions.length})</h3>
                {decisions.length === 0 ? (
                  <p className="text-sm text-white/40 py-4">No decisions yet.</p>
                ) : (
                  <div className="space-y-2">
                    {decisions.map(d => (
                      <DecisionRow key={d.id} decision={d} onClick={() => { setCurrentDecision(d); setTab("council"); }} />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-lime-400">Past Simulations ({simulations.length})</h3>
                {simulations.length === 0 ? (
                  <p className="text-sm text-white/40 py-4">No simulations yet.</p>
                ) : (
                  <div className="space-y-2">
                    {simulations.map(s => (
                      <SimulationRow key={s.id} sim={s} onClick={() => { setCurrentSim(s); setTab("simulation"); }} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DecisionResult({ decision }) {
  const [expandedRound, setExpandedRound] = useState(null);
  const rounds = decision.rounds || [];
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-lime-400/30 bg-lime-400/5 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-xs text-white/50">Final Decision</p>
            <p className="mt-1 text-sm text-white">{decision.final_decision || "Pending..."}</p>
          </div>
          <div className="text-right">
            <div className={cn("text-2xl font-bold", (decision.decision_confidence || 0) >= 70 ? "text-lime-400" : (decision.decision_confidence || 0) >= 40 ? "text-amber-400" : "text-red-400")}>
              {Math.round(decision.decision_confidence || 0)}%
            </div>
            <p className="text-[10px] text-white/40">confidence</p>
          </div>
        </div>
        {decision.approval_required && (
          <div className="mt-2 flex items-center gap-1.5 rounded bg-red-400/10 px-2 py-1 text-[10px] text-red-400">
            <AlertTriangle className="h-3 w-3" /> Human approval required (red-tier)
          </div>
        )}
      </div>

      {decision.dissent_preserved && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-400"><Shield className="h-3 w-3" /> Dissent Preserved</p>
          <p className="mt-1 text-xs text-white/60">{decision.dissent_preserved}</p>
        </div>
      )}

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/50">11-Round Debate</p>
        <div className="space-y-1">
          {rounds.map((r, i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-black/30">
              <button
                onClick={() => setExpandedRound(expandedRound === i ? null : i)}
                className="flex w-full items-center gap-2 p-2 text-left"
              >
                {expandedRound === i ? <ChevronDown className="h-3 w-3 text-white/40" /> : <ChevronRight className="h-3 w-3 text-white/40" />}
                <span className="text-[10px] font-bold text-lime-400">R{r.round_number}</span>
                <span className="text-xs text-white/70">{r.round_name?.replace(/_/g, " ")}</span>
                <span className="ml-auto text-[10px] text-white/40">{r.archetype}</span>
                <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold", (r.confidence || 0) >= 70 ? "bg-lime-400/20 text-lime-400" : (r.confidence || 0) >= 40 ? "bg-amber-400/20 text-amber-400" : "bg-red-400/20 text-red-400")}>
                  {Math.round(r.confidence || 0)}%
                </span>
              </button>
              {expandedRound === i && (
                <div className="border-t border-white/5 p-2">
                  <p className="text-xs text-white/70">{r.analysis}</p>
                  {r.evidence && <p className="mt-1 text-[10px] text-white/40">Evidence: {r.evidence}</p>}
                  {r.dissent && <p className="mt-1 text-[10px] text-amber-400/80">Dissent: {r.dissent}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {decision.failure_modes?.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-red-400">Failure Modes</p>
          <ul className="space-y-1">
            {decision.failure_modes.map((f, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-white/60">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-400/60" /> {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {decision.recommended_next_action && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-lime-400">Recommended Next Action</p>
          <p className="mt-0.5 text-xs text-white/70">{decision.recommended_next_action}</p>
        </div>
      )}
    </div>
  );
}

function SimulationResult({ result }) {
  const summary = result.summary || {};
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <MetricCard label="P(Success)" value={`${summary.probability_of_success || 0}%`} icon={Target} color={summary.probability_of_success >= 60 ? "text-lime-400" : summary.probability_of_success >= 30 ? "text-amber-400" : "text-red-400"} />
        <MetricCard label="Expected Value" value={`$${(summary.expected_value || 0).toLocaleString()}`} icon={Scale} color={summary.expected_value >= 0 ? "text-lime-400" : "text-red-400"} />
        <MetricCard label="Break-Even" value={summary.break_even_months > 0 ? `${summary.break_even_months} mo` : "Not in horizon"} icon={TrendingUp} />
        <MetricCard label="Worst Case" value={`$${(summary.worst_case_loss || 0).toLocaleString()}`} icon={AlertTriangle} color="text-red-400" />
      </div>

      {result.uncertainty_notes && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-2">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-400"><AlertTriangle className="h-3 w-3" /> Uncertainty</p>
          <p className="mt-0.5 text-[10px] text-white/50">{result.uncertainty_notes}</p>
        </div>
      )}

      {result.assumptions?.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/50">Key Assumptions (challengeable)</p>
          <ul className="space-y-0.5">
            {result.assumptions.map((a, i) => (
              <li key={i} className="text-[10px] text-white/50">• {a}</li>
            ))}
          </ul>
        </div>
      )}

      {result.sensitivity_analysis?.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/50">Sensitivity (impact ranking)</p>
          <div className="space-y-1">
            {result.sensitivity_analysis.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-32 truncate text-[10px] text-white/50">{s.variable.replace(/_/g, " ")}</span>
                <div className="flex-1">
                  <div className="h-1.5 rounded-full bg-white/10">
                    <div className={cn("h-full rounded-full", s.direction === "positive" ? "bg-lime-400" : "bg-red-400")} style={{ width: `${s.impact}%` }} />
                  </div>
                </div>
                <span className="w-8 text-right text-[10px] text-white/40">{s.impact}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color = "text-white" }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-2.5">
      <div className="flex items-center gap-1.5">
        <Icon className={cn("h-3 w-3", color)} />
        <span className="text-[10px] text-white/50">{label}</span>
      </div>
      <p className={cn("mt-1 text-lg font-bold", color)}>{value}</p>
    </div>
  );
}

function DecisionRow({ decision, onClick }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-zinc-950 p-3 text-left transition-colors hover:border-lime-400/30">
      <div className={cn("rounded px-2 py-0.5 text-[10px] font-bold", (decision.decision_confidence || 0) >= 70 ? "bg-lime-400/20 text-lime-400" : (decision.decision_confidence || 0) >= 40 ? "bg-amber-400/20 text-amber-400" : "bg-red-400/20 text-red-400")}>
        {Math.round(decision.decision_confidence || 0)}%
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white">{decision.question}</p>
        <p className="text-[10px] text-white/40">{decision.decision_type} · {decision.status} · {decision.rounds?.length || 0} rounds</p>
      </div>
      {decision.approval_required && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
    </button>
  );
}

function SimulationRow({ sim, onClick }) {
  const summary = sim.summary || {};
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-zinc-950 p-3 text-left transition-colors hover:border-lime-400/30">
      <FlaskConical className="h-4 w-4 shrink-0 text-lime-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white">{sim.simulation_name}</p>
        <p className="text-[10px] text-white/40">{sim.scenario} · {sim.time_horizon?.replace(/_/g, " ")} · P(success)={summary.probability_of_success || 0}%</p>
      </div>
      <span className={cn("text-xs font-bold", (summary.expected_value || 0) >= 0 ? "text-lime-400" : "text-red-400")}>
        ${(summary.expected_value || 0).toLocaleString()}
      </span>
    </button>
  );
}