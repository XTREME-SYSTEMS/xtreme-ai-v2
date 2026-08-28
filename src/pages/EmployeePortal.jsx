import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import { Boxes, Eye, Play, CheckCircle, Clock, Package, AlertCircle, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import EmployeeInvitePanel from "@/components/employee/EmployeeInvitePanel";
import { getBuildStepInfo } from "@/lib/unifiedSteps";

export default function EmployeePortal() {
  const [user, setUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [packages, setPackages] = useState([]);
  const [builds, setBuilds] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadData();
    const unsub = base44.entities.EmployeeAssignment.subscribe(() => loadData());
    return unsub;
  }, []);

  const loadData = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
      if (me?.email) {
        const [assigns, pkgs] = await Promise.all([
          base44.entities.EmployeeAssignment.filter({ employee_email: me.email }, "-assigned_at", 50),
          base44.entities.ProductPackage.list("-packaged_at", 10),
        ]);
        setAssignments(assigns || []);
        setPackages(pkgs || []);
        // Fetch build records for build-type assignments so we can show the
        // unified step number (Step N/Total: Label) on each assignment card.
        const buildIds = (assigns || [])
          .filter((a) => a.assignment_type === "build" && a.entity_id)
          .map((a) => a.entity_id);
        if (buildIds.length) {
          const results = await Promise.all(
            buildIds.map((id) => base44.entities.AutoBuild.get(id).catch(() => null))
          );
          const map = {};
          results.filter(Boolean).forEach((b) => { map[b.id] = b; });
          setBuilds(map);
        }
      }
    } catch (e) {
      console.error("Failed to load:", e);
    } finally {
      setLoading(false);
    }
  };

  const runValidation = async (buildId) => {
    setActionLoading((prev) => ({ ...prev, [`val-${buildId}`]: true }));
    try {
      await base44.functions.invoke("runValidationLoop", { build_id: buildId });
      await loadData();
    } catch (e) {
      console.error("Validation failed:", e);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`val-${buildId}`]: false }));
    }
  };

  const runBuildStep = async (buildId) => {
    setActionLoading((prev) => ({ ...prev, [`build-${buildId}`]: true }));
    try {
      const build = (await base44.entities.AutoBuild.filter({ id: buildId }, "-created_date", 1))?.[0];
      if (build) {
        await base44.functions.invoke("processAutoBuildStep", { build_id: buildId, step: build.current_step });
        await loadData();
      }
    } catch (e) {
      console.error("Build step failed:", e);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`build-${buildId}`]: false }));
    }
  };

  const activeAssignments = assignments.filter((a) => a.status === "active");
  const completedAssignments = assignments.filter((a) => a.status === "completed");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-amber-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Portal"
        subtitle={`Welcome, ${user?.full_name || user?.email || "Employee"}`}
      />

      {/* Admin-only: invite new employees by email */}
      {user?.role === "admin" && <EmployeeInvitePanel />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-1">
            <Clock className="h-4 w-4" /> Active Tasks
          </div>
          <div className="text-2xl font-bold text-amber-400">{activeAssignments.length}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-1">
            <CheckCircle className="h-4 w-4" /> Completed
          </div>
          <div className="text-2xl font-bold text-green-400">{completedAssignments.length}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-1">
            <Package className="h-4 w-4" /> Products Packaged
          </div>
          <div className="text-2xl font-bold text-white">{packages.length}</div>
        </div>
      </div>

      {/* Active Assignments */}
      <Panel title="Your Active Assignments">
        {activeAssignments.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No active assignments"
            subtitle="Your admin will assign builds and tasks to you. Check back soon."
          />
        ) : (
          <div className="space-y-3">
            {activeAssignments.map((a) => (
              <div key={a.id} className="rounded-lg border border-white/10 bg-black p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{a.entity_name || "Unnamed Build"}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="rounded-md bg-amber-400/10 px-2 py-0.5 text-xs text-amber-400">{a.role}</span>
                      <span className="text-xs text-white/40">{a.assignment_type}</span>
                      {a.assignment_type === "build" && builds[a.entity_id]?.current_step && (() => {
                        const info = getBuildStepInfo(builds[a.entity_id].current_step);
                        return info ? (
                          <span className="rounded-md bg-lime-400/15 px-2 py-0.5 text-xs font-medium text-lime-400">
                            Step {info.number}/{info.total} · {info.label}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>
                {a.assignment_type === "build" && (
                  <div className="flex gap-2">
                    <LoadingButton
                      onClick={() => runBuildStep(a.entity_id)}
                      loading={actionLoading[`build-${a.entity_id}`]}
                    >
                      <Rocket className="h-3.5 w-3.5 mr-1" /> Run Build Step
                    </LoadingButton>
                    <LoadingButton
                      variant="ghost"
                      onClick={() => runValidation(a.entity_id)}
                      loading={actionLoading[`val-${a.entity_id}`]}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Run Validation
                    </LoadingButton>
                    <Link
                      to={`/auto-builder?build=${a.entity_id}`}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Recent Products */}
      {packages.length > 0 && (
        <Panel title="Recently Packaged Products">
          <div className="space-y-2">
            {packages.slice(0, 5).map((pkg) => (
              <div key={pkg.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black p-3">
                <div>
                  <div className="text-sm font-medium text-white">{pkg.name}</div>
                  <div className="text-xs text-white/40">{pkg.industry} · {pkg.product_type.replace("_", " ")}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-amber-400">{pkg.validation_score}%</span>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                    pkg.status === "deployed" ? "bg-green-500/20 text-green-400" : "bg-amber-400/20 text-amber-400"
                  }`}>
                    {pkg.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}