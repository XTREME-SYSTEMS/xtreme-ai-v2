// purchaseBuildDomain — lets an admin/employee buy a custom domain through
// Vercel's Registrar API for an AutoBuild. Two modes:
//   confirm=false → check availability + return price (no purchase)
//   confirm=true  → actually purchase the domain and attach it to the
//                   build's Vercel project (if one exists)
// Registrant contact is pulled from the build's profile so the user never
// fills out a form — they just type a domain and click Buy.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import {
  normalizeDomain, checkDomainAvailability, getDomainPrice, buyDomain,
  attachDomainToProject, buildRegistrantContact,
} from "../../shared/vercelRegistrar.ts";

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
    const base44 = createClientFromRequest(req);

    let user: any = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (!user || (user.role !== "admin" && user.role !== "employee")) {
      return new Response(JSON.stringify({ error: "Admin or employee access required" }), { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const buildId = String(body.build_id || "");
    const rawDomain = String(body.domain || "").trim();
    const years = Number(body.years) || 1;
    const autoRenew = body.autoRenew !== false;
    const confirm = body.confirm === true;

    if (!buildId) return new Response(JSON.stringify({ error: "build_id is required" }), { status: 400 });
    if (!rawDomain) return new Response(JSON.stringify({ error: "domain is required" }), { status: 400 });

    // Normalize: strip protocol, path, www
    const domain = normalizeDomain(rawDomain);

    // Load build
    const builds = await base44.asServiceRole.entities.AutoBuild.filter({ id: buildId }, "-created_date", 1);
    const build = builds?.[0];
    if (!build) return new Response(JSON.stringify({ error: "Build not found" }), { status: 404 });

    const token = process.env.VERCEL_TOKEN;
    const team = process.env.VERCEL_TEAM_ID;
    if (!token) return new Response(JSON.stringify({ error: "VERCEL_TOKEN not set" }), { status: 500 });

    // 1. Availability check
    let avail;
    try {
      avail = await checkDomainAvailability(token, team, domain);
    } catch (e: any) {
      console.error("Vercel availability failed:", e?.message);
      return new Response(JSON.stringify({ error: e?.message || "Availability check failed" }), { status: 502 });
    }
    if (!avail.available) {
      return new Response(JSON.stringify({
        available: false,
        domain,
        error: `${domain} is not available for purchase`,
      }), { status: 200 });
    }

    // 2. Price lookup
    const { price: priceAmount } = await getDomainPrice(token, team, domain, years);

    // If not confirming, just return availability + price
    if (!confirm) {
      return new Response(JSON.stringify({
        available: true,
        domain,
        price: priceAmount,
        years,
      }), { status: 200 });
    }

    // 3. Purchase — registrant contact from the build's profile
    const contact = buildRegistrantContact(
      build.profile || {},
      user.email,
      build.business_name || "",
    );

    let order;
    try {
      order = await buyDomain(token, team, domain, { years, autoRenew, contact, expectedPrice: priceAmount });
    } catch (e: any) {
      console.error("Vercel buy failed:", e?.message);
      return new Response(JSON.stringify({ error: e?.message || "Purchase failed" }), { status: 502 });
    }

    // 4. Attach domain to the build's Vercel project (if deployed)
    let attached = false;
    const vercelProjectId = build.deployment?.vercel_project_id;
    if (vercelProjectId) {
      try {
        attached = await attachDomainToProject(token, team, vercelProjectId, domain);
      } catch (e) { console.warn("Vercel attach domain error:", (e as any)?.message); }
    }

    // 5. Update the build's deployment record
    try {
      await base44.asServiceRole.entities.AutoBuild.update(buildId, {
        deployment: {
          ...build.deployment,
          custom_domain: domain,
          domain_purchased: true,
          domain_order_id: order?.orderId || order?.id || "",
          domain_price: priceAmount,
        },
        logs: [...(build.logs || []), `[${new Date().toISOString()}] Domain purchased: ${domain} (${priceAmount ?? "?"} USD)${attached ? " · attached to Vercel project" : ""}`],
      });
    } catch (e) { console.error("Build update failed:", (e as any)?.message); }

    // 6. Receipt
    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: "purchaseBuildDomain",
        action: "purchase_domain",
        entity_type: "AutoBuild",
        entity_id: buildId,
        inputs: JSON.stringify({ domain, years, autoRenew }).slice(0, 4000),
        outputs: JSON.stringify({ order_id: order?.orderId || order?.id, price: priceAmount, attached }).slice(0, 4000),
        status: "success",
        evidence: `Purchased ${domain} for ${build.business_name} via Vercel Registrar${attached ? " · attached to project" : ""}`,
      });
    } catch { /* best-effort */ }

    return new Response(JSON.stringify({
      success: true,
      domain,
      order,
      price: priceAmount,
      attached,
    }), { status: 200 });
  } catch (e) {
    console.error("purchaseBuildDomain error:", (e as any)?.message || e);
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), { status: 500 });
  }
});