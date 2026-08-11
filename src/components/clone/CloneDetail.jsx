import React, { useState, useEffect } from "react";
import { Panel, LoadingButton } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import ScoreBar from "@/components/ScoreBar";
import { Image } from "@/components/ui/image";
import {
  CheckCircle2, AlertCircle, ExternalLink, RefreshCw, Package,
  Palette, Sparkles, ShoppingCart, TrendingUp, ChevronRight,
} from "lucide-react";

const PIPELINE_STEPS = [
  { key: 'scanning', label: 'Legal Scan' },
  { key: 'scanned', label: 'Review Scan' },
  { key: 'generating_rebrand', label: 'Generate Rebrand' },
  { key: 'rebrand_ready', label: 'Approve & Launch' },
  { key: 'provisioning', label: 'Provision' },
  { key: 'buying_domain', label: 'Buy Domain' },
  { key: 'seo_aeo_optimizing', label: 'SEO/AEO Fill' },
  { key: 'racing_to_rank', label: 'Race to Rank' },
];

export default function CloneDetail({ project, loading, busy, onGenerateRebrand, onApproveLaunch, onRefresh }) {
  const [selectedName, setSelectedName] = useState(project.selected_name || '');
  const [selectedDomain, setSelectedDomain] = useState(project.selected_domain || '');

  useEffect(() => {
    setSelectedName(project.selected_name || '');
    setSelectedDomain(project.selected_domain || '');
  }, [project.id, project.selected_name, project.selected_domain]);

  if (loading) return <Panel title="Pipeline Detail"><div className="text-sm text-white/40 py-6 text-center">Loading…</div></Panel>;

  const stepIdx = PIPELINE_STEPS.findIndex(s => s.key === project.current_step);
  const scan = project.legal_scan;
  const rp = project.rebrand_package;
  const isScanned = project.current_step === 'scanned' || (scan && project.current_step !== 'scanning');
  const isRebrandReady = project.current_step === 'rebrand_ready' && rp;

  return (
    <>
      <PipelineProgress steps={PIPELINE_STEPS} stepIdx={stepIdx} status={project.status} />

      {project.validation_score > 0 && (
        <Panel title="Final Validation">
          <ScoreBar label="Overall Completeness" value={project.validation_score} />
          {project.validation_summary && <p className="mt-3 text-sm text-white/60">{project.validation_summary}</p>}
        </Panel>
      )}

      {scan && <LegalScanReport scan={scan} />}
      {scan?.name_recommendations?.length > 0 && (
        <NameRecommendations
          names={scan.name_recommendations}
          selectedName={selectedName}
          selectedDomain={selectedDomain}
          onSelect={setSelectedName && setSelectedDomain ? (n, d) => { setSelectedName(n); setSelectedDomain(d); } : null}
          isScanned={isScanned}
          hasRebrand={!!rp}
          onGenerate={() => onGenerateRebrand(project.id, selectedName, selectedDomain)}
          busy={busy === `rebrand-${project.id}`}
        />
      )}
      {rp && <RebrandPackage rp={rp} />}
      {isRebrandReady && <ApprovalGate onApprove={() => onApproveLaunch(project.id)} busy={busy === `launch-${project.id}`} />}
      {project.provisioning && <ProvisioningStatus provisioning={project.provisioning} />}
      {project.domain_purchase_status && <DomainStatus project={project} />}
      {project.seo_aeo_gaps?.length > 0 && <SeoAeoGaps gaps={project.seo_aeo_gaps} />}
      {project.monetization_options?.length > 0 && <MonetizationOptions options={project.monetization_options} />}
      {project.social_content?.platforms?.length > 0 && <SocialContent content={project.social_content} />}
      {project.logs?.length > 0 && <ExecutionLogs logs={project.logs} />}
      {project.status === 'running' && (
        <div className="flex justify-center">
          <LoadingButton onClick={onRefresh} variant="ghost" className="text-xs"><RefreshCw className="h-3.5 w-3.5" /> Refresh Status</LoadingButton>
        </div>
      )}
    </>
  );
}

