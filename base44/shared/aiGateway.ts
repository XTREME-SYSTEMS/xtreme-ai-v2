// Shared Vercel AI Gateway wrapper — a drop-in replacement for the Core
// InvokeLLM integration. Routes all LLM calls directly to the Vercel AI
// Gateway (OpenAI-compatible) using the VERCEL_AI_GATEWAY_API_KEY secret,
// so the system keeps running even when Base44 integration credits are
// exhausted. Works from any backend function context (user or service role).
//
// Usage (same shape as Core.InvokeLLM):
//   import { invokeLLM } from 'base44:shared/aiGateway';
//   const result = await invokeLLM({
//     prompt: 'Generate a strategy...',
//     response_json_schema: { type: 'object', properties: { ... } },
//     model: 'openai/gpt-4o-mini',  // optional
//     max_tokens: 2000,              // optional
//     temperature: 0.7,              // optional
//     system_prompt: 'You are...',  // optional
//   });
//   // result is a string (no schema) or a parsed JSON object (with schema)

import { secrets } from 'base44:runtime';

export async function invokeLLM(opts: {
  prompt: string;
  response_json_schema?: any;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  system_prompt?: string;
}) {
  const {
    prompt,
    response_json_schema,
    model = 'openai/gpt-4o-mini',
    max_tokens = 2000,
    temperature = 0.7,
    system_prompt,
  } = opts;

  const apiKey = secrets.get('VERCEL_AI_GATEWAY_API_KEY');
  const gatewayUrl = (secrets.get('VERCEL_AI_GATEWAY_URL') || 'https://ai-gateway.vercel.sh/v1').replace(/\/$/, '');

  if (!apiKey) throw new Error('VERCEL_AI_GATEWAY_API_KEY secret is not set');

  const schemaInstruction = response_json_schema
    ? '\n\nReturn ONLY valid JSON matching this schema (no markdown, no code fences):\n' +
      JSON.stringify(response_json_schema)
    : '';

  const messages = [
    ...(system_prompt ? [{ role: 'system', content: system_prompt }] : []),
    { role: 'user', content: prompt + schemaInstruction },
  ];

  const res = await fetch(`${gatewayUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens,
      temperature,
      stream: false,
      ...(response_json_schema ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Vercel AI Gateway error (${res.status}): ${errText.slice(0, 500)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';

  if (response_json_schema) {
    let cleaned = content.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    }
    return JSON.parse(cleaned);
  }

  return content;
}

// Convenience: raw multi-turn chat
export async function chat(messages: any[], opts: {
  model?: string;
  max_tokens?: number;
  temperature?: number;
  response_format?: any;
} = {}) {
  const apiKey = secrets.get('VERCEL_AI_GATEWAY_API_KEY');
  const gatewayUrl = (secrets.get('VERCEL_AI_GATEWAY_URL') || 'https://ai-gateway.vercel.sh/v1').replace(/\/$/, '');
  if (!apiKey) throw new Error('VERCEL_AI_GATEWAY_API_KEY secret is not set');

  const res = await fetch(`${gatewayUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: opts.model || 'openai/gpt-4o-mini',
      messages,
      max_tokens: opts.max_tokens || 2000,
      temperature: opts.temperature ?? 0.7,
      stream: false,
      ...(opts.response_format ? { response_format: opts.response_format } : {}),
    }),
  });

  if (!res.ok) throw new Error(`Vercel AI Gateway error (${res.status}): ${(await res.text()).slice(0, 500)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}