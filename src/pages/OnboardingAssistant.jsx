import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Building2, User, Briefcase, MapPin, Wrench, Users, Trophy, DollarSign,
  ArrowRight, ArrowLeft, Loader2, Search, CheckCircle2, AlertCircle,
  Brain, Sparkles, Radar,
} from "lucide-react";
import { ONBOARDING_QUESTIONS } from "@/lib/onboardingQuestions";
import { cn } from "@/lib/utils";

const ICON_MAP = { Building2, User, Briefcase, MapPin, Wrench, Users, Trophy, DollarSign };

export default function OnboardingAssistant() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answer, setAnswer] = useState("");
  const [tracing, setTracing] = useState(false);
  const [traceResults, setTraceResults] = useState({});
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  // Create or load session on mount
  useEffect(() => {
    async function initSession() {
      setCreating(true);
      try {
        const existing = await base44.entities.OnboardingSession.filter(
          { user_email: (await base44.auth.me()).email, status: 'onboarding' },
          { sort: '-created_date', limit: 1 }
        );
        const items = existing.items || existing;
        if (items.length > 0) {
          setSession(items[0]);
          setCurrentStep(items[0].current_step || 0);
          if (items[0].answers) setTraceResults(items[0].answers);
        } else {
          const newSession = await base44.entities.OnboardingSession.create({
            user_email: (await base44.auth.me()).email,
            status: 'onboarding',
            current_step: 0,
            answers: {},
          });
          setSession(newSession);
        }
      } catch (e) {
        setError(e.message);
      }
      setCreating(false);
    }
    initSession();
  }, []);

  const submitAnswer = useCallback(async () => {
    if (!answer.trim() || !session || tracing) return;
    setTracing(true);
    setError(null);
    try {
      const question = ONBOARDING_QUESTIONS[currentStep];
      const context = {};
      Object.entries(traceResults).forEach(([k, v]) => {
        if (v.answer_text) context[k] = { answer_text: v.answer_text };
      });

      const res = await base44.functions.invoke('skipTraceAnswer', {
        session_id: session.session_id || session.id,
        question_key: question.key,
        answer_text: answer.trim(),
        context,
      });

      const traceData = res.data?.report || res.data;
      const newAnswers = {
        ...traceResults,
        [question.key]: {
          answer_text: answer.trim(),
          skip_trace_id: traceData?.id,
          answered_at: new Date().toISOString(),
          trace: traceData,
        },
      };
      setTraceResults(newAnswers);
      setAnswer("");

      // Update session
      const nextStep = currentStep + 1;
      await base44.entities.OnboardingSession.update(session.id, {
        current_step: nextStep,
        answers: newAnswers,
      });

      if (nextStep >= ONBOARDING_QUESTIONS.length) {
        // All questions answered — go to strategy
        navigate('/strategy-review', { state: { session_id: session.session_id || session.id } });
      } else {
        setCurrentStep(nextStep);
      }
    } catch (e) {
      setError(e.message || 'Skip trace failed. You can continue anyway.');
    }
    setTracing(false);
  }, [answer, session, tracing, currentStep, traceResults, navigate]);

  const skipQuestion = useCallback(async () => {
    if (!session) return;
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    setAnswer("");
    await base44.entities.OnboardingSession.update(session.id, { current_step: nextStep });
    if (nextStep >= ONBOARDING_QUESTIONS.length) {
      navigate('/strategy-review', { state: { session_id: session.session_id || session.id } });
    }
  }, [session, currentStep, navigate]);

  if (creating) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const question = ONBOARDING_QUESTIONS[currentStep];
  const Icon = ICON_MAP[question.icon] || Brain;
  const progress = (currentStep / ONBOARDING_QUESTIONS.length) * 100;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">AI Onboarding</h1>
            <p className="text-sm text-muted-foreground">Answer questions — we research everything in the background</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-2">
          <div className="h-2 flex-1 rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary transition-all" style={{ width: progress + '%' }} />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{currentStep}/{ONBOARDING_QUESTIONS.length}</span>
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">{question.question}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{question.hint}</p>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
            Step {currentStep + 1} of {ONBOARDING_QUESTIONS.length}
          </span>
        </div>

        <div className="mt-5">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !tracing && answer.trim() && submitAnswer()}
            placeholder={question.placeholder}
            disabled={tracing}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
            autoFocus
          />
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={skipQuestion}
            disabled={tracing}
            className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
          </button>
          <button
            onClick={submitAnswer}
            disabled={tracing || !answer.trim()}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {tracing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Researching...
              </>
            ) : (
              <>
                {currentStep === ONBOARDING_QUESTIONS.length - 1 ? 'Finish & Generate Strategy' : 'Answer & Continue'}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Skip-trace results from previous answers */}
      {Object.keys(traceResults).length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Radar className="h-4 w-4 text-primary" />
            Background Intelligence ({Object.keys(traceResults).length} traces)
          </div>
          {Object.entries(traceResults).map(([key, val]) => {
            const q = ONBOARDING_QUESTIONS.find((x) => x.key === key);
            const trace = val.trace;
            return (
              <div key={key} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-foreground">{q?.question || key}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{val.answer_text}</span>
                </div>
                {trace && trace.competitors?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {trace.competitors.slice(0, 5).map((c, i) => (
                      <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}
                {trace && trace.sources?.length > 0 && (
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    {trace.sources.length} sources · {trace.confidence_score || 50}% confidence
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}