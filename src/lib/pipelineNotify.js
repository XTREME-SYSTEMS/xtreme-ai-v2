import { base44 } from "@/api/base44Client";

// Frontend helper that fires a "step completed" notification after a client
// finishes a pipeline step. Sends email to the client + all admins and stubs
// SMS (server-side). Best-effort: never blocks the user's flow on failure.
export async function notifyStepComplete(stepKey, opts = {}) {
  try {
    let email = opts.clientEmail || "";
    if (!email) {
      try {
        const me = await base44.auth.me();
        email = me?.email || "";
      } catch {}
    }
    await base44.functions.invoke("notifyPipelineStep", {
      stepKey,
      stepLabel: opts.stepLabel || "",
      businessName: opts.businessName || "",
      clientEmail: email,
    });
  } catch (e) {
    // best effort — don't block the user's flow
  }
}