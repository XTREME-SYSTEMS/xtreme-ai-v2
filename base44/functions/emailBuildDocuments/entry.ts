// emailBuildDocuments — emails the user a complete package of their build's
// documentation and provisioned links. Creates a ZIP of all docs, uploads it
// to the Google Drive folder, and sends an email with every link + a doc
// summary so the user can download everything in one click.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import AdmZip from "npm:adm-zip@0.5.18";
import {
  generateSystemDocs, generateSetupInstructions, generateUserGuide,
} from "../../shared/systemBuildProvisioning.ts";

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }
    const base44 = createClientFromRequest(req);

    let user: any = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (!user || (user.role !== "admin" && user.role !== "employee")) {
      return new Response(JSON.stringify({ error: "Admin or employee access required" }), { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const buildId = String(body.build_id || "");
    const email = String(body.email || "").trim();
    if (!buildId) return new Response(JSON.stringify({ error: "build_id is required" }), { status: 400 });
    if (!email) return new Response(JSON.stringify({ error: "email is required" }), { status: 400 });

    // Load build
    const builds = await base44.asServiceRole.entities.AutoBuild.filter({ id: buildId }, "-created_date", 1);
    const build = builds?.[0];
    if (!build) return new Response(JSON.stringify({ error: "Build not found" }), { status: 404 });
    if (!build.code_manifest) return new Response(JSON.stringify({ error: "Code manifest is required — run the codegen step first" }), { status: 400 });

    const dep = build.deployment || {};

    // 1. Generate all docs (with the provisioned URLs baked into the setup instructions)
    const docs = generateSystemDocs(build);
    const provisioned = {
      github: dep.repo ? { repo: dep.repo, repo_url: dep.repo_url } : null,
      vercel: dep.live_url ? { url: dep.live_url } : null,
      supabase: dep.supabase_url ? { project_url: dep.supabase_url, project_id: dep.supabase_project_id } : null,
      drive: dep.drive_url ? { folder_url: dep.drive_url, folder_id: dep.drive_folder_id } : null,
    };
    docs["docs/SETUP_INSTRUCTIONS.md"] = generateSetupInstructions(build, provisioned);
    docs["docs/USER_GUIDE.md"] = generateUserGuide(build);

    // 2. Create a ZIP of all docs and upload it to the Google Drive folder
    let zipUrl: string | null = null;
    try {
      const zip = new AdmZip();
      for (const [path, content] of Object.entries(docs)) {
        zip.addFile(path, content);
      }
      const zipBuffer = zip.toBuffer();

      if (dep.drive_folder_id) {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");
        const boundary = "xtp" + Math.random().toString(36).slice(2);
        const metadata = JSON.stringify({
          name: `${build.business_name || "System Build"} — All Documents.zip`,
          parents: [dep.drive_folder_id],
        });
        const multipartBody = new Blob([
          `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
          `--${boundary}\r\nContent-Type: application/zip\r\n\r\n`,
          new Uint8Array(zipBuffer),
          `\r\n--${boundary}--`,
        ], { type: `multipart/related; boundary=${boundary}` });

        const uploadRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: multipartBody,
        });
        if (uploadRes.ok) {
          const file = await uploadRes.json();
          zipUrl = `https://drive.google.com/file/d/${file.id}/view`;
        }
      }
    } catch (e) {
      console.error("ZIP upload failed:", (e as any)?.message || e);
    }

    // 3. Compose the email
    const docList = Object.keys(docs).map((path, i) =>
      `  ${i + 1}. ${path.replace(/^docs\//, "")}`
    ).join("\n");

    const emailBody = `Hi there,

Your "${build.business_name}" build is complete! Here's everything you need — all your documents, links, and a one-click download.

══════════════════════════════════════════════════
YOUR PROVISIONED RESOURCES
══════════════════════════════════════════════════

  Live Website:        ${dep.live_url || "(pending — run provisioning first)"}
  GitHub Repository:   ${dep.repo_url || "(pending)"}
  Database (Supabase): ${dep.supabase_url || "(not needed for this build)"}
  Google Drive (Docs): ${dep.drive_url || "(pending)"}
  Download All (ZIP):  ${zipUrl || "(upload pending — check your Drive folder)"}

══════════════════════════════════════════════════
YOUR DOCUMENTATION (${Object.keys(docs).length} files)
══════════════════════════════════════════════════

${docList}

All documents are available in your Google Drive folder and as a single ZIP download (link above). The ZIP contains every file ready to open in any text editor.

══════════════════════════════════════════════════
QUICK START
══════════════════════════════════════════════════

  1. Clone:    git clone ${dep.repo_url || "<repo-url>"}
  2. Install:  npm install
  3. Env vars: copy .env.example → .env (see SETUP_INSTRUCTIONS.md)
  4. Run:      npm run dev
  5. Deploy:   push to main — Vercel auto-deploys

See SETUP_INSTRUCTIONS.md in your docs for the full step-by-step guide.

══════════════════════════════════════════════════

Built by Xtreme AI — your autonomous growth operating system.
https://leadgenerationnearyou.com
`;

    // 4. Send the email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: `Your ${build.business_name} Build — Documents & Links`,
      body: emailBody,
    });

    // 5. Receipt for auditability
    try {
      await base44.asServiceRole.entities.Receipt.create({
        agent_or_workflow: "emailBuildDocuments",
        action: "email_build_documents",
        entity_type: "AutoBuild",
        entity_id: buildId,
        inputs: JSON.stringify({ build_id: buildId, email }).slice(0, 4000),
        outputs: JSON.stringify({ docs_count: Object.keys(docs).length, zip_url: zipUrl }).slice(0, 4000),
        status: "success",
        evidence: `Emailed ${Object.keys(docs).length} docs + links to ${email}. ZIP: ${zipUrl || "failed"}`,
      });
    } catch { /* best-effort */ }

    return new Response(JSON.stringify({
      success: true,
      email,
      docs_count: Object.keys(docs).length,
      zip_url: zipUrl,
    }), { status: 200 });
  } catch (e) {
    console.error("emailBuildDocuments error:", (e as any)?.message || e);
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), { status: 500 });
  }
});