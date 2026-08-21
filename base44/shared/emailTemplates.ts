// Polished, attractive email templates with upsell sections.
// Used by payments-webhook (receipt emails) and onUserSignup (welcome emails).
// All templates use inline styles for email client compatibility.

const LIME = "#D4FF4D";
const BLACK = "#0A0A0A";
const DARK = "#18181B";
const GRAY = "#71717A";
const LIGHT_GRAY = "#F4F4F5";
const WHITE = "#FFFFFF";

// Reusable upsell section — highlights enhancements the user can add.
// Shown in both welcome and receipt emails.
function upsellSection(appUrl: string): string {
  const enhancementsLink = `${appUrl}/enhancements`;
  return `
    <div style="background: ${LIGHT_GRAY}; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <div style="text-align: center; margin-bottom: 16px;">
        <span style="display: inline-block; background: ${LIME}; color: ${BLACK}; font-size: 11px; font-weight: 800; letter-spacing: 1px; padding: 4px 12px; border-radius: 20px; text-transform: uppercase;">Level Up</span>
        <h3 style="margin: 12px 0 4px; font-size: 20px; font-weight: 800; color: ${BLACK};">Supercharge Your Results</h3>
        <p style="margin: 0; font-size: 14px; color: ${GRAY};">Add these enhancements to accelerate your growth</p>
      </div>
      <table style="width: 100%; border-collapse: separate; border-spacing: 8px;">
        <tr>
          <td style="width: 50%; background: ${WHITE}; border-radius: 10px; padding: 16px; border: 1px solid #E4E4E7; vertical-align: top;">
            <div style="font-size: 22px; margin-bottom: 4px;">🚀</div>
            <div style="font-size: 14px; font-weight: 700; color: ${BLACK};">Priority Rush Delivery</div>
            <div style="font-size: 12px; color: ${GRAY}; margin-top: 2px;">Get everything in 3 days instead of 7</div>
            <div style="font-size: 16px; font-weight: 800; color: ${BLACK}; margin-top: 6px;">$500</div>
          </td>
          <td style="width: 50%; background: ${WHITE}; border-radius: 10px; padding: 16px; border: 1px solid #E4E4E7; vertical-align: top;">
            <div style="font-size: 22px; margin-bottom: 4px;">⭐</div>
            <div style="font-size: 14px; font-weight: 700; color: ${BLACK};">Review Management System</div>
            <div style="font-size: 12px; color: ${GRAY}; margin-top: 2px;">Auto-request reviews, boost Google rating</div>
            <div style="font-size: 16px; font-weight: 800; color: ${BLACK}; margin-top: 6px;">$400</div>
          </td>
        </tr>
        <tr>
          <td style="width: 50%; background: ${WHITE}; border-radius: 10px; padding: 16px; border: 1px solid #E4E4E7; vertical-align: top;">
            <div style="font-size: 22px; margin-bottom: 4px;">📞</div>
            <div style="font-size: 14px; font-weight: 700; color: ${BLACK};">Call Tracking Number</div>
            <div style="font-size: 12px; color: ${GRAY}; margin-top: 2px;">Track every lead source with analytics</div>
            <div style="font-size: 16px; font-weight: 800; color: ${BLACK}; margin-top: 6px;">$200</div>
          </td>
          <td style="width: 50%; background: ${WHITE}; border-radius: 10px; padding: 16px; border: 1px solid #E4E4E7; vertical-align: top;">
            <div style="font-size: 22px; margin-bottom: 4px;">📍</div>
            <div style="font-size: 14px; font-weight: 700; color: ${BLACK};">Google Business Profile Setup</div>
            <div style="font-size: 12px; color: ${GRAY}; margin-top: 2px;">Maximize local pack visibility</div>
            <div style="font-size: 16px; font-weight: 800; color: ${BLACK}; margin-top: 6px;">$300</div>
          </td>
        </tr>
      </table>
      <div style="text-align: center; margin-top: 16px;">
        <a href="${enhancementsLink}" style="display: inline-block; background: ${LIME}; color: ${BLACK}; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 10px; text-decoration: none;">Browse All Enhancements →</a>
      </div>
    </div>
  `;
}

function emailFooter(): string {
  return `
    <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #E4E4E7;">
      <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: ${BLACK};">Lead Generation Near You</p>
      <p style="margin: 0; font-size: 12px; color: ${GRAY};">2200 NW 32nd St #700, Pompano Beach, FL 33069</p>
      <p style="margin: 4px 0 0; font-size: 12px; color: ${GRAY};">📞 (772) 209-0266 · Mon–Sat 8 AM – 8 PM ET</p>
    </div>
  `;
}

