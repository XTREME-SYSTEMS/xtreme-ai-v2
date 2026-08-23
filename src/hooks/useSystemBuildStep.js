import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAutoBuild } from "@/lib/AutoBuildContext";

// Shared hook for system-build step pages (Architecture, DataModel, UiSystem,
// Codegen, Deploy). Encapsulates the generate → validate → retry → save flow
// and the approve → mark-visited → navigate flow so every step page behaves
// identically and gets auto-retry + validation error display for free.
//
// @param functionName — the backend function name to invoke
// @param fieldName — the AutoBuild field to save the result into (snake_case)
// @param stepKey — the current_step value to set after generation
export function useSystemBuildStep(functionName, fieldName, stepKey) {
  const autoBuild = useAutoBuild();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [approved, setApproved] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [judge, setJudge] = useState(null);
  const [regenerated, setRegenerated] = useState(false);
  const [compileErrors, setCompileErrors] = useState([]);
  const [compileValid, setCompileValid] = useState(null);

  const generate = useCallback(async (payload) => {
    const build = autoBuild.build;
    if (!build) return null;
    setGenerating(true);
    setError("");
    setValidationErrors([]);
    setWarnings([]);
    setJudge(null);
    setRegenerated(false);
    setCompileErrors([]);
    setCompileValid(null);

    const maxRetries = 3;
    for (let attemptNum = 1; attemptNum <= maxRetries; attemptNum++) {
      setAttempt(attemptNum);
      try {
        const res = await base44.functions.invoke(functionName, payload);
        // Handle non-2xx responses that don't throw (defensive)
        const body = res?.data || {};
        if (body.error && !body.data) {
          // Validation error from the backend (422)
          if (body.validationErrors) {
            setValidationErrors(body.validationErrors);
            setError(body.error);
            if (body.judge) setJudge(body.judge);
            setGenerating(false);
            setAttempt(0);
            return null;
          }
          throw new Error(body.error);
        }
        const spec = body.data || body;
        if (!spec || (typeof spec === "object" && Object.keys(spec).length === 0)) {
          throw new Error(`No ${fieldName} returned from the AI`);
        }
        // Capture warnings, judge scores, and retry info
        if (body.warnings?.length) setWarnings(body.warnings);
        if (body.judge) setJudge(body.judge);
        if (body.regenerated) setRegenerated(true);
        if (body.compileErrors?.length) setCompileErrors(body.compileErrors);
        if (body.compileValid !== undefined) setCompileValid(body.compileValid);

        await autoBuild.saveBuild({
          [fieldName]: spec,
          current_step: stepKey,
          logs: [...(build.logs || []), `[${new Date().toISOString()}] ${stepKey} generated (attempt ${attemptNum})`],
        });
        // Create Receipt for auditability
        try {
          await base44.entities.Receipt.create({
            agent_or_workflow: "useSystemBuildStep",
            action: `generate_${stepKey}`,
            entity_type: "AutoBuild",
            entity_id: build.id,
            inputs: JSON.stringify({ function: functionName, attempt: attemptNum }).slice(0, 4000),
            outputs: JSON.stringify({ field: fieldName }).slice(0, 4000),
            status: "success",
            evidence: `${stepKey} spec generated on attempt ${attemptNum}`,
          });
        } catch {}
        setGenerating(false);
        setAttempt(0);
        return spec;
      } catch (e) {
        const msg = e?.message || `Couldn't generate ${fieldName}.`;
        // Check for validation errors in the error response
        const valErrors = e?.response?.data?.validationErrors;
        if (valErrors) {
          setValidationErrors(valErrors);
          setError(e?.response?.data?.error || msg);
          setGenerating(false);
          setAttempt(0);
          return null; // Don't retry validation errors
        }
        if (attemptNum < maxRetries) {
          // Exponential backoff: 1s, 2s
          await new Promise((r) => setTimeout(r, 1000 * attemptNum));
          continue;
        }
        setError(msg);
        setGenerating(false);
        setAttempt(0);
        return null;
      }
    }
    setGenerating(false);
    setAttempt(0);
    return null;
  }, [functionName, fieldName, stepKey, autoBuild]);

  const approve = useCallback(async (stepPath, nextRoute, navigate) => {
    const build = autoBuild.build;
    if (!build) return;
    setApproved(true);
    const visited = build.visited_steps || [];
    if (!visited.includes(stepPath)) visited.push(stepPath);
    await autoBuild.saveBuild({
      visited_steps: visited,
      logs: [...(build.logs || []), `[${new Date().toISOString()}] ${stepKey} approved`],
    });
    // Create Receipt for the approval
    try {
      await base44.entities.Receipt.create({
        agent_or_workflow: "useSystemBuildStep",
        action: `approve_${stepKey}`,
        entity_type: "AutoBuild",
        entity_id: build.id,
        inputs: JSON.stringify({ step_path: stepPath, next_route: nextRoute }).slice(0, 4000),
        outputs: "",
        status: "success",
        evidence: `${stepKey} approved, advancing to ${nextRoute}`,
      });
    } catch {}
    navigate(nextRoute);
  }, [autoBuild, stepKey]);

  return {
    generating, error, validationErrors, warnings, approved, attempt,
    judge, regenerated, compileErrors, compileValid,
    generate, approve, setApproved,
  };
}