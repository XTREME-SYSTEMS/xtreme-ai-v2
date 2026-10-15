// Shared helpers for ingested capability functions.
// Provides common patterns: LLM invocation, receipt logging, error handling.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export async function withBase44(req: any, fn: (base44: any) => Promise<any>) {
  try {
    const base44 = createClientFromRequest(req);
    return { ok: true, data: await fn(base44), base44 };
  } catch (error: any) {
    return { ok: false, error: error.message || String(error) };
  }
}

export async function llm(base44: any, prompt: string, schema?: any, model?: string) {
  const params: any = { prompt };
  if (schema) params.response_json_schema = schema;
  if (model) params.model = model;
  return await base44.asServiceRole.integrations.Core.InvokeLLM(params);
}

export async function logReceipt(base44: any, agent: string, action: string, status: string, inputs: any, outputs: any, evidence?: string) {
  try {
    await base44.asServiceRole.entities.Receipt.create({
      agent_or_workflow: agent,
      action,
      status,
      inputs: JSON.stringify(inputs).slice(0, 4000),
      outputs: JSON.stringify(outputs).slice(0, 4000),
      evidence: evidence || "",
    });
  } catch {}
}

export function jsonBody(req: Request): Promise<any> {
  return req.json().catch(() => ({}));
}

export function ok(data: any) {
  return Response.json(data);
}

export function fail(error: string, status = 500) {
  return Response.json({ error }, { status });
}