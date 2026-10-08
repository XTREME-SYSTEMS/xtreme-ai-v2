import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Inbox, Eye, CheckCircle2, XCircle, Loader2, FileCode, Clock, Sparkles, Layers, Copy, Check } from 'lucide-react';
import StudioTopBar from '@/components/studio/StudioTopBar';

const KIND_LABELS = { web_pack: 'Website', logo_pack: 'Logo', brand_pack: 'Brand Pack', marketing_pack: 'Marketing', social_pack: 'Social', video_pack: 'Video' };

export default function PackInbox() {
  const location = useLocation();
  const sessionId = new URLSearchParams(location.search).get('session');
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  async function loadPacks() {
    setLoading(true);
    try {
      const query = sessionId ? { session_id: sessionId } : {};
      const res = await base44.entities.GptPack.filter(query, { sort: '-created_date', limit: 100 });
      setPacks(res.items || res || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }
  useEffect(() => { loadPacks(); }, [sessionId]);

  async function approvePack(pack) {
    setActionLoading(pack.id + '_approve');
    try {
      const me = await base44.auth.me();
      await base44.entities.GptPack.update(pack.id, { status: 'approved', approved_by: me?.email, approved_at: new Date().toISOString() });
      loadPacks();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  }
  async function rejectPack(pack) {
    setActionLoading(pack.id + '_reject');
    try { await base44.entities.GptPack.update(pack.id, { status: 'rejected' }); setSelectedPack(null); loadPacks(); }
    catch (e) { console.error(e); }
    setActionLoading(null);
  }
  async function approveGroup(groupId) {
    const groupPacks = packs.filter(p => p.version_group_id === groupId && p.status === 'pending');
    setActionLoading(groupId + '_approve');
    try {
      const me = await base44.auth.me();
      await base44.entities.GptPack.bulkUpdate(groupPacks.map(p => ({ id: p.id, status: 'approved', approved_by: me?.email, approved_at: new Date().toISOString() })));
      loadPacks();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  }

  // Group packs by version_group_id, then by kind
  const groups = useMemo(() => {
    const map = new Map();
    for (const pack of packs) {
      const key = pack.version_group_id || pack.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(pack);
    }
    // Sort each group's packs by version_number
    for (const [key, groupPacks] of map) groupPacks.sort((a, b) => (a.version_number || 1) - (b.version_number || 1));
    return [...map.entries()].sort((a, b) => new Date(b[1][0].created_date) - new Date(a[1][0].created_date));
  }, [packs]);

  const pendingCount = packs.filter(p => p.status === 'pending').length;
  const approvedCount = packs.filter(p => p.status === 'approved').length;

  return (
    <div className="studio-workspace flex h-dvh min-h-0 flex-col bg-background text-foreground">
      <StudioTopBar />
      <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Inbox className="h-6 w-6" /></div>
              <div><h1 className="text-xl font-bold">Pack Inbox</h1><p className="text-sm text-muted-foreground">3 versions of each asset, grouped for review. Nothing goes live until you approve.</p></div>
            </div>
            <div className="mt-4 flex gap-3">
              <div className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">{pendingCount} Pending</div>
              <div className="rounded-lg bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-500">{approvedCount} Approved</div>
            </div>
          </div>

          {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : null}

          {!loading && packs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <Sparkles className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-3 text-sm font-semibold">No packs yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Generate a pipeline summary, send it to ChatGPT, and it will POST 3 versions of each asset here.</p>
              <div className="mt-4 rounded-lg bg-muted p-3 font-mono text-xs">POST https://autobuilder.base44.app/functions/ingestPack</div>
            </div>
          ) : null}

          {!loading && groups.map(([groupId, groupPacks]) => {
            const kind = groupPacks[0].kind;
            const hasPending = groupPacks.some(p => p.status === 'pending');
            const allApproved = groupPacks.every(p => p.status === 'approved');
            return (
              <div key={groupId} className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-semibold"><Layers className="h-4 w-4 text-primary" /> {KIND_LABELS[kind] || kind} · {groupPacks.length} version{groupPacks.length > 1 ? 's' : ''}</h2>
                  {hasPending && <button onClick={() => approveGroup(groupId)} disabled={actionLoading === groupId + '_approve'} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40">
                    {actionLoading === groupId + '_approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Approve All
                  </button>}
                  {allApproved && <span className="flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-500"><CheckCircle2 className="h-3.5 w-3.5" /> All Approved</span>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {groupPacks.map(pack => <PackCard key={pack.id} pack={pack} onPreview={() => setSelectedPack(pack)} onApprove={() => approvePack(pack)} onReject={() => rejectPack(pack)} loading={actionLoading} />)}
                </div>
              </div>
            );
          })}

          {selectedPack && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedPack(null)}>
              <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-border bg-card" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-border p-4">
                  <div><h3 className="text-sm font-semibold">{selectedPack.name}</h3><p className="text-xs text-muted-foreground">From {selectedPack.submitted_by_label} · {KIND_LABELS[selectedPack.kind] || selectedPack.kind} · Version {selectedPack.version_number || 1}</p></div>
                  <button onClick={() => setSelectedPack(null)} className="text-muted-foreground hover:text-foreground"><XCircle className="h-5 w-5" /></button>
                </div>
                <div className="flex-1 overflow-hidden"><iframe srcDoc={selectedPack.preview_html} className="h-full w-full" style={{ minHeight: '500px' }} title={selectedPack.name} /></div>
                {selectedPack.status === 'pending' && (
                  <div className="flex items-center justify-end gap-3 border-t border-border p-4">
                    <button onClick={() => rejectPack(selectedPack)} disabled={actionLoading === selectedPack.id + '_reject'} className="flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50">
                      {actionLoading === selectedPack.id + '_reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Reject
                    </button>
                    <button onClick={() => approvePack(selectedPack)} disabled={actionLoading === selectedPack.id + '_approve'} className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                      {actionLoading === selectedPack.id + '_approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function PackCard({ pack, onPreview, onApprove, onReject, loading }) {
  const approved = pack.status === 'approved';
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center justify-between">
        <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold">v{pack.version_number || 1}</span>
        {approved ? <span className="flex items-center gap-1 text-[10px] font-medium text-green-500"><CheckCircle2 className="h-3 w-3" /> Approved</span> : <span className="flex items-center gap-1 text-[10px] font-medium text-primary"><Clock className="h-3 w-3" /> Pending</span>}
      </div>
      <h3 className="mt-2 truncate text-sm font-semibold">{pack.name}</h3>
      <p className="text-xs text-muted-foreground">{new Date(pack.created_date).toLocaleDateString()}</p>
      <div className="mt-3 flex items-center gap-1.5">
        <button onClick={onPreview} className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-secondary"><Eye className="h-3 w-3" /> Preview</button>
        {!approved && <>
          <button onClick={onReject} disabled={loading === pack.id + '_reject'} className="rounded-lg border border-destructive/30 p-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-50">{loading === pack.id + '_reject' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}</button>
          <button onClick={onApprove} disabled={loading === pack.id + '_approve'} className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">{loading === pack.id + '_approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Approve</button>
        </>}
      </div>
    </div>
  );
}