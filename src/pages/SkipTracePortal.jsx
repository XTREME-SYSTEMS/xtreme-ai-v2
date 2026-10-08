import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Search, Users, Globe, TrendingUp, ExternalLink, Phone, MapPin, Building2, ChevronDown, ChevronRight, ShieldCheck, AlertCircle } from 'lucide-react';
import StudioTopBar from '@/components/studio/StudioTopBar';

export default function SkipTracePortal() {
  const [traces, setTraces] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      base44.entities.SkipTraceReport.filter({}, { sort: '-created_date', limit: 200, fields: ['session_id', 'user_email', 'question_key', 'answer_text', 'business_name', 'owner_name', 'industry', 'location', 'website', 'competitors', 'social_profiles', 'market_data', 'suppliers', 'adjacent_trades', 'sources', 'confidence_score', 'status', 'error'] }),
      base44.entities.OnboardingSession.filter({}, { sort: '-created_date', limit: 50, fields: ['project_name', 'user_email', 'business_type', 'client_phone', 'client_address', 'answers', 'status'] }),
    ]).then(([tracePage, sessionPage]) => {
      setTraces(tracePage.items || []);
      setSessions(sessionPage.items || []);
    }).catch(e => console.error(e)).finally(() => setLoading(false));
  }, []);

  // Group traces by session_id
  const sessionMap = new Map(sessions.map(s => [s.id, s]));
  const grouped = new Map();
  for (const t of traces) {
    const key = t.session_id || 'unknown';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(t);
  }

  const filtered = [...grouped.entries()].filter(([sid, groupTraces]) => {
    const session = sessionMap.get(sid);
    const name = session?.project_name || groupTraces[0]?.business_name || groupTraces[0]?.answer_text || 'Unknown';
    if (search && !name.toLowerCase().includes(search.toLowerCase()) && !sid.includes(search)) return false;
    if (statusFilter !== 'all') {
      const allComplete = groupTraces.every(t => t.status === 'complete');
      const hasFailed = groupTraces.some(t => t.status === 'failed');
      if (statusFilter === 'complete' && !allComplete) return false;
      if (statusFilter === 'failed' && !hasFailed) return false;
      if (statusFilter === 'pending' && (allComplete || hasFailed)) return false;
    }
    return true;
  });

  return (
    <div className="studio-workspace flex h-dvh min-h-0 flex-col bg-background text-foreground">
      <StudioTopBar />
      <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Search className="h-6 w-6" /></div>
              <div><h1 className="text-xl font-bold">Skip Trace Portal</h1><p className="text-sm text-muted-foreground">All background intelligence gathered from client onboarding — competitors, social profiles, market data, and sources.</p></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">{grouped.size} Clients</div>
              <div className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium">{traces.length} Total Traces</div>
              <div className="rounded-lg bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-500">{traces.filter(t => t.status === 'complete').length} Complete</div>
              <div className="rounded-lg bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive">{traces.filter(t => t.status === 'failed').length} Failed</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by business name or session…" className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
              <option value="all">All Status</option>
              <option value="complete">Complete</option>
              <option value="pending">In Progress</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : null}

          {!loading && filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center"><Search className="mx-auto h-10 w-10 text-muted-foreground" /><h3 className="mt-3 text-sm font-semibold">No skip traces found</h3><p className="mt-1 text-sm text-muted-foreground">Traces appear here automatically when clients complete onboarding.</p></div>
          ) : null}

          {/* Client groups */}
          <div className="space-y-3">
            {filtered.map(([sessionId, groupTraces]) => {
              const session = sessionMap.get(sessionId);
              const name = session?.project_name || groupTraces[0]?.business_name || groupTraces[0]?.answer_text || 'Unknown Client';
              const isOpen = expanded === sessionId;
              const allComplete = groupTraces.every(t => t.status === 'complete');
              const avgConfidence = groupTraces.filter(t => t.confidence_score).reduce((s, t) => s + t.confidence_score, 0) / (groupTraces.filter(t => t.confidence_score).length || 1);
              return (
                <div key={sessionId} className="rounded-xl border border-border bg-card overflow-hidden">
                  <button onClick={() => setExpanded(isOpen ? null : sessionId)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-secondary/50">
                    {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{name}</p>
                      <p className="truncate text-xs text-muted-foreground">{session?.user_email || groupTraces[0]?.user_email} · {groupTraces.length} traces</p>
                    </div>
                    {session?.client_phone && <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex"><Phone className="h-3 w-3" /> {session.client_phone}</span>}
                    {session?.client_address && <span className="hidden items-center gap-1 text-xs text-muted-foreground lg:flex"><MapPin className="h-3 w-3" /> {session.client_address.slice(0, 40)}</span>}
                    <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${allComplete ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-muted-foreground'}`}>{allComplete ? 'Complete' : 'In Progress'}</span>
                    {avgConfidence > 0 && <span className="flex shrink-0 items-center gap-1 text-xs"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> {Math.round(avgConfidence)}%</span>}
                  </button>

                  {isOpen && (
                    <div className="border-t border-border p-4 space-y-4">
                      {/* Session meta */}
                      {session && (
                        <div className="grid gap-2 sm:grid-cols-3 text-xs">
                          {session.business_type && <div className="rounded-lg bg-secondary px-2 py-1.5"><span className="text-muted-foreground">Type: </span>{session.business_type}</div>}
                          {session.answers?.industry?.answer_text && <div className="rounded-lg bg-secondary px-2 py-1.5"><span className="text-muted-foreground">Industry: </span>{session.answers.industry.answer_text}</div>}
                          {session.answers?.services?.answer_text && <div className="rounded-lg bg-secondary px-2 py-1.5"><span className="text-muted-foreground">Services: </span>{session.answers.services.answer_text.slice(0, 60)}</div>}
                        </div>
                      )}

                      {/* Individual traces */}
                      {groupTraces.map(trace => (
                        <TraceDetail key={trace.id} trace={trace} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function TraceDetail({ trace }) {
  const [showSources, setShowSources] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-3">
      <div className="flex items-center gap-2">
        <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">{trace.question_key}</span>
        <span className="truncate text-sm font-medium">{trace.answer_text}</span>
        <span className="ml-auto shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase {trace.status === 'complete' ? 'text-green-500' : trace.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'}">{trace.status}</span>
      </div>

      {trace.error && <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="h-3 w-3" /> {trace.error}</p>}

      {trace.status === 'complete' && (
        <div className="space-y-3">
          {/* Business info */}
          {(trace.business_name || trace.owner_name || trace.industry || trace.location || trace.website) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {trace.business_name && <span className="flex items-center gap-1 rounded bg-secondary px-2 py-1"><Building2 className="h-3 w-3" /> {trace.business_name}</span>}
              {trace.owner_name && <span className="flex items-center gap-1 rounded bg-secondary px-2 py-1"><Users className="h-3 w-3" /> {trace.owner_name}</span>}
              {trace.industry && <span className="flex items-center gap-1 rounded bg-secondary px-2 py-1">{trace.industry}</span>}
              {trace.location && <span className="flex items-center gap-1 rounded bg-secondary px-2 py-1"><MapPin className="h-3 w-3" /> {trace.location}</span>}
              {trace.website && <a href={trace.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-primary hover:underline"><Globe className="h-3 w-3" /> {new URL(trace.website).hostname}</a>}
            </div>
          )}

          {/* Competitors */}
          {trace.competitors?.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Users className="h-3.5 w-3.5" /> Competitors ({trace.competitors.length})</p>
              <div className="space-y-1">
                {trace.competitors.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-start gap-2 rounded bg-secondary/50 px-2 py-1.5 text-xs">
                    <span className="font-medium">{c.name}</span>
                    {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 text-primary hover:underline"><ExternalLink className="h-3 w-3" /> {new URL(c.url).hostname}</a>}
                    {c.note && <span className="text-muted-foreground">— {c.note.slice(0, 100)}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social profiles */}
          {trace.social_profiles?.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Globe className="h-3.5 w-3.5" /> Social Profiles ({trace.social_profiles.length})</p>
              <div className="flex flex-wrap gap-2">
                {trace.social_profiles.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs hover:bg-primary/10 hover:text-primary">
                    <span className="font-medium">{s.platform}</span> <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Market data */}
          {trace.market_data && (trace.market_data.market_size || trace.market_data.trend || trace.market_data.avg_pricing) && (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><TrendingUp className="h-3.5 w-3.5" /> Market Data</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {trace.market_data.market_size && <span className="rounded bg-secondary px-2 py-1">Size: {trace.market_data.market_size}</span>}
                {trace.market_data.trend && <span className="rounded bg-secondary px-2 py-1">Trend: {trace.market_data.trend}</span>}
                {trace.market_data.avg_pricing && <span className="rounded bg-secondary px-2 py-1">Avg Price: {trace.market_data.avg_pricing}</span>}
              </div>
              {trace.market_data.demand_signals?.length > 0 && <p className="mt-1 text-xs text-muted-foreground">Demand: {trace.market_data.demand_signals.join(', ')}</p>}
            </div>
          )}

          {/* Sources */}
          {trace.sources?.length > 0 && (
            <div>
              <button onClick={() => setShowSources(!showSources)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                {showSources ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />} {trace.sources.length} sources
              </button>
              {showSources && (
                <div className="mt-1 space-y-0.5">
                  {trace.sources.slice(0, 10).map((src, i) => (
                    <a key={i} href={src} target="_blank" rel="noreferrer" className="block truncate text-xs text-primary hover:underline">{src}</a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}