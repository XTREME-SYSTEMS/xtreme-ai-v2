import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Lock, Loader2, CheckCircle2, AlertCircle, FileText, Target,
  TrendingUp, Shield, ArrowRight, Copy, Brain, Radar, Users,
} from "lucide-react";

export default function StrategyReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionId = location.state?.session_id;
  const [strategy, setStrategy] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sessionId) generateStrategy();
  }, [sessionId]);

  async function generateStrategy() {
    setGenerating(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('lockStrategy', { session_id: sessionId });
      setStrategy(res.data?.strategy || res.data);
    } catch (e) {
      setError(e.message || 'Strategy generation failed');
    }
    setGenerating(false);
  }

  async function approveStrategy() {
    if (!strategy) return;
    try {
      await base44.entities.LockedStrategy.update(strategy.id, {
        approved: true,
        approved_at: new Date().toISOString(),
      });
      navigate('/pack-inbox', { state: { session_id: sessionId, strategy_id: strategy.id } });
    } catch (e) {
      setError(e.message);
    }
  }

  function copyBrief() {
    if (strategy?.website_brief) {
      navigator.clipboard.writeText(strategy.website_brief);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (generating) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 animate-pulse text-primary" />
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Locking your strategy...</h2>
          <p className="text-sm text-muted-foreground">Synthesizing intelligence from all skip-trace reports</p>
        </div>
      </div>
    );
  }

  if (error && !strategy) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        </div>
        <button onClick={generateStrategy} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">
          Retry
        </button>
      </div>
    );
  }

  if (!strategy) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Your Locked Strategy</h1>
            <p className="text-sm text-muted-foreground">This is THE strategy. Review it, approve it, and we generate your website.</p>
          </div>
        </div>
      </div>

      {/* Strategy sections */}
      <div className="grid gap-4 md:grid-cols-2">
        <StrategyCard icon={Target} title="Positioning" content={strategy.positioning} />
        <StrategyCard icon={Users} title="Target Market" content={strategy.target_market} />
        <StrategyCard icon={TrendingUp} title="Competitive Advantage" content={strategy.competitive_advantage} />
        <StrategyCard icon={Shield} title="Pricing Model" content={strategy.pricing_model} />
      </div>

      {/* Growth channels */}
      {strategy.growth_channels?.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <TrendingUp className="h-4 w-4 text-primary" /> Growth Channels
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {strategy.growth_channels.map((ch, i) => (
              <span key={i} className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm text-primary">{ch}</span>
            ))}
          </div>
        </div>
      )}

      {/* Risk factors */}
      {strategy.risk_factors?.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlertCircle className="h-4 w-4 text-amber-500" /> Risk Factors
          </h3>
          <ul className="mt-3 space-y-1.5">
            {strategy.risk_factors.map((r, i) => (
              <li key={i} className="text-sm text-muted-foreground">• {r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Website brief — the key output */}
      <div className="rounded-2xl border-2 border-primary/30 bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4 text-primary" /> Website Brief for GPT
          </h3>
          <button onClick={copyBrief} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted">
            <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm text-foreground">
          {strategy.website_brief}
        </pre>
      </div>

      {/* GPT Sync instructions */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Radar className="h-4 w-4 text-primary" /> Send this brief to GPT
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Give the website brief above to GPT (or any AI tool). When GPT generates a mockup, it POSTs to the sync endpoint and the mockup lands here for your review.
        </p>
        <div className="mt-3 rounded-lg bg-muted p-3 font-mono text-xs text-foreground">
          POST https://autobuilder.base44.app/functions/ingestPack
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          GPT sends the sync_token, name, preview_html, and brand_tokens. Nothing goes live until you approve.
        </p>
      </div>

      {/* Approve button */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Ready to lock this strategy?</h3>
          <p className="text-xs text-muted-foreground">Once approved, GPT can generate mockups against this brief.</p>
        </div>
        <button onClick={approveStrategy} className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <CheckCircle2 className="h-4 w-4" /> Approve & Lock
        </button>
      </div>
    </div>
  );
}

function StrategyCard({ icon: Icon, title, content }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">{content}</p>
    </div>
  );
}