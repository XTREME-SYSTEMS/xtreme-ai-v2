// Validates a promo code for a given product. Called from the UI before
// checkout so the user sees the discounted price before paying. The
// create-checkout function validates again server-side (never trust the
// client) before applying the discount.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

export default async function (req: Request) {
  const base44 = createClientFromRequest(req);

  let body: any = {};
  try { body = await req.json(); } catch {
    return Response.json({ valid: false, error: "Invalid request" }, { status: 400 });
  }

  const code = String(body.code ?? "").trim().toUpperCase();
  const productId = String(body.productId ?? "");

  if (!code) {
    return Response.json({ valid: false, error: "Enter a promo code" });
  }

  try {
    const matches = await base44.asServiceRole.entities.PromoCode.filter({ code });
    const promo = matches?.[0];

    if (!promo) {
      return Response.json({ valid: false, error: "Invalid promo code" });
    }
    if (!promo.active) {
      return Response.json({ valid: false, error: "This promo code is no longer active" });
    }

    const now = new Date();
    if (promo.validFrom && new Date(promo.validFrom) > now) {
      return Response.json({ valid: false, error: "This promo code is not yet active" });
    }
    if (promo.validUntil && new Date(promo.validUntil) < now) {
      return Response.json({ valid: false, error: "This promo code has expired" });
    }
    if (promo.maxUses > 0 && (promo.usedCount || 0) >= promo.maxUses) {
      return Response.json({ valid: false, error: "This promo code has reached its usage limit" });
    }
    if (promo.applicableProductIds?.length > 0 && productId && !promo.applicableProductIds.includes(productId)) {
      return Response.json({ valid: false, error: "This promo code is not valid for this product" });
    }

    return Response.json({
      valid: true,
      promoCodeId: promo.id,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      description: promo.description || "",
    });
  } catch (e) {
    console.error("validate-promo-code: failed", e?.message || e);
    return Response.json({ valid: false, error: "Could not validate promo code" }, { status: 500 });
  }
}