// Welcome email — sent when a new user signs up (free starter or paid).
export function welcomeEmail(opts: {
  email: string;
  planName: string;
  appUrl: string;
  hasAccount: boolean;
}): string {
  const { email, planName, appUrl, hasAccount } = opts;
  const loginLink = `${appUrl}/login`;
  const packageLink = `${appUrl}/my-package`;
  const profileLink = `${appUrl}/business-profile`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: ${LIGHT_GRAY};">
      <!-- Header -->
      <div style="background: ${BLACK}; padding: 32px 24px; text-align: center; border-radius: 16px 16px 0 0;">
        <div style="display: inline-block; background: ${LIME}; color: ${BLACK}; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px;">Welcome Aboard</div>
        <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: ${WHITE}; letter-spacing: -0.5px;">You're In! 🎉</h1>
        <p style="margin: 8px 0 0; font-size: 15px; color: ${LIME}; font-weight: 500;">${planName} access is now active</p>
      </div>

      <!-- Body -->
      <div style="background: ${WHITE}; padding: 32px 24px; border-radius: 0 0 16px 16px;">
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #333;">Welcome to Lead Generation Near You! Your <strong style="color: ${BLACK};">${planName}</strong> access is now unlocked. You can start building your brand, website, and lead engine right away.</p>

        <!-- Next steps -->
        <h2 style="margin: 28px 0 12px; font-size: 18px; font-weight: 800; color: ${BLACK};">Your Next Steps</h2>
        <table style="width: 100%; border-collapse: separate; border-spacing: 0 8px;">
          <tr>
            <td style="background: ${LIGHT_GRAY}; border-radius: 10px; padding: 14px 16px;">
              <div style="display: flex; align-items: flex-start;">
                <span style="flex-shrink: 0; width: 28px; height: 28px; background: ${LIME}; border-radius: 50%; text-align: center; line-height: 28px; font-size: 13px; font-weight: 800; color: ${BLACK}; margin-right: 12px;">1</span>
                <div>
                  <div style="font-size: 14px; font-weight: 700; color: ${BLACK};">Complete Your Business Profile</div>
                  <div style="font-size: 13px; color: ${GRAY}; margin-top: 2px;">Tell us about your business so our AI can start building.</div>
                  <a href="${profileLink}" style="font-size: 13px; font-weight: 600; color: ${BLACK}; text-decoration: none; border-bottom: 2px solid ${LIME};">Start your profile →</a>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background: ${LIGHT_GRAY}; border-radius: 10px; padding: 14px 16px;">
              <div style="display: flex; align-items: flex-start;">
                <span style="flex-shrink: 0; width: 28px; height: 28px; background: ${LIME}; border-radius: 50%; text-align: center; line-height: 28px; font-size: 13px; font-weight: 800; color: ${BLACK}; margin-right: 12px;">2</span>
                <div>
                  <div style="font-size: 14px; font-weight: 700; color: ${BLACK};">Approve Each Design Step</div>
                  <div style="font-size: 13px; color: ${GRAY}; margin-top: 2px;">Review and approve your logo, brand, website, content, social & videos.</div>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background: ${LIGHT_GRAY}; border-radius: 10px; padding: 14px 16px;">
              <div style="display: flex; align-items: flex-start;">
                <span style="flex-shrink: 0; width: 28px; height: 28px; background: ${LIME}; border-radius: 50%; text-align: center; line-height: 28px; font-size: 13px; font-weight: 800; color: ${BLACK}; margin-right: 12px;">3</span>
                <div>
                  <div style="font-size: 14px; font-weight: 700; color: ${BLACK};">Get Instant Access to All Files</div>
                  <div style="font-size: 13px; color: ${GRAY}; margin-top: 2px;">The moment you finish the process, all deliverables are yours.</div>
                  <a href="${hasAccount ? loginLink : packageLink}" style="font-size: 13px; font-weight: 600; color: ${BLACK}; text-decoration: none; border-bottom: 2px solid ${LIME};">${hasAccount ? "Log in to your portal →" : "Go to your portal →"}</a>
                </div>
              </div>
            </td>
          </tr>
        </table>

        <!-- What's included -->
        <div style="background: ${DARK}; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="margin: 0 0 10px; font-size: 15px; font-weight: 700; color: ${LIME};">✓ What's Included in Your ${planName}</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 4px 0; font-size: 13px; color: ${WHITE};">✓ Logo Generator — 10 concepts, pick 1</td></tr>
            <tr><td style="padding: 4px 0; font-size: 13px; color: ${WHITE};">✓ Brand Generator — 10 mockups, pick up to 3</td></tr>
            <tr><td style="padding: 4px 0; font-size: 13px; color: ${WHITE};">✓ Website Design — 10 packs, pick up to 3</td></tr>
            <tr><td style="padding: 4px 0; font-size: 13px; color: ${WHITE};">✓ Website Build — design, copy, imagery & deploy</td></tr>
            <tr><td style="padding: 4px 0; font-size: 13px; color: ${WHITE};">✓ SEO + AEO optimization with JSON-LD</td></tr>
            <tr><td style="padding: 4px 0; font-size: 13px; color: ${WHITE};">✓ Social Media Pack — 30-day calendar</td></tr>
            <tr><td style="padding: 4px 0; font-size: 13px; color: ${WHITE};">✓ Video Pack — 10 video concepts</td></tr>
            <tr><td style="padding: 4px 0; font-size: 13px; color: ${WHITE};">✓ Up to 2 free iterations on all deliverables</td></tr>
          </table>
        </div>

        <!-- Upsell -->
        ${upsellSection(appUrl)}

        <!-- Support -->
        <div style="text-align: center; margin-top: 24px; padding: 16px; background: ${LIGHT_GRAY}; border-radius: 10px;">
          <p style="margin: 0; font-size: 13px; color: ${GRAY};">Questions? Reply to this email or call <strong style="color: ${BLACK};">(772) 209-0266</strong></p>
        </div>

        ${emailFooter()}
      </div>
    </div>
  `;
}

// Receipt email — sent when a payment is confirmed (via webhook).
export function receiptEmail(opts: {
  email: string;
  productName: string;
  amount: string;
  dateStr: string;
  appUrl: string;
  hasAccount: boolean;
}): string {
  const { email, productName, amount, dateStr, appUrl, hasAccount } = opts;
  const loginLink = `${appUrl}/login`;
  const registerLink = `${appUrl}/register`;
  const packageLink = `${appUrl}/my-package`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: ${LIGHT_GRAY};">
      <!-- Header -->
      <div style="background: ${BLACK}; padding: 32px 24px; text-align: center; border-radius: 16px 16px 0 0;">
        <div style="display: inline-block; background: ${LIME}; color: ${BLACK}; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px;">Payment Confirmed</div>
        <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: ${WHITE}; letter-spacing: -0.5px;">Thank You! ✅</h1>
        <p style="margin: 8px 0 0; font-size: 15px; color: ${LIME}; font-weight: 500;">Your purchase is being processed</p>
      </div>

      <!-- Body -->
      <div style="background: ${WHITE}; padding: 32px 24px; border-radius: 0 0 16px 16px;">
        <!-- Receipt table -->
        <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 800; color: ${BLACK};">Your Receipt</h2>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #E4E4E7; border-radius: 10px; overflow: hidden;">
          <tr style="background: ${LIGHT_GRAY};">
            <td style="padding: 12px 16px; font-size: 13px; color: ${GRAY}; font-weight: 600;">Product</td>
            <td style="padding: 12px 16px; font-size: 14px; color: ${BLACK}; font-weight: 700; text-align: right;">${productName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; color: ${GRAY}; font-weight: 600; border-top: 1px solid #E4E4E7;">Amount</td>
            <td style="padding: 12px 16px; font-size: 14px; color: ${BLACK}; font-weight: 700; text-align: right; border-top: 1px solid #E4E4E7;">${amount}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; color: ${GRAY}; font-weight: 600; border-top: 1px solid #E4E4E7;">Date</td>
            <td style="padding: 12px 16px; font-size: 14px; color: ${BLACK}; font-weight: 700; text-align: right; border-top: 1px solid #E4E4E7;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; color: ${GRAY}; font-weight: 600; border-top: 1px solid #E4E4E7;">Email</td>
            <td style="padding: 12px 16px; font-size: 14px; color: ${BLACK}; font-weight: 700; text-align: right; border-top: 1px solid #E4E4E7;">${email}</td>
          </tr>
        </table>

        <!-- What happens next -->
        <h2 style="margin: 28px 0 12px; font-size: 18px; font-weight: 800; color: ${BLACK};">What Happens Next</h2>
        <table style="width: 100%; border-collapse: separate; border-spacing: 0 8px;">
          <tr>
            <td style="background: ${LIGHT_GRAY}; border-radius: 10px; padding: 14px 16px;">
              <div style="display: flex; align-items: flex-start;">
                <span style="flex-shrink: 0; width: 28px; height: 28px; background: ${LIME}; border-radius: 50%; text-align: center; line-height: 28px; font-size: 13px; font-weight: 800; color: ${BLACK}; margin-right: 12px;">1</span>
                <div>
                  <div style="font-size: 14px; font-weight: 700; color: ${BLACK};">${hasAccount ? "Log In to Your Account" : "Create Your Account"}</div>
                  <div style="font-size: 13px; color: ${GRAY}; margin-top: 2px;">Use this email to access your client portal.</div>
                  <a href="${hasAccount ? loginLink : registerLink}" style="font-size: 13px; font-weight: 600; color: ${BLACK}; text-decoration: none; border-bottom: 2px solid ${LIME};">${hasAccount ? "Click here to log in →" : "Click here to create your account →"}</a>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background: ${LIGHT_GRAY}; border-radius: 10px; padding: 14px 16px;">
              <div style="display: flex; align-items: flex-start;">
                <span style="flex-shrink: 0; width: 28px; height: 28px; background: ${LIME}; border-radius: 50%; text-align: center; line-height: 28px; font-size: 13px; font-weight: 800; color: ${BLACK}; margin-right: 12px;">2</span>
                <div>
                  <div style="font-size: 14px; font-weight: 700; color: ${BLACK};">Complete Your Business Profile</div>
                  <div style="font-size: 13px; color: ${GRAY}; margin-top: 2px;">Tell us about your business so our team can start building.</div>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background: ${LIGHT_GRAY}; border-radius: 10px; padding: 14px 16px;">
              <div style="display: flex; align-items: flex-start;">
                <span style="flex-shrink: 0; width: 28px; height: 28px; background: ${LIME}; border-radius: 50%; text-align: center; line-height: 28px; font-size: 13px; font-weight: 800; color: ${BLACK}; margin-right: 12px;">3</span>
                <div>
                  <div style="font-size: 14px; font-weight: 700; color: ${BLACK};">Approve Each Step & Get Instant Access</div>
                  <div style="font-size: 13px; color: ${GRAY}; margin-top: 2px;">Review logo, brand, website, content, social & videos. Finish the process and get all files instantly.</div>
                </div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Instant access callout -->
        <div style="background: ${LIME}; border-radius: 10px; padding: 16px 20px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px; font-weight: 700; color: ${BLACK};">⚡ Instant Access — Finish the onboarding process and all your files are yours immediately.</p>
        </div>

        <!-- Upsell -->
        ${upsellSection(appUrl)}

        <!-- Support -->
        <div style="text-align: center; margin-top: 24px; padding: 16px; background: ${LIGHT_GRAY}; border-radius: 10px;">
          <p style="margin: 0; font-size: 13px; color: ${GRAY};">Questions? Reply to this email or call <strong style="color: ${BLACK};">(772) 209-0266</strong></p>
        </div>

        ${emailFooter()}
      </div>
    </div>
  `;
}

// Admin notification email — sent to admins when a new purchase or signup occurs.
export function adminNotificationEmail(opts: {
  type: "purchase" | "signup";
  email: string;
  productName?: string;
  amount?: string;
  dateStr: string;
  purchaseId?: string;
  appUserId?: string | null;
}): string {
  const { type, email, productName, amount, dateStr, purchaseId, appUserId } = opts;
  const isPurchase = type === "purchase";
  const title = isPurchase ? "🔔 New Purchase" : "👋 New Signup";
  const rows = isPurchase
    ? `<tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Product:</td><td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${productName || ""}</td></tr>
       <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Amount:</td><td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${amount || ""}</td></tr>
       <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Purchase ID:</td><td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${purchaseId || ""}</td></tr>`
    : `<tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Plan:</td><td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">Free Starter (Elite demo)</td></tr>`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #000; color: #fff; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 22px;">${title}</h1>
      </div>
      <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 12px 12px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Email:</td><td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${email}</td></tr>
          ${rows}
          <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Date:</td><td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${dateStr}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">User ID:</td><td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${appUserId || "N/A"}</td></tr>
        </table>
      </div>
    </div>
  `;
}