function PipelineProgress({ steps, stepIdx, status }) {
  return (
    <Panel title="Pipeline Progress">
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((s, i) => {
          const done = i < stepIdx || status === 'complete';
          const current = i === stepIdx && status !== 'complete';
          return (
            <React.Fragment key={s.key}>
              <div className={`flex flex-col items-center gap-1 shrink-0 ${current ? 'text-lime-400' : done ? 'text-white/60' : 'text-white/20'}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${current ? 'border-lime-400 bg-lime-400/10' : done ? 'border-lime-400/50 bg-lime-400/5' : 'border-white/20'}`}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs">{i + 1}</span>}
                </div>
                <span className="text-[10px] text-center w-16">{s.label}</span>
              </div>
              {i < steps.length - 1 && <ChevronRight className="h-3 w-3 text-white/20 shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>
    </Panel>
  );
}

function LegalScanReport({ scan }) {
  const mc = scan.must_change || {};
  return (
    <Panel title={`Legal Scan Report — Risk: ${scan.risk_level || 'medium'}`}>
      <div className={`rounded-lg border p-3 mb-3 ${scan.risk_level === 'high' ? 'border-rose-500/30 bg-rose-500/5' : scan.risk_level === 'medium' ? 'border-amber-500/30 bg-amber-500/5' : 'border-lime-500/30 bg-lime-500/5'}`}>
        <p className="text-sm text-white/80">{scan.executive_summary || 'No summary available.'}</p>
      </div>
      <details className="rounded-lg border border-white/10 p-3" open>
        <summary className="cursor-pointer text-sm font-semibold text-white">⚠️ Must Change ({(mc.images_to_replace || []).length + (mc.content_to_replace || []).length + 1} items)</summary>
        <div className="mt-3 space-y-3 text-sm">
          <div><span className="text-white/40">Business Name:</span> <span className="text-white">{mc.business_name || 'N/A'}</span></div>
          {mc.tagline && <div><span className="text-white/40">Tagline:</span> <span className="text-white">{mc.tagline}</span></div>}
          {mc.trademarked_terms?.length > 0 && (
            <div><span className="text-white/40">Trademarked Terms:</span> {mc.trademarked_terms.map((t, i) => <span key={i} className="ml-1 inline-block rounded border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 text-xs text-rose-300">{t}</span>)}</div>
          )}
          {mc.images_to_replace?.length > 0 && (
            <div>
              <span className="text-white/40">Images to Replace ({mc.images_to_replace.length}):</span>
              <div className="mt-1 space-y-1">
                {mc.images_to_replace.map((img, i) => (
                  <div key={i} className="rounded border border-white/10 px-2 py-1.5 text-xs">
                    <div className="text-white/70">{img.description}</div>
                    <div className="text-white/40">Reason: {img.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {mc.content_to_replace?.length > 0 && (
            <div>
              <span className="text-white/40">Content to Replace ({mc.content_to_replace.length}):</span>
              <div className="mt-1 space-y-1">
                {mc.content_to_replace.map((c, i) => (
                  <div key={i} className="rounded border border-white/10 px-2 py-1.5 text-xs">
                    <div className="text-white/70">{c.section}</div>
                    <div className="text-white/40 truncate">"{c.original_text?.slice(0, 120)}…"</div>
                    <div className="text-white/40">Reason: {c.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </details>
      <details className="mt-2 rounded-lg border border-white/10 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-white">✅ Can Keep (no legal issues)</summary>
        <div className="mt-3 space-y-2 text-sm text-white/60">
          {scan.can_keep?.page_structure && <p><span className="text-white/40">Structure:</span> {scan.can_keep.page_structure}</p>}
          {scan.can_keep?.color_scheme && <p><span className="text-white/40">Colors:</span> {scan.can_keep.color_scheme}</p>}
          {scan.can_keep?.layout && <p><span className="text-white/40">Layout:</span> {scan.can_keep.layout}</p>}
        </div>
      </details>
    </Panel>
  );
}

function NameRecommendations({ names, selectedName, selectedDomain, onSelect, isScanned, hasRebrand, onGenerate, busy }) {
  return (
    <Panel title={`Recommended Names + Domains (${names.length})`}>
      <div className="max-h-56 overflow-y-auto space-y-1">
        {names.map((n, i) => (
          <button
            key={i}
            onClick={() => onSelect?.(n.name, n.domain)}
            disabled={!onSelect}
            className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm text-left transition-colors ${selectedName === n.name ? 'border-lime-400 bg-lime-400/10' : 'border-white/5 hover:bg-white/5'}`}
          >
            <div>
              <span className="text-white font-medium">{n.name}</span>
              <span className="ml-2 text-xs text-white/40">{n.domain}</span>
            </div>
            <div className="flex items-center gap-2">
              {n.available ? <CheckCircle2 className="h-3.5 w-3.5 text-lime-400" /> : <AlertCircle className="h-3.5 w-3.5 text-white/30" />}
              {selectedName === n.name && <span className="text-xs text-lime-400">SELECTED</span>}
            </div>
          </button>
        ))}
      </div>
      {isScanned && !hasRebrand && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-white/40">Selected: <span className="text-lime-400">{selectedName}</span> · {selectedDomain}</div>
          <LoadingButton onClick={onGenerate} loading={busy} variant="primary">
            <Package className="h-4 w-4" /> Generate Rebrand Package
          </LoadingButton>
        </div>
      )}
    </Panel>
  );
}

function RebrandPackage({ rp }) {
  return (
    <>
      <Panel title="Rebrand Package — New Brand Identity">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-white/10 p-3">
            <Palette className="h-4 w-4 text-white/40 mb-1" />
            <div className="text-xs text-white/40">Name</div>
            <div className="text-sm font-medium text-white">{rp.new_brand?.name}</div>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <Sparkles className="h-4 w-4 text-white/40 mb-1" />
            <div className="text-xs text-white/40">Tagline</div>
            <div className="text-sm text-white">{rp.new_brand?.tagline}</div>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <div className="h-4 w-4 rounded mb-1" style={{ background: rp.new_brand?.colors?.primary }} />
            <div className="text-xs text-white/40">Primary</div>
            <div className="text-sm text-white font-mono">{rp.new_brand?.colors?.primary}</div>
          </div>
          <div className="rounded-lg border border-white/10 p-3">
            <div className="h-4 w-4 rounded mb-1" style={{ background: rp.new_brand?.colors?.accent }} />
            <div className="text-xs text-white/40">Accent</div>
            <div className="text-sm text-white font-mono">{rp.new_brand?.colors?.accent}</div>
          </div>
        </div>
      </Panel>

      {rp.logos?.length > 0 && (
        <Panel title={`Generated Logos (${rp.logos.length})`}>
          <div className="grid grid-cols-3 gap-3">
            {rp.logos.map((l, i) => (
              <div key={i} className="rounded-lg border border-white/10 p-2">
                <Image src={l.url} fittingType="fit" className="h-20 w-full" />
                <div className="mt-1 text-xs text-white/40 capitalize">{l.style}</div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {rp.replacement_images?.length > 0 && (
        <Panel title={`Replacement Images (${rp.replacement_images.length})`}>
          <div className="grid grid-cols-2 gap-3">
            {rp.replacement_images.map((img, i) => (
              <div key={i} className="rounded-lg border border-white/10 p-2">
                <Image src={img.new_url} fittingType="fill" className="h-32 w-full rounded" />
                <div className="mt-1 text-xs text-white/50">{img.description}</div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {rp.replacement_content?.length > 0 && (
        <Panel title={`Replacement Content (${rp.replacement_content.length})`}>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {rp.replacement_content.map((c, i) => (
              <div key={i} className="rounded-lg border border-white/10 px-3 py-2 text-xs">
                <div className="text-white/40">{c.section}</div>
                <div className="mt-1 text-white/60 line-through opacity-50">{c.original_text?.slice(0, 100)}…</div>
                <div className="mt-1 text-white">{c.new_text?.slice(0, 200)}…</div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {rp.hero_content && (
        <Panel title="Hero Content">
          <div className="space-y-2 text-sm">
            <div><span className="text-white/40">Headline:</span> <span className="text-white">{rp.hero_content.headline}</span></div>
            <div><span className="text-white/40">Subhead:</span> <span className="text-white">{rp.hero_content.subhead}</span></div>
            {rp.hero_content.about && <div className="text-white/60">{rp.hero_content.about.slice(0, 200)}…</div>}
          </div>
        </Panel>
      )}
    </>
  );
}

function ApprovalGate({ onApprove, busy }) {
  return (
    <Panel title="Approve & Launch">
      <p className="text-sm text-white/60 mb-4">Review the rebrand package above. Once approved, the system will autonomously:
        <br />1. Provision Drive, GitHub, Supabase, and Vercel
        <br />2. Purchase the domain from Vercel
        <br />3. Fill all SEO/AEO gaps (JSON-LD, FAQ schema, sitemap, breadcrumbs)
        <br />4. Create a Rank Engine campaign + Google Search Console sync
        <br />5. Begin the race to rank on page one
      </p>
      <LoadingButton onClick={onApprove} loading={busy} variant="primary" className="w-full justify-center">
        <CheckCircle2 className="h-4 w-4" /> Approve & Launch Autonomous Provisioning
      </LoadingButton>
    </Panel>
  );
}

function ProvisioningStatus({ provisioning }) {
  return (
    <Panel title="Provisioning Status">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {['drive', 'github', 'supabase', 'vercel'].map(svc => {
          const data = provisioning[svc];
          return (
            <div key={svc} className="rounded-lg border border-white/10 p-3">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/40">
                {data ? <CheckCircle2 className="h-3.5 w-3.5 text-lime-400" /> : <AlertCircle className="h-3.5 w-3.5 text-rose-400" />}
                {svc}
              </div>
              {data?.url && <a href={data.url} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-xs text-lime-400 hover:underline truncate"><ExternalLink className="h-3 w-3" />{data.url.replace(/^https?:\/\//, '').slice(0, 30)}</a>}
            </div>
          );
        })}
      </div>
      {provisioning.vercel?.url && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-white/40">Live site:</span>
          <a href={provisioning.vercel.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-lime-400 hover:underline"><ExternalLink className="h-3.5 w-3.5" />{provisioning.vercel.url}</a>
        </div>
      )}
    </Panel>
  );
}

function DomainStatus({ project }) {
  return (
    <Panel title="Domain Purchase">
      <div className="flex items-center gap-2">
        {project.domain_purchased ? <CheckCircle2 className="h-5 w-5 text-lime-400" /> : <AlertCircle className="h-5 w-5 text-amber-400" />}
        <div>
          <div className="text-sm text-white">{project.selected_domain}</div>
          <div className="text-xs text-white/40">{project.domain_purchase_status}</div>
        </div>
      </div>
    </Panel>
  );
}

function SeoAeoGaps({ gaps }) {
  return (
    <Panel title="SEO/AEO Gap Fill">
      <div className="space-y-1">
        {gaps.map((g, i) => (
          <div key={i} className="flex items-start gap-2 rounded-lg border border-white/5 px-3 py-2 text-sm">
            {g.filled ? <CheckCircle2 className="h-4 w-4 text-lime-400 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />}
            <div>
              <div className="text-white/70">{g.gap}</div>
              <div className="text-xs text-white/40">Fix: {g.fix}</div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function MonetizationOptions({ options }) {
  return (
    <Panel title={`Monetization Opportunities (${options.length})`}>
      <div className="space-y-2">
        {options.map((m, i) => (
          <div key={i} className="rounded-lg border border-white/5 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white capitalize">{m.type}</span>
              <span className="text-xs text-lime-400">{m.estimated_revenue}</span>
            </div>
            <p className="mt-1 text-xs text-white/50">{m.description}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SocialContent({ content }) {
  return (
    <Panel title="Social Media Automation">
      <div className="flex flex-wrap gap-2 mb-3">
        {content.platforms.map((p, i) => <span key={i} className="rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-1 text-xs text-lime-300">{p}</span>)}
      </div>
      <p className="text-sm text-white/60">{content.post_schedule}</p>
    </Panel>
  );
}

function ExecutionLogs({ logs }) {
  return (
    <Panel title="Execution Logs">
      <div className="max-h-40 overflow-y-auto space-y-0.5 font-mono text-xs text-white/40">
        {logs.slice(-40).map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </Panel>
  );
}