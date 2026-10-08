import { useState, useEffect } from 'react';
import { Loader2, Send, Mail, Phone, Building2, CheckCircle2, Clock, ArrowRight, FileText, Copy, Check, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import StudioTopBar from '@/components/studio/StudioTopBar';

const BUSINESS_TYPE_LABELS = { new: 'New Business', ai_enhancement: 'AI Enhancement', rebrand: 'Rebrand' };
const PIPELINE_STEPS = [
  { key: 'invite', label: 'Invite Client', icon: Send },
  { key: 'onboarding', label: 'Client Onboarding', icon: Mail },
  { key: 'skip_trace', label: 'Skip Tracing', icon: Phone },
  { key: 'summary', label: 'Pipeline Summary', icon: FileText },
  { key: 'gpt_sync', label: 'GPT Sync (3 versions)', icon: Building2 },
  { key: 'approval', label: 'Client Approval', icon: CheckCircle2 },
];

export default function PipelineFlow() {
  const [user, setUser] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ client_name: '', client_email: '', client_phone: '', business_type: 'new' });
  const [activeSession, setActiveSession] = useState(null);
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [traces, setTraces] = useState([]);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role === 'admin') loadInvitations();
    }).catch(e => setError(e.message));
  }, []);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const page = await base44.entities.ClientInvitation.filter({}, { sort: '-created_date', limit: 50, fields: ['client_name', 'client_email', 'client_phone', 'business_type', 'status', 'session_id', 'sent_at', 'completed_at'] });
      setInvitations(page.items || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const sendInvitation = async () => {
    if (!form.client_name || !form.client_email) { setError('Name and email are required.'); return; }
    setSending(true); setError('');
    try {
      await base44.functions.invoke('sendClientInvitation', form);
      setForm({ client_name: '', client_email: '', client_phone: '', business_type: 'new' });
      loadInvitations();
    } catch (e) { setError(e.response?.data?.error || e.message || 'Could not send invitation.'); }
    finally { setSending(false); }
  };

  const selectSession = async (sessionId) => {
    setActiveSession(sessionId);
    setSummary(''); setTraces([]);
    try {
      const tracePage = await base44.entities.SkipTraceReport.filter({ session_id: sessionId }, { sort: '-created_date', limit: 20, fields: ['question_key', 'answer_text', 'status', 'confidence_score', 'competitors', 'social_profiles'] });
      setTraces(tracePage.items || []);
    } catch {}
  };

  const generateSummary = async () => {
    if (!activeSession) return;
    setSummaryLoading(true);
    try {
      const { data } = await base44.functions.invoke('generatePipelineSummary', { session_id: activeSession });
      setSummary(data.summary || '');
    } catch (e) { setError(e.response?.data?.error || e.message); }
    finally { setSummaryLoading(false); }
  };

  const copySummary = () => { navigator.clipboard.writeText(summary).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };

  return (
    <div className="studio-workspace flex h-dvh min-h-0 flex-col bg-background text-foreground">
      <StudioTopBar />
      <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-xl font-semibold">Deterministic Pipeline</h1>
            <p className="mt-1 text-sm text-muted-foreground">Invite a client, they onboard, the system skip-traces, generates a summary for ChatGPT, and GPT produces 3 versions of each asset for approval.</p>
          </div>

          {/* Pipeline steps visual */}
          <div className="flex flex-wrap gap-2">
            {PIPELINE_STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2"><s.icon className="h-3.5 w-3.5 text-primary" /><span className="text-xs font-medium">{s.label}</span></div>
                {i < PIPELINE_STEPS.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              </div>
            ))}
          </div>

          {/* Step 1: Invite Client */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Send className="h-4 w-4 text-primary" /> Step 1: Invite Client</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input placeholder="Client full name" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} className="rounded-lg border border-border bg-background p-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" />
              <input placeholder="Client email" value={form.client_email} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))} className="rounded-lg border border-border bg-background p-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" />
              <input placeholder="Client phone (optional)" value={form.client_phone} onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))} className="rounded-lg border border-border bg-background p-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" />
              <select value={form.business_type} onChange={e => setForm(f => ({ ...f, business_type: e.target.value }))} className="rounded-lg border border-border bg-background p-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
                <option value="new">New Business</option>
                <option value="ai_enhancement">AI Enhancement</option>
                <option value="rebrand">Rebrand</option>
              </select>
            </div>
            <button onClick={sendInvitation} disabled={sending} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Invitation Email
            </button>
            {error && <p role="alert" className="text-sm">{error}</p>}
          </div>

          {/* Invitations list */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h2 className="text-sm font-semibold">Sent Invitations</h2>
            {loading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p> :
             invitations.length === 0 ? <p className="text-sm text-muted-foreground">No invitations sent yet.</p> :
             <div className="space-y-2">
               {invitations.map(inv => (
                 <div key={inv.id} className={`rounded-lg border p-3 ${activeSession === inv.session_id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                   <div className="flex items-center gap-3">
                     <div className="min-w-0 flex-1">
                       <p className="truncate text-sm font-medium">{inv.client_name} · {BUSINESS_TYPE_LABELS[inv.business_type]}</p>
                       <p className="truncate text-xs text-muted-foreground">{inv.client_email}{inv.client_phone ? ` · ${inv.client_phone}` : ''}</p>
                     </div>
                     <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${inv.status === 'completed' ? 'bg-green-500/10 text-green-500' : inv.status === 'opened' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>{inv.status}</span>
                   </div>
                   {inv.status === 'completed' && inv.session_id && (
                     <button onClick={() => selectSession(inv.session_id)} className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
                       <Eye className="h-3 w-3" /> View pipeline for this client
                     </button>
                   )}
                 </div>
               ))}
             </div>}
          </div>

          {/* Active session pipeline detail */}
          {activeSession && (
            <div className="space-y-4 rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">Pipeline Detail</h2>

              {/* Skip trace status */}
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Phone className="h-3.5 w-3.5" /> Step 3: Skip Tracing</h3>
                {traces.length === 0 ? <p className="text-sm text-muted-foreground">No skip traces yet. Traces run automatically when the client completes onboarding.</p> :
                  <div className="space-y-1.5">
                    {traces.map(t => (
                      <div key={t.id} className="flex items-center gap-2 rounded-lg border border-border p-2 text-xs">
                        <span className="font-mono">{t.question_key}</span>
                        <span className="truncate text-muted-foreground">{t.answer_text?.slice(0, 60)}</span>
                        <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold ${t.status === 'complete' ? 'bg-green-500/10 text-green-500' : t.status === 'failed' ? 'bg-destructive/10 text-destructive' : 'bg-secondary'}`}>{t.status}</span>
                        {t.confidence_score ? <span className="text-muted-foreground">{t.confidence_score}%</span> : null}
                      </div>
                    ))}
                  </div>}
              </div>

              {/* Summary generation */}
              <div className="space-y-2 border-t border-border pt-4">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><FileText className="h-3.5 w-3.5" /> Step 4: Pipeline Summary</h3>
                <button onClick={generateSummary} disabled={summaryLoading} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40">
                  {summaryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Generate Summary for ChatGPT
                </button>
                {summary && (
                  <div className="relative">
                    <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-background p-3 text-xs leading-relaxed whitespace-pre-wrap">{summary}</pre>
                    <button onClick={copySummary} className="absolute right-2 top-2 rounded-md bg-card p-2 hover:bg-secondary" aria-label="Copy summary">
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                )}
              </div>

              {/* GPT Sync link */}
              <div className="border-t border-border pt-4">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Building2 className="h-3.5 w-3.5" /> Step 5: GPT Sync (3 versions)</h3>
                <p className="mt-1 text-sm text-muted-foreground">Send the summary to ChatGPT. It produces 3 versions of each asset (website, logo, brand pack, marketing) and POSTs them to the sync endpoint.</p>
                <Link to="/gpt-sync" className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:underline"><ArrowRight className="h-4 w-4" /> Go to GPT Sync page</Link>
              </div>

              {/* Approval link */}
              <div className="border-t border-border pt-4">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5" /> Step 6: Client Approval</h3>
                <p className="mt-1 text-sm text-muted-foreground">Review the 3 versions of each asset and approve the best one for the client.</p>
                <Link to="/pack-inbox" className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:underline"><ArrowRight className="h-4 w-4" /> Go to Pack Inbox</Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}