// CRM Auto-Capture — fires on every signup (and login for backfill).
// Creates a Contact record in the Base44 CRM, then syncs it to Google Drive
// (Sheets API) and Supabase (PostgREST). Idempotent: skips if a contact with
// the same email already exists, so login events are safe no-ops.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const SPREADSHEET_NAME = "LGNY CRM Contacts";
const HEADERS = ["ID", "First Name", "Last Name", "Email", "Phone", "Status", "Source", "Created Date", "Notes", "User ID"];

export default async function (req: Request) {
  const base44 = createClientFromRequest(req);

  let body: any = {};
  try { body = await req.json(); } catch { /* empty body is fine for manual test */ }
  const { user_id, email, full_name, auth_method, event_type } = body;

  if (!email) return Response.json({ error: "email required" }, { status: 400 });

  // 1. Idempotency check — skip if contact already exists
  try {
    const existing = await base44.entities.Contact.filter({ email });
    if (existing && existing.length > 0) {
      return Response.json({ ok: true, message: "Contact already exists", contact_id: existing[0].id });
    }
  } catch (e) {
    console.error("Contact lookup failed:", (e as Error).message);
  }

  // 2. Create contact in Base44 CRM
  const nameParts = (full_name || "").trim().split(/\s+/).filter(Boolean);
  let contact: any;
  try {
    contact = await base44.entities.Contact.create({
      first_name: nameParts[0] || email.split("@")[0],
      last_name: nameParts.slice(1).join(" ") || "",
      email,
      source: "signup",
      status: "new",
      notes: `Auto-captured from ${auth_method || "app"} ${event_type || "signup"}. User ID: ${user_id || "N/A"}`,
    });
  } catch (e) {
    console.error("Contact creation failed:", (e as Error).message);
    return Response.json({ ok: false, error: "Failed to create contact: " + (e as Error).message }, { status: 500 });
  }

  // 3. Sync to Google Drive (non-blocking — contact is already saved)
  const driveResult: any = { ok: false, error: null };
  try {
    await syncToGoogleDrive(base44, contact, user_id);
    driveResult.ok = true;
  } catch (e) {
    driveResult.error = (e as Error).message;
    console.error("Google Drive sync failed:", (e as Error).message);
  }

  // 4. Sync to Supabase (non-blocking)
  const supabaseResult: any = { ok: false, error: null };
  try {
    await syncToSupabase(contact, user_id);
    supabaseResult.ok = true;
  } catch (e) {
    supabaseResult.error = (e as Error).message;
    console.error("Supabase sync failed:", (e as Error).message);
  }

  return Response.json({
    ok: true,
    contact_id: contact.id,
    google_drive: driveResult,
    supabase: supabaseResult,
  });
}

// ---- Google Drive sync (Sheets API via Drive access token) ----
async function syncToGoogleDrive(base44: any, contact: any, userId: string) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");
  if (!accessToken) throw new Error("Google Drive not connected");

  const authHeader = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

  // Search for existing spreadsheet
  const q = encodeURIComponent(`name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!searchRes.ok) throw new Error(`Drive search failed: ${searchRes.status}`);
  const search = await searchRes.json();
  let spreadsheetId = search.files && search.files.length > 0 ? search.files[0].id : null;

  // Create spreadsheet with headers if not found
  if (!spreadsheetId) {
    const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({ properties: { title: SPREADSHEET_NAME } }),
    });
    if (!createRes.ok) throw new Error(`Sheets create failed: ${createRes.status}`);
    const created = await createRes.json();
    spreadsheetId = created.spreadsheetId;

    // Add header row
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:J1?valueInputOption=RAW`, {
      method: "PUT",
      headers: authHeader,
      body: JSON.stringify({ values: [HEADERS] }),
    });
  }

  // Append contact row
  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:J:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        values: [[
          contact.id, contact.first_name || "", contact.last_name || "", contact.email || "",
          contact.phone || "", contact.status || "new", contact.source || "signup",
          new Date().toISOString(), contact.notes || "", userId || "",
        ]],
      }),
    }
  );
  if (!appendRes.ok) throw new Error(`Sheets append failed: ${appendRes.status}`);
}

// ---- Supabase sync (Management API + PostgREST) ----
async function syncToSupabase(contact: any, userId: string) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error("SUPABASE_ACCESS_TOKEN not set");

  // List projects and pick the first
  const projectsRes = await fetch("https://api.supabase.com/v1/projects", { headers: { Authorization: `Bearer ${token}` } });
  if (!projectsRes.ok) throw new Error(`Supabase list projects failed: ${projectsRes.status}`);
  const projects = await projectsRes.json();
  if (!projects || projects.length === 0) throw new Error("No Supabase projects found");

  const ref = projects[0].id;

  // Create table if not exists
  try {
    await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `CREATE TABLE IF NOT EXISTS crm_contacts (
          id TEXT PRIMARY KEY,
          first_name TEXT,
          last_name TEXT,
          email TEXT UNIQUE,
          phone TEXT,
          status TEXT DEFAULT 'new',
          source TEXT,
          notes TEXT,
          user_id TEXT,
          created_date TIMESTAMPTZ DEFAULT NOW(),
          synced_at TIMESTAMPTZ DEFAULT NOW()
        );`,
      }),
    });
  } catch { /* table may already exist */ }

  // Get service role key
  const keysRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, { headers: { Authorization: `Bearer ${token}` } });
  if (!keysRes.ok) throw new Error(`Supabase api-keys failed: ${keysRes.status}`);
  const keys = await keysRes.json();
  const serviceKey = (keys || []).find((k: any) => k.name === "service_role")?.api_key;
  if (!serviceKey) throw new Error("Supabase service_role key not found");

  // Upsert contact
  const upsertRes = await fetch(`https://${ref}.supabase.co/rest/v1/crm_contacts`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({
      id: contact.id,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      status: contact.status,
      source: contact.source,
      notes: contact.notes,
      user_id: userId || null,
      synced_at: new Date().toISOString(),
    }),
  });
  if (!upsertRes.ok) throw new Error(`Supabase upsert failed: ${upsertRes.status}`);
}