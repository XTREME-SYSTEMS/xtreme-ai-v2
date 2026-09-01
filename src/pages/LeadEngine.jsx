import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Facebook, MessageSquare, Building2, Search, Send, RefreshCw, Plus,
  Mail, Phone, MapPin, TrendingUp, Users, Target, CheckCircle, Clock,
  AlertCircle, Trash2, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import OrchestratorChat from "@/components/leadengine/OrchestratorChat";

const SOURCE_TYPES = [
  { value: "facebook_group", label: "Facebook Group", icon: Facebook, color: "text-blue-400" },
  { value: "craigslist", label: "Craigslist", icon: MessageSquare, color: "text-amber-400" },
  { value: "reddit", label: "Reddit", icon: MessageSquare, color: "text-orange-400" },
  { value: "building_dept", label: "Building Department", icon: Building2, color: "text-emerald-400" },
  { value: "company_directory", label: "Company Directory", icon: Search, color: "text-violet-400" },
  { value: "google_maps", label: "Google Maps", icon: MapPin, color: "text-rose-400" },
];

const DEFAULT_KEYWORDS = [
  "epoxy flooring", "garage floor", "polished concrete", "decorative concrete",
  "concrete countertop", "driveway", "patio", "concrete leveling",
];

export default function LeadEngine() {
  const [sources, setSources] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [sending, setSending] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [filter, setFilter] = useState("all");
  const [discovering, setDiscovering] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, companies: 0, serviceRequests: 0 });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [srcRes, leadRes] = await Promise.all([
        base44.entities.LeadSource.list("-created_date", 50),
        base44.entities.ScrapedLead.list("-created_date", 100),
      ]);
      setSources(srcRes || []);
      setLeads(leadRes || []);
      const allLeads = leadRes || [];
      setStats({
        total: allLeads.length,
        new: allLeads.filter(l => l.status === "new").length,
        contacted: allLeads.filter(l => ["outreach_sent", "follow_up_1", "follow_up_2", "follow_up_3"].includes(l.status)).length,
        companies: allLeads.filter(l => l.lead_type === "company").length,
        serviceRequests: allLeads.filter(l => l.lead_type === "service_request").length,
      });
    } catch (err) {
      console.error("Failed to load lead engine data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleScrape = async (sourceId = null) => {
    try {
      setScraping(true);
      await base44.functions.invoke("scrapeLeadSources", {
        source_id: sourceId,
        max_sources: 5,
      });
      await loadData();
    } catch (err) {
      console.error("Scrape failed:", err);
      alert("Scrape failed: " + (err?.response?.data?.error || err?.message || "unknown error"));
    } finally {
      setScraping(false);
    }
  };

  const handleSendOutreach = async (leadId = null, followUpOnly = false) => {
    try {
      setSending(true);
      await base44.functions.invoke("sendLeadOutreach", {
        lead_id: leadId,
        template_type: "hello",
        max_sends: 10,
        follow_up_only: followUpOnly,
      });
      await loadData();
    } catch (err) {
      console.error("Outreach failed:", err);
      alert("Outreach failed: " + (err?.response?.data?.error || err?.message || "unknown error"));
    } finally {
      setSending(false);
    }
  };

  const handleDiscoverSources = async () => {
    try {
      setDiscovering(true);
      const res = await base44.functions.invoke("discoverSourcesRecursive", {
        max_sources: 20,
        max_depth: 2,
        verify_urls: true,
      });
      await loadData();
      alert(`Discovery complete: ${res?.sources_discovered || 0} new sources found.`);
    } catch (err) {
      console.error("Discovery failed:", err);
      alert("Discovery failed: " + (err?.response?.data?.error || err?.message || "unknown error"));
    } finally {
      setDiscovering(false);
    }
  };

  const handleEnrichLeads = async () => {
    try {
      setEnriching(true);
      const res = await base44.functions.invoke("enrichHotLead", {
        triggered_by: "manual",
      });
      await loadData();
      alert(`Enrichment complete: ${res?.nodes_created || 0} graph nodes created.`);
    } catch (err) {
      console.error("Enrichment failed:", err);
      alert("Enrichment failed: " + (err?.response?.data?.error || err?.message || "unknown error"));
    } finally {
      setEnriching(false);
    }
  };

  const filteredLeads = filter === "all" ? leads :
    filter === "service_request" ? leads.filter(l => l.lead_type === "service_request") :
    filter === "company" ? leads.filter(l => l.lead_type === "company") :
    filter === "permit" ? leads.filter(l => l.lead_type === "permit_project") :
    filter === "new" ? leads.filter(l => l.status === "new") :
    leads;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-400" />
            Lead Engine
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Autonomous scraping + outreach system — finds leads from social media, building departments & company directories
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleScrape()}
            disabled={scraping}
            className="bg-amber-400 text-black hover:bg-amber-300"
          >
            {scraping ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            {scraping ? "Scraping..." : "Scrape All Sources"}
          </Button>
          <Button
            onClick={handleDiscoverSources}
            disabled={discovering}
            variant="outline"
            className="border-violet-400/50 text-violet-400 hover:bg-violet-400/10"
          >
            {discovering ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            {discovering ? "Discovering..." : "Discover Sources"}
          </Button>
          <Button
            onClick={handleEnrichLeads}
            disabled={enriching}
            variant="outline"
            className="border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10"
          >
            {enriching ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Target className="h-4 w-4 mr-2" />}
            {enriching ? "Enriching..." : "Enrich Hot Leads"}
          </Button>
          <Button
            onClick={() => handleSendOutreach(null, false)}
            disabled={sending}
            variant="outline"
            className="border-amber-400 text-black hover:bg-amber-400/10"
          >
            {sending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {sending ? "Sending..." : "Send Outreach"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard icon={Target} label="Total Leads" value={stats.total} color="text-amber-400" />
        <StatCard icon={Clock} label="New" value={stats.new} color="text-blue-400" />
        <StatCard icon={CheckCircle} label="Contacted" value={stats.contacted} color="text-emerald-400" />
        <StatCard icon={Users} label="Companies" value={stats.companies} color="text-violet-400" />
        <StatCard icon={MessageSquare} label="Service Requests" value={stats.serviceRequests} color="text-rose-400" />
      </div>

      <Tabs defaultValue="leads" className="w-full">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="leads" className="data-[state=active]:bg-amber-400 data-[state=active]:text-black">
            Leads ({leads.length})
          </TabsTrigger>
          <TabsTrigger value="sources" className="data-[state=active]:bg-amber-400 data-[state=active]:text-black">
            Sources ({sources.length})
          </TabsTrigger>
        </TabsList>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "All" },
              { value: "service_request", label: "Service Requests" },
              { value: "company", label: "Companies" },
              { value: "permit", label: "Permits" },
              { value: "new", label: "New Only" },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f.value
                    ? "bg-amber-400 text-black"
                    : "border border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Leads list */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
              <Target className="h-12 w-12 mx-auto text-white/20 mb-3" />
              <p className="text-white/40">No leads yet. Add sources and run a scrape to find leads.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLeads.map(lead => (
                <LeadCard key={lead.id} lead={lead} onSendOutreach={handleSendOutreach} sending={sending} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddSource(true)} className="bg-amber-400 text-black hover:bg-amber-300">
              <Plus className="h-4 w-4 mr-2" /> Add Source
            </Button>
          </div>

          {sources.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
              <Search className="h-12 w-12 mx-auto text-white/20 mb-3" />
              <p className="text-white/40 mb-4">No sources configured yet. Add a Facebook group, Craigslist city, or building department to start scraping.</p>
              <Button onClick={() => setShowAddSource(true)} className="bg-amber-400 text-black hover:bg-amber-300">
                <Plus className="h-4 w-4 mr-2" /> Add Your First Source
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map(source => (
                <SourceCard key={source.id} source={source} onScrape={handleScrape} scraping={scraping} onChanged={loadData} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Source Dialog */}
      <AddSourceDialog open={showAddSource} onOpenChange={setShowAddSource} onAdded={loadData} />

      {/* ORCHESTRATOR chat — ask "what's hot today?" */}
      <OrchestratorChat />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", color)} />
        <span className="text-xs text-white/50">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function LeadCard({ lead, onSendOutreach, sending }) {
  const [expanded, setExpanded] = useState(false);
  const typeIcon = lead.lead_type === "company" ? Users :
                   lead.lead_type === "permit_project" ? Building2 : MessageSquare;
  const TypeIcon = typeIcon;
  const statusColor = lead.status === "new" ? "text-blue-400 bg-blue-400/10" :
                      lead.status === "outreach_sent" ? "text-amber-400 bg-amber-400/10" :
                      lead.status?.startsWith("follow_up") ? "text-violet-400 bg-violet-400/10" :
                      lead.status === "responded" || lead.status === "won" ? "text-emerald-400 bg-emerald-400/10" :
                      lead.status === "bounced" ? "text-red-400 bg-red-400/10" :
                      "text-white/40 bg-white/5";

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-amber-400/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TypeIcon className="h-4 w-4 shrink-0 text-white/40" />
            <h3 className="font-semibold text-white truncate">{lead.title}</h3>
            <span className={cn("rounded px-2 py-0.5 text-[10px] font-medium uppercase", statusColor)}>
              {lead.status?.replace(/_/g, " ")}
            </span>
            {lead.intent_tier && lead.intent_tier !== "warm" && (
              <span className={cn(
                "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                lead.intent_tier === "very_hot" ? "bg-red-400/20 text-red-400" :
                lead.intent_tier === "hot" ? "bg-orange-400/20 text-orange-400" :
                lead.intent_tier === "partner" ? "bg-violet-400/20 text-violet-400" :
                lead.intent_tier === "project" ? "bg-cyan-400/20 text-cyan-400" :
                lead.intent_tier === "property" ? "bg-blue-400/20 text-blue-400" :
                "bg-white/5 text-white/40"
              )}>
                {lead.intent_tier.replace(/_/g, " ")}
              </span>
            )}
            {lead.opportunity_type && lead.opportunity_type !== "direct_demand" && (
              <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[9px] text-amber-400/80">
                {lead.opportunity_type.replace(/_/g, " ")}
              </span>
            )}
            {lead.review_status === "flagged" && (
              <span className="rounded bg-yellow-400/20 px-1.5 py-0.5 text-[9px] text-yellow-400">⚠ Review</span>
            )}
            {lead.enrichment_status === "enriched" && (
              <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[9px] text-emerald-400">Graph</span>
            )}
          </div>
          {lead.description && (
            <p className={cn("text-sm text-white/60", !expanded && "line-clamp-2")}>
              {lead.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/40">
            {lead.contact_name && <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {lead.contact_name}</span>}
            {lead.contact_email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {lead.contact_email}</span>}
            {lead.contact_phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.contact_phone}</span>}
            {lead.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {lead.location}</span>}
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Intent: {lead.intent_score || 0}
            </span>
            <span className="text-white/30">from {lead.source_name || lead.source_type}</span>
          </div>
          {lead.matched_keywords?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {lead.matched_keywords.map((kw, i) => (
                <span key={i} className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-400">{kw}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          {lead.lead_type === "company" && lead.contact_email && lead.status === "new" && (
            <Button
              size="sm"
              onClick={() => onSendOutreach(lead.id)}
              disabled={sending}
              className="bg-amber-400 text-black hover:bg-amber-300 h-7 text-xs"
            >
              <Send className="h-3 w-3 mr-1" /> Email
            </Button>
          )}
          {lead.description && lead.description.length > 100 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="h-7 text-xs text-white/50 hover:text-white"
            >
              {expanded ? "Less" : "More"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SourceCard({ source, onScrape, scraping, onChanged }) {
  const sourceType = SOURCE_TYPES.find(t => t.value === source.source_type);
  const TypeIcon = sourceType?.icon || Search;

  const handleDelete = async () => {
    if (!confirm(`Delete source "${source.source_name}"?`)) return;
    try {
      await base44.entities.LeadSource.delete(source.id);
      onChanged();
    } catch (err) {
      alert("Failed to delete: " + (err?.message || "unknown error"));
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-amber-400/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TypeIcon className={cn("h-4 w-4 shrink-0", sourceType?.color || "text-white/40")} />
            <h3 className="font-semibold text-white">{source.source_name}</h3>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-white/50">
              {sourceType?.label || source.source_type}
            </span>
            {source.active ? (
              <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[10px] text-emerald-400">Active</span>
            ) : (
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">Paused</span>
            )}
          </div>
          <a href={source.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-400 hover:underline truncate block">
            {source.source_url}
          </a>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/40">
            {source.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {source.location}</span>}
            <span>Scrape: {source.scrape_frequency}</span>
            <span>Last: {source.last_result_count || 0} leads</span>
            {source.last_scraped && <span>{new Date(source.last_scraped).toLocaleDateString()}</span>}
          </div>
          {source.service_keywords?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {source.service_keywords.slice(0, 5).map((kw, i) => (
                <span key={i} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50">{kw}</span>
              ))}
              {source.service_keywords.length > 5 && (
                <span className="text-[10px] text-white/30">+{source.service_keywords.length - 5} more</span>
              )}
            </div>
          )}
          {source.last_error && (
            <div className="flex items-center gap-1 mt-2 text-xs text-red-400">
              <AlertCircle className="h-3 w-3" /> {source.last_error}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <Button
            size="sm"
            onClick={() => onScrape(source.id)}
            disabled={scraping}
            variant="outline"
            className="border-amber-400/50 text-amber-400 hover:bg-amber-400/10 h-7 text-xs"
          >
            {scraping ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Search className="h-3 w-3 mr-1" />}
            Scrape
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            className="h-7 text-xs text-red-400/60 hover:text-red-400"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddSourceDialog({ open, onOpenChange, onAdded }) {
  const [form, setForm] = useState({
    source_type: "facebook_group",
    source_name: "",
    source_url: "",
    location: "",
    scrape_frequency: "daily",
    keywordsText: DEFAULT_KEYWORDS.join(", "),
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.source_name || !form.source_url) {
      alert("Please fill in the source name and URL");
      return;
    }
    try {
      setSaving(true);
      const user = await base44.auth.me();
      await base44.entities.LeadSource.create({
        client_email: user.email,
        source_type: form.source_type,
        source_name: form.source_name,
        source_url: form.source_url,
        location: form.location,
        scrape_frequency: form.scrape_frequency,
        service_keywords: form.keywordsText.split(",").map(k => k.trim()).filter(Boolean),
        active: true,
      });
      setForm({
        source_type: "facebook_group",
        source_name: "",
        source_url: "",
        location: "",
        scrape_frequency: "daily",
        keywordsText: DEFAULT_KEYWORDS.join(", "),
      });
      onOpenChange(false);
      onAdded();
    } catch (err) {
      alert("Failed to add source: " + (err?.message || "unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-zinc-900 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Add Lead Source</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-white/70">Source Type</Label>
            <Select value={form.source_type} onValueChange={(v) => setForm({ ...form, source_type: v })}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10">
                {SOURCE_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value} className="text-white hover:bg-white/10">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-white/70">Source Name</Label>
            <Input
              value={form.source_name}
              onChange={(e) => setForm({ ...form, source_name: e.target.value })}
              placeholder="e.g. DFW Epoxy Flooring Facebook Group"
              className="bg-white/5 border-white/10 text-white mt-1 placeholder:text-white/30"
            />
          </div>
          <div>
            <Label className="text-white/70">Source URL</Label>
            <Input
              value={form.source_url}
              onChange={(e) => setForm({ ...form, source_url: e.target.value })}
              placeholder="https://www.facebook.com/groups/..."
              className="bg-white/5 border-white/10 text-white mt-1 placeholder:text-white/30"
            />
          </div>
          <div>
            <Label className="text-white/70">Location (city, state)</Label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Dallas, TX"
              className="bg-white/5 border-white/10 text-white mt-1 placeholder:text-white/30"
            />
          </div>
          <div>
            <Label className="text-white/70">Service Keywords (comma-separated)</Label>
            <Textarea
              value={form.keywordsText}
              onChange={(e) => setForm({ ...form, keywordsText: e.target.value })}
              placeholder="epoxy flooring, garage floor, polished concrete..."
              className="bg-white/5 border-white/10 text-white mt-1 placeholder:text-white/30"
              rows={3}
            />
          </div>
          <div>
            <Label className="text-white/70">Scrape Frequency</Label>
            <Select value={form.scrape_frequency} onValueChange={(v) => setForm({ ...form, scrape_frequency: v })}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10">
                <SelectItem value="daily" className="text-white hover:bg-white/10">Daily</SelectItem>
                <SelectItem value="weekly" className="text-white hover:bg-white/10">Weekly</SelectItem>
                <SelectItem value="monthly" className="text-white hover:bg-white/10">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-white/60">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-amber-400 text-black hover:bg-amber-300">
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            {saving ? "Adding..." : "Add Source"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}