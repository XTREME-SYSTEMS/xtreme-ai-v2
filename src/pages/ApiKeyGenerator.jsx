import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  Key, Copy, Check, Trash2, Plus, Eye, EyeOff, Activity, Brain,
  Shield, Zap, RefreshCw, AlertCircle, CheckCircle, XCircle, Clock,
  Stethoscope, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const KEY_TYPES = [
  {
    value: "vision_cortex",
    label: "Vision Cortex",
    icon: Brain,
    color: "text-violet-400",
    border: "border-violet-400/40",
    bg: "bg-violet-400/5",
    desc: "Full autonomous brain — diagnostics, heal, harden, optimize. Has access to all systems including XPS catalog, prompt library, lead engine, and bid engine.",
    permissions: ["all", "diagnostics", "heal", "harden", "optimize", "manage", "xps_catalog", "prompt_library", "lead_engine", "bid_engine"],
  },
  {
    value: "admin",
    label: "Admin",
    icon: Shield,
    color: "text-amber-400",
    border: "border-amber-400/40",
    bg: "bg-amber-400/5",
    desc: "Full read/write access to all entities, functions, and system operations.",
    permissions: ["all"],
  },
  {
    value: "user",
    label: "User",
    icon: Key,
    color: "text-cyan-400",
    border: "border-cyan-400/40",
    bg: "bg-cyan-400/5",
    desc: "Read-only access to public data. Limited to non-sensitive operations.",
    permissions: ["read_public"],
  },
];

