import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Panel, LoadingButton } from "@/components/ui";
import {
  CheckCircle2, Loader2, AlertCircle, Edit3, RefreshCw, Sparkles,
  ChevronDown, Play, X, Type, Globe, Palette, FileText, Image as ImageIcon,
  Code, Quote, BarChart3, Phone, FileCheck, Shield, Wand2,
} from "lucide-react";

const ITEM_ICONS = {
  business_name: Type, domain: Globe, logo: Palette, tagline: Sparkles,
  written_copy: FileText, photos: ImageIcon, source_code: Code,
  testimonials: Quote, facts_claims: BarChart3, contact_info: Phone,
  privacy_terms: FileCheck, overall_branding: Shield,
};

const STATUS_CONFIG = {
  pending: { color: "text-white/40", bg: "bg-white/5", border: "border-white/10", label: "Pending", icon: AlertCircle },
  generating: { color: "text-lime-400", bg: "bg-lime-400/5", border: "border-lime-400/30", label: "AI Generating...", icon: Loader2 },
  ready: { color: "text-amber-400", bg: "bg-amber-400/5", border: "border-amber-400/30", label: "Ready — Review", icon: AlertCircle },
  approved: { color: "text-lime-400", bg: "bg-lime-400/5", border: "border-lime-400/30", label: "Approved", icon: CheckCircle2 },
  needs_revision: { color: "text-rose-400", bg: "bg-rose-400/5", border: "border-rose-400/30", label: "Needs Revision", icon: AlertCircle },
  manual: { color: "text-blue-400", bg: "bg-blue-400/5", border: "border-blue-400/30", label: "Manual Edit", icon: Edit3 },
};

