import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

// Vercel AI Gateway — a unified LLM API gateway that routes requests to
// multiple providers (OpenAI, Anthropic, Google, Mistral, etc.) through
// Vercel's infrastructure. This is an alternative to the built-in InvokeLLM
// integration, giving you provider-agnostic LLM access with Vercel's
// rate limiting, caching, and observability.
//
// Requires secrets:
//   VERCEL_AI_GATEWAY_API_KEY — your Vercel AI Gateway API key
//   VERCEL_AI_GATEWAY_URL — base URL (e.g. https://ai-gateway.vercel.sh/v1)
//
// Usage:
//   base44.functions.invoke('vercelAIGateway', {
//     model: 'openai/gpt-4o-mini',  // provider/model format
//     messages: [{ role: 'user', content: 'Hello' }],
//     max_tokens: 1000,
//     temperature: 0.7,
//   })

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = secrets.get('VERCEL_AI_GATEWAY_API_KEY');
    const gatewayUrl = secrets.get('VERCEL_AI_GATEWAY_URL') || 'https://ai-gateway.vercel.sh/v1';

    if (!apiKey) {
      return Response.json({
        error: 'VERCEL_AI_GATEWAY_API_KEY secret is not set. Add it in Dashboard → Secrets.',
      }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { model, messages, max_tokens, temperature, stream, response_format } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'messages array is required' }, { status: 400 });
    }

    // Call the Vercel AI Gateway (OpenAI-compatible API)
    const gatewayResponse = await fetch(`${gatewayUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-4o-mini',
        messages,
        max_tokens: max_tokens || 1000,
        temperature: temperature ?? 0.7,
        stream: false,
        ...(response_format ? { response_format } : {}),
      }),
    });

    if (!gatewayResponse.ok) {
      const errText = await gatewayResponse.text();
      return Response.json({
        error: `Vercel AI Gateway error (${gatewayResponse.status})`,
        details: errText,
      }, { status: gatewayResponse.status });
    }

    const data = await gatewayResponse.json();

    return Response.json({
      status: 'success',
      model: data.model,
      content: data.choices?.[0]?.message?.content || '',
      usage: data.usage,
      finish_reason: data.choices?.[0]?.finish_reason,
    });
  } catch (error) {
    console.error('vercelAIGateway error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}