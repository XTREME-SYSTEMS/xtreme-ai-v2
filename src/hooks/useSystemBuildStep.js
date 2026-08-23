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

  const generate = useCallback(async (payload) => {
    const build = autoBuild.build;
    if (!build) return null;
    setGenerating(true);
    setError("");
    setValidationErrors([]);
    setWarnings([]);

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
        // Capture warnings
        if (body.warnings?.length) setWarnings(body.warnings);

        await autoBuild.saveBuild({
          [fieldName]: spec,
          current_step: stepKey,
          logs: [...(build.logs || []), `[${new Date().toISOString()}] ${stepKey} generated (attempt ${attemptNum})`],
        });
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
    navigate(nextRoute);
  }, [autoBuild, stepKey]);

  return {
    generating, error, validationErrors, warnings, approved, attempt,
    generate, approve, setApproved,
  };
}