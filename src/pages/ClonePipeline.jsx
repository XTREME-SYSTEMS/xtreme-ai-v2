import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import PipelineStepper from "@/components/pipeline/PipelineStepper";
import StepSearch from "@/components/pipeline/StepSearch";
import StepOriginalPreview from "@/components/pipeline/StepOriginalPreview";
import StepAuditReport from "@/components/pipeline/StepAuditReport";
import StepNameDomain from "@/components/pipeline/StepNameDomain";
import StepRebrandProgress from "@/components/pipeline/StepRebrandProgress";
import StepProvisioning from "@/components/pipeline/StepProvisioning";
import StepHardening from "@/components/pipeline/StepHardening";
import StepLiveSite from "@/components/pipeline/StepLiveSite";
import { Rocket, RefreshCw } from "lucide-react";

export default function ClonePipeline() {
  const [step, setStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [project, setProject] = useState(null);
  const [targetUrl, setTargetUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const unsubRef = useRef(null);

  // Subscribe to real-time project updates
  useEffect(() => {
    if (!project?.id) return;
    const unsub = base44.entities.CloneProject.subscribe((event) => {
      if (event.id === project.id) {
        setProject((prev) => event.type === "delete" ? null : { ...prev, ...event.data });
      }
    });
    unsubRef.current = unsub;
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [project?.id]);

  // Auto-advance step based on project state
  useEffect(() => {
    if (!project) return;
    const cs = project.current_step;
    const advance = (s) => { setStep(s); setMaxReached((prev) => Math.max(prev, s)); };
    if (cs === "scanned" && step === 2) advance(3);
    else if (cs === "generating_rebrand" && step === 4) advance(5);
    else if (cs === "provisioning" && step === 5) advance(6);
    else if (cs === "racing_to_rank" && step === 6) advance(7);
    // eslint-disable-next-line
  }, [project?.current_step]);

  const refreshProject = useCallback(async () => {
    if (!project?.id) return;
    try {
      const updated = await base44.entities.CloneProject.get(project.id);
      setProject(updated);
    } catch {}
  }, [project?.id]);

  // === Step 1 → 2: User selected a URL ===
  const handleSelectUrl = (url, ind, name) => {
    setTargetUrl(url);
    setIndustry(ind || "");
    setProject(null);
    setStep(2);
    setMaxReached(Math.max(maxReached, 2));
  };

  // === Step 2 → 3: Clone & Audit (legalScanClone) ===
  const handleClone = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("legalScanClone", {
        target_url: targetUrl,
        industry,
        business_name: "",
      });
      if (res?.data?.project_id) {
        const proj = await base44.entities.CloneProject.get(res.data.project_id);
        setProject(proj);
        // Stay on step 2 until scan completes (real-time will advance us)
      } else if (res?.data?.error) {
        setError(res.data.error);
      }
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  // === Step 3 → 4: View name recommendations ===
  const handleViewNames = () => {
    setStep(4);
    setMaxReached(Math.max(maxReached, 4));
  };

  // === Step 4 → 5: Approve name & generate rebrand ===
  const handleApproveName = async (name, domain) => {
    setBusy(true);
    setError("");
    try {
      await base44.functions.invoke("generateRebrandPackage", {
        project_id: project.id,
        selected_name: name,
        selected_domain: domain,
      });
      await refreshProject();
      setStep(5);
      setMaxReached(Math.max(maxReached, 5));
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  // === Step 5 → 6: Approve rebrand & provision ===
  const handleProvision = async () => {
    setBusy(true);
    setError("");
    try {
      await base44.functions.invoke("provisionApprovedClone", { project_id: project.id });
      await refreshProject();
      setStep(6);
      setMaxReached(Math.max(maxReached, 6));
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  // === Step 6 → 7: Harden ===
  const handleHarden = () => {
    setStep(7);
    setMaxReached(Math.max(maxReached, 7));
  };

  // === Step 7 → 8: View live site ===
  const handleViewLive = () => {
    setStep(8);
    setMaxReached(Math.max(maxReached, 8));
  };

  // === Restart ===
  const handleRestart = () => {
    setProject(null);
    setTargetUrl("");
    setIndustry("");
    setStep(1);
    setMaxReached(1);
    setError("");
  };

  const handleStepClick = (id) => {
    if (id <= maxReached) setStep(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl flex items-center gap-2">
            <Rocket className="h-6 w-6 text-lime-400" /> Clone Pipeline
          </h1>
          <p className="mt-1 text-sm text-white/50">End-to-end: search → clone → audit → rebrand → provision → harden → live</p>
        </div>
        {project && (
          <button onClick={refreshProject} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Stepper sidebar */}
        <div className="lg:sticky lg:top-0 lg:self-start">
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-3">
            <PipelineStepper
              currentStep={step}
              maxReachedStep={maxReached}
              onStepClick={handleStepClick}
              project={project}
            />
            {project && (
              <div className="mt-3 border-t border-white/10 pt-3 space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-white/40">Active Project</div>
                <div className="text-sm font-medium text-white truncate">{project.selected_name || targetUrl}</div>
                <div className="text-xs text-lime-400/70 capitalize">{(project.current_step || "").replace(/_/g, " ")}</div>
              </div>
            )}
          </div>
        </div>

        {/* Step content */}
        <div className="rounded-xl border border-white/10 bg-black p-6">
          {step === 1 && <StepSearch onSelect={handleSelectUrl} />}

          {step === 2 && (
            <StepOriginalPreview
              targetUrl={targetUrl}
              industry={industry}
              onClone={handleClone}
              scanning={busy || project?.current_step === "scanning"}
            />
          )}

          {step === 3 && project && (
            <StepAuditReport project={project} onNext={handleViewNames} />
          )}

          {step === 4 && project && (
            <StepNameDomain project={project} onApprove={handleApproveName} generating={busy} />
          )}

          {step === 5 && project && (
            <StepRebrandProgress project={project} onNext={handleProvision} />
          )}

          {step === 6 && project && (
            <StepProvisioning
              project={project}
              onNext={handleHarden}
              provisioning={busy || ["provisioning", "buying_domain", "seo_aeo_optimizing"].includes(project.current_step)}
            />
          )}

          {step === 7 && project && (
            <StepHardening project={project} onNext={handleViewLive} />
          )}

          {step === 8 && project && (
            <StepLiveSite project={project} onRestart={handleRestart} />
          )}
        </div>
      </div>

      <style>{`.pipeline-input{width:100%;border-radius:0.5rem;border:1px solid hsl(0 0% 15%);background:#000;padding:0.5rem 0.75rem;font-size:0.875rem;color:#fff;outline:none}.pipeline-input:focus{border-color:hsl(84 100% 59%)}`}</style>
    </div>
  );
}