import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { money } from "@/lib/bidEngine";
import { cn } from "@/lib/utils";
import { Eye, Mail, Phone, MapPin, Calendar, Sparkles, RefreshCw } from "lucide-react";

const STATUS_COLORS = {
  draft: "bg-white/10 text-white/60",
  bid_generated: "bg-blue-500/20 text-blue-400",
  contact_captured: "bg-amber-400/20 text-amber-400",
  proposal_sent: "bg-purple-500/20 text-purple-400",
  won: "bg-green-500/20 text-green-400",
  lost: "bg-red-500/20 text-red-400",
  archived: "bg-white/5 text-white/30",
};

export default function VisualizerInbox() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");

  const loadSessions = async () => {
    setLoading(true);
    try {
      const rows = await base44.entities.VisualizerSession.list("-created_date", 100);
      setSessions(rows);
    } catch (err) {
      toast({ title: "Failed to load sessions", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSessions(); }, []);

  const filtered = filter === "all" ? sessions : sessions.filter(s => s.status === filter);

  const updateStatus = async (id, status) => {
    try {
      await base44.entities.VisualizerSession.update(id, { status });
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
      toast({ title: "Status updated" });
    } catch (err) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Visualizer Inbox</h1>
          <p className="text-sm text-white/50">Customer floor visualizer sessions & estimates</p>
        </div>
        <button onClick={loadSessions} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/60 hover:border-amber-400 hover:text-amber-400">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Sessions" value={sessions.length} />
        <StatCard label="Contact Captured" value={sessions.filter(s => s.status === "contact_captured").length} />
        <StatCard label="Proposals Sent" value={sessions.filter(s => s.status === "proposal_sent").length} />
        <StatCard label="Won" value={sessions.filter(s => s.status === "won").length} />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {["all", "contact_captured", "proposal_sent", "won", "lost"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              filter === f
                ? "border-amber-400 bg-amber-400/10 text-amber-400"
                : "border-white/10 text-white/50 hover:border-white/20"
            )}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Sessions list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-white/20 mb-3" />
          <p className="text-white/40">No visualizer sessions yet</p>
          <p className="text-xs text-white/30 mt-1">Customer estimates from the floor visualizer will appear here</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onSelect={() => setSelected(session)}
              onStatusChange={(status) => updateStatus(session.id, status)}
              isSelected={selected?.id === session.id}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <SessionDetailModal session={selected} onClose={() => setSelected(null)} onStatusChange={(status) => updateStatus(selected.id, status)} />
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-white/40">{label}</div>
    </div>
  );
}

function SessionCard({ session, onSelect, onStatusChange, isSelected }) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "cursor-pointer rounded-xl border p-4 transition-all",
        isSelected ? "border-amber-400 bg-amber-400/5" : "border-white/10 bg-white/5 hover:border-white/20"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {session.photo_url ? (
            <Image src={session.photo_url} alt="Floor" className="h-12 w-12 rounded-lg object-cover" fittingType="fill" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5">
              <Sparkles className="h-5 w-5 text-white/30" />
            </div>
          )}
          <div>
            <div className="text-sm font-semibold text-white">{session.customer_name || "Anonymous"}</div>
            <div className="text-xs text-white/40">{session.system_name}</div>
          </div>
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS_COLORS[session.status] || STATUS_COLORS.draft)}>
          {session.status?.replace("_", " ")}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-white/40">Estimate:</span>{" "}
          <span className="font-bold text-amber-400">{session.bid_mid ? money(session.bid_mid) : "—"}</span>
        </div>
        <div>
          <span className="text-white/40">Sq Ft:</span> <span className="text-white">{session.square_feet || 0}</span>
        </div>
        <div>
          <span className="text-white/40">Color:</span> <span className="text-white">{session.color_name || "—"}</span>
        </div>
        <div>
          <span className="text-white/40">Tier:</span> <span className="text-white capitalize">{session.bid_tier || "—"}</span>
        </div>
      </div>

      {session.customer_email && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-white/50">
          <Mail className="h-3 w-3" /> {session.customer_email}
        </div>
      )}
    </div>
  );
}

function SessionDetailModal({ session, onClose, onStatusChange }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{session.customer_name || "Anonymous Session"}</h2>
            <p className="text-sm text-white/50">{session.system_name} · {session.color_name || "Standard"}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        {session.photo_url && (
          <Image src={session.photo_url} alt="Floor" className="mt-4 h-48 w-full rounded-xl object-cover" fittingType="fill" />
        )}

        {/* Contact info */}
        <div className="mt-4 space-y-2">
          {session.customer_email && (
            <div className="flex items-center gap-2 text-sm text-white/70"><Mail className="h-4 w-4 text-amber-400" /> {session.customer_email}</div>
          )}
          {session.customer_phone && (
            <div className="flex items-center gap-2 text-sm text-white/70"><Phone className="h-4 w-4 text-amber-400" /> {session.customer_phone}</div>
          )}
          {session.project_address && (
            <div className="flex items-center gap-2 text-sm text-white/70"><MapPin className="h-4 w-4 text-amber-400" /> {session.project_address}</div>
          )}
        </div>

        {/* Bid details */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <DetailBox label="Estimate" value={session.bid_mid ? money(session.bid_mid) : "—"} highlight />
          <DetailBox label="Range" value={`${session.bid_low ? money(session.bid_low) : "—"} – ${session.bid_high ? money(session.bid_high) : "—"}`} />
          <DetailBox label="Per Sq Ft" value={session.per_sqft ? `$${session.per_sqft}` : "—"} />
          <DetailBox label="Sq Ft" value={session.square_feet || 0} />
          <DetailBox label="Condition" value={session.condition || "—"} />
          <DetailBox label="Tier" value={session.bid_tier || "—"} />
          <DetailBox label="Finish" value={session.finish || "—"} />
          <DetailBox label="Color Code" value={session.color_code || "—"} />
        </div>

        {/* Prep summary */}
        {session.prep_summary && (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-xs font-semibold text-white/60 mb-1">Prep Work</div>
            <div className="text-sm text-white/80">{session.prep_summary}</div>
          </div>
        )}

        {/* Specifications */}
        {session.specifications?.length > 0 && (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-xs font-semibold text-white/60 mb-2">Scope of Work</div>
            <div className="space-y-1.5">
              {session.specifications.map((spec, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="text-amber-400 font-bold shrink-0">{i + 1}.</span>
                  <div>
                    <span className="text-white font-medium">{spec.label}:</span>{" "}
                    <span className="text-white/50">{spec.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status controls */}
        <div className="mt-4">
          <div className="text-xs font-semibold text-white/60 mb-2">Update Status</div>
          <div className="flex flex-wrap gap-2">
            {["contact_captured", "proposal_sent", "won", "lost", "archived"].map(status => (
              <button
                key={status}
                onClick={() => onStatusChange(status)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  session.status === status
                    ? "border-amber-400 bg-amber-400/10 text-amber-400"
                    : "border-white/10 text-white/50 hover:border-white/20"
                )}
              >
                {status.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailBox({ label, value, highlight }) {
  return (
    <div className={cn("rounded-lg border p-2.5", highlight ? "border-amber-400/30 bg-amber-400/5" : "border-white/10 bg-white/5")}>
      <div className="text-[10px] text-white/40">{label}</div>
      <div className={cn("text-sm font-bold", highlight ? "text-amber-400" : "text-white")}>{value}</div>
    </div>
  );
}