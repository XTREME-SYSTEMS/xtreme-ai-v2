// Sends an "account modified" email to a user when their package or account
// is changed by an admin or the system (plan upgrade/downgrade, access
// granted/revoked, package added/removed). The email includes a prominent
// link to the client portal so the user can navigate directly from their inbox.
//
// Called from admin UI pages (e.g. ClientSetup, AdminPackages) after an admin
// modifies a user's account. Also reusable from other backend functions.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { accountModifiedEmail } from "../../shared/emailTemplates.ts";

export default async function (req: Request) {
  const base44 = createClientFromRequest(req);

  let body: any = {};
  try { body = await req.json(); } catch {
    return Response.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const { userEmail, changeType, changeSummary } = body;

  if (!userEmail || !changeType) {
    return Response.json({ ok: false, error: "userEmail and changeType are required" }, { status: 400 });
  }

  const appUrl = Deno.env.get("WIX_CHECKOUT_APP_URL") || "";
  if (!appUrl) {
    console.error("notifyAccountChange: WIX_CHECKOUT_APP_URL not set");
    return Response.json({ ok: false, error: "App URL not configured" }, { status: 500 });
  }

  try {
    // Check if the user has a registered account (determines whether the
    // email links go straight to the portal or to the login page first).
    let hasAccount = false;
    try {
      const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
      hasAccount = !!(users && users.length > 0);
    } catch {
      // If we can't check, assume they have an account — the portal link
      // will redirect to login if they're not authenticated anyway.
      hasAccount = true;
    }

    const emailBody = accountModifiedEmail({
      email: userEmail,
      changeType,
      changeSummary: changeSummary || "Your account has been updated.",
      appUrl,
      hasAccount,
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: userEmail,
      subject: `Account Update: ${changeType}`,
      body: emailBody,
    });

    console.log("notifyAccountChange: sent", { userEmail, changeType });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("notifyAccountChange: failed", e?.message || e);
    return Response.json({ ok: false, error: "Failed to send notification" }, { status: 500 });
  }
}