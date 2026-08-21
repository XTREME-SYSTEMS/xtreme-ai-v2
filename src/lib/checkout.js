import { base44 } from "@/api/base44Client";

// Starts a Wix/Base44 Payments checkout for the given product ID.
// Redirects the browser to the hosted checkout page on success.
export async function startCheckout(productId, promoCode) {
  const res = await base44.functions.invoke("create-checkout", {
    productId,
    ...(promoCode ? { promoCode } : {}),
  });
  if (res?.data?.redirectUrl) {
    window.location.href = res.data.redirectUrl;
  } else {
    throw new Error(res?.data?.error || "Could not start checkout");
  }
}