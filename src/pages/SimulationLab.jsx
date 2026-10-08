import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Activity, Loader2, Play, TrendingUp, Users, DollarSign, Globe,
  BarChart3, Target, AlertTriangle, Shield, Zap, Eye, ChevronRight,
  RefreshCw, ArrowRight, Sparkles, BarChart, LineChart,
} from "lucide-react";
import {
  LineChart as RLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, Legend, BarChart as RBarChart, Bar,
} from "recharts";

const HORIZONS = [
  { value: "1_month", label: "1 Month", months: 1 },
  { value: "6_months", label: "6 Months", months: 6 },
  { value: "12_months", label: "1 Year", months: 12 },
  { value: "2_years", label: "2 Years", months: 24 },
  { value: "3_years", label: "3 Years", months: 36 },
  { value: "4_years", label: "4 Years", months: 48 },
  { value: "5_years", label: "5 Years", months: 60 },
  { value: "10_years", label: "10 Years", months: 120 },
];

const SCENARIOS = [
  { value: "baseline", label: "Baseline", desc: "Normal conditions" },
  { value: "conservative", label: "Conservative", desc: "Below-average growth" },
  { value: "expected", label: "Expected", desc: "Most likely outcome" },
  { value: "optimistic", label: "Optimistic", desc: "Above-average growth" },
  { value: "adverse", label: "Adverse", desc: "Significant headwinds" },
  { value: "black_swan", label: "Black Swan", desc: "Worst-case scenario" },
];

const DEFAULT_INPUTS = {
  customers: 0,
  price: 1500,
  conversion_rate: 0.03,
  churn_rate: 0.08,
  cac: 50,
  gross_margin: 0.65,
  monthly_cost: 5000,
  growth_rate: 0.15,
  sites_per_month: 50,
  avg_traffic_per_site: 200,
  avg_revenue_per_site: 300,
  domain_cost: 12,
  hosting_cost_per_site: 0,
  keywords_per_site: 15,
  market_share_target: 0.01,
};

