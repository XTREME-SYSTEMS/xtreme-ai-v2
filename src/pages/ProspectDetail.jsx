import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageHeader, LoadingButton, Panel } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import ScoreBar from "@/components/ScoreBar";
import AuditTab from "@/components/prospect/AuditTab";
import CustomerTab from "@/components/prospect/CustomerTab";
import GenericListTab from "@/components/prospect/GenericListTab";
import PacksTab from "@/components/prospect/PacksTab";
import BuildTab from "@/components/prospect/BuildTab";
import DisplayTab from "@/components/prospect/DisplayTab";
import QATab from "@/components/prospect/QATab";
import {
  findCompetitors, buildIntent, findSearchOpportunities, generateDomains, throwTheBook, inventConcepts,
  generateBrandPacks, generateWebsitePacks, generateMarketingPacks, logReceipt,
} from "@/lib/lgny";
import { Star, Globe, Phone, MapPin, ChevronRight } from "lucide-react";

const TABS = ["Overview","Audit","Customer","Competitors","Intent","Search","Domains","Tactics","Concepts","Brand","Website","Marketing","Generators","Build","QA","Proposal","Experiments","Receipts"];

export default function ProspectDetail() {
  const { id } = useParams();
  const [prospect, setProspect] = useState(null);
  const [audit, setAudit] = useState(null);
  const [tab, setTab] = useState("Overview");
  const [receipts, setReceipts] = useState([]);

  useEffect(() => {
    base44.entities.BusinessProspect.get(id).then(setProspect).catch(() => {});
    base44.entities.PresenceAudit.filter({ business_id: id }, "-created_date", 1).then((r) => setAudit(r[0] || null));
    base44.entities.Receipt.filter({ entity_id: id }, "-created_date", 50).then(setReceipts).catch(() => {});
  }, [id]);

  if (!prospect) return <div className="py-12 text-center text-sm text-slate-500">Loading prospect…</div>;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
        <Link to="/prospects" className="hover:text-slate-300">Prospects</Link>
        <ChevronRight className="h-3 w-3" /> <span className="text-slate-300">{prospect.name}</span>
      </div>
      <PageHeader title={prospect.name} subtitle={`${prospect.category || "Local service"} · ${prospect.city || ""} ${prospect.state || ""}`}>
        <StatusBadge status={prospect.status} />
        {audit && <span className="text-sm text-slate-400">Overall audit: <b className="text-white">{Math.round(audit.overall_score)}</b></span>}
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-1.5 border-b border-slate-800 pb-px">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-t-md px-3 py-2 text-sm transition-colors ${tab === t ? "bg-slate-900/60 text-cyan-300 border-b-2 border-cyan-400" : "text-slate-400 hover:text-slate-200"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Business" className="lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <Info icon={MapPin} label="Address" value={prospect.address || `${prospect.city || ""}, ${prospect.state || ""} ${prospect.zip || ""}`} />
              <Info icon={Phone} label="Phone" value={prospect.phone || "—"} />
              <Info icon={Globe} label="Website" value={prospect.website || "—"} />
              <Info icon={Star} label="Rating" value={prospect.rating ? `${prospect.rating} ★ (${prospect.review_count || 0})` : "—"} />
            </div>
          </Panel>
          <Panel title="Audit Snapshot">
            {audit ? (
              <div className="grid gap-2">
                {[["overall","Overall"],["seo","SEO"],["local_seo","Local"],["conversion","Conv."],["lead_capture","Lead Cap."]].map(([k,l]) => <ScoreBar key={k} label={l} value={audit[`${k}_score`]} />)}
              </div>
            ) : <p className="text-sm text-slate-500">No audit yet. Visit the Audit tab.</p>}
          </Panel>
        </div>
      )}

      {tab === "Audit" && <AuditTab businessId={id} businessName={prospect.name} prospect={prospect} />}
      {tab === "Customer" && <CustomerTab businessId={id} businessName={prospect.name} prospect={prospect} />}

      {tab === "Competitors" && (
        <GenericListTab businessId={id} businessName={prospect.name} entity="Competitor" title="Competitors"
          generateFn={findCompetitors} generateLabel="Research Competitors"
          columns={[{key:"name",label:"Name"},{key:"domain",label:"Domain"},{key:"location",label:"Location"},{key:"reason_selected",label:"Why"}]} />
      )}
      {tab === "Intent" && (
        <GenericListTab businessId={id} businessName={prospect.name} entity="IntentMap" title="Intent Map"
          generateFn={buildIntent} generateLabel="Map Intent"
          columns={[{key:"intent_type",label:"Intent"},{key:"query_or_question",label:"Query / Question"},{key:"stage",label:"Stage"},{key:"commercial_value",label:"Value"},{key:"priority",label:"Priority"}]} />
      )}
      {tab === "Search" && (
        <GenericListTab businessId={id} businessName={prospect.name} entity="SearchOpportunity" title="Search Opportunities"
          generateFn={findSearchOpportunities} generateLabel="Hunt Search Opportunities"
          columns={[{key:"query",label:"Query"},{key:"intent",label:"Intent"},{key:"tool_opportunity",label:"Tool"},{key:"overall_score",label:"Score",render:(it)=><span className="font-mono text-cyan-400">{Math.round(it.overall_score)}</span>}]} />
      )}
      {tab === "Domains" && (
        <GenericListTab businessId={id} businessName={prospect.name} entity="DomainCandidate" title="Domain Candidates"
          generateFn={generateDomains} generateLabel="Generate Domains"
          columns={[{key:"domain",label:"Domain"},{key:"availability_status",label:"Status",render:(it)=><StatusBadge status={it.availability_status==="UNKNOWN"?"open":it.availability_status.toLowerCase()} />},{key:"score",label:"Score",render:(it)=><span className="font-mono text-cyan-400">{Math.round(it.score)}</span>},{key:"collision_risk",label:"Collision"}]} />
      )}
      {tab === "Tactics" && (
        <GenericListTab businessId={id} businessName={prospect.name} entity="TacticScore" title="Throw The Book — Tactic Scores"
          generateFn={throwTheBook} generateLabel="Throw The Book"
          columns={[{key:"tactic_family",label:"Family"},{key:"tactic_name",label:"Tactic"},{key:"total",label:"Total",render:(it)=><span className="font-mono text-cyan-400">{Math.round(it.total)}</span>},{key:"rationale",label:"Rationale"}]} />
      )}
      {tab === "Concepts" && (
        <GenericListTab businessId={id} businessName={prospect.name} entity="LeadGenConcept" title="Lead-Gen Concepts"
          generateFn={inventConcepts} generateLabel="Invent Concepts"
          columns={[{key:"name",label:"Concept"},{key:"tool_type",label:"Tool"},{key:"lead_event",label:"Lead Event"},{key:"score",label:"Score",render:(it)=><span className="font-mono text-cyan-400">{Math.round(it.score)}</span>}]} />
      )}
      {tab === "Brand" && <PacksTab businessId={id} businessName={prospect.name} mode="brand" entity="BrandPack" generateFn={generateBrandPacks} accent="text-pink-400" />}
      {tab === "Website" && <PacksTab businessId={id} businessName={prospect.name} mode="website" entity="WebsitePack" generateFn={generateWebsitePacks} accent="text-cyan-400" />}
      {tab === "Marketing" && <PacksTab businessId={id} businessName={prospect.name} mode="marketing" entity="MarketingPack" generateFn={generateMarketingPacks} accent="text-amber-400" />}
      {tab === "Generators" && (
        <DisplayTab businessId={id} entity="BuildProject" title="Generator Chain Compositions"
          columns={[
            { key: "status", label: "Status", render: (it) => <StatusBadge status={it.status} /> },
            { key: "generator_chain", label: "Chain", render: (it) => (
              <span className="text-xs text-white/70">{(it.generator_chain || []).join(" → ")}</span>
            )},
            { key: "preview_url", label: "Preview", render: (it) => it.preview_url ? <a href={it.preview_url} target="_blank" rel="noreferrer" className="text-lime-400 hover:underline">Open ↗</a> : "—" },
          ]}
          renderPanel={(items) => (
            <Panel title="Generator Chain Compositions">
              {items.length === 0 ? <p className="text-sm text-white/40">No build projects yet. Use the Build tab to compose a generator chain.</p> : (
                <div className="space-y-3">
                  {items.map((b) => (
                    <div key={b.id} className="rounded-lg border border-white/10 bg-zinc-950 p-3">
                      <div className="flex items-center gap-2"><StatusBadge status={b.status} /><span className="text-xs text-white/40">{new Date(b.created_date).toLocaleString()}</span></div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {(b.generator_chain || []).map((g, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/70">{g}{i < (b.generator_chain || []).length - 1 && <span className="text-white/30">→</span>}</span>
                        ))}
                      </div>
                      {b.preview_url && <a href={b.preview_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-lime-400 hover:underline">Open preview ↗</a>}
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}
        />
      )}
      {tab === "Build" && <BuildTab businessId={id} businessName={prospect.name} />}
      {tab === "QA" && <QATab businessId={id} />}
      {tab === "Proposal" && (
        <DisplayTab businessId={id} entity="ProposalPackage" title="Proposal Packages"
          columns={[
            { key: "status", label: "Status", render: (it) => <StatusBadge status={it.status} /> },
            { key: "audit_summary", label: "Audit Summary", render: (it) => <span className="text-xs text-white/60">{(it.audit_summary || "").slice(0, 120)}…</span> },
            { key: "opportunity_summary", label: "Opportunity", render: (it) => <span className="text-xs text-white/60">{(it.opportunity_summary || "").slice(0, 120)}…</span> },
          ]}
          renderPanel={(items) => (
            <Panel title="Proposal Packages">
              {items.length === 0 ? <p className="text-sm text-white/40">No proposals yet. Use the Build tab → Generate Proposal.</p> : (
                <div className="space-y-3">
                  {items.map((p) => (
                    <div key={p.id} className="rounded-lg border border-white/10 bg-zinc-950 p-3">
                      <div className="flex items-center gap-2"><StatusBadge status={p.status} /><span className="text-xs text-white/40">{new Date(p.created_date).toLocaleString()}</span></div>
                      <div className="mt-2"><div className="text-xs font-semibold uppercase text-white/40">Audit Summary</div><p className="text-sm text-white/70">{p.audit_summary}</p></div>
                      <div className="mt-2"><div className="text-xs font-semibold uppercase text-white/40">Opportunity Summary</div><p className="text-sm text-white/70">{p.opportunity_summary}</p></div>
                      {(p.offer_options || []).length > 0 && (
                        <div className="mt-2"><div className="text-xs font-semibold uppercase text-white/40">Offer Options</div><ul className="mt-1 space-y-0.5">{p.offer_options.map((o,i)=><li key={i} className="text-sm text-white/70">• {o}</li>)}</ul></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}
        />
      )}
      {tab === "Experiments" && (
        <DisplayTab businessId={id} entity="Experiment" title="Experiments"
          columns={[
            { key: "hypothesis", label: "Hypothesis" },
            { key: "tactic_name", label: "Tactic" },
            { key: "channel", label: "Channel" },
            { key: "status", label: "Status", render: (it) => <StatusBadge status={it.status} /> },
            { key: "verdict", label: "Verdict", render: (it) => <span className="text-xs text-white/60">{it.verdict || "—"}</span> },
          ]}
        />
      )}

      {tab === "Receipts" && (
        <Panel title="Receipts for this prospect">
          {receipts.length === 0 ? <p className="text-sm text-slate-500">No receipts yet.</p> : (
            <div className="space-y-2">
              {receipts.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
                  <StatusBadge status={r.status} />
                  <div className="min-w-0 flex-1"><div className="truncate text-sm text-slate-200">{r.action}</div><div className="truncate text-xs text-slate-500">{r.agent_or_workflow}</div></div>
                  <span className="text-xs text-slate-600">{new Date(r.created_date).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 text-slate-500" />
      <div><div className="text-xs text-slate-500">{label}</div><div className="text-sm text-slate-200">{value}</div></div>
    </div>
  );
}