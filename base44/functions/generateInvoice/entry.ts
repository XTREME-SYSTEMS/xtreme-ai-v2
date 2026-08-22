import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
    const body = await req.json();
    const { account_name, deal_name, value, scope } = body;

    const prompt = `Generate a professional invoice for a digital marketing + lead generation engagement. Client: ${account_name || "Client"}. Project/Deal: ${deal_name || "Project"}. Scope: ${scope || "standard monthly package"}. Approximate value: $${value || 0}. Return realistic line items (description, qty, unit_price, total) for setup, campaign management, creative, and lead gen services, plus subtotal, tax_rate (as a percent number e.g. 7), tax, total, and a short notes string. Totals must be internally consistent.`;
    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          lines: { type: "array", items: { type: "object", properties: { description: { type: "string" }, qty: { type: "number" }, unit_price: { type: "number" }, total: { type: "number" } } } },
          subtotal: { type: "number" }, tax_rate: { type: "number" }, tax: { type: "number" }, total: { type: "number" }, notes: { type: "string" },
        },
      },
    });
    return Response.json(res);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}