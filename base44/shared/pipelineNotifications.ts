// Shared pipeline notification + revision cascade helpers.
// Import from any backend function: import { ... } from '../../shared/pipelineNotifications.ts';

// Step key → human label
export const STEP_LABELS: Record<string, string> = {
  welcome: "Welcome",
  profile: "Business Profile",
  content: "Content Generator",
  logo: "Logo Generator",
  brand: "Brand Generator",
  website: "Website Design",
  social: "Social Media",
  video: "Video Generator",
  designs: "Your Designs",
  enhancements: "Enhancements",
  signatures: "Sign Agreement",
};

// When step X is revised, these downstream steps must be redone because they
// depend on X's output (e.g. revising the logo invalidates brand mockups).
export const CASCADE: Record<string, string[]> = {
  content: ["website"],
  logo: ["brand", "website"],
  brand: [],
  website: ["social", "video"],
  social: [],
  video: [],
};

// User profile fields to clear when a step is reset (revision cascade).
export const STEP_RESET_FIELDS: Record<string, string[]> = {
  content: ["contentTemplatesChosen", "contentTemplates", "chosenContentTemplate"],
  logo: ["chosenLogoUrl", "logoPacks"],
  brand: ["brandPacksChosen", "chosenBrandImages", "brandPacks"],
  website: ["designPacksChosen", "chosenWebsiteLayout", "chosenPalette", "websiteContent", "websiteImages"],
  social: ["socialMediaChosen", "socialMediaPack"],
  video: ["videoChosen", "videoPack"],
};

export async function getAdminEmails(base44: any): Promise<string[]> {
  try {
    const users = await base44.asServiceRole.entities.User.list();
    return (users || []).filter((u: any) => u.role === "admin" && u.email).map((u: any) => u.email);
  } catch {
    return [];
  }
}

// Sends a "step completed" email to the client + all admins, and stubs SMS.
export async function notifyStepCompleted(base44: any, opts: {
  clientEmail: string;
  stepKey: string;
  stepLabel: string;
  appUrl: string;
  businessName?: string;
}) {
  const { clientEmail, stepKey, stepLabel, appUrl, businessName } = opts;
  const biz = businessName ? ` for ${businessName}` : "";

  // 1) Email the client
  if (clientEmail) {
    try {
      await base44.integrations.Core.SendEmail({
        to: clientEmail,
        subject: `Progress update: ${stepLabel} complete`,
        body:
          `Hi there,\n\n` +
          `Great news — you've completed the "${stepLabel}" step of your website build${biz}.\n\n` +
          `You can continue here: ${appUrl}\n\n` +
          `Thanks,\nThe Lead Gen Near You Team`,
      });
    } catch (e) {
      console.error("notifyStepCompleted: client email failed", e?.message || e);
    }
  }

  // 2) Email all admins so the team is synced
  const adminEmails = await getAdminEmails(base44);
  for (const adminEmail of adminEmails) {
    try {
      await base44.integrations.Core.SendEmail({
        to: adminEmail,
        subject: `Client completed: ${stepLabel}`,
        body:
          `Client ${clientEmail || "(unknown)"} just completed the "${stepLabel}" step${biz}.\n\n` +
          `Review pipeline: ${appUrl}/approvals`,
      });
    } catch (e) {
      console.error("notifyStepCompleted: admin email failed", adminEmail, e?.message || e);
    }
  }

  // 3) SMS stub — logged for future Twilio integration
  console.log(
    `[SMS STUB] To: ${clientEmail} | Step "${stepKey}" (${stepLabel}) completed. SMS not yet configured.`
  );
}

// Sends a "revision requested" email to the client + all admins, and stubs SMS.
export async function notifyRevisionRequested(base44: any, opts: {
  clientEmail: string;
  stepKey: string;
  stepLabel: string;
  comment: string;
  appUrl: string;
  cascadedSteps: string[];
}) {
  const { clientEmail, stepKey, stepLabel, comment, appUrl, cascadedSteps } = opts;
  const cascadeNote =
    cascadedSteps.length > 0
      ? `\n\nBecause this step was revised, these dependent steps will also need to be redone: ${cascadedSteps.join(", ")}.`
      : "";

  // 1) Email the client
  if (clientEmail) {
    try {
      await base44.integrations.Core.SendEmail({
        to: clientEmail,
        subject: `Revision received: ${stepLabel}`,
        body:
          `Hi there,\n\n` +
          `We received your revision request for the "${stepLabel}" step.\n\n` +
          `Your note:\n${comment}${cascadeNote}\n\n` +
          `Our team will review it and reach out shortly.\n\n` +
          `Thanks,\nThe Lead Gen Near You Team`,
      });
    } catch (e) {
      console.error("notifyRevisionRequested: client email failed", e?.message || e);
    }
  }

  // 2) Email all admins
  const adminEmails = await getAdminEmails(base44);
  for (const adminEmail of adminEmails) {
    try {
      await base44.integrations.Core.SendEmail({
        to: adminEmail,
        subject: `Revision requested: ${stepLabel}`,
        body:
          `Client ${clientEmail || "(unknown)"} requested a revision to the "${stepLabel}" step.\n\n` +
          `Their note:\n${comment}${cascadeNote}\n\n` +
          `Review: ${appUrl}/approvals`,
      });
    } catch (e) {
      console.error("notifyRevisionRequested: admin email failed", adminEmail, e?.message || e);
    }
  }

  // 3) SMS stub
  console.log(
    `[SMS STUB] To: ${clientEmail} | Revision requested for "${stepKey}" (${stepLabel}). SMS not yet configured.`
  );
}

// Applies the revision cascade: clears the revised step's saved data AND all
// downstream dependent steps' data on the user profile, returning the list of
// cascaded step labels so callers can include it in notifications.
export async function applyRevisionCascade(
  base44: any,
  stepKey: string,
  clientEmail: string
): Promise<string[]> {
  const cascadedKeys = CASCADE[stepKey] || [];
  const allSteps = [stepKey, ...cascadedKeys];
  const unsetFields: Record<string, string> = {};
  for (const s of allSteps) {
    const fields = STEP_RESET_FIELDS[s];
    if (fields) {
      for (const f of fields) {
        unsetFields[f] = "";
      }
    }
  }
  if (Object.keys(unsetFields).length > 0 && clientEmail) {
    try {
      const mongoUnset: Record<string, string> = {};
      for (const k of Object.keys(unsetFields)) {
        mongoUnset[k] = "";
      }
      await base44.asServiceRole.entities.User.updateMany(
        { email: clientEmail },
        { $unset: mongoUnset }
      );
    } catch (e) {
      console.error("applyRevisionCascade: updateMany failed", e?.message || e);
    }
  }
  return cascadedKeys.map((s) => STEP_LABELS[s] || s);
}