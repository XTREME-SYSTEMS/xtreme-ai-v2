// Base44 Payments checkout starter — base44/functions/create-checkout/entry.ts
//
// Provided by the platform. Do NOT rewrite the plumbing (session construct + persisting the
// join key + return-URL resolution). Edit only the region marked `// ===== APP-SPECIFIC =====`
// to resolve — SERVER-SIDE — what the buyer is purchasing and its price.
//
// PUBLIC by default: a buyer does NOT need to be logged in to check out. Backend function routes
// are callable anonymously, and storefront buyers often have no account — requiring login here is
// what blocks real purchases. If a buyer IS signed in we record their app-user id as the
// fulfillment target; otherwise the webhook grants by the buyer's email. Never 401 here.
//
// CRITICAL: Wix's checkout has NO custom-metadata field, so the returned `checkoutSession.id` is
// the ONLY thing that ties this payment back to this purchase. We persist it on a pending
// Base44Purchase BEFORE redirecting; the webhook resolves the purchase by that same id
// (order.checkoutId === checkoutSession.id). Skipping this write makes fulfillment impossible.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const CONSTRUCT_URL = "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct";

// The app's public base URL for the buyer's return links. Use the platform-injected
// `X-Base44-App-Url` header (server-set from app state — correct behind custom domains), then the
// server-owned `WIX_CHECKOUT_APP_URL` secret. We do NOT fall back to the request `Origin`: it's
// caller-controlled, so a spoofed Origin would make Wix send the paid buyer to an attacker page
// (open redirect). Both sources above are always present for a connected payments app.
function resolveAppUrl(req: Request): string {
  return (
    req.headers.get("x-base44-app-url") ||
    Deno.env.get("WIX_CHECKOUT_APP_URL") ||
    ""
  );
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
    // Read per request, never at module scope: disconnecting payments blanks these, and a warm
    // isolate that captured them at startup would keep charging with the old credentials.
    const WIX_API_KEY = Deno.env.get("WIX_CHECKOUT_API_KEY");
    const WIX_SITE_ID = Deno.env.get("WIX_CHECKOUT_SITE_ID");
    if (!WIX_API_KEY || !WIX_SITE_ID) {
      console.error("create-checkout: Wix payment config not set");
      return new Response(JSON.stringify({ error: "Payments not configured" }), { status: 500 });
    }

    const appUrl = resolveAppUrl(req);
    if (!appUrl) {
      // Fail closed: with no server-owned app URL (both the X-Base44-App-Url header AND the
      // WIX_CHECKOUT_APP_URL secret are absent — e.g. a slug-less or partially-wired app) we'd build
      // relative return links like `/ThankYou` and strand the paid buyer. Never fall back to the
      // caller-controlled Origin (open redirect). Reconnecting payments repopulates the secret.
      console.error("create-checkout: no app URL (X-Base44-App-Url header and WIX_CHECKOUT_APP_URL both empty)");
      return new Response(JSON.stringify({ error: "Payments not configured" }), { status: 500 });
    }
    const base44 = createClientFromRequest(req);

    // Capture the buyer's app-user id IF signed in — but never REQUIRE it. This is the
    // fulfillment target the webhook grants to; when absent (anonymous buyer) the webhook grants
    // by the email the buyer enters on Wix's checkout page.
    let appUser = null;
    try {
      appUser = await base44.auth.me();
    } catch (_) {
      appUser = null;
    }

    const body = await req.json().catch(() => ({}));

    // ===== APP-SPECIFIC =====
    // Resolve what is being bought AND its price SERVER-SIDE. NEVER trust a price sent by the
    // client — a buyer can tamper the request body and pay any amount. The client sends only a
    // product identifier; look up the authoritative price here (a Product entity, a config map,
    // etc.). For a subscription, set `subscriptionInfo` (frequency/interval/billingCycles).
    const productId = String(body.productId ?? "");
    // Quantity is buyer-controlled, so VALIDATE it server-side. Check the RAW value is a positive
    // integer BEFORE using it — do NOT Math.trunc first, or a fractional POST (e.g. 1.9) silently
    // passes as 1 and charges a quantity the UI never allowed. For a plan / fixed-entitlement product,
    // hard-code `1` and ignore the body; for a genuine multi-unit product, also enforce YOUR own max.
    const quantity = Number(body.quantity ?? 1);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return new Response(JSON.stringify({ error: "Invalid quantity" }), { status: 400 });
    }
    // Server-side product catalog — authoritative prices, never trust client-sent price.
    const PRODUCTS: Record<string, { name: string; price: string; subscription?: { frequency: string } }> = {
      // ── Subscriptions ──
      "pro-monthly":   { name: "Pro Plan (Monthly)",   price: "499.00",   subscription: { frequency: "MONTH" } },
      "pro-annual":    { name: "Pro Plan (Annual)",    price: "4990.00",  subscription: { frequency: "YEAR" } },
      "elite-monthly": { name: "Elite Plan (Monthly)", price: "1499.00",  subscription: { frequency: "MONTH" } },
      "elite-annual":  { name: "Elite Plan (Annual)",  price: "14990.00", subscription: { frequency: "YEAR" } },
      // ── Web Packs (one-time, downloadable) ──
      "web-pack-starter":   { name: "Starter Web Pack",      price: "299.00" },
      "web-pack-pro":       { name: "Pro Web Pack",          price: "599.00" },
      "web-pack-ecommerce": { name: "E-Commerce Web Pack",   price: "899.00" },
      "web-pack-landing":   { name: "Landing Page Pack",     price: "199.00" },
      // ── App Packs (one-time) ──
      "app-pack-ios":     { name: "iOS App Pack",        price: "499.00" },
      "app-pack-android": { name: "Android App Pack",    price: "499.00" },
      "app-pack-both":    { name: "iOS + Android App Pack", price: "899.00" },
      "app-pack-pwa":     { name: "PWA Pack",            price: "299.00" },
      // ── AI Tools (one-time, downloadable, $99 each) ──
      "ai-tool-logo":     { name: "AI Logo Generator",       price: "99.00" },
      "ai-tool-content":  { name: "AI Content Generator",    price: "99.00" },
      "ai-tool-social":   { name: "AI Social Media Generator", price: "99.00" },
      "ai-tool-video":    { name: "AI Video Generator",      price: "99.00" },
      "ai-tool-brand":    { name: "AI Brand Designer",        price: "99.00" },
      "ai-tool-rank":     { name: "Rank Engine",              price: "99.00" },
      "ai-tool-citation": { name: "Citation Builder",         price: "99.00" },
      "ai-tool-backlink": { name: "Backlink Outreach",        price: "99.00" },
      "ai-tool-chatbot":  { name: "AI Lead Chatbot",          price: "99.00" },
      // ── Individual Services (one-time) ──
      "service-seo-audit":      { name: "SEO Audit",                price: "149.00" },
      "service-gbp":            { name: "Google Business Profile Setup", price: "300.00" },
      "service-call-tracking":  { name: "Call Tracking Number",     price: "200.00" },
      "service-rush":           { name: "Priority Rush Delivery",   price: "500.00" },
      "service-reviews":        { name: "Review Management System",  price: "400.00" },
      // ── Legacy / other ──
      "ai-tool":       { name: "AI Tool",              price: "99.00" },
      "web-pack":      { name: "Web Pack",             price: "299.00" },
      "app-pack":      { name: "App Pack",             price: "499.00" },
      "deposit":       { name: "Done-For-You Service Deposit", price: "500.00" },
      "enhancements":  { name: "Package Enhancements", price: "0" },
    };
    const product = PRODUCTS[productId];
    if (!product) {
      return new Response(JSON.stringify({ error: "Unknown product" }), { status: 400 });
    }
    let productName = product.name;
    let price = product.price;
    const currency = "USD";

    // G8 — For enhancements, resolve the price server-side from the buyer's saved
    // selections (never trust a client-sent price). The buyer must be signed in
    // since enhancements are selected in the client portal.
    if (productId === "enhancements") {
      if (!appUser?.email) {
        return new Response(JSON.stringify({ error: "Sign in to purchase enhancements" }), { status: 400 });
      }
      try {
        const users = await base44.asServiceRole.entities.User.filter({ email: appUser.email });
        const userRecord = users?.[0];
        const enhancementsTotal = Number(userRecord?.enhancementsTotal || 0);
        if (enhancementsTotal < 0.5) {
          return new Response(JSON.stringify({ error: "No enhancements to pay for (minimum $0.50)" }), { status: 400 });
        }
        price = enhancementsTotal.toFixed(2);
      } catch (e) {
        console.error("create-checkout: enhancements price resolve failed", e?.message || e);
        return new Response(JSON.stringify({ error: "Could not resolve enhancement total" }), { status: 500 });
      }
    }
    // ===== PROMO CODE =====
    // If the buyer provided a promo code, validate it SERVER-SIDE (never trust
    // the client) and apply the discount to the unit price. The UI calls
    // validate-promo-code first to show the discounted price, but this is the
    // authoritative check — it runs again here before the Wix charge.
    let appliedPromoCode: string | null = null;
    const requestedPromoCode = String(body.promoCode ?? "").trim().toUpperCase();
    if (requestedPromoCode) {
      try {
        const promos = await base44.asServiceRole.entities.PromoCode.filter({ code: requestedPromoCode });
        const promo = promos?.[0];
        if (!promo) {
          return new Response(JSON.stringify({ error: "Invalid promo code" }), { status: 400 });
        }
        if (!promo.active) {
          return new Response(JSON.stringify({ error: "This promo code is no longer active" }), { status: 400 });
        }
        const now = new Date();
        if (promo.validFrom && new Date(promo.validFrom) > now) {
          return new Response(JSON.stringify({ error: "This promo code is not yet active" }), { status: 400 });
        }
        if (promo.validUntil && new Date(promo.validUntil) < now) {
          return new Response(JSON.stringify({ error: "This promo code has expired" }), { status: 400 });
        }
        if (promo.maxUses > 0 && (promo.usedCount || 0) >= promo.maxUses) {
          return new Response(JSON.stringify({ error: "This promo code has reached its usage limit" }), { status: 400 });
        }
        if (promo.applicableProductIds?.length > 0 && !promo.applicableProductIds.includes(productId)) {
          return new Response(JSON.stringify({ error: "This promo code is not valid for this product" }), { status: 400 });
        }
        if (promo.minOrderAmount > 0 && parseFloat(price) < promo.minOrderAmount) {
          return new Response(JSON.stringify({ error: `Minimum order of $${promo.minOrderAmount} required for this promo code` }), { status: 400 });
        }
        // Apply the discount to the unit price.
        let discount = 0;
        if (promo.discountType === "percentage") {
          discount = parseFloat(price) * (promo.discountValue / 100);
        } else {
          discount = promo.discountValue;
        }
        if (discount > parseFloat(price)) discount = parseFloat(price);
        price = (parseFloat(price) - discount).toFixed(2);
        appliedPromoCode = promo.code;
        // Increment the usage counter atomically (avoids overselling under
        // concurrent checkouts — read-then-write would race two buyers past maxUses).
        await base44.asServiceRole.entities.PromoCode.updateMany(
          { code: requestedPromoCode },
          { $inc: { usedCount: 1 } }
        );
        console.log("create-checkout: promo code applied", { code: promo.code, discount: discount.toFixed(2) });
      } catch (e) {
        console.error("create-checkout: promo code validation failed", e?.message || e);
        return new Response(JSON.stringify({ error: "Could not validate promo code" }), { status: 500 });
      }
    }

    // For a SUBSCRIPTION set this to Wix's subscriptionInfo; leave null for a one-time payment.
    const subscriptionInfo = product.subscription
      ? { subscriptionSettings: { frequency: product.subscription.frequency }, title: product.name, description: product.name }
      : null;
    // Where Wix returns the buyer. Both MUST be real, PUBLICLY reachable routes in this app: the
    // returning buyer is often anonymous, so a missing or login-gated route strands a paid customer.
    // Match your router exactly — `/ThankYou`, not `/thank-you`.
    const thankYouPath = "/ThankYou";
    const postFlowPath = "/";
    // ===== END APP-SPECIFIC =====

    const total = parseFloat(price) * quantity;
    if (!(total >= 0.5)) {
      // Wix rejects charges under 0.50 in the charged currency (major units, not cents).
      return new Response(JSON.stringify({ error: "Amount must be at least 0.50" }), { status: 400 });
    }

    const constructBody = {
      cart: {
        items: [{ name: productName, quantity, price, ...(subscriptionInfo ? { subscriptionInfo } : {}) }],
        // Prefill the signed-in buyer's email if we have one; anonymous buyers enter it on Wix.
        ...(appUser?.email ? { customerInfo: { email: appUser.email } } : {}),
      },
      callbackUrls: {
        thankYouPageUrl: `${appUrl}${thankYouPath}`,
        postFlowUrl: `${appUrl}${postFlowPath}`,
      },
    };

    const wixRes = await fetch(CONSTRUCT_URL, {
      method: "POST",
      headers: {
        "Authorization": WIX_API_KEY,
        "wix-site-id": WIX_SITE_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(constructBody),
    });

    if (!wixRes.ok) {
      const errText = await wixRes.text();
      console.error("create-checkout: Wix construct failed", { status: wixRes.status, errText });
      return new Response(JSON.stringify({ error: "Could not start checkout" }), { status: 502 });
    }

    const { checkoutSession } = await wixRes.json();
    const checkoutSessionId: string = checkoutSession?.id;
    const redirectUrl: string = checkoutSession?.redirectUrl;

    if (!checkoutSessionId || !redirectUrl) {
      console.error("create-checkout: missing checkoutSession id/redirectUrl", checkoutSession);
      return new Response(JSON.stringify({ error: "Could not start checkout" }), { status: 502 });
    }

    // PERSIST THE JOIN KEY (the whole point). Pending until the webhook flips it to "paid".
    // asServiceRole so the row is trustworthy — Base44Purchase RLS blocks client writes, so a buyer
    // can't forge a paid purchase. appUserId is the fulfillment target when known; null for an
    // anonymous buyer (the webhook then grants by buyerEmail).
    await base44.asServiceRole.entities.Base44Purchase.create({
      checkoutSessionId,
      status: "pending",
      appUserId: appUser?.id ?? null,
      buyerEmail: appUser?.email ?? null,
      // The server-resolved product key — the webhook grant reads this to decide what to unlock.
      productId,
      productName,
      // Persist the validated quantity so the webhook's grant can award the RIGHT count
      // (seats/credits/items) for a multi-unit purchase — the grant runs later from this row and has
      // no other authoritative count. (Fixed-entitlement plans keep quantity 1.)
      quantity,
      // Charged total (unit price × quantity), so the record matches what Wix charged.
      amount: total.toFixed(2),
      currency,
      ...(appliedPromoCode ? { promoCode: appliedPromoCode } : {}),
    });

    return new Response(JSON.stringify({ redirectUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-checkout: unhandled error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});