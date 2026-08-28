import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

// Admin-only panel rendered inside the Employee Portal page. Lets the admin
// invite a new employee by email — `base44.users.inviteUser` sends the join
// email and creates the user record with the chosen role. The invited
// employee signs in from the standard /login page once they've accepted.
export default function EmployeeInvitePanel() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employee");
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [message, setMessage] = useState("");

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
      await base44.users.inviteUser(clean, role);
      setStatus("success");
      setMessage(`Invitation sent to ${clean}. They'll receive an email to set up their account and sign in.`);
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err?.response?.data?.message || err?.message || "Failed to send invitation. You may need an admin plan to invite users.");
    }
  };

  return (
    <div className="rounded-xl border border-amber-400/30 bg-zinc-900 p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/15">
          <UserPlus className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Invite Employee</h2>
          <p className="text-xs text-white/40">Email a team member an invitation to access the system.</p>
        </div>
      </div>

      <form onSubmit={sendInvite} className="space-y-3">
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
          <button
            type="submit"
            disabled={status === "sending"}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-bold text-black transition-all hover:bg-amber-300 hover:shadow-lg hover:shadow-amber-400/30 disabled:opacity-60"
          >
            {status === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {status === "sending" ? "Sending…" : "Send Invitation"}
          </button>
        </div>

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
        Invited employees sign in at the <a href="/login" className="text-amber-400 hover:underline">login page</a> after accepting the email invitation.
      </p>
    </div>
  );
}