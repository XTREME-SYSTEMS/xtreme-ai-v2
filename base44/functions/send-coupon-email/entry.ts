import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Sends a branded, polished coupon email. Best-effort: Base44's built-in SendEmail
// reaches registered app users only; non-registered recipients are rejected (handled gracefully).
// For delivery to any address, connect the Gmail connector (BYO shared) and switch to it.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { name, email, phone, coupon_code } = body || {};
    if (!email) return Response.json({ error: "email required" }, { status: 400 });
    const code = coupon_code || "LGNY10";

    const html = `<!DOCTYPE html><html><body style="margin:0;background:#000;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#000;color:#fff;border:1px solid #D4FF4D;border-radius:16px;overflow:hidden">
    <div style="background:#D4FF4D;color:#000;padding:18px 24px;text-align:center;font-weight:bold;font-size:16px;letter-spacing:1px">LEAD GENERATION NEAR YOU</div>
    <div style="padding:32px 28px">
      <div style="font-size:24px;font-weight:bold;color:#D4FF4D;margin-bottom:8px">Your 10% Off Coupon</div>
      <p style="color:#fff;line-height:1.6">Hi ${name || "there"},</p>
      <p style="color:#fff;line-height:1.6">Thanks for claiming your discount! Use the code below at checkout to save 10% on any AI-optimized website package.</p>
      <div style="margin:24px 0;padding:20px;border:2px dashed #D4FF4D;border-radius:12px;text-align:center;background:#0a0a0a">
        <div style="font-size:12px;color:#D4FF4D;letter-spacing:2px">YOUR COUPON CODE</div>
        <div style="font-size:36px;font-weight:bold;color:#fff;letter-spacing:3px">${code}</div>
        <div style="font-size:13px;color:#aaa;margin-top:4px">10% off - AI-Optimized Websites</div>
      </div>
      <a href="https://leadgenerationnearyou.com/pricing" style="display:block;background:#D4FF4D;color:#000;text-align:center;padding:14px;border-radius:10px;font-weight:bold;text-decoration:none;margin-top:8px">Use My Coupon Now</a>
      <p style="color:#aaa;font-size:13px;line-height:1.6;margin-top:24px">We'll reach out${phone ? ` at ${phone}` : ""} to learn about your project. Questions? Call (772) 209-0266.</p>
      <p style="color:#666;font-size:11px;margin-top:20px">Lead Generation Near You - 2200 NW 32nd St #700, Pompano Beach, FL 33069</p>
    </div>
  </div>
</body></html>`;

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `Your 10% Off Coupon ${code} - Lead Generation Near You`,
        body: html,
      });
      return Response.json({ sent: true });
    } catch (e) {
      // SendEmail reaches registered app users only; non-registered recipients are rejected.
      return Response.json({ sent: false, reason: "recipient_not_registered", detail: String(e).slice(0, 200) });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}