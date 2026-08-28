import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Users, Trash2, Pencil, Check, X, Loader2, Mail, Shield, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  ACCESS_PRESETS, INDIVIDUAL_CAPABILITIES, getLandingPage,
} from "@/lib/accessCapabilities";

// Admin-only panel that lists every invited user (employees + admins) with
// their email, role, and access capabilities. The admin can edit capabilities
// inline, change the role, or delete the user entirely.
export default function EmployeeListPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editCaps, setEditCaps] = useState([]);
  const [editRole, setEditRole] = useState("employee");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    try {
      const list = await base44.entities.User.list("-created_date", 100);
      setUsers(list || []);
    } catch (e) {
      setError(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const startEdit = (u) => {
    setEditingId(u.id);
    setEditCaps(u.access_capabilities || []);
    setEditRole(u.role || "employee");
  };
  const cancelEdit = () => { setEditingId(null); setEditCaps([]); };

  const applyPreset = (presetId) => {
    const preset = ACCESS_PRESETS.find((p) => p.id === presetId);
    if (preset) setEditCaps(preset.capabilities);
  };
  const toggleCap = (path) => {
    setEditCaps((prev) => {
      if (prev.includes(path)) return prev.filter((c) => c !== path);
      return [...prev.filter((c) => c !== "all"), path];
    });
  };

  const saveEdit = async (userId) => {
    setSaving(true);
    try {
      await base44.entities.User.update(userId, {
        access_capabilities: editCaps,
        role: editRole,
      });
      setUsers((prev) => prev.map((u) =>
        u.id === userId ? { ...u, access_capabilities: editCaps, role: editRole } : u
      ));
      setEditingId(null);
    } catch (e) {
      setError(e?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (userId, email) => {
    if (!confirm(`Remove ${email}? This will permanently delete their account.`)) return;
    setDeleting(userId);
    try {
      await base44.entities.User.delete(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (e) {
      setError(e?.message || "Failed to delete user");
    } finally {
      setDeleting(null);
    }
  };

  const grouped = INDIVIDUAL_CAPABILITIES.reduce((acc, cap) => {
    if (!acc[cap.group]) acc[cap.group] = [];
    acc[cap.group].push(cap);
    return acc;
  }, {});

  const capSummary = (caps) => {
    if (!caps || caps.length === 0) return "No access";
    if (caps.includes("all")) return "Full Access";
    return `${caps.length} tool${caps.length === 1 ? "" : "s"}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900 p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/15">
          <Users className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Invited Employees</h2>
          <p className="text-xs text-white/40">{users.length} user{users.length === 1 ? "" : "s"} — edit access, change role, or remove.</p>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {users.map((u) => {
          const isEditing = editingId === u.id;
          return (
            <div key={u.id} className="rounded-lg border border-white/10 bg-black p-3">
              {/* Row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400/10">
                    <Mail className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">{u.email}</div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        u.role === "admin" ? "bg-amber-400/20 text-amber-400" : "bg-white/10 text-white/50"
                      }`}>{u.role}</span>
                      <span className="text-[11px] text-white/40">{capSummary(u.access_capabilities)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {!isEditing && (
                    <>
                      <button
                        onClick={() => startEdit(u)}
                        className="flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-white/60 transition-colors hover:border-amber-400/40 hover:text-amber-400"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button
                        onClick={() => deleteUser(u.id, u.email)}
                        disabled={deleting === u.id}
                        className="flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-white/60 transition-colors hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
                      >
                        {deleting === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Inline editor */}
              {isEditing && (
                <div className="mt-3 border-t border-white/10 pt-3">
                  {/* Role */}
                  <div className="mb-3 flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-white/40" />
                    <span className="text-xs text-white/40">Role:</span>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="rounded-md border border-white/10 bg-zinc-950 px-2 py-1 text-xs text-white outline-none focus:border-amber-400"
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Preset buttons */}
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {ACCESS_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset.id)}
                        className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-white/50 transition-colors hover:border-amber-400/40 hover:text-white/80"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Individual checkboxes */}
                  <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border border-white/5 bg-zinc-950 p-2.5">
                    {Object.entries(grouped).map(([group, caps]) => (
                      <div key={group}>
                        <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-white/25">{group}</div>
                        <div className="grid gap-1 sm:grid-cols-2">
                          {caps.map((cap) => {
                            const checked = editCaps.includes(cap.path);
                            return (
                              <label
                                key={cap.path}
                                className={`flex cursor-pointer items-start gap-1.5 rounded border px-2 py-1 text-[11px] transition-colors ${
                                  checked ? "border-amber-400/40 bg-amber-400/5" : "border-white/5 hover:border-white/15"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleCap(cap.path)}
                                  className="mt-0.5 h-3 w-3 accent-amber-400"
                                />
                                <span className="text-white/70">{cap.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 text-[10px] text-white/30">
                    {editCaps.includes("all") ? "Full access" : `${editCaps.length} selected · Landing: ${getLandingPage(editCaps)}`}
                  </div>

                  {/* Save / Cancel */}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => saveEdit(u.id)}
                      disabled={saving}
                      className="flex items-center gap-1.5 rounded-md bg-amber-400 px-3 py-1.5 text-xs font-bold text-black transition-colors hover:bg-amber-300 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/60 transition-colors hover:text-white"
                    >
                      <X className="h-3 w-3" /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {users.length === 0 && (
          <div className="py-8 text-center text-sm text-white/30">No users found.</div>
        )}
      </div>
    </div>
  );
}