import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateSiteFiles, provisionGithub, provisionDrive, provisionSupabase, provisionVercel } from '../../shared/provisioning.ts';

// AI Site Factory — auto-provisioning orchestrator.
// Given a market_id, generates the static site, then provisions GitHub repo +
// files, Google Drive folder, Supabase project, and Vercel deployment. Stores
// every step's result on a ProvisioningRecord and flips the Market to published.
// Idempotent: re-running reuses existing records and skips/pushes as needed.
// Admin-only.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    // Allow admin (dashboard) or system context (workflow trigger has no user session).
    let user = null;
    try { user = await base44.auth.me(); } catch (e) { /* workflow context — no user */ }
    if (user && user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const { market_id } = body || {};
    if (!market_id) return Response.json({ error: "market_id required" }, { status: 400 });

    const market = await base44.asServiceRole.entities.Market.get(market_id);
    if (!market) return Response.json({ error: "Market not found" }, { status: 404 });

    const seoList = await base44.asServiceRole.entities.MarketSeo.filter({ market_id });
    const seo = seoList[0] || null;

    // Upsert provisioning record
    const existing = await base44.asServiceRole.entities.ProvisioningRecord.filter({ market_id });
    let record;
    const base = { market_id, status: "running", step: "generate", error: "", logs: [] };
    if (existing.length > 0) record = await base44.asServiceRole.entities.ProvisioningRecord.update(existing[0].id, base);
    else record = await base44.asServiceRole.entities.ProvisioningRecord.create(base);

    const patch = async (p) => { record = await base44.asServiceRole.entities.ProvisioningRecord.update(record.id, p); return record; };
    const log = async (m) => { const logs = [...(record.logs || []), `${new Date().toISOString()} ${m}`]; await patch({ logs }); };

    try {
      await log("Generating static site files…");
      const files = generateSiteFiles(market, seo);

      await log("Provisioning GitHub repo + pushing site…");
      const gh = await provisionGithub(base44, market, files, record.github_repo);
      await patch({ github_repo: gh.repo, github_repo_url: gh.repo_url, step: "drive" });
      await log(`GitHub: ${gh.repo}`);

      await log("Provisioning Google Drive folder…");
      const drive = record.drive_folder_id ? { folder_id: record.drive_folder_id, folder_url: record.drive_folder_url } : await provisionDrive(base44, market);
      await patch({ drive_folder_id: drive.folder_id, drive_folder_url: drive.folder_url, step: "supabase" });
      await log(`Drive: ${drive.folder_id}`);

      await log("Provisioning Supabase project…");
      const supa = record.supabase_project_id ? { project_id: record.supabase_project_id, project_url: record.supabase_project_url } : await provisionSupabase(market);
      await patch({ supabase_project_id: supa.project_id, supabase_project_url: supa.project_url, step: "vercel" });
      await log(`Supabase: ${supa.project_id}`);

      await log("Provisioning Vercel project + deploy…");
      const vercel = await provisionVercel(market, gh.repo, files);
      await patch({ vercel_project_id: vercel.project_id, vercel_url: vercel.url, status: "provisioned", step: "done" });
      await log(`Vercel: ${vercel.url}`);

      const finalDomain = market.domain || vercel.url.replace(/^https?:\/\//, "");
      await base44.asServiceRole.entities.Market.update(market_id, { status: "published", domain: finalDomain });

      return Response.json({ ok: true, market_id, vercel_url: vercel.url, record_id: record.id });
    } catch (innerError) {
      const msg = String(innerError.message || innerError);
      await patch({ status: "failed", error: msg });
      return Response.json({ ok: false, error: msg, record_id: record.id }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ error: String(error.message || error) }, { status: 500 });
  }
}