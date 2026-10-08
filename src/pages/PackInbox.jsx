import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Inbox, Eye, CheckCircle2, XCircle, Loader2, FileCode, Rocket,
  Copy, ExternalLink, Clock, Sparkles,
} from "lucide-react";

export default function PackInbox() {
  const location = useLocation();
  const sessionId = location.state?.session_id;
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  async function loadPacks() {
    setLoading(true);
    try {
      const query = sessionId ? { session_id: sessionId } : {};
      const res = await base44.entities.GptPack.filter(query, { sort: '-created_date', limit: 50 });
      setPacks(res.items || res || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => { loadPacks(); }, [sessionId]);

  async function approvePack(pack) {
    setActionLoading(pack.id + '_approve');
    try {
      await base44.entities.GptPack.update(pack.id, {
        status: 'approved',
        approved_by: (await base44.auth.me()).email,
        approved_at: new Date().toISOString(),
      });
      loadPacks();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  }

  async function rejectPack(pack) {
    setActionLoading(pack.id + '_reject');
    try {
      await base44.entities.GptPack.update(pack.id, { status: 'rejected' });
      setSelectedPack(null);
      loadPacks();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  }

  const pendingPacks = packs.filter(p => p.status === 'pending');
  const approvedPacks = packs.filter(p => p.status === 'approved');

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Inbox className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Pack Inbox</h1>
            <p className="text-sm text-muted-foreground">Mockups from GPT land here. Nothing goes live until you approve.</p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <div className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-600">
            {pendingPacks.length} Pending
          </div>
          <div className="rounded-lg bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-600">
            {approvedPacks.length} Approved
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!loading && packs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold text-foreground">No mockups yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Send the website brief to GPT. When GPT generates a mockup and POSTs to the sync endpoint, it appears here.
          </p>
          <div className="mt-4 rounded-lg bg-muted p-3 font-mono text-xs text-foreground">
            POST https://autobuilder.base44.app/functions/ingestPack
          </div>
        </div>
      )}

      {/* Pending packs */}
      {pendingPacks.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="h-4 w-4 text-amber-500" /> Pending Review
          </h2>
          {pendingPacks.map(pack => (
            <PackCard key={pack.id} pack={pack} onPreview={() => setSelectedPack(pack)}
              onApprove={() => approvePack(pack)} onReject={() => rejectPack(pack)}
              loading={actionLoading} />
          ))}
        </div>
      )}

      {/* Approved packs */}
      {approvedPacks.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" /> Approved
          </h2>
          {approvedPacks.map(pack => (
            <PackCard key={pack.id} pack={pack} onPreview={() => setSelectedPack(pack)} approved />
          ))}
        </div>
      )}

      {/* Preview modal */}
      {selectedPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedPack(null)}>
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-border bg-card" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{selectedPack.name}</h3>
                <p className="text-xs text-muted-foreground">From {selectedPack.submitted_by_label} · {selectedPack.kind}</p>
              </div>
              <button onClick={() => setSelectedPack(null)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                srcDoc={selectedPack.preview_html}
                className="h-full w-full"
                style={{ minHeight: '500px' }}
                title={selectedPack.name}
              />
            </div>
            {selectedPack.status === 'pending' && (
              <div className="flex items-center justify-end gap-3 border-t border-border p-4">
                <button onClick={() => rejectPack(selectedPack)} disabled={actionLoading === selectedPack.id + '_reject'}
                  className="flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50">
                  {actionLoading === selectedPack.id + '_reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Reject
                </button>
                <button onClick={() => approvePack(selectedPack)} disabled={actionLoading === selectedPack.id + '_approve'}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {actionLoading === selectedPack.id + '_approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PackCard({ pack, onPreview, onApprove, onReject, loading, approved }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileCode className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{pack.name}</h3>
            <p className="text-xs text-muted-foreground">
              From {pack.submitted_by_label} · {new Date(pack.created_date).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onPreview} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted">
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
          {!approved && (
            <>
              <button onClick={onReject} disabled={loading === pack.id + '_reject'}
                className="rounded-lg border border-destructive/30 p-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-50">
                {loading === pack.id + '_reject' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              </button>
              <button onClick={onApprove} disabled={loading === pack.id + '_approve'}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {loading === pack.id + '_approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Approve
              </button>
            </>
          )}
          {approved && (
            <span className="flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Approved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}