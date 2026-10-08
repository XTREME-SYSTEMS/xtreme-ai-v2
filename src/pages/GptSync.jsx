import { useState, useEffect } from 'react';
import { Copy, Check, Webhook, Package, ArrowRight, KeyRound, Loader2, ExternalLink, FileText, Layers } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import StudioTopBar from '@/components/studio/StudioTopBar';

const APP_URL = 'https://autobuilder.base44.app';
const ENDPOINT = `${APP_URL}/functions/ingestPack`;

const CURL = `curl -X POST ${ENDPOINT} \\
  -H "Content-Type: application/json" \\
  -d '{
    "sync_token": "<your PACK_SYNC_TOKEN>",
    "name": "Hero Mockup v2",
    "kind": "web_pack",
    "preview_html": "<!doctype html>...</html>",
    "brand_tokens": "{\\"colors\\":{...}}",
    "source": "gpt_sync",
    "submitted_by_label": "GPT",
    "session_id": "optional-onboarding-session-id",
    "user_email": "optional-owner-email"
  }'`;

const FIELDS = [
  { name: 'sync_token', required: true, desc: 'Must match your PACK_SYNC_TOKEN secret' },
  { name: 'name', required: true, desc: 'Display name for this pack' },
  { name: 'kind', required: false, desc: 'web_pack (default), brand_pack, marketing_pack, social_pack, or video_pack' },
  { name: 'preview_html', required: true, desc: 'Full HTML of the mockup — this is what gets reviewed and deployed' },
  { name: 'brand_tokens', required: false, desc: 'JSON string of brand tokens (colors, fonts, etc.)' },
  { name: 'source', required: false, desc: 'gpt_sync (default) or manual_upload' },
  { name: 'submitted_by_label', required: false, desc: 'Who submitted (default: GPT)' },
  { name: 'session_id', required: false, desc: 'Links to an OnboardingSession' },
  { name: 'user_email', required: false, desc: 'Owner email for RLS isolation' },
];

