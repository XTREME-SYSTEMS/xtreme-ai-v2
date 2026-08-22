import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

// Purchases a domain through Vercel's Registrar API under OUR account
// (VERCEL_TOKEN + VERCEL_TEAM_ID), then optionally attaches it to the client's
// Vercel project. Everything runs in the background — the client just clicks
// "Buy" on a domain already recommended to them.
//
// Auth model:
//  - Clients pass `clientDomainId` → the domain is loaded from their own
//    ClientDomain record (verified client_email === user.email), so a client
//    can only buy a domain already recommended to them. Registrant contact
//    info is pulled automatically from their business profile — they never
//    fill out a form.
//  - Admins can pass `domain` directly to buy any domain.
//
// Vercel Registrar API:
//  - Availability: GET /v1/registrar/domains/{domain}/availability
//  - Price:        GET /v1/registrar/domains/{domain}/price?years=
//  - Buy:          POST /v1/registrar/domains/{domain}/buy

export default async function (req: Request) {
  const base44 = createClientFromRequest(req);
  let body: any = {};
  try { body = await req.json(); } catch { /* empty body */ }
  const {
    domain,
    years = 1,
    autoRenew = true,
    contact,
    clientDomainId,
    attachToProjectId,
  } = body;

  let user: any = null;
  try { user = await base44.auth.me(); } catch {}
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = user.role === "admin";

  let purchaseDomain = domain;
  if (clientDomainId) {
    let clientDomainRec: any = null;
    try { clientDomainRec = await base44.entities.ClientDomain.get(clientDomainId); } catch {}
    if (!clientDomainRec) return Response.json({ error: "Domain request not found" }, { status: 404 });
    if (!isAdmin && clientDomainRec.client_email !== user.email) {
      return Response.json({ error: "Not your domain request" }, { status: 403 });
    }
    purchaseDomain = clientDomainRec.domain || domain;
  }
  if (!purchaseDomain) return Response.json({ error: "domain required" }, { status: 400 });
  if (!clientDomainId && !isAdmin) {
    return Response.json({ error: "Admin only for arbitrary domains" }, { status: 403 });
  }

  // Registrant contact — pulled from the client's business profile so they
  // never have to fill out a form. Admins can override via body.contact.
  const p = user.epoxyProfile || {};
  const fullName = (user.full_name || p.businessName || user.email || "").trim();
  const nameParts = fullName.split(/\s+/);
  const firstName = nameParts[0] || "Owner";
  const lastName = nameParts.slice(1).join(" ") || firstName;
  const locParts = (p.primaryLocation || p.location || "").split(",").map((x: string) => x.trim());
  const registrantContact = contact || {
    firstName,
    lastName,
    email: p.email || user.email,
    phone: p.phone || "",
    address1: p.address || "",
    city: locParts[0] || "",
    state: locParts[1] || "",
    zip: p.zip || "",
    country: "US",
  };

  const token = process.env.VERCEL_TOKEN;
  const team = process.env.VERCEL_TEAM_ID;
  if (!token) return Response.json({ error: "VERCEL_TOKEN not set" }, { status: 500 });
  const qs = team ? `?teamId=${encodeURIComponent(team)}` : "";
  const addParam = (url: string, param: string) => (url.includes("?") ? `${url}&${param}` : `${url}?${param}`);
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const dom = encodeURIComponent(purchaseDomain);

  try {
    // Mark the request as purchasing (client-facing status)
    if (clientDomainId) {
      try { await base44.asServiceRole.entities.ClientDomain.update(clientDomainId, { status: "purchasing" }); } catch {}
    }

    // 1. Availability
    const availRes = await fetch(`https://api.vercel.com/v1/registrar/domains/${dom}/availability${qs}`, { headers });
    if (!availRes.ok) {
      const t = await availRes.text();
      console.error("Vercel availability failed:", availRes.status, t);
      return Response.json({ error: `Availability check failed: ${availRes.status} ${t}` }, { status: 502 });
    }
    const avail = await availRes.json();
    if (!avail.available) {
      if (clientDomainId) { try { await base44.asServiceRole.entities.ClientDomain.update(clientDomainId, { status: "unavailable", domain_available: false }); } catch {} }
      return Response.json({ ok: false, available: false, error: "Domain is not available for purchase" }, { status: 200 });
    }

    // 2. Price (so we can pass expectedPrice to the buy call)
    const priceRes = await fetch(`https://api.vercel.com/v1/registrar/domains/${dom}/price${addParam(qs, `years=${years}`)}`, { headers });
    let price: any = null;
    if (priceRes.ok) price = await priceRes.json();
    else console.warn("Vercel price lookup failed:", priceRes.status, await priceRes.text());
    const expectedPrice = price?.purchasePrice?.amount ?? price?.purchasePrice ?? price?.purchasePrice?.value ?? null;

    // 3. Buy
    const buyBody: any = { autoRenew: String(autoRenew), years: String(years), contactInformation: registrantContact };
    if (expectedPrice != null) buyBody.expectedPrice = expectedPrice;
    const buyRes = await fetch(`https://api.vercel.com/v1/registrar/domains/${dom}/buy${qs}`, { method: "POST", headers, body: JSON.stringify(buyBody) });
    if (!buyRes.ok) {
      const t = await buyRes.text();
      console.error("Vercel buy failed:", buyRes.status, t);
      if (clientDomainId) { try { await base44.asServiceRole.entities.ClientDomain.update(clientDomainId, { status: "requested", notes: `Purchase failed: ${buyRes.status} ${t}` }); } catch {} }
      return Response.json({ error: `Buy failed: ${buyRes.status} ${t}` }, { status: 502 });
    }
    const order = await buyRes.json();

    // 4. Optionally attach the domain to a Vercel project
    let attached: any = null;
    if (attachToProjectId) {
      try {
        const attRes = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(attachToProjectId)}/domains${qs}`, { method: "POST", headers, body: JSON.stringify({ name: purchaseDomain }) });
        if (attRes.ok) attached = await attRes.json();
        else console.warn("Vercel attach domain failed:", attRes.status, await attRes.text());
      } catch (e) { console.warn("Vercel attach domain error:", (e as Error).message); }
    }

    // 5. Update the ClientDomain record
    if (clientDomainId) {
      try {
        await base44.asServiceRole.entities.ClientDomain.update(clientDomainId, {
          status: "purchased",
          domain_available: true,
          registrar: "vercel",
          buy_url: "https://vercel.com/dashboard/domains",
          notes: `Purchased via Vercel Registrar API. Order: ${order?.orderId || order?.id || ""}${attached ? " · attached to project" : ""}`,
        });
      } catch (e) { console.error("ClientDomain update failed:", (e as Error).message); }
    }

    return Response.json({ ok: true, domain: purchaseDomain, available: true, order, price, attached });
  } catch (e) {
    console.error("purchaseDomainViaVercel error:", (e as Error).message);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}