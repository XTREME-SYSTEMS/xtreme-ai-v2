// Full CRM → Google Drive sync. Exports ALL contacts to a Google Sheet
// ("LGNY CRM Contacts"), replacing all rows. Called manually from the
// Contacts page or can be scheduled. Uses the authorized Google Drive
// connector (drive scope covers Sheets API).

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const SPREADSHEET_NAME = "LGNY CRM Contacts";
const HEADERS = ["ID", "First Name", "Last Name", "Email", "Phone", "Title", "Account", "Status", "Source", "Lead Score", "Created Date", "Notes"];

export default async function (req: Request) {
  const base44 = createClientFromRequest(req);

  // 1. Fetch all contacts (paginated)
  const all: any[] = [];
  let batch = await base44.entities.Contact.list("-created_date", 500);
  all.push(...batch);
  // If there are more, keep fetching (list returns up to 500 per call)
  while (batch.length === 500) {
    batch = await base44.entities.Contact.list("-created_date", 500, all.length);
    all.push(...batch);
    if (batch.length < 500) break;
  }

  // 2. Get Google Drive access token
  const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");
  if (!accessToken) return Response.json({ ok: false, error: "Google Drive not connected" }, { status: 500 });
  const authHeader = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

  // 3. Find or create the spreadsheet
  const q = encodeURIComponent(`name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!searchRes.ok) return Response.json({ ok: false, error: `Drive search failed: ${searchRes.status}` }, { status: 500 });
  const search = await searchRes.json();
  let spreadsheetId = search.files && search.files.length > 0 ? search.files[0].id : null;

  if (!spreadsheetId) {
    const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST", headers: authHeader,
      body: JSON.stringify({ properties: { title: SPREADSHEET_NAME } }),
    });
    if (!createRes.ok) return Response.json({ ok: false, error: `Sheets create failed: ${createRes.status}` }, { status: 500 });
    spreadsheetId = (await createRes.json()).spreadsheetId;
  }

  // 4. Clear existing content (A1:L100000 covers header + data)
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:L100000:clear`, {
    method: "POST", headers: authHeader,
  });

  // 5. Write headers + all contact rows in one batch
  const rows = [HEADERS, ...all.map((c) => [
    c.id || "", c.first_name || "", c.last_name || "", c.email || "", c.phone || "",
    c.title || "", c.account_name || "", c.status || "new", c.source || "",
    c.lead_score ?? 0, c.created_date || "", c.notes || "",
  ])];

  const writeRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1?valueInputOption=RAW`, {
    method: "PUT", headers: authHeader,
    body: JSON.stringify({ values: rows }),
  });
  if (!writeRes.ok) return Response.json({ ok: false, error: `Sheets write failed: ${writeRes.status}` }, { status: 500 });

  return Response.json({
    ok: true,
    synced: all.length,
    spreadsheet_id: spreadsheetId,
    spreadsheet_url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  });
}