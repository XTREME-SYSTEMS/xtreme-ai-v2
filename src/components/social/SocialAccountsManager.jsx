import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Plus, Trash2, Loader2, ExternalLink, Instagram, Facebook, Linkedin, Youtube, MapPin, Music2, Twitter, Bookmark, Globe } from "lucide-react";
import { useClientUser } from "@/hooks/useClientUser";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "google_business", label: "Google Business", icon: MapPin },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "tiktok", label: "TikTok", icon: Music2 },
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "twitter_x", label: "X / Twitter", icon: Twitter },
  { id: "pinterest", label: "Pinterest", icon: Bookmark },
  { id: "nextdoor", label: "Nextdoor", icon: Globe },
  { id: "other", label: "Other", icon: Globe },
];

const STATUS_STYLES = {
  active: "border-lime-400/40 bg-lime-400/10 text-lime-300",
  pending_setup: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  needs_access: "border-red-400/40 bg-red-400/10 text-red-300",
  paused: "border-white/15 bg-white/5 text-white/50",
};

const platformMeta = (id) => PLATFORMS.find((p) => p.id === id) || PLATFORMS[PLATFORMS.length - 1];

export default function SocialAccountsManager() {
  const { user } = useClientUser();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ platform: "instagram", handle: "", url: "", follower_count: "", status: "pending_setup", access_notes: "" });

  const load = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const list = await base44.entities.SocialAccount.filter({ client_email: user.email }, "-created_date", 100);
      setAccounts(list || []);
    } catch { setAccounts([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.email]);
  useEffect(() => { const u = base44.entities.SocialAccount.subscribe(() => load()); return () => u && u(); }, [user?.email]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.handle.trim() || !user?.email) return;
    setSaving(true);
    try {
      await base44.entities.SocialAccount.create({
        client_email: user.email,
        platform: form.platform,
        handle: form.handle.trim(),
        url: form.url.trim(),
        follower_count: Number(form.follower_count) || 0,
        status: form.status,
        access_notes: form.access_notes.trim(),
      });
      setForm({ platform: "instagram", handle: "", url: "", follower_count: "", status: "pending_setup", access_notes: "" });
      setShowForm(false);
      load();
    } catch {}
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    try { await base44.entities.SocialAccount.delete(id); load(); } catch {}
  };

  const setStatus = async (id, status) => {
    try { await base44.entities.SocialAccount.update(id, { status }); load(); } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Your Social Accounts</h2>
          <p className="text-sm text-white/50">Add every account you want us to manage and post to.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-xs font-semibold text-black hover:bg-lime-300">
          <Plus className="h-4 w-4" /> Add Account
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl border border-lime-400/30 bg-zinc-950 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-white/60">Platform</label>
              <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-lime-400 focus:outline-none">
                {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-white/60">Handle / Page Name</label>
              <input value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} placeholder="@yourbusiness"
                className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-white/60">Profile URL</label>
              <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://instagram.com/yourbusiness"
                className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-white/60">Followers (optional)</label>
              <input type="number" value={form.follower_count} onChange={(e) => setForm({ ...form, follower_count: e.target.value })} placeholder="0"
                className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-white/60">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-lime-400 focus:outline-none">
                <option value="pending_setup">Pending Setup</option>
                <option value="active">Active</option>
                <option value="needs_access">Needs Access</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-white/60">Access Notes (optional)</label>
              <input value={form.access_notes} onChange={(e) => setForm({ ...form, access_notes: e.target.value })} placeholder="e.g. Manager invited as editor"
                className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-lime-400 focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving || !form.handle.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Save Account
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 hover:border-white/30">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="mt-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>
      ) : accounts.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-white/15 bg-white/5 p-8 text-center">
          <p className="text-sm text-white/50">No accounts yet. Add your first social media account to get started.</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {accounts.map((a) => {
            const P = platformMeta(a.platform).icon;
            return (
              <div key={a.id} className="rounded-xl border border-white/10 bg-zinc-950 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-400/15">
                    <P className="h-5 w-5 text-lime-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{a.handle}</span>
                      {a.url && (
                        <a href={a.url} target="_blank" rel="noreferrer" className="text-white/40 hover:text-lime-300">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <span className="text-xs text-white/40">{platformMeta(a.platform).label}</span>
                    {a.follower_count > 0 && <span className="ml-2 text-xs text-white/40">{a.follower_count.toLocaleString()} followers</span>}
                  </div>
                  <button onClick={() => remove(a.id)} className="text-white/30 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                </div>
                {a.access_notes && <p className="mt-2 text-xs text-white/50">{a.access_notes}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["pending_setup", "active", "needs_access", "paused"].map((s) => (
                    <button key={s} onClick={() => setStatus(a.id, s)}
                      className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize transition-colors",
                        a.status === s ? STATUS_STYLES[s] : "border-white/10 text-white/30 hover:text-white/60")}>
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}