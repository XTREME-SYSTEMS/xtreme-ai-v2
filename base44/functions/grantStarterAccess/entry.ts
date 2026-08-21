// Grants full Elite access to a new user who signed up via the Free Starter
// plan (for presentation/demo purposes). Called from the Register page after
// OTP verification. Sets plan="elite" and has_paid=true so the user can
// experience the entire workflow end-to-end.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { welcomeEmail, adminNotificationEmail } from "../../shared/emailTemplates.ts";

export default async function (req: Request) {
  const base44 = createClientFromRequest(req);

  let body: any = {};
  try { body = await req.json(); } catch { /* empty body is fine */ }

  // Resolve the current user from the auth token
  let appUser: any = null;
  try {
    appUser = await base44.auth.me();
  } catch (_) {
    return Response.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  if (!appUser?.id) {
    return Response.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  // Grant full Elite access (presentation mode)
  try {
    await base44.asServiceRole.entities.User.update(appUser.id, {
      plan: "elite",
      has_paid: true,
    });
  } catch (e) {
    console.error("grantStarterAccess: failed to update user plan", e?.message || e);
    return Response.json({ ok: false, error: "Failed to grant access" }, { status: 500 });
  }

  // Send polished welcome email with upsell
  const appUrl = Deno.env.get("WIX_CHECKOUT_APP_URL") || "";
  if (appUser.email && appUrl) {
    try {
      const emailBody = welcomeEmail({
        email: appUser.email,
        planName: "Elite (Free Starter Demo)",
        appUrl,
        hasAccount: true,
      });
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: appUser.email,
        subject: "🎉 Welcome to Lead Generation Near You — Your Elite Access is Active!",
        body: emailBody,
      });
    } catch (emailErr) {
      console.error("grantStarterAccess: welcome email failed", emailErr);
    }

    // Notify admins of new signup
    try {
      const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
      const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      for (const admin of admins) {
        if (admin.email && admin.email !== appUser.email) {
          const adminBody = adminNotificationEmail({
            type: "signup",
            email: appUser.email,
            dateStr,
            appUserId: appUser.id,
          });
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: admin.email,
            subject: `👋 New Signup: ${appUser.email}`,
            body: adminBody,
          });
        }
      }
    } catch (adminErr) {
      console.error("grantStarterAccess: admin notification failed", adminErr);
    }
  }

  return Response.json({ ok: true, plan: "elite", has_paid: true });
}