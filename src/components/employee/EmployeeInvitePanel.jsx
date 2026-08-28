import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, Mail, CheckCircle, AlertCircle, Loader2, ChevronDown, Lock } from "lucide-react";
import {
  ACCESS_PRESETS, INDIVIDUAL_CAPABILITIES, getLandingPage,
} from "@/lib/accessCapabilities";

// Admin-only panel rendered inside the Employee Portal page. Lets the admin
// invite a new employee by email AND select which tools/capabilities they get
// access to. The backend function sends a custom email with a direct link to
// their landing page.
export default function EmployeeInvitePanel() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employee");
  const [selectedCaps, setSelectedCaps] = useState(["all"]);
  const [showCustom, setShowCustom] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [message, setMessage] = useState("");

  const applyPreset = (presetId) => {
    const preset = ACCESS_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedCaps(preset.capabilities);
      setShowCustom(presetId === "custom");
    }
  };

  const toggleCapability = (path) => {
    setSelectedCaps((prev) => {
      if (prev.includes(path)) return prev.filter((c) => c !== path);
      return [...prev.filter((c) => c !== "all"), path];
    });
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      const res = await base44.functions.invoke("inviteEmployeeWithAccess", {
        email: clean,
        role,
        access_capabilities: selectedCaps,
      });
      const landing = res.data?.landing_page || getLandingPage(selectedCaps);
      setStatus("success");
      setMessage(`Invitation sent to ${clean}. They'll receive an email with a direct link to ${landing}.`);
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err?.response?.data?.message || err?.message || "Failed to send invitation.");
    }
  };

  const grouped = INDIVIDUAL_CAPABILITIES.reduce((acc, cap) => {
    if (!acc[cap.group]) acc[cap.group] = [];
    acc[cap.group].push(cap);
    return acc;
  }, {});

  return (
    <div className="rounded-xl border border-amber-400/30 bg-zinc-900 p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/15">
          <UserPlus className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Invite Employee</h2>
          <p className="text-xs text-white/40">Email a team member and select their access capabilities.</p>
        </div>
      </div>

      <form onSubmit={sendInvite} className="space-y-3">
        {/* Email + Role */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
              placeholder="employee@email.com"
              disabled={status === "sending"}
              className="w-full rounded-lg border border-white/10 bg-black py-2.5 pl-10 pr-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-amber-400 disabled:opacity-50"
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={status === "sending"}
            className="rounded-lg border border-white/10 bg-black px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-amber-400 disabled:opacity-50"
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Access Capabilities */}
        <div className="rounded-lg border border-white/10 bg-black p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-white/60">
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            Access Capabilities
          </div>
          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2">
            {ACCESS_PRESETS.map((preset) => {
              const isActive = selectedCaps.includes(preset.id) ||
                (preset.id === "auto_builder" && selectedCaps.length > 0 && !selectedCaps.includes("all") &&
                 JSON.stringify([...selectedCaps].sort()) === JSON.stringify([...preset.capabilities].sort()));
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-amber-400 bg-amber-400/15 text-amber-400"
                      : "border-white/10 text-white/50 hover:border-amber-400/40 hover:text-white/80"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => { setShowCustom(true); setSelectedCaps(selectedCaps.filter((c) => c !== "all")); }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                showCustom
                  ? "border-amber-400 bg-amber-400/15 text-amber-400"
                  : "border-white/10 text-white/50 hover:border-amber-400/40 hover:text-white/80"
              }`}
            >
              Custom (Pick Tools)
            </button>
          </div>

          {/* Custom capability checkboxes */}
          {showCustom && (
            <div className="mt-3 max-h-56 space-y-3 overflow-y-auto rounded-lg border border-white/5 bg-zinc-950 p-3">
              {Object.entries(grouped).map(([group, caps]) => (
                <div key={group}>
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30">{group}</div>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {caps.map((cap) => {
                      const checked = selectedCaps.includes(cap.path);
                      return (
                        <label
                          key={cap.path}
                          className={`flex cursor-pointer items-start gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                            checked ? "border-amber-400/40 bg-amber-400/5" : "border-white/5 hover:border-white/15"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCapability(cap.path)}
                            className="mt-0.5 h-3.5 w-3.5 accent-amber-400"
                          />
                          <div>
                            <div className="font-medium text-white/80">{cap.label}</div>
                            <div className="text-[10px] text-white/30">{cap.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected summary */}
          <div className="mt-2 text-[11px] text-white/40">
            {selectedCaps.includes("all")
              ? "Full access to all capabilities"
              : `${selectedCaps.length} tool${selectedCaps.length === 1 ? "" : "s"} selected · Landing page: ${getLandingPage(selectedCaps)}`}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-bold text-black transition-all hover:bg-amber-300 hover:shadow-lg hover:shadow-amber-400/30 disabled:opacity-60"
        >
          {status === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {status === "sending" ? "Sending Invitation…" : "Send Invitation with Access"}
        </button>

        {status === "success" && (
          <div className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}
        {status === "error" && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}
      </form>

      <p className="mt-3 text-xs text-white/30">
        The invitee receives an email with a direct link to their portal. They sign in at the <a href="/login" className="text-amber-400 hover:underline">login page</a> from the home page hamburger menu → Client Portal.
      </p>
    </div>
  );
}