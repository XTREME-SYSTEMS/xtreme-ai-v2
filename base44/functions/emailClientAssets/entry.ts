import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Emails the client a polished "thank you" package with all their generated
// assets (logo, brand mockups, website design, social media kit, video
// concepts), setup instructions, and an offer for professional setup via
// Vercel/Supabase/Drive. Called after the client signs their contract and
// has no enhancement balance to pay (or after they pay it).
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole;
    const clientEmail = user.email;
    const profile = user.epoxyProfile || {};
    const businessName = profile.businessName || user.full_name || 'there';

    // Pull the client's project to get all generated assets
    let project = null;
    try {
      const projects = await svc.entities.ClientProject.filter(
        { client_email: clientEmail }, '-created_date', 1
      );
      project = projects?.[0] || null;
    } catch (e) {
      console.error('emailClientAssets: project fetch failed', e?.message || e);
    }

    // Build the assets list
    const assetLines: string[] = [];
    const logoUrl = project?.chosen_logo_url || user?.chosenLogoUrl;
    if (logoUrl) assetLines.push(`<li><strong>Logo:</strong> <a href="${logoUrl}" style="color:#FFEA00;">Download your logo (PNG, transparent)</a></li>`);
    const brandImages = project?.chosen_brand_images || user?.chosenBrandImages || [];
    if (brandImages.length > 0) {
      assetLines.push(`<li><strong>Brand Mockups (${brandImages.length}):</strong> Business cards, brochures, apparel & more — <a href="${brandImages[0]}" style="color:#FFEA00;">view mockups</a></li>`);
    }
    if (project?.chosen_website_layout) {
      assetLines.push(`<li><strong>Website Design:</strong> Layout "${project.chosen_website_layout}" with palette "${project.chosen_palette || 'default'}" — approved and ready</li>`);
    }
    if (project?.social_media_chosen || user?.socialMediaChosen) {
      assetLines.push(`<li><strong>Social Media Kit:</strong> Profile, cover, stories, posts & 30-day content calendar — approved</li>`);
    }
    if (project?.video_chosen || user?.videoChosen) {
      assetLines.push(`<li><strong>Video Concepts:</strong> Your video pack is approved and ready for download</li>`);
    }
    const enhancements = user?.enhancements || [];
    if (enhancements.length > 0) {
      assetLines.push(`<li><strong>Enhancements (${enhancements.length}):</strong> ${enhancements.join(', ')}</li>`);
    }

    const assetsHtml = assetLines.length > 0
      ? `<ul style="list-style:none;padding:0;">${assetLines.join('')}</ul>`
      : '<p>Your assets are being finalized — you\'ll receive a follow-up email shortly.</p>';

    const html = `
      <div style="background:#0a0a0a;color:#f5f5f5;font-family:system-ui,sans-serif;padding:32px 20px;">
        <div style="max-width:600px;margin:0 auto;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="font-size:28px;font-weight:800;color:#FFEA00;margin:0;">Your Assets Are Ready! 🎉</h1>
            <p style="color:#999;margin:8px 0 0;">Thank you for choosing Xtreme AI, ${businessName}.</p>
          </div>

          <div style="background:#111;border:1px solid #222;border-radius:16px;padding:28px;margin-bottom:24px;">
            <h2 style="font-size:18px;color:#fff;margin:0 0 16px;">Your Package Assets</h2>
            ${assetsHtml}
          </div>

          <div style="background:#111;border:1px solid #222;border-radius:16px;padding:28px;margin-bottom:24px;">
            <h2 style="font-size:18px;color:#fff;margin:0 0 16px;">How to Use Your Assets</h2>
            <ol style="color:#ccc;line-height:1.8;padding-left:20px;">
              <li><strong>Logo:</strong> Use the transparent PNG on your website, business cards, social media, and signage.</li>
              <li><strong>Website:</strong> Your design is approved — our team will deploy it. You'll receive the live URL shortly.</li>
              <li><strong>Brand Mockups:</strong> Download and send to any printer for business cards, brochures, and apparel.</li>
              <li><strong>Social Media Kit:</strong> Upload the profile and cover images to your social accounts. Use the 30-day calendar for daily posts.</li>
              <li><strong>Video Concepts:</strong> Use these on your website, YouTube, and social media ads.</li>
            </ol>
          </div>

          <div style="background:#1a1a1a;border:1px solid #FFEA00;border-radius:16px;padding:28px;margin-bottom:24px;">
            <h2 style="font-size:18px;color:#FFEA00;margin:0 0 12px;">Want Us to Set Everything Up for You?</h2>
            <p style="color:#ccc;line-height:1.6;margin:0 0 16px;">
              We offer a full setup service where we handle everything — website deployment via Vercel,
              database setup via Supabase, file storage via Google Drive, and domain connection.
              You just relax and watch it go live.
            </p>
            <p style="color:#999;font-size:14px;margin:0 0 8px;"><strong>Or set it up yourself:</strong></p>
            <ul style="color:#aaa;line-height:1.8;padding-left:20px;font-size:14px;">
              <li><strong>Vercel:</strong> Create a free account at vercel.com, connect your GitHub repo, and deploy.</li>
              <li><strong>Supabase:</strong> Create a project at supabase.com for your database and authentication.</li>
              <li><strong>Google Drive:</strong> Store your brand assets in a shared Drive folder for your team.</li>
              <li><strong>Domain:</strong> Purchase your domain at Namecheap or GoDaddy, then point DNS to Vercel.</li>
            </ul>
          </div>

          <div style="text-align:center;color:#666;font-size:13px;">
            <p>Questions? Reply to this email and our team will help.</p>
            <p style="margin-top:8px;">© Xtreme AI Growth Factory</p>
          </div>
        </div>
      </div>
    `;

    await svc.integrations.Core.SendEmail({
      to: clientEmail,
      subject: `Your Assets Are Ready — ${businessName}`,
      body: html,
    });

    return Response.json({ ok: true, sent: true });
  } catch (error) {
    console.error('emailClientAssets error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}