export default function SimulationLab() {
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [horizon, setHorizon] = useState("12_months");
  const [scenario, setScenario] = useState("expected");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [priorRuns, setPriorRuns] = useState([]);
  const [error, setError] = useState("");
  const [loadingProject, setLoadingProject] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;
        const res = await base44.entities.ClientProject.filter(
          { client_email: user.email },
          { sort: "-created_date", limit: 1 }
        );
        const items = res?.items || res || [];
        if (items.length > 0) {
          setProject(items[0]);
          // Pre-fill from strategy data
          const s = items[0]?.strategy;
          if (s) {
            setInputs((prev) => ({
              ...prev,
              price: s.pricing_strategy ? 1500 : prev.price,
              growth_rate: s.acquisition_channels?.length > 3 ? 0.2 : 0.15,
            }));
          }
        }
      } catch {}
      setLoadingProject(false);
    })();
  }, []);

  const loadPriorRuns = useCallback(async () => {
    try {
      const res = await base44.entities.SimulationResult.filter(
        { simulation_type: "digital_dominance" },
        { sort: "-created_date", limit: 10 }
      );
      setPriorRuns(res?.items || res || []);
    } catch {}
  }, []);

  useEffect(() => { loadPriorRuns(); }, [loadPriorRuns]);

  const runSimulation = async () => {
    setRunning(true);
    setError("");
    try {
      const res = await base44.functions.invoke("runDominanceSimulation", {
        simulation_name: `Digital Dominance — ${SCENARIOS.find(s => s.value === scenario)?.label} — ${HORIZONS.find(h => h.value === horizon)?.label}`,
        simulation_type: "digital_dominance",
        input_variables: inputs,
        scenario,
        time_horizon: horizon,
        iterations: 500,
        prior_result_id: result?.id,
        vision_data: project?.vision,
        strategy_data: project?.strategy,
      });
      const data = res?.data || res;
      if (data?.simulation_id) {
        const full = await base44.entities.SimulationResult.get(data.simulation_id);
        setResult(full);
        loadPriorRuns();
      } else {
        setError(data?.error || "Simulation failed.");
      }
    } catch (e) {
      setError(e?.message || "Simulation failed.");
    } finally {
      setRunning(false);
    }
  };

  const fmtMoney = (n) => {
    if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
    return `$${Math.round(n)}`;
  };

  const fmtNum = (n) => {
    if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return Math.round(n).toLocaleString();
  };

  const chartData = result?.projections?.map((p) => ({
    period: p.period.replace("month_", "M").replace("period_", "P"),
    revenue: p.revenue_p50,
    revenueLow: p.revenue_p10,
    revenueHigh: p.revenue_p90,
    profit: p.profit_p50,
    profitLow: p.profit_p10,
    profitHigh: p.profit_p90,
    traffic: p.traffic_p50,
    trafficLow: p.traffic_p10,
    trafficHigh: p.traffic_p90,
    sites: p.site_count_p50,
    sitesLow: p.site_count_p10,
    sitesHigh: p.site_count_p90,
    da: p.domain_authority_p50,
    keywords: p.keywords_ranking_p50,
    marketShare: p.market_share_p50,
  })) || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Activity className="h-4 w-4" /> Digital Dominance Simulation Lab
        </div>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Monte Carlo Business & SEO Projection</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connected to your <span className="text-primary">Vision → Strategy</span>. Run probabilistic projections
          across time horizons from 1 month to 10 years. Projects revenue, customers, costs, profit, organic traffic,
          site count, domain authority, keyword rankings, and market share — all with p10/p50/p90 uncertainty bands.
        </p>
      </div>

      {/* Vision → Strategy status */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className={`rounded-xl border p-4 ${project?.vision ? "border-primary/30 bg-primary/5" : "border-border bg-muted"}`}>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Vision</span>
            {project?.vision?.approved && <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">APPROVED</span>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {project?.vision ? (project.vision.mission || "Vision generated").slice(0, 100) + "…" : "No vision yet — generate one first"}
          </p>
        </div>
        <div className={`rounded-xl border p-4 ${project?.strategy ? "border-primary/30 bg-primary/5" : "border-border bg-muted"}`}>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Strategy</span>
            {project?.strategy?.approved && <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">APPROVED</span>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {project?.strategy ? (project.strategy.competitive_positioning || "Strategy generated").slice(0, 100) + "…" : "No strategy yet — generate one first"}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Controls */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time Horizon</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {HORIZONS.map((h) => (
                <button
                  key={h.value}
                  onClick={() => setHorizon(h.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    horizon === h.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scenario</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SCENARIOS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setScenario(s.value)}
                  title={s.desc}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    scenario === s.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input variables */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Input Variables</label>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(inputs).map(([key, val]) => (
              <div key={key}>
                <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">{key.replace(/_/g, " ")}</label>
                <input
                  type="number"
                  step="any"
                  value={val}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running ? "Running Monte Carlo…" : "Run Simulation"}
        </button>
      </div>

      {/* Results */}
      {result && result.summary && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard icon={DollarSign} label="Expected Revenue" value={fmtMoney(result.summary.expected_revenue_12m)} sub={`P(success) ${result.summary.probability_of_success}%`} />
            <SummaryCard icon={TrendingUp} label="Expected Profit" value={fmtMoney(result.summary.expected_profit_12m)} sub={`Break-even ${result.summary.break_even_months > 0 ? `${result.summary.break_even_months}mo` : "—"}`} />
            <SummaryCard icon={Globe} label="Sites Deployed" value={fmtNum(result.summary.total_sites_projected)} sub="at horizon end" />
            <SummaryCard icon={BarChart3} label="Monthly Traffic" value={fmtNum(result.summary.total_traffic_projected)} sub="organic visitors" />
            <SummaryCard icon={Target} label="Keywords Ranking" value={fmtNum(result.summary.total_keywords_projected)} sub="top-10 positions" />
            <SummaryCard icon={Shield} label="Domain Authority" value={`${result.summary.avg_domain_authority_projected}`} sub="average DA" />
            <SummaryCard icon={Users} label="Market Share" value={`${result.summary.market_share_projected}%`} sub="of estimated TAM" />
            <SummaryCard icon={Activity} label="Expected Value" value={fmtMoney(result.summary.expected_value)} sub={`Worst: ${fmtMoney(result.summary.worst_case_loss)}`} />
          </div>

          {/* Revenue chart */}
          <ChartCard title="Revenue Projection" subtitle="p10 / p50 (median) / p90 — Monte Carlo uncertainty bands">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={fmtMoney} />
                <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenueHigh" stroke="none" fill="hsl(var(--primary) / 0.1)" name="p90" />
                <Area type="monotone" dataKey="revenueLow" stroke="none" fill="hsl(var(--card))" name="p10" />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="p50 (median)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Traffic + Sites chart */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Organic Traffic Growth" subtitle="Total monthly visitors across all deployed sites">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={fmtNum} />
                  <Tooltip formatter={(v) => fmtNum(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="trafficHigh" stroke="none" fill="hsl(var(--primary) / 0.1)" />
                  <Area type="monotone" dataKey="trafficLow" stroke="none" fill="hsl(var(--card))" />
                  <Line type="monotone" dataKey="traffic" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Site Count Growth" subtitle="Cumulative deployed sites over time">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={fmtNum} />
                  <Tooltip formatter={(v) => fmtNum(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="sitesHigh" stroke="none" fill="hsl(var(--primary) / 0.1)" />
                  <Area type="monotone" dataKey="sitesLow" stroke="none" fill="hsl(var(--card))" />
                  <Line type="monotone" dataKey="sites" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Profit + Domain Authority */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Profit Projection" subtitle="p10 / p50 / p90 profit bands">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={fmtMoney} />
                  <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="profitHigh" stroke="none" fill="hsl(var(--primary) / 0.1)" />
                  <Area type="monotone" dataKey="profitLow" stroke="none" fill="hsl(var(--card))" />
                  <Line type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Domain Authority + Keywords" subtitle="Average DA and total keywords ranking">
              <ResponsiveContainer width="100%" height={200}>
                <RLineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={fmtNum} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Line yAxisId="left" type="monotone" dataKey="da" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Domain Authority" />
                  <Line yAxisId="right" type="monotone" dataKey="keywords" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="Keywords" />
                </RLineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Sensitivity analysis */}
          {result.sensitivity_analysis?.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Zap className="h-3.5 w-3.5" /> Sensitivity Analysis — Which Variables Matter Most
              </div>
              <div className="mt-3 space-y-1.5">
                {result.sensitivity_analysis.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 text-xs text-muted-foreground">{s.variable.replace(/_/g, " ")}</span>
                    <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded ${s.direction === "positive" ? "bg-primary" : "bg-destructive"}`}
                        style={{ width: `${s.impact}%` }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right text-xs font-medium text-foreground">{s.impact}%</span>
                    <span className={`w-16 shrink-0 text-xs ${s.direction === "positive" ? "text-primary" : "text-destructive"}`}>
                      {s.direction === "positive" ? "↑" : "↓"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assumptions + uncertainty */}
          {result.assumptions?.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Shield className="h-3.5 w-3.5" /> Key Assumptions
              </div>
              <ul className="mt-2 space-y-1">
                {result.assumptions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="text-primary/50 mt-0.5">•</span> {a}
                  </li>
                ))}
              </ul>
              <p className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive/80">
                <AlertTriangle className="inline h-3 w-3 mr-1" /> {result.uncertainty_notes}
              </p>
            </div>
          )}

          {/* CTA to Digital Dominance */}
          <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-5">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-foreground">Ready to deploy?</h3>
                <p className="text-xs text-muted-foreground">
                  Your simulation projects {fmtNum(result.summary.total_sites_projected)} sites and {fmtNum(result.summary.total_traffic_projected)} monthly visitors.
                  Launch your Digital Dominance mass deployment now.
                </p>
              </div>
              <button
                onClick={() => navigate("/digital-dominance")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Deploy <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prior runs */}
      {priorRuns.length > 0 && !result && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5" /> Prior Simulations
          </div>
          <div className="mt-2 space-y-1.5">
            {priorRuns.slice(0, 5).map((r) => (
              <button
                key={r.id}
                onClick={() => setResult(r)}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-background p-2.5 text-left hover:border-primary/40"
              >
                <BarChart className="h-4 w-4 text-primary/60" />
                <span className="flex-1 text-xs font-medium text-foreground">{r.simulation_name}</span>
                <span className="text-[10px] text-muted-foreground">{r.scenario} · {r.time_horizon.replace(/_/g, " ")}</span>
                {r.summary?.total_sites_projected && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    {fmtNum(r.summary.total_sites_projected)} sites
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1 text-lg font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground/70">{sub}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="text-[10px] text-muted-foreground">{subtitle}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}