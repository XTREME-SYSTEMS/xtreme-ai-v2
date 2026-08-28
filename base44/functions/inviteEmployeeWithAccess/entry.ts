// inviteEmployeeWithAccess — invites a user by email, sets their
// access_capabilities on the User record, and sends a custom email with a
// direct link to their landing page (auto builder, architect, etc.) so they
// can sign in and go straight to the tools they were given access to.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

function getLandingPage(capabilities: string[]): string {
  if (!capabilities || capabilities.length === 0) return "/auto-builder";
  if (capabilities.includes("all")) return "/auto-builder";
  if (capabilities.includes("/auto-builder")) return "/auto-builder";
  if (capabilities.includes("/architect")) return "/architect";
  const first = capabilities.find((c) => c.startsWith("/"));
  return first || "/auto-builder";
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
    const base44 = createClientFromRequest(req);

    let user: any = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (!user || user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const role = String(body.role || "employee");
    const accessCapabilities: string[] = Array.isArray(body.access_capabilities) ? body.access_capabilities : [];

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "A valid email is required" }), { status: 400 });
    }

    // 1. Invite the user (platform sends the setup/password email)
    let inviteSent = false;
    try {
      await base44.users.inviteUser(email, role);
      inviteSent = true;
    } catch (e: any) {
      // User may already exist — that's OK, we'll just update their capabilities
      console.warn("inviteUser result:", (e as any)?.message || e);
    }

    // 2. Find the user record and set access_capabilities
    let capsUpdated = false;
    try {
      const users = await base44.asServiceRole.entities.User.filter({ email }, "-created_date", 1);
      const u = users?.[0];
      if (u) {
        await base44.asServiceRole.entities.User.update(u.id, { access_capabilities: accessCapabilities });
        capsUpdated = true;
      }
    } catch (e: any) {
      console.error("Failed to update user capabilities:", (e as any)?.message || e);
    }

    // 3. Build the app URL and landing page link
    const appUrl = (req.headers.get("X-Base44-App-Url") || process.env.WIX_CHECKOUT_APP_URL || "").replace(/\/$/, "");
    if (!appUrl) {
      return new Response(JSON.stringify({ error: "App URL not configured — set WIX_CHECKOUT_APP_URL" }), { status: 500 });
    }
    const landingPage = getLandingPage(accessCapabilities);
    const loginLink = `${appUrl}/login?returnTo=${encodeURIComponent(landingPage)}`;

    // 4. Build a human-readable capability list for the email
    let capSummary: string;
    if (accessCapabilities.includes("all") || accessCapabilities.length === 0) {
      capSummary = "Full access to all capabilities — AI Chief Architect, Vision Cortex, Pipeline Catalog, Queue System, Auto Builder, and all individual tools.";
    } else {
      const labels: Record<string, string> = {
        "/architect": "AI Chief Architect",
        "/vision-cortex": "Vision Cortex",
        "/pipeline-catalog": "Pipeline Catalog",
        "/build-queue": "Queue System",
        "/auto-builder": "Auto Builder",
        "/business-name-studio": "Business Name Studio",
        "/content-generator": "Content Generator",
        "/logo-generator": "Logo Generator",
        "/brand-generator": "Brand Generator",
        "/design-direction": "Design Direction",
        "/social-media": "Social Media Generator",
        "/video-generator": "Video Generator",
        "/your-designs": "Your Designs",
        "/enhancements": "Enhancements",
        "/system-architecture": "System Architecture",
        "/data-model": "Data Model",
        "/ui-system": "UI System",
        "/codegen": "Codegen",
        "/deploy": "Deploy",
        "/system-review": "System Review",
      };
      capSummary = accessCapabilities
        .filter((c) => c.startsWith("/"))
        .map((c) => labels[c] || c)
        .join(", ");
      if (!capSummary) capSummary = "Auto Builder System";
    }

    // 5. Send the custom email with the direct link
    const emailBody = `Welcome to Xtreme AI!

You've been invited to join the Xtreme AI Growth Factory as a ${role}.

Your access includes: ${capSummary}

GETTING STARTED
═══════════════

1. Set your password — use the setup link in the separate account email we sent you.

2. Once your password is set, click this link to go straight to your portal:
   ${loginLink}

3. You can also sign in anytime from our home page:
   ${appUrl}
   (Click the hamburger menu → Client Portal)

Your direct link takes you to: ${landingPage}

See you inside!

Xtreme AI — Autonomous Growth Operating System
`;

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: "Your Xtreme AI Portal Access — Get Started Here",
        body: emailBody,
      });
    } catch (e: any) {
      console.error("Failed to send custom email:", (e as any)?.message || e);
    }

    return new Response(JSON.stringify({
      success: true,
      email,
      role,
      access_capabilities: accessCapabilities,
      landing_page: landingPage,
      invite_sent: inviteSent,
      caps_updated: capsUpdated,
    }), { status: 200 });
  } catch (e) {
    console.error("inviteEmployeeWithAccess error:", (e as any)?.message || e);
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), { status: 500 });
  }
});