export default function RebrandChecklist({ project, onUpdated }) {
  const [initing, setIniting] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(null);
  const [runningAll, setRunningAll] = useState(false);
  const [expandedKey, setExpandedKey] = useState(null);
  const [editingKey, setEditingKey] = useState(null);
  const [editText, setEditText] = useState("");
  const [reviseKey, setReviseKey] = useState(null);
  const [reviseText, setReviseText] = useState("");

  const checklist = project?.rebrand_checklist || [];

  const approvedCount = checklist.filter(c => c.status === "approved" || c.status === "manual").length;
  const totalCount = checklist.length;
  const progress = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  const initChecklist = async () => {
    setIniting(true);
    try {
      const res = await base44.functions.invoke("rebrandAssistant", {
        action: "init_checklist", project_id: project.id,
      });
      onUpdated?.();
    } catch (e) { alert(e.message); }
    setIniting(false);
  };

  const generateItem = async (key, feedback) => {
    setGeneratingKey(key);
    try {
      await base44.functions.invoke("rebrandAssistant", {
        action: "generate_item", project_id: project.id,
        item_key: key, revision_feedback: feedback,
      });
      onUpdated?.();
    } catch (e) { alert(e.message); }
    setGeneratingKey(null);
  };

  const approveItem = async (key) => {
    try {
      await base44.functions.invoke("rebrandAssistant", {
        action: "approve_item", project_id: project.id, item_key: key,
      });
      onUpdated?.();
    } catch (e) { alert(e.message); }
  };

  const reviseItem = async (key) => {
    try {
      await base44.functions.invoke("rebrandAssistant", {
        action: "revise_item", project_id: project.id,
        item_key: key, feedback: reviseText,
      });
      setReviseKey(null);
      setReviseText("");
      onUpdated?.();
    } catch (e) { alert(e.message); }
  };

  const manualEdit = async (key) => {
    try {
      await base44.functions.invoke("rebrandAssistant", {
        action: "manual_edit_item", project_id: project.id,
        item_key: key, replacement: editText,
      });
      setEditingKey(null);
      setEditText("");
      onUpdated?.();
    } catch (e) { alert(e.message); }
  };

  const runFullRebrand = async () => {
    setRunningAll(true);
    const pendingItems = checklist.filter(c => c.status === "pending" || c.status === "needs_revision");
    for (const item of pendingItems) {
      await generateItem(item.key, item.revision_feedback);
      await new Promise(r => setTimeout(r, 300));
    }
    setRunningAll(false);
  };

  if (checklist.length === 0) {
    return (
      <Panel title="Guided Rebrand Checklist">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Wand2 className="mb-3 h-10 w-10 text-lime-400/40" />
          <p className="text-sm font-medium text-white">No checklist initialized yet</p>
          <p className="mt-1 max-w-md text-xs text-white/40">
            Initialize the 12-element standardized rebrand checklist based on minimum-action legal compliance.
            The AI will guide you through each item, generate replacements, and let you approve or revise.
          </p>
          <LoadingButton onClick={initChecklist} loading={initing} variant="primary" className="mt-4">
            <Sparkles className="h-3.5 w-3.5" /> Initialize Checklist
          </LoadingButton>
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      title="Guided Rebrand Checklist"
      action={
        <span className="text-xs text-white/40">{approvedCount}/{totalCount} approved</span>
      }
    >
      {/* Progress bar */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-white/60">Rebrand Progress</span>
          <span className="font-mono text-lime-400">{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-lime-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="mb-4 flex items-center gap-2">
        <LoadingButton
          onClick={runFullRebrand}
          loading={runningAll}
          disabled={checklist.every(c => c.status === "approved" || c.status === "manual")}
          variant="primary"
          className="flex-1 justify-center"
        >
          <Play className="h-3.5 w-3.5" />
          {runningAll ? "AI Rebranding..." : "Start Full AI Rebrand"}
        </LoadingButton>
        <LoadingButton onClick={initChecklist} loading={initing} variant="ghost" className="text-xs">
          <RefreshCw className="h-3 w-3" /> Reset
        </LoadingButton>
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {checklist.map((item, idx) => {
          const Icon = ITEM_ICONS[item.key] || AlertCircle;
          const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
          const SIcon = sc.icon;
          const isGenerating = generatingKey === item.key || (runningAll && item.status === "generating");
          const isExpanded = expandedKey === item.key;

          return (
            <div key={item.key} className={`rounded-lg border ${sc.border} ${sc.bg} overflow-hidden`}>
              {/* Item header */}
              <button
                onClick={() => setExpandedKey(isExpanded ? null : item.key)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5"
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${sc.bg} ${sc.color}`}>
                  {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/30 font-mono">{idx + 1}.</span>
                    <span className="text-sm font-medium text-white truncate">{item.label}</span>
                  </div>
                  <div className="text-xs text-white/40 truncate">{item.description}</div>
                </div>
                <div className={`flex items-center gap-1 rounded-md border ${sc.border} px-1.5 py-0.5 text-[10px] ${sc.color}`}>
                  <SIcon className={`h-2.5 w-2.5 ${isGenerating ? "animate-spin" : ""}`} />
                  {sc.label}
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-white/30 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-white/5 px-3 py-3 space-y-2">
                  {/* Original */}
                  {item.original && (
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-0.5">Original</div>
                      <div className="rounded-md bg-black/50 px-2 py-1.5 text-xs text-white/60 whitespace-pre-wrap">
                        {item.original.length > 300 ? item.original.slice(0, 300) + "..." : item.original}
                      </div>
                    </div>
                  )}

                  {/* AI Replacement */}
                  {item.replacement && (
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-lime-400/60 mb-0.5">AI Replacement</div>
                      <div className="rounded-md border border-lime-400/20 bg-lime-400/5 px-2 py-1.5 text-xs text-white/90 whitespace-pre-wrap">
                        {item.replacement}
                      </div>
                    </div>
                  )}

                  {/* AI Notes */}
                  {item.ai_notes && (
                    <div className="flex items-start gap-1.5 text-xs text-white/50">
                      <Sparkles className="h-3 w-3 mt-0.5 shrink-0 text-lime-400/60" />
                      <span className="whitespace-pre-wrap">{item.ai_notes}</span>
                    </div>
                  )}

                  {/* Replacement data: logos */}
                  {item.replacement_data?.logos?.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {item.replacement_data.logos.map((logo, i) => (
                        <div key={i} className="rounded-md border border-white/10 bg-white p-1">
                          <img src={logo.url} alt={`Logo ${i+1}`} className="h-16 w-full object-contain" />
                          <div className="mt-0.5 text-center text-[9px] text-black/50">{logo.style}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Replacement data: images */}
                  {item.replacement_data?.images?.length > 0 && (
                    <div className="space-y-1.5">
                      {item.replacement_data.images.slice(0, 3).map((img, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-md border border-white/5 p-1.5">
                          <img src={img.new_url} alt="Replacement" className="h-12 w-12 rounded object-cover" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-white/70 truncate">{img.description || "Replacement image"}</div>
                            <div className="text-[10px] text-white/40 truncate">Original: {img.original_url}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Replacement data: content blocks */}
                  {item.replacement_data?.blocks?.length > 0 && (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {item.replacement_data.blocks.map((b, i) => (
                        <div key={i} className="rounded-md border border-white/5 p-2">
                          <div className="text-[10px] font-semibold text-lime-400/60">{b.section}</div>
                          <div className="mt-0.5 text-xs text-white/70 line-clamp-3">{b.new_text}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Revision feedback */}
                  {item.revision_feedback && (
                    <div className="rounded-md border border-rose-400/20 bg-rose-400/5 px-2 py-1.5 text-xs text-rose-300">
                      <span className="font-semibold">Revision feedback:</span> {item.revision_feedback}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {(item.status === "pending" || item.status === "needs_revision") && (
                      <LoadingButton
                        onClick={() => generateItem(item.key, item.revision_feedback)}
                        loading={isGenerating}
                        variant="primary"
                        className="text-xs px-2 py-1"
                      >
                        <Sparkles className="h-3 w-3" /> Generate with AI
                      </LoadingButton>
                    )}
                    {item.status === "ready" && (
                      <>
                        <button
                          onClick={() => approveItem(item.key)}
                          className="flex items-center gap-1 rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-1 text-xs text-lime-300 hover:bg-lime-400/20"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Approve
                        </button>
                        <button
                          onClick={() => { setReviseKey(item.key); setReviseText(item.revision_feedback || ""); }}
                          className="flex items-center gap-1 rounded-md border border-rose-400/30 bg-rose-400/10 px-2 py-1 text-xs text-rose-300 hover:bg-rose-400/20"
                        >
                          <X className="h-3 w-3" /> Revise
                        </button>
                      </>
                    )}
                    {(item.status === "approved" || item.status === "manual" || item.status === "ready") && (
                      <button
                        onClick={() => { setEditingKey(item.key); setEditText(item.replacement || ""); }}
                        className="flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-xs text-white/70 hover:bg-white/5"
                      >
                        <Edit3 className="h-3 w-3" /> Manual Edit
                      </button>
                    )}
                    {item.status === "approved" && (
                      <button
                        onClick={() => generateItem(item.key)}
                        className="flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-xs text-white/70 hover:bg-white/5"
                      >
                        <RefreshCw className="h-3 w-3" /> Regenerate
                      </button>
                    )}
                  </div>

                  {/* Revise form */}
                  {reviseKey === item.key && (
                    <div className="rounded-md border border-rose-400/20 bg-rose-400/5 p-2 space-y-2">
                      <textarea
                        value={reviseText}
                        onChange={e => setReviseText(e.target.value)}
                        placeholder="Tell the AI what to change..."
                        className="w-full rounded-md border border-white/10 bg-black px-2 py-1.5 text-xs text-white outline-none focus:border-rose-400/50"
                        rows={2}
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => reviseItem(item.key)}
                          className="rounded-md bg-rose-500/80 px-2 py-1 text-xs text-white hover:bg-rose-500"
                        >
                          Send to AI
                        </button>
                        <button
                          onClick={() => { setReviseKey(null); setReviseText(""); }}
                          className="rounded-md border border-white/15 px-2 py-1 text-xs text-white/60 hover:bg-white/5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Manual edit form */}
                  {editingKey === item.key && (
                    <div className="rounded-md border border-blue-400/20 bg-blue-400/5 p-2 space-y-2">
                      <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        placeholder="Enter your manual replacement..."
                        className="w-full rounded-md border border-white/10 bg-black px-2 py-1.5 text-xs text-white outline-none focus:border-blue-400/50"
                        rows={4}
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => manualEdit(item.key)}
                          className="rounded-md bg-blue-500/80 px-2 py-1 text-xs text-white hover:bg-blue-500"
                        >
                          Save Manual Edit
                        </button>
                        <button
                          onClick={() => { setEditingKey(null); setEditText(""); }}
                          className="rounded-md border border-white/15 px-2 py-1 text-xs text-white/60 hover:bg-white/5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}