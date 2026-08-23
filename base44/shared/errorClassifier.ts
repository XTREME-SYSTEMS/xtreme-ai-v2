// ============================================================
// errorClassifier.ts — Classifies errors from the autonomous
// pipeline and recommends a recovery action. Used by the
// self-healing loop to decide whether to retry, regenerate,
// or escalate.
// ============================================================

export type ErrorClass =
  | "transient"
  | "structural"
  | "schema"
  | "logic"
  | "dependency"
  | "timeout"
  | "unknown";

export interface ClassifiedError {
  class: ErrorClass;
  message: string;
  recommendedAction: "retry" | "regenerate" | "escalate" | "skip";
  retryDelay: number; // seconds
  context: string; // additional context to inject into regeneration prompt
}

// ── Classification rules ──────────────────────────────────────────────────

const TRANSIENT_PATTERNS = [
  /timeout/i, /ETIMEDOUT/i, /ECONNRESET/i, /ECONNREFUSED/i, /socket hang up/i,
  /network/i, /fetch failed/i, /aborted/i, /503/i, /502/i, /rate.?limit/i,
  /too many requests/i, /service unavailable/i, /internal server error/i,
];

const SCHEMA_PATTERNS = [
  /validation failed/i, /missing.*required/i, /must be/i, /expected.*got/i,
  /invalid.*type/i, /schema/i, /enum/i, /validationErrors/i,
];

const LOGIC_PATTERNS = [
  /test.*fail/i, /assertion/i, /expected.*received/i, /mismatch/i,
  /wrong.*result/i, /incorrect/i,
];

const DEPENDENCY_PATTERNS = [
  /module not found/i, /cannot find module/i, /import.*failed/i,
  /unresolved/i, /dependency/i, /package.*not.*installed/i,
  /connector.*not.*authorized/i, /oauth/i, /token.*expired/i,
];

const TIMEOUT_PATTERNS = [
  /timeout/i, /timed out/i, /deadline exceeded/i, /execution.*time/i,
];

// ── Classifier ───────────────────────────────────────────────────────────

export function classifyError(error: string | Error): ClassifiedError {
  const msg = typeof error === "string" ? error : (error?.message || String(error));

  // Check timeout first (before transient, since timeout is a subset)
  if (TIMEOUT_PATTERNS.some((p) => p.test(msg))) {
    return {
      class: "timeout",
      message: msg,
      recommendedAction: "retry",
      retryDelay: 5,
      context: `The previous attempt timed out. Consider splitting the work into smaller batches or simplifying the request.`,
    };
  }

  if (TRANSIENT_PATTERNS.some((p) => p.test(msg))) {
    return {
      class: "transient",
      message: msg,
      recommendedAction: "retry",
      retryDelay: 2,
      context: `The previous attempt failed due to a transient network/service issue.`,
    };
  }

  if (SCHEMA_PATTERNS.some((p) => p.test(msg))) {
    return {
      class: "schema",
      message: msg,
      recommendedAction: "regenerate",
      retryDelay: 0,
      context: `The previous output failed schema validation. Fix these validation errors: ${msg}`,
    };
  }

  if (LOGIC_PATTERNS.some((p) => p.test(msg))) {
    return {
      class: "logic",
      message: msg,
      recommendedAction: "regenerate",
      retryDelay: 0,
      context: `The previous output had a logic error: ${msg}. Fix the logic and regenerate.`,
    };
  }

  if (DEPENDENCY_PATTERNS.some((p) => p.test(msg))) {
    return {
      class: "dependency",
      message: msg,
      recommendedAction: "escalate",
      retryDelay: 0,
      context: `A dependency is missing or unauthorized: ${msg}. This requires operator intervention.`,
    };
  }

  // Structural — anything else that's a real error
  if (msg.length > 0) {
    return {
      class: "structural",
      message: msg,
      recommendedAction: "regenerate",
      retryDelay: 0,
      context: `The previous attempt had a structural error: ${msg}. Regenerate with this context.`,
    };
  }

  return {
    class: "unknown",
    message: msg,
    recommendedAction: "escalate",
    retryDelay: 0,
    context: `An unknown error occurred: ${msg}`,
  };
}

// ── Circuit breaker ──────────────────────────────────────────────────────

export class CircuitBreaker {
  private failureCounts: Map<string, number> = new Map();
  private threshold: number;
  private state: Map<string, "closed" | "open"> = new Map();

  constructor(threshold = 5) {
    this.threshold = threshold;
  }

  recordFailure(key: string): boolean {
    const count = (this.failureCounts.get(key) || 0) + 1;
    this.failureCounts.set(key, count);
    if (count >= this.threshold) {
      this.state.set(key, "open");
      return true; // tripped
    }
    return false;
  }

  recordSuccess(key: string): void {
    this.failureCounts.delete(key);
    this.state.delete(key);
  }

  isOpen(key: string): boolean {
    return this.state.get(key) === "open";
  }

  reset(key: string): void {
    this.failureCounts.delete(key);
    this.state.delete(key);
  }
}