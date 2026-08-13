import React from "react";
import { LoadingButton } from "@/components/ui";
import { ShieldCheck, ArrowRight, HardDrive, Github, Database, Cloud, Globe, TrendingUp, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export default function StepProvisioning({ project, onNext, provisioning }) {
  const prov = project?.provisioning || {};
  const logs = project?.logs || [];

  const services = [
    { key: "drive", label: "Google Drive", icon: HardDrive, data: prov.drive, urlKey: "url" },
    { key: "github", label: "GitHub Repo", icon: Github, data: prov.github, urlKey: "html_url" },
    { key: "supabase", label: "Supabase Backend", icon: Database, data: prov.supabase, urlKey: "url" },
    { key: "vercel", label: "Vercel Deploy", icon: Cloud, data: prov.vercel, urlKey: "url" },
  ];

  const domainStatus = project?.domain_purchase_status;
  const seoFilled = project?.seo_aeo_filled;
  const rankEngineId = project?.rank_engine_id;
  const vercelReady = !!prov.vercel?.url;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Autonomous Provisioning</h2>
          <p className="mt-1 text-sm text-white/50">Drive, GitHub, Supabase, Vercel, SEO/AEO, and Rank Engine — all automatic. Domain purchase is manual.</p>
        </div>
        <LoadingButton onClick={onNext} variant="primary" disabled={!vercelReady}>
          <ShieldCheck className="h-4 w-4" /> Harden & Validate
          <ArrowRight className="h-4 w-4" />
        </LoadingButton>
      </div>

      {/* Service cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((svc) => {
          const status = svc.data ? "done" : provisioning ? "loading" : "pending";
          const svcUrl = svc.data?.[svc.urlKey] || svc.data?.url;
          return (
            <div key={svc.key} className="rounded-xl border border-white/10 bg-zinc-950 p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${status === "done" ? "bg-lime-400/10 text-lime-400" : status === "loading" ? "bg-amber-400/10 text-amber-400" : "bg-white/5 text-white/30"}`}>
                  <svc.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">{svc.label}</div>
                  <StatusText status={status} />
                </div>
                {status === "done" && <CheckCircle2 className="h-5 w-5 text-lime-400" />}
                {status === "loading" && <Loader2 className="h-5 w-5 animate-spin text-amber-400" />}
                {status === "pending" && <div className="h-5 w-5 rounded-full border-2 border-white/20" />}
              </div>
              {svcUrl && (
                <a href={svcUrl.startsWith("http") ? svcUrl : `https://${svcUrl}`} target="_blank" rel="noreferrer" className="mt-2 block text-xs text-lime-400/70 truncate hover:text-lime-400">
                  {svcUrl.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* Domain + SEO + Rank Engine */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 sm:col-span-3">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-lime-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Domain — Manual Purchase Required</span>
          </div>
          <div className="text-sm text-white truncate">{project?.selected_domain || "—"}</div>
          <div className="text-xs mt-1 text-amber-400 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Buy this domain manually, then point DNS at Vercel using the records below.
          </div>
          {(project?.provisioning?.vercel?.domain_verification || []).length > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider text-white/40">Verification / DNS records (set these at your registrar)</div>
              {project.provisioning.vercel.domain_verification.map((v, i) => (
                <div key={i} className="rounded border border-white/10 bg-black px-2.5 py-1.5 font-mono text-[11px] text-lime-400/80 flex flex-wrap gap-x-3 gap-y-0.5">
                  <span className="text-white/40">{v.type}</span>
                  <span className="text-white/60 truncate">{v.name || '@'}</span>
                  <span className="truncate">{v.value}</span>
                </div>
              ))}
            </div>
          )}
          {(project?.provisioning?.vercel?.nameservers || []).length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-white/40">Or point nameservers to:</div>
              {project.provisioning.vercel.nameservers.map((ns, i) => (
                <div key={i} className="rounded border border-white/10 bg-black px-2.5 py-1.5 font-mono text-[11px] text-lime-400/80">{ns}</div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-lime-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/40">SEO / AEO</span>
          </div>
          <div className="text-sm text-white">{seoFilled ? "Gaps Filled" : "Filling…"}</div>
          <div className="text-xs text-white/40 mt-1">{(project?.seo_aeo_gaps || []).length} gaps identified</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-lime-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Rank Engine</span>
          </div>
          <div className="text-sm text-white">{rankEngineId ? "Campaign Active" : "Creating…"}</div>
          <div className="text-xs text-white/40 mt-1">{project?.gsc_synced ? "GSC synced" : "GSC pending"}</div>
        </div>
      </div>

      {/* Live logs */}
      {logs.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-black p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Live Logs</div>
          <div className="max-h-48 overflow-y-auto space-y-0.5 font-mono text-xs text-lime-400/70">
            {logs.slice(-30).map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
      )}

      {provisioning && (
        <div className="flex items-center gap-3 rounded-lg border border-lime-400/30 bg-lime-400/5 px-4 py-3">
          <Loader2 className="h-5 w-5 animate-spin text-lime-400" />
          <div>
            <div className="text-sm font-medium text-white">Provisioning everything…</div>
            <div className="text-xs text-white/50">Building site files, creating Drive/Git/Supabase/Vercel, adding domain to Vercel, filling SEO/AEO gaps, creating Rank Engine campaign. This takes 1-3 minutes.</div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusText({ status }) {
  if (status === "done") return <div className="text-xs text-lime-400">Provisioned</div>;
  if (status === "loading") return <div className="text-xs text-amber-400">In progress…</div>;
  return <div className="text-xs text-white/30">Waiting</div>;
}