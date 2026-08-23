import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  AlertTriangle, CheckCircle, RefreshCw, XCircle, Clock,
  Activity, Zap, ShieldAlert,
} from "lucide-react";

// SystemAlerts — admin dashboard for the autonomous self-healing system.
// Shows all SystemAlerts, lets the admin filter by status/severity,
// and manually retry or dismiss alerts.
export default function SystemAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");
  const [healing, setHealing] = useState(null);
  const [healError, setHealError] = useState(null);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const list = await base44.entities.SystemAlert.list("-created_date", 50);
      setAlerts(list || []);
    } catch (e) {
      console.error("Failed to load alerts", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
    const unsub = base44.entities.SystemAlert.subscribe(() => loadAlerts());
    return unsub;
  }, [loadAlerts]);

  const healAlert = async (alert) => {
    setHealing(alert.id);
    setHealError(null);
    try {
      // The backend selfHealBuild function already updates the alert's status,
      // context, logs, and retry_count — so we just invoke it and reload.
      const res = await base44.functions.invoke("selfHealBuild", {
        buildId: alert.build_id,
        alertType: alert.alert_type,
        alertId: alert.id,
      });
      const body = res?.data || res;
      if (body?.error) {
        setHealError(body.error);
      } else if (body?.healed) {
        setHealError(null);
      } else if (body?.action === "escalate") {
        setHealError(body.message || "Re-verification still failing — alert escalated");
      }
      await loadAlerts();
    } catch (e) {
      console.error("Heal failed", e);
      const msg = e?.response?.data?.error || e?.message || "Heal failed — check the function logs";
      setHealError(msg);
    } finally {
      setHealing(null);
    }
  };

  const dismissAlert = async (alert) => {
    try {
      await base44.entities.SystemAlert.update(alert.id, {
        status: "dismissed",
        resolved_at: new Date().toISOString(),
        resolution: "Dismissed by operator",
      });
      await loadAlerts();
    } catch (e) {
      console.error("Dismiss failed", e);
      setHealError(e?.message || "Failed to dismiss alert");
    }
  };

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.status === filter);

  const stats = {
    open: alerts.filter((a) => a.status === "open").length,
    healing: alerts.filter((a) => a.status === "healing").length,
    resolved: alerts.filter((a) => a.status === "resolved").length,
    escalated: alerts.filter((a) => a.status === "escalated").length,
  };

  const severityColor = (sev) => {
    if (sev === "critical") return "border-red-400/40 bg-red-400/5 text-red-300";
    if (sev === "warning") return "border-amber-400/40 bg-amber-400/5 text-amber-300";
    return "border-blue-400/40 bg-blue-400/5 text-blue-300";
  };

  const statusIcon = (status) => {
    if (status === "open") return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    if (status === "healing") return <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />;
    if (status === "resolved") return <CheckCircle className="h-4 w-4 text-lime-400" />;
    if (status === "escalated") return <ShieldAlert className="h-4 w-4 text-red-400" />;
    return <XCircle className="h-4 w-4 text-white/40" />;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-400/15">
          <Activity className="h-5 w-5 text-lime-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-white">System Alerts</h1>
          <p className="text-sm text-white/50">Autonomous self-healing monitor — alerts, failures, and escalations</p>
        </div>
        <button onClick={loadAlerts} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:border-lime-400/50 hover:text-lime-300">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Open", value: stats.open, color: "text-amber-400" },
          { label: "Healing", value: stats.healing, color: "text-blue-400" },
          { label: "Resolved", value: stats.resolved, color: "text-lime-400" },
          { label: "Escalated", value: stats.escalated, color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-zinc-950 p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/40">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["open", "healing", "resolved", "escalated", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === f ? "bg-lime-400/15 text-lime-300 border border-lime-400/30" : "border border-white/10 text-white/50 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Heal error banner */}
      {healError && (
        <div className="rounded-xl border border-red-400/40 bg-red-400/5 p-3 text-sm text-red-300">
          {healError}
        </div>
      )}

      {/* Alerts list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <RefreshCw className="h-6 w-6 animate-spin text-lime-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-zinc-950 py-12 text-center">
          <CheckCircle className="mx-auto h-8 w-8 text-lime-400/50" />
          <p className="mt-2 text-sm text-white/50">No {filter !== "all" ? filter : ""} alerts — system is healthy</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <div key={alert.id} className={`rounded-xl border p-4 ${severityColor(alert.severity)}`}>
              <div className="flex items-start gap-3">
                {statusIcon(alert.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider opacity-70">{alert.alert_type?.replace(/_/g, " ")}</span>
                    <span className="text-[10px] opacity-50">·</span>
                    <span className="text-[10px] opacity-50">{alert.step || "unknown step"}</span>
                    {alert.build_name && (
                      <>
                        <span className="text-[10px] opacity-50">·</span>
                        <span className="text-[10px] opacity-70">{alert.build_name}</span>
                      </>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium">{alert.message}</p>
                  {alert.context && (
                    <p className="mt-1 text-xs opacity-60 max-h-20 overflow-y-auto">{alert.context}</p>
                  )}
                  {alert.recommended_action && (
                    <div className="mt-2 flex items-center gap-2">
                      <Zap className="h-3 w-3 opacity-60" />
                      <span className="text-[10px] uppercase tracking-wider opacity-60">Recommended: {alert.recommended_action}</span>
                      {alert.retry_count > 0 && (
                        <span className="text-[10px] opacity-50">· {alert.retry_count} retries</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  {(alert.status === "open" || alert.status === "healing" || alert.status === "escalated") && (
                    <button
                      onClick={() => healAlert(alert)}
                      disabled={healing === alert.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-lime-400/40 px-2.5 py-1 text-[11px] font-medium text-lime-300 hover:bg-lime-400/10 disabled:opacity-50"
                    >
                      {healing === alert.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Heal
                    </button>
                  )}
                  {alert.status !== "resolved" && (
                    <button
                      onClick={() => dismissAlert(alert)}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1 text-[11px] text-white/50 hover:text-white"
                    >
                      <XCircle className="h-3 w-3" /> Dismiss
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}