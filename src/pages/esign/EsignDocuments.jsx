import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, EmptyState, LoadingButton } from "@/components/ui";
import CreateModal from "@/components/CreateModal";
import StatusBadge from "@/components/StatusBadge";
import { FileSignature, Plus, Sparkles, Send, Copy, Loader2 } from "lucide-react";

export default function EsignDocuments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gen, setGen] = useState(null);
  const [toast, setToast] = useState(null);

  const load = () => base44.entities.EsignDocument.list("-created_date", 200).then(setItems).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const create = async (form) => {
    setBusy(true);
    try {
      const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
      await base44.entities.EsignDocument.create({
        title: form.title, body: "", deal_name: form.deal_name, account_name: form.account_name,
        status: "draft", share_token: token,
        signers: form.signer_name ? [{ name: form.signer_name, email: form.signer_email, signed: false }] : [],
        owner_name: form.owner_name,
      });
      setOpen(false); await load();
    } catch (e) {}
    setBusy(false);
  };

  const aiGenerate = async (id) => {
    setGen(id);
    try { await base44.functions.invoke("generateContract", { document_id: id }); await load(); } catch (e) {}
    setGen(null);
  };

  const send = async (id) => {
    setBusy(id);
    try {
      const r = await base44.functions.invoke("sendEsignRequest", { document_id: id });
      const d = r.data;
      if (d?.emailed) setToast("Email sent to signer(s).");
      else if (d?.link) setToast("Signer not a registered user — copy the share link instead.");
      await load();
    } catch (e) {}
    setBusy(null);
    setTimeout(() => setToast(null), 4000);
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}/sign/${token}`;
    navigator.clipboard?.writeText(url);
    setToast("Share link copied to clipboard.");
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div>
      <PageHeader title="E-Sign Documents" subtitle="Clone of e-sign technology — generate, sign in-portal, or share by email.">
        <LoadingButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Document</LoadingButton>
      </PageHeader>
      {toast && <div className="mb-3 rounded-lg border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-sm text-lime-200">{toast}</div>}
      <Panel title={`${items.length} documents`}>
        {loading ? <div className="py-8 text-sm text-white/50">Loading…</div> : items.length === 0 ? (
          <EmptyState icon={FileSignature} title="No documents yet" subtitle="Create a contract and AI-generate the body, then send for signature.">
            <LoadingButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Document</LoadingButton>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40">
                <th className="px-3 py-2">Title</th><th className="px-3 py-2">Account</th><th className="px-3 py-2">Signer</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Actions</th>
              </tr></thead>
              <tbody>
                {items.map((d) => {
                  const s = (d.signers || [])[0] || {};
                  return (
                    <tr key={d.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-3 py-2 text-white">{d.title}</td>
                      <td className="px-3 py-2 text-white/60">{d.account_name || "—"}</td>
                      <td className="px-3 py-2 text-white/60">{s.name ? `${s.name}${s.email ? ` · ${s.email}` : ""}` : "—"}</td>
                      <td className="px-3 py-2"><StatusBadge status={d.status} /></td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => aiGenerate(d.id)} disabled={gen === d.id} className="inline-flex items-center gap-1 rounded-md border border-lime-400/40 px-2 py-1 text-xs font-semibold text-lime-300 hover:bg-lime-400/10 disabled:opacity-50">
                            {gen === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI
                          </button>
                          <button onClick={() => copyLink(d.share_token)} className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-xs font-semibold text-white hover:bg-white/5"><Copy className="h-3 w-3" /> Link</button>
                          <button onClick={() => send(d.id)} disabled={busy === d.id} className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-xs font-semibold text-white hover:bg-white/5 disabled:opacity-50">
                            {busy === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Send
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <CreateModal open={open} onClose={() => setOpen(false)} title="New E-Sign Document" loading={busy} onSubmit={create}
        fields={[
          { key: "title", label: "Document title", required: true },
          { key: "account_name", label: "Account / Business" },
          { key: "deal_name", label: "Deal / Project" },
          { key: "signer_name", label: "Signer name" },
          { key: "signer_email", label: "Signer email", type: "email" },
          { key: "owner_name", label: "Owner" },
        ]}
      />
    </div>
  );
}