export default function GptSync() {
  const [copied, setCopied] = useState('');
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tokenConfigured, setTokenConfigured] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState('');
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);

  useEffect(() => {
    base44.entities.OnboardingSession.filter({}, { sort: '-updated_date', limit: 20, fields: ['project_name', 'business_type', 'status', 'answers'] })
      .then(page => setSessions(page.items || []))
      .catch(() => {});

    base44.entities.GptPack.filter({}, { sort: '-created_date', limit: 10, fields: ['name', 'kind', 'status', 'source', 'submitted_by_label', 'created_date'] })
      .then(page => setPacks(page.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    // Check token by sending a test request with an invalid token — 401 means it's configured
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sync_token: '__check__' }) })
      .then(r => setTokenConfigured(r.status === 401))
      .catch(() => setTokenConfigured(null));
  }, []);

  const generateSummary = async () => {
    if (!activeSession) return;
    setSummaryLoading(true);
    try {
      const { data } = await base44.functions.invoke('generatePipelineSummary', { session_id: activeSession });
      setSummary(data.summary || '');
    } catch (e) { setSummary(e.response?.data?.error || e.message || 'Could not generate summary.'); }
    finally { setSummaryLoading(false); }
  };

  const copySummary = () => { navigator.clipboard.writeText(summary).then(() => { setSummaryCopied(true); setTimeout(() => setSummaryCopied(false), 2000); }); };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(''), 2000); });
  };

  const pendingCount = packs.filter(p => p.status === 'pending').length;

  return (
    <div className="studio-workspace flex h-dvh min-h-0 flex-col bg-background text-foreground">
      <StudioTopBar />
      <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold"><Webhook className="h-5 w-5 text-primary" /> GPT Sync Endpoint</h1>
            <p className="mt-1 text-sm text-muted-foreground">Let GPT (or any external tool) POST approved mockups straight in. They land as pending review — nothing goes live until you approve.</p>
          </div>

          {/* Token status */}
          <div className={`flex items-center gap-3 rounded-xl border p-4 ${tokenConfigured === true ? 'border-green-500/40 bg-green-500/5' : tokenConfigured === false ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-card'}`}>
            <KeyRound className={`h-5 w-5 ${tokenConfigured === true ? 'text-green-500' : tokenConfigured === false ? 'text-destructive' : 'text-muted-foreground'}`} />
            <div className="flex-1">
              <p className="text-sm font-semibold">PACK_SYNC_TOKEN</p>
              <p className="text-xs text-muted-foreground">
                {tokenConfigured === true ? 'Configured — the endpoint is ready to receive packs.' : tokenConfigured === false ? 'Not configured — set PACK_SYNC_TOKEN in dashboard → Secrets.' : 'Checking token status…'}
              </p>
            </div>
          </div>

          {/* Pipeline Summary for ChatGPT */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-primary" /> Pipeline Summary for ChatGPT</h2>
            <p className="text-xs text-muted-foreground">Select a client session, generate the summary (onboarding + skip trace + strategy), then send it to ChatGPT to produce 3 versions of each asset.</p>
            <div className="flex gap-2">
              <select value={activeSession} onChange={e => setActiveSession(e.target.value)} className="flex-1 rounded-lg border border-border bg-background p-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
                <option value="">Select a client session…</option>
                {sessions.map(s => <option key={s.id} value={s.id}>{s.project_name || s.answers?.business_name?.answer_text || s.id}</option>)}
              </select>
              <button onClick={generateSummary} disabled={!activeSession || summaryLoading} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40">
                {summaryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Generate
              </button>
            </div>
            {summary && (
              <div className="relative">
                <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-background p-3 text-xs leading-relaxed whitespace-pre-wrap">{summary}</pre>
                <button onClick={copySummary} className="absolute right-2 top-2 rounded-md bg-card p-2 hover:bg-secondary" aria-label="Copy summary">
                  {summaryCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            )}
          </div>

          {/* 3-Version instructions */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Layers className="h-4 w-4 text-primary" /> 3-Version Asset Generation</h2>
            <p className="text-xs text-muted-foreground">ChatGPT must produce 3 distinct versions of each asset type. Each version is POSTed separately with the same <code className="rounded bg-muted px-1">version_group_id</code> and <code className="rounded bg-muted px-1">version_number</code> 1, 2, or 3.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { kind: 'web_pack', label: 'Website', desc: '3 different design directions' },
                { kind: 'logo_pack', label: 'Logo', desc: '3 different logo concepts' },
                { kind: 'brand_pack', label: 'Brand Pack', desc: '3 different color/font/style sets' },
                { kind: 'marketing_pack', label: 'Marketing', desc: '3 different marketing copy sets' },
              ].map(a => (
                <div key={a.kind} className="rounded-lg border border-border bg-card p-3">
                  <p className="text-sm font-semibold">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">kind: "{a.kind}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Endpoint URL */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h2 className="text-sm font-semibold">Endpoint URL</h2>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-3">
              <code className="flex-1 truncate text-sm">{ENDPOINT}</code>
              <button onClick={() => copy(ENDPOINT, 'url')} className="shrink-0 rounded-md p-2 hover:bg-secondary" aria-label="Copy URL">
                {copied === 'url' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* curl example */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h2 className="text-sm font-semibold">curl example</h2>
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg border border-border bg-background p-3 text-xs leading-relaxed"><code>{CURL}</code></pre>
              <button onClick={() => copy(CURL, 'curl')} className="absolute right-2 top-2 rounded-md bg-card p-2 hover:bg-secondary" aria-label="Copy curl">
                {copied === 'curl' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Field reference */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h2 className="text-sm font-semibold">Request fields</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="pb-2 pr-4">Field</th><th className="pb-2 pr-4">Required</th><th className="pb-2">Description</th></tr></thead>
                <tbody>
                  {FIELDS.map(f => (
                    <tr key={f.name} className="border-b border-border/50">
                      <td className="py-2 pr-4 font-mono text-xs">{f.name}</td>
                      <td className="py-2 pr-4">{f.required ? <span className="text-xs font-semibold text-primary">Yes</span> : <span className="text-xs text-muted-foreground">No</span>}</td>
                      <td className="py-2 text-xs text-muted-foreground">{f.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent packs */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold"><Package className="h-4 w-4" /> Recent packs</h2>
              {pendingCount > 0 && <Link to="/pack-inbox" className="flex items-center gap-1 text-xs text-primary hover:underline">{pendingCount} pending review <ArrowRight className="h-3 w-3" /></Link>}
            </div>
            {loading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
            ) : packs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No packs received yet. Send a POST to the endpoint above to test.</p>
            ) : (
              <div className="space-y-2">
                {packs.map(pack => (
                  <div key={pack.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{pack.name || 'Untitled pack'}</p>
                      <p className="text-xs text-muted-foreground">{pack.submitted_by_label || pack.source || 'gpt_sync'} · {new Date(pack.created_date).toLocaleDateString()}</p>
                    </div>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${pack.status === 'pending' ? 'bg-primary/10 text-primary' : pack.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-muted-foreground'}`}>{pack.status}</span>
                  </div>
                ))}
                <Link to="/pack-inbox" className="flex items-center gap-1.5 pt-1 text-xs text-primary hover:underline"><ExternalLink className="h-3 w-3" /> Open Pack Inbox to review all packs</Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}