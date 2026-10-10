import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Play, Zap, CheckCircle2, XCircle, Clock, ArrowRight, Activity, Cpu, Rocket, RefreshCw } from 'lucide-react';
import StudioTopBar from '@/components/studio/StudioTopBar';

export default function AutonomousPipeline() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(null);
  const [result, setResult] = useState(null);
  const [autoDeploy, setAutoDeploy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const page = await base44.entities.OnboardingSession.filter({}, { sort: '-created_date', limit: 50, fields: ['session_id', 'project_name', 'user_email', 'status', 'business_type', 'current_step', 'locked_strategy_id', 'approved_pack_id', 'deployed_site_id', 'answers', 'created_date', 'client_phone'] });
      setSessions(page.items || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const runPipeline = async (sessionId) => {
    setRunning(sessionId); setResult(null); setError('');
    try {
      const { data } = await base44.functions.invoke('runAutonomousPipeline', { session_id: sessionId, auto_deploy: autoDeploy });
      setResult(data);
      loadSessions();
    } catch (e) {
      const errData = e.response?.data || {};
      setError(errData.error || e.message || 'Pipeline failed.');
      setResult(errData);
    } finally { setRunning(null); }
  };

  const statusColor = (s) => ({
    onboarding: 'bg-secondary text-muted-foreground',
    strategy_locked: 'bg-primary/10 text-primary',
    pack_pending: 'bg-amber-500/10 text-amber-500',
    pack_approved: 'bg-green-500/10 text-green-500',
    deployed: 'bg-green-500/20 text-green-600',
    mass_deploying: 'bg-primary/20 text-primary',
    complete: 'bg-green-500/20 text-green-600',
  }[s] || 'bg-secondary text-muted-foreground');

  return (
    <div className="studio-workspace flex h-dvh min-h-0 flex-col bg-background text-foreground">
      <StudioTopBar />
      <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Header */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Cpu className="h-6 w-6" /></div>
              <div className="flex-1"><h1 className="text-xl font-bold">Autonomous Pipeline Engine</h1><p className="text-sm text-muted-foreground">Run the entire 8-step pipeline for any client — skip tracing, strategy, asset generation, approval, and deployment — all in one click, no manual steps.</p></div>
              <button onClick={loadSessions} className="rounded-lg border border-border p-2 hover:bg-secondary"><RefreshCw className="h-4 w-4" /></button>
            </div>

            {/* Auto-deploy toggle */}
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={autoDeploy} onChange={e => setAutoDeploy(e.target.checked)} className="h-4 w-4 rounded border-border" />
              <span className="font-medium">Auto-deploy to Vercel</span>
              <span className="text-muted-foreground">— also pushes the approved site live (uses VERCEL_TOKEN, not integration credits)</span>
            </label>
          </div>

          {/* Credit warning */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm text-amber-600 dark:text-amber-400">⚠ Integration credits are exhausted until Oct 12. The autonomous engine uses deterministic fallbacks (no LLM, no image generation) so it still runs end-to-end. Email invitations and LLM-based strategy are skipped — the system generates assets internally instead.</p>
          </div>

          {/* Pipeline result */}
          {result && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                {result.ok ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-destructive" />}
                <h2 className="text-sm font-semibold">{result.ok ? 'Pipeline Complete' : 'Pipeline Failed'}</h2>
              </div>
              {result.summary && (
                <div className="grid gap-2 sm:grid-cols-3">
                  <ResultCard label="Skip Traces" value={result.summary.skip_traces} ok={result.summary.skip_traces?.includes('complete')} />
                  <ResultCard label="Strategy Locked" value={result.summary.strategy_locked ? '✓' : '✗'} ok={result.summary.strategy_locked} />
                  <ResultCard label="Packs Generated" value={String(result.summary.packs_generated)} ok={result.summary.packs_generated > 0} />
                  <ResultCard label="Pack Approved" value={result.summary.pack_approved ? '✓' : '✗'} ok={result.summary.pack_approved} />
                  <ResultCard label="Deployed" value={result.summary.deployed ? '✓' : 'Skipped'} ok={result.summary.deployed} />
                  <ResultCard label="Supabase Sync" value={result.steps?.supabase_sync?.status === 'ok' ? '✓' : result.steps?.supabase_sync?.status === 'skipped' ? 'Skipped' : '✗'} ok={result.steps?.supabase_sync?.status === 'ok'} />
                  {result.summary.live_url && <a href={result.summary.live_url} target="_blank" rel="noreferrer" className="col-span-full flex items-center gap-1.5 rounded-lg bg-primary/10 p-3 text-sm text-primary hover:underline"><Rocket className="h-4 w-4" /> {result.summary.live_url}</a>}
                </div>
              )}
              {result.logs && (
                <details>
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">Execution logs ({result.logs.length} lines)</summary>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-background p-3 text-xs leading-relaxed whitespace-pre-wrap">{result.logs.join('\n')}</pre>
                </details>
              )}
            </div>
          )}

          {error && <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}

          {/* Sessions list */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Client Sessions</h2>
            {loading ? <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> :
             sessions.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center"><p className="text-sm text-muted-foreground">No sessions yet. Invite a client from the Pipeline page to get started.</p></div> :
             sessions.map(s => (
              <div key={s.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.project_name || 'Unnamed Project'}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.user_email} · {new Date(s.created_date).toLocaleDateString()}</p>
                  </div>
                  <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${statusColor(s.status)}`}>{s.status.replace(/_/g, ' ')}</span>
                  <button onClick={() => runPipeline(s.session_id)} disabled={running === s.session_id}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40">
                    {running === s.session_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                    {running === s.session_id ? 'Running…' : 'Run Pipeline'}
                  </button>
                </div>
                {/* Pipeline progress indicators */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <StepDot label="Onboarded" done={true} />
                  <StepDot label="Skip Traced" done={s.status !== 'onboarding'} />
                  <StepDot label="Strategy" done={!!s.locked_strategy_id} />
                  <StepDot label="Packs Gen" done={['pack_pending', 'pack_approved', 'deployed', 'complete'].includes(s.status)} />
                  <StepDot label="Approved" done={['pack_approved', 'deployed', 'complete'].includes(s.status)} />
                  <StepDot label="Deployed" done={['deployed', 'complete'].includes(s.status)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function ResultCard({ label, value, ok }) {
  return <div className={`rounded-lg border p-3 ${ok ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-background'}`}>
    <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
    <p className="text-sm font-semibold">{value}</p>
  </div>;
}

function StepDot({ label, done }) {
  return <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${done ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-muted-foreground'}`}>
    {done ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />} {label}
  </span>;
}