export default function ApiKeyGenerator() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState({ key_name: "", key_type: "vision_cortex" });
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState({});
  const [diagnostic, setDiagnostic] = useState(null);
  const [runningDiag, setRunningDiag] = useState(false);

  useEffect(() => { loadKeys(); }, []);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const result = await base44.entities.ApiKey.list("-created_date", 50);
      setKeys(result);
    } catch (e) {
      console.error("Failed to load keys:", e);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newKey.key_name.trim()) return;
    setCreating(true);
    try {
      const res = await base44.functions.invoke("generateApiKey", {
        key_name: newKey.key_name,
        key_type: newKey.key_type,
      });
      setGeneratedKey(res.data);
      setNewKey({ key_name: "", key_type: "vision_cortex" });
      setShowCreate(false);
      await loadKeys();
    } catch (e) {
      console.error("Failed to create key:", e);
    }
    setCreating(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this API key? This cannot be undone.")) return;
    try {
      await base44.entities.ApiKey.delete(id);
      await loadKeys();
    } catch (e) {
      console.error("Failed to delete key:", e);
    }
  };

  const handleToggle = async (key) => {
    try {
      await base44.entities.ApiKey.update(key.id, { active: !key.active });
      await loadKeys();
    } catch (e) {
      console.error("Failed to toggle key:", e);
    }
  };

  const copyKey = (keyValue) => {
    navigator.clipboard.writeText(keyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runDiagnostics = async (keyId) => {
    setRunningDiag(true);
    setDiagnostic(null);
    try {
      const res = await base44.functions.invoke("visionCortexDiagnostics", {
        auto_fix: true,
        api_key_id: keyId,
      });
      setDiagnostic(res.data);
    } catch (e) {
      setDiagnostic({ error: e.message });
    }
    setRunningDiag(false);
  };

  const toggleKeyVisibility = (id) => {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Key className="h-6 w-6 text-amber-400" />
            API Key Generator
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Generate and manage API keys for external access. Vision Cortex keys have full autonomous diagnostic and healing capabilities.
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-amber-400 text-black hover:bg-amber-400/90 font-semibold"
        >
          <Plus className="h-4 w-4 mr-1" />
          Generate New Key
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="border-amber-400/30 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white">Generate New API Key</CardTitle>
            <CardDescription className="text-white/50">
              Choose a key type and name. The key will be shown once — save it securely.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Key Type Selection */}
            <div>
              <Label className="text-white/70 mb-2 block">Key Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {KEY_TYPES.map((kt) => {
                  const Icon = kt.icon;
                  const selected = newKey.key_type === kt.value;
                  return (
                    <button
                      key={kt.value}
                      onClick={() => setNewKey({ ...newKey, key_type: kt.value })}
                      className={cn(
                        "text-left p-4 rounded-xl border-2 transition-all",
                        selected
                          ? cn(kt.border, kt.bg, "ring-2 ring-offset-0")
                          : "border-white/10 bg-zinc-950 hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={cn("h-5 w-5", selected ? kt.color : "text-white/40")} />
                        <span className={cn("font-semibold", selected ? kt.color : "text-white/70")}>
                          {kt.label}
                        </span>
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed">{kt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Key Name */}
            <div>
              <Label className="text-white/70 mb-1.5 block">Key Name</Label>
              <Input
                value={newKey.key_name}
                onChange={(e) => setNewKey({ ...newKey, key_name: e.target.value })}
                placeholder="e.g. Vision Cortex Production, External Integrations"
                className="bg-zinc-950 border-white/10 text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                disabled={!newKey.key_name.trim() || creating}
                className="bg-amber-400 text-black hover:bg-amber-400/90 font-semibold"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
                Generate Key
              </Button>
              <Button
                onClick={() => setShowCreate(false)}
                variant="outline"
                className="border-white/10 text-white/60 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Key Display */}
      {generatedKey && (
        <Card className="border-emerald-400/40 bg-emerald-400/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-emerald-400 mb-1">Key Generated Successfully</h3>
                <p className="text-xs text-white/50 mb-3">
                  Save this key securely — it will not be shown again. You can copy it now.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-zinc-950 border border-white/10 px-3 py-2 text-sm text-amber-400 font-mono break-all">
                    {generatedKey.key_value}
                  </code>
                  <Button
                    size="sm"
                    onClick={() => copyKey(generatedKey.key_value)}
                    className="bg-amber-400 text-black hover:bg-amber-400/90"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {generatedKey.permissions.map((p) => (
                    <span key={p} className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-white/50 font-mono">
                      {p}
                    </span>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setGeneratedKey(null)}
                  className="mt-3 text-white/40 hover:text-white"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnostic Report */}
      {diagnostic && (
        <Card className="border-violet-400/30 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-violet-400" />
              Vision Cortex Diagnostic Report
            </CardTitle>
            <CardDescription className="text-white/50">
              {diagnostic.summary || diagnostic.error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {diagnostic.error ? (
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-4 w-4" />
                {diagnostic.error}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Score */}
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex h-20 w-20 items-center justify-center rounded-full border-4 text-2xl font-bold",
                    diagnostic.overall_score >= 80 ? "border-emerald-400 text-emerald-400" :
                    diagnostic.overall_score >= 50 ? "border-amber-400 text-amber-400" :
                    "border-red-400 text-red-400"
                  )}>
                    {diagnostic.overall_score}
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">
                      {diagnostic.status === 'healthy' && '✓ System Healthy'}
                      {diagnostic.status === 'warning' && '⚠ Warnings Detected'}
                      {diagnostic.status === 'critical' && '✗ Critical Issues'}
                    </div>
                    <div className="text-sm text-white/50">
                      {diagnostic.total_checks} checks · {diagnostic.issues_found} issues · {diagnostic.critical_issues} critical · {diagnostic.auto_fixed} auto-fixed
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {diagnostic.actions && diagnostic.actions.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-semibold uppercase text-white/40">Auto-Actions Taken</div>
                    {diagnostic.actions.map((a, i) => (
                      <div key={i} className="text-xs text-amber-400 font-mono bg-amber-400/5 border border-amber-400/20 rounded px-2 py-1">
                        {a}
                      </div>
                    ))}
                  </div>
                )}

                {/* Checks */}
                <div className="space-y-1.5 max-h-96 overflow-y-auto">
                  {diagnostic.checks.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      {c.status === 'pass' && <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />}
                      {c.status === 'warn' && <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />}
                      {c.status === 'fail' && <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />}
                      {c.status === 'pending' && <Clock className="h-4 w-4 text-white/30 mt-0.5 shrink-0" />}
                      <div className="flex-1">
                        <span className="text-white/70 font-medium">{c.check_name}</span>
                        {c.auto_fixed && <span className="ml-2 text-xs text-emerald-400">(auto-fixed)</span>}
                        <span className="text-white/40 ml-2">— {c.details}</span>
                        {c.remediation && (
                          <div className="text-xs text-amber-400/70 mt-0.5">→ {c.remediation}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Keys List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
          </div>
        ) : keys.length === 0 ? (
          <Card className="border-white/10 bg-zinc-900">
            <CardContent className="pt-6 text-center">
              <Key className="h-10 w-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/50">No API keys generated yet. Click "Generate New Key" to create one.</p>
            </CardContent>
          </Card>
        ) : (
          keys.map((key) => {
            const kt = KEY_TYPES.find((t) => t.value === key.key_type) || KEY_TYPES[0];
            const Icon = kt.icon;
            const isVisible = visibleKeys[key.id];
            return (
              <Card key={key.id} className={cn("border-white/10 bg-zinc-900", !key.active && "opacity-50")}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg border", kt.border, kt.bg)}>
                      <Icon className={cn("h-5 w-5", kt.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{key.key_name}</span>
                        <span className={cn("text-xs font-mono px-1.5 py-0.5 rounded", kt.bg, kt.color, "border", kt.border)}>
                          {key.key_type}
                        </span>
                        {key.active ? (
                          <span className="text-xs text-emerald-400 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active
                          </span>
                        ) : (
                          <span className="text-xs text-white/30 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-white/30" /> Inactive
                          </span>
                        )}
                      </div>

                      {/* Key Value */}
                      <div className="flex items-center gap-2 mt-2">
                        <code className="flex-1 rounded-md bg-zinc-950 border border-white/10 px-2.5 py-1.5 text-sm text-white/60 font-mono truncate">
                          {isVisible ? key.key_value : `${key.key_prefix}•••••••••••••••••••••••`}
                        </code>
                        <button
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="text-white/40 hover:text-white p-1.5"
                        >
                          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => copyKey(key.key_value)}
                          className="text-white/40 hover:text-amber-400 p-1.5"
                        >
                          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Permissions */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {key.permissions?.map((p) => (
                          <span key={p} className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] text-white/40 font-mono">
                            {p}
                          </span>
                        ))}
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-white/30">
                        {key.created_by_email && <span>Created by {key.created_by_email}</span>}
                        {key.last_used && (
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            Last used {new Date(key.last_used).toLocaleDateString()}
                          </span>
                        )}
                        {key.last_diagnostic_report && (
                          <span className="flex items-center gap-1 text-violet-400/60">
                            <Brain className="h-3 w-3" />
                            Score: {key.last_diagnostic_report.overall_score}/100
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5">
                      {key.key_type === 'vision_cortex' && key.active && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runDiagnostics(key.id)}
                          disabled={runningDiag}
                          className="border-violet-400/40 text-violet-400 hover:bg-violet-400/10"
                        >
                          {runningDiag ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Stethoscope className="h-3.5 w-3.5" />}
                          <span className="ml-1">Run Diagnostics</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggle(key)}
                        className="text-white/40 hover:text-white"
                      >
                        {key.active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(key.id)}
                        className="text-red-400/60 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}