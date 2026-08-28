import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import {
  normalizeDomain, checkDomainAvailability, getDomainPrice, buyDomain,
  attachDomainToProject, buildRegistrantContact,
} from "../../shared/vercelRegistrar.ts";

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
  const registrantContact = contact || buildRegistrantContact(
    user.epoxyProfile || {},
    user.email,
    user.full_name || "",
  );

  const token = process.env.VERCEL_TOKEN;
  const team = process.env.VERCEL_TEAM_ID;
  if (!token) return Response.json({ error: "VERCEL_TOKEN not set" }, { status: 500 });

  try {
    // Mark the request as purchasing (client-facing status)
    if (clientDomainId) {
      try { await base44.asServiceRole.entities.ClientDomain.update(clientDomainId, { status: "purchasing" }); } catch {}
    }

    // 1. Availability
    let avail;
    try {
      avail = await checkDomainAvailability(token, team, purchaseDomain);
    } catch (e: any) {
      console.error("Vercel availability failed:", e?.message);
      return Response.json({ error: e?.message || "Availability check failed" }, { status: 502 });
    }
    if (!avail.available) {
      if (clientDomainId) { try { await base44.asServiceRole.entities.ClientDomain.update(clientDomainId, { status: "unavailable", domain_available: false }); } catch {} }
      return Response.json({ ok: false, available: false, error: "Domain is not available for purchase" }, { status: 200 });
    }

    // 2. Price (so we can pass expectedPrice to the buy call)
    const { price: expectedPrice } = await getDomainPrice(token, team, purchaseDomain, years);

    // 3. Buy
    let order;
    try {
      order = await buyDomain(token, team, purchaseDomain, { years, autoRenew, contact: registrantContact, expectedPrice });
    } catch (e: any) {
      console.error("Vercel buy failed:", e?.message);
      if (clientDomainId) { try { await base44.asServiceRole.entities.ClientDomain.update(clientDomainId, { status: "requested", notes: `Purchase failed: ${e?.message}` }); } catch {} }
      return Response.json({ error: e?.message || "Buy failed" }, { status: 502 });
    }

    // 4. Optionally attach the domain to a Vercel project
    let attached: any = null;
    if (attachToProjectId) {
      try {
        const ok = await attachDomainToProject(token, team, attachToProjectId, purchaseDomain);
        attached = ok ? { ok: true } : null;
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