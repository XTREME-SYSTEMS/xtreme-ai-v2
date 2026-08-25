import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import { UserPlus, Users, Eye, Play, CheckCircle, Clock, Boxes, Package } from "lucide-react";
import { Link } from "react-router-dom";

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [users, assigns] = await Promise.all([
        base44.entities.User.list("-created_date", 100),
        base44.entities.EmployeeAssignment.list("-assigned_at", 100),
      ]);
      setEmployees((users || []).filter((u) => u.role === "employee"));
      setAssignments(assigns || []);
    } catch (e) {
      console.error("Failed to load:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail, "employee");
      setInviteEmail("");
      await loadData();
    } catch (e) {
      console.error("Invite failed:", e);
    } finally {
      setInviting(false);
    }
  };

  const handleAssign = async (employeeEmail, employeeName) => {
    // Get the most recent queued build to assign
    try {
      const builds = await base44.entities.AutoBuild.filter({ status: "queued" }, "-created_date", 1);
      const build = builds?.[0];
      if (!build) {
        alert("No queued builds available to assign");
        return;
      }
      await base44.entities.EmployeeAssignment.create({
        employee_email: employeeEmail,
        employee_name: employeeName,
        assignment_type: "build",
        entity_id: build.id,
        entity_name: build.business_name,
        role: "builder",
        status: "active",
        assigned_by: "admin",
        assigned_at: new Date().toISOString(),
      });
      await loadData();
    } catch (e) {
      console.error("Assignment failed:", e);
    }
  };

  const stats = {
    total: employees.length,
    active: assignments.filter((a) => a.status === "active").length,
    completed: assignments.filter((a) => a.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Management"
        subtitle="Invite employees and assign them to builds and tasks"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-1">
            <Users className="h-4 w-4" /> Employees
          </div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-1">
            <Clock className="h-4 w-4" /> Active Assignments
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.active}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-1">
            <CheckCircle className="h-4 w-4" /> Completed
          </div>
          <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
        </div>
      </div>

      {/* Invite Employee */}
      <Panel title="Invite New Employee">
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="employee@example.com"
            className="flex-1 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder-white/30 focus:border-amber-400 focus:outline-none"
          />
          <LoadingButton onClick={handleInvite} loading={inviting}>
            <UserPlus className="h-4 w-4 mr-1.5" /> Invite Employee
          </LoadingButton>
        </div>
        <p className="mt-2 text-xs text-white/40">
          The employee will receive an email invitation. Once they sign in, they'll see the Employee Portal with their assigned builds.
        </p>
      </Panel>

      {/* Employee List */}
      <Panel title="Employees">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-amber-400" />
          </div>
        ) : employees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employees yet"
            description="Invite your first team member above."
          />
        ) : (
          <div className="space-y-2">
            {employees.map((emp) => {
              const empAssignments = assignments.filter((a) => a.employee_email === emp.email);
              return (
                <div key={emp.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black p-3">
                  <div>
                    <div className="text-sm font-medium text-white">{emp.full_name || emp.email}</div>
                    <div className="text-xs text-white/40">
                      {empAssignments.length} assignment{empAssignments.length !== 1 ? "s" : ""}
                      {empAssignments.filter((a) => a.status === "active").length > 0 && ` · ${empAssignments.filter((a) => a.status === "active").length} active`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAssign(emp.email, emp.full_name || emp.email)}
                      className="flex items-center gap-1.5 rounded-lg border border-amber-400/30 px-3 py-1.5 text-xs text-amber-400 hover:bg-amber-400/10"
                    >
                      <Boxes className="h-3.5 w-3.5" /> Assign Build
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Recent Assignments */}
      <Panel title="Recent Assignments">
        {assignments.length === 0 ? (
          <EmptyState icon={Boxes} title="No assignments yet" description="Assign builds to employees above." />
        ) : (
          <div className="space-y-2">
            {assignments.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black p-3">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${a.status === "active" ? "bg-amber-400" : a.status === "completed" ? "bg-green-400" : "bg-white/30"}`} />
                  <div>
                    <div className="text-sm font-medium text-white">{a.employee_name || a.employee_email}</div>
                    <div className="text-xs text-white/40">
                      {a.assignment_type}: {a.entity_name || a.entity_id?.slice(0, 8)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">{a.role}</span>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                    a.status === "active" ? "bg-amber-400/20 text-amber-400" :
                    a.status === "completed" ? "bg-green-500/20 text-green-400" :
                    "bg-white/5 text-white/40"
                  }`}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}