import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { X, Mail, Send, RefreshCw, Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function BacklinkProspectsModal({ portfolio, onClose }) {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prospecting, setProspecting] = useState(false);
  const [sending, setSending] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.BacklinkProspect.filter({ portfolio_id: portfolio.id }, '-relevance_score', 100);
      setProspects(list);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [portfolio.id]);

  useEffect(() => { load(); }, [load]);

  const prospect = async () => {
    setProspecting(true);
    setError("");
    try {
      await base44.functions.invoke('prospectBacklinks', { portfolio_id: portfolio.id, niche: portfolio.niche, limit: 15 });
      await load();
    } catch (e) { setError(e.message); }
    setProspecting(false);
  };

  const send = async (p) => {
    setSending(p.id);
    setError("");
    try {
      const edits = draft[p.id] || {};
      await base44.functions.invoke('sendOutreach', {
        prospect_id: p.id,
        subject: edits.subject ?? p.outreach_subject,
        body: edits.body ?? p.outreach_body,
      });
      setProspects(prev => prev.map(x => x.id === p.id ? { ...x, outreach_status: 'sent', last_contacted: new Date().toISOString() } : x));
      setDraft(prev => { const n = { ...prev }; delete n[p.id]; return n; });
      setEditing(null);
    } catch (e) { setError(e.message); }
    setSending(null);
  };

  const updateField = async (p, field, value) => {
    await base44.entities.BacklinkProspect.update(p.id, { [field]: value });
    setProspects(prev => prev.map(x => x.id === p.id ? { ...x, [field]: value } : x));
  };

  const stats = {
    total: prospects.length,
    drafted: prospects.filter(p => p.outreach_status === 'drafted').length,
    sent: prospects.filter(p => p.outreach_status === 'sent').length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-white/10 bg-zinc-950" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Backlink Prospects — {portfolio.domain}</h3>
            <p className="text-xs text-white/40">{stats.total} prospects · {stats.drafted} drafted · {stats.sent} sent</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prospect} disabled={prospecting} className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-1.5 text-xs font-medium text-black hover:bg-lime-300 disabled:opacity-50">
              {prospecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Find Prospects
            </button>
            <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></button>
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-sm text-white/40">Loading prospects…</div>
          ) : prospects.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-white/50">No backlink prospects yet.</p>
              <p className="mt-1 text-xs text-white/30">Click "Find Prospects" to search the web for niche-relevant link opportunities and auto-draft outreach emails.</p>
            </div>
          ) : (
            prospects.map(p => {
              const isEditing = editing === p.id;
              const d = draft[p.id] || {};
              return (
                <div key={p.id} className="rounded-lg border border-white/10 bg-black p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <a href={p.target_url || `https://${p.target_domain}`} target="_blank" rel="noopener" className="text-sm font-medium text-white truncate hover:text-lime-400">
                          {p.target_domain}
                        </a>
                        <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] uppercase text-white/40">{p.prospect_type}</span>
                      </div>
                      {p.page_title && <p className="mt-0.5 text-xs text-white/40 truncate">{p.page_title}</p>}
                      <div className="mt-1 flex items-center gap-3 text-xs">
                        <span className="text-cyan-400">DA {p.domain_authority || 0}</span>
                        <span className="text-amber-400">{p.relevance_score || 0}% rel</span>
                        {p.contact_email ? (
                          <span className="text-lime-400/70 flex items-center gap-0.5"><Mail className="h-3 w-3" /> {p.contact_email}</span>
                        ) : (
                          <span className="text-white/30">no email</span>
                        )}
                      </div>
                    </div>
                    <StatusPill status={p.outreach_status} />
                  </div>

                  {p.notes && <p className="mt-2 text-xs italic text-white/30">"{p.notes}"</p>}

                  {isEditing ? (
                    <div className="mt-3 space-y-2">
                      <input
                        className="w-full rounded border border-white/15 bg-black px-2.5 py-1.5 text-xs text-white outline-none focus:border-lime-400"
                        value={d.subject ?? p.outreach_subject ?? ''}
                        onChange={e => setDraft(prev => ({ ...prev, [p.id]: { ...prev[p.id], subject: e.target.value } }))}
                        placeholder="Subject line"
                      />
                      <textarea
                        className="w-full rounded border border-white/15 bg-black px-2.5 py-1.5 text-xs text-white outline-none focus:border-lime-400"
                        rows={5}
                        value={d.body ?? p.outreach_body ?? ''}
                        onChange={e => setDraft(prev => ({ ...prev, [p.id]: { ...prev[p.id], body: e.target.value } }))}
                        placeholder="Email body"
                      />
                      {!p.contact_email && (
                        <input
                          className="w-full rounded border border-white/15 bg-black px-2.5 py-1.5 text-xs text-white outline-none focus:border-lime-400"
                          value={d.contact_email ?? ''}
                          onChange={e => setDraft(prev => ({ ...prev, [p.id]: { ...prev[p.id], contact_email: e.target.value } }))}
                          placeholder="Add contact email…"
                        />
                      )}
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditing(null)} className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-white/60 hover:bg-white/5">Cancel</button>
                        <button
                          onClick={async () => {
                            if (d.contact_email) await updateField(p, 'contact_email', d.contact_email);
                            await send(p);
                          }}
                          disabled={sending === p.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-1 text-xs font-medium text-black hover:bg-lime-300 disabled:opacity-50"
                        >
                          {sending === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Send
                        </button>
                      </div>
                    </div>
                  ) : p.outreach_status === 'sent' ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-lime-400/70">
                      <CheckCircle className="h-3.5 w-3.5" /> Sent {p.last_contacted ? new Date(p.last_contacted).toLocaleDateString() : ''}
                      <button onClick={() => setEditing(p.id)} className="ml-auto text-white/30 hover:text-white">View</button>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-white/30 truncate pr-2">{p.outreach_subject || 'No draft yet'}</p>
                      <button
                        onClick={() => setEditing(p.id)}
                        className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1 text-xs text-white/60 hover:bg-white/5"
                      >
                        {p.outreach_subject ? 'Edit & Send' : 'Draft'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const colors = {
    pending: 'bg-white/10 text-white/50 border-white/20',
    drafted: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
    sent: 'bg-lime-400/10 text-lime-400 border-lime-400/30',
    replied: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30',
    accepted: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
    rejected: 'bg-rose-400/10 text-rose-400 border-rose-400/30',
    follow_up: 'bg-orange-400/10 text-orange-400 border-orange-400/30',
    dead: 'bg-white/5 text-white/30 border-white/10',
  };
  return (
    <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium capitalize ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}