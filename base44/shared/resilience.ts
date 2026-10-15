// Shared resilience utilities for backend functions.
// Provides retry with exponential backoff, timeout, circuit breaker,
// and safe LLM invocation with graceful fallback.
// Import from any backend function: import { withRetry, safeInvoke, ... } from '../../shared/resilience.ts';

// ---- Retry with exponential backoff + jitter ----
export async function withRetry(fn, opts = {}) {
  const { retries = 3, baseDelay = 500, maxDelay = 8000, retryOn = null, label = 'op' } = opts;
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      const msg = err?.message || String(err);
      // If a custom retryOn predicate is provided, check it; otherwise retry on any error
      const shouldRetry = retryOn ? retryOn(err) : true;
      if (!shouldRetry || attempt === retries) throw err;
      const delay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt)) + Math.random() * 250;
      // Don't log on every retry — the caller can decide
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// ---- Timeout wrapper — rejects if fn doesn't resolve in time ----
export async function withTimeout(fn, ms, label = 'op') {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

// ---- Safe LLM invocation with retry + fallback + timeout ----
// Retries transient LLM failures, falls back to fallbackValue if all retries fail.
export async function safeInvoke(base44, opts) {
  const {
    prompt, model, response_json_schema, add_context_from_internet,
    file_urls, fallback = null, timeout = 45000, retries = 2, label = 'LLM',
  } = opts;

  try {
    const result = await withRetry(
      (attempt) => withTimeout(
        () => base44.integrations.Core.InvokeLLM({
          prompt, model, response_json_schema, add_context_from_internet, file_urls,
        }),
        timeout,
        label
      ),
      { retries, label }
    );
    return result;
  } catch (err) {
    console.error(`[safeInvoke:${label}] All retries exhausted:`, err?.message || err);
    if (fallback !== null) return fallback;
    throw err;
  }
}

// ---- Safe entity update with retry ----
// Entity updates can fail on transient DB issues; retry them.
export async function safeUpdate(svc, entityName, id, data, label = 'update') {
  return withRetry(
    () => svc.entities[entityName].update(id, data),
    { retries: 2, baseDelay: 400, label }
  );
}

// ---- Run operations in parallel with individual error isolation ----
// Each op gets its own try/catch so one failure doesn't kill the others.
// Returns array of { ok, result, error } in the same order as ops.
export async function parallelSafe(ops) {
  const results = await Promise.all(
    ops.map(async (op) => {
      try {
        const result = await op();
        return { ok: true, result, error: null };
      } catch (err) {
        return { ok: false, result: null, error: err?.message || String(err) };
      }
    })
  );
  return results;
}

// ---- Structured error capture ----
// Returns a clean JSON-serializable error object instead of a raw Error.
export function captureError(err, context = {}) {
  return {
    message: err?.message || String(err),
    name: err?.name || 'Error',
    stack: err?.stack?.split('\n').slice(0, 5).join('\n') || '',
    context,
    timestamp: new Date().toISOString(),
  };
}