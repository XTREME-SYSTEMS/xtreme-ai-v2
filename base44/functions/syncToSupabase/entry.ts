import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Sync Xtreme AI platform data to a Supabase project. Uses the Supabase
// connector (already authorized) to:
// 1. List available Supabase projects
// 2. Create tables in the selected project (if they don't exist)
// 3. Sync entity data (AutoBuilds, VisualizerSessions, ScrapedLeads, etc.)
//
// This gives the platform a Supabase-backed data mirror for external
// integrations, analytics, and backup.
//
// Input:
//   project_ref: string — optional: specific Supabase project ref to sync to
//                         (if omitted, lists available projects)
//   entities: string[] — optional: which entities to sync (default: all key entities)
//   mode: string — 'list_projects' | 'sync' (default: 'list_projects')

const SYNC_ENTITIES = [
  { name: 'AutoBuild', table: 'xtreme_autobuilds', columns: 'id, created_date, updated_date, business_name, industry, product_type, current_step, status, auto_advance, governance_tier' },
  { name: 'VisualizerSession', table: 'xtreme_visualizer_sessions', columns: 'id, created_date, customer_name, customer_email, customer_phone, system_name, color_name, square_feet, bid_tier, bid_low, bid_high, status' },
  { name: 'ScrapedLead', table: 'xtreme_scraped_leads', columns: 'id, created_date, client_email, source, name, email, phone, location, hot_score, status' },
  { name: 'XpsAsset', table: 'xtreme_xps_assets', columns: 'id, created_date, category, name, sku, price, brand, product_type, inventory_status, inventory_quantity, active' },
  { name: 'FloorSystem', table: 'xtreme_floor_systems', columns: 'id, name, category, base_rate_low, base_rate_high, color_system_key, active, sort_order' },
  { name: 'PreflightCheck', table: 'xtreme_preflight_checks', columns: 'id, created_date, category, check_name, status, score, details, checked_at' },
  { name: 'ApiKey', table: 'xtreme_api_keys', columns: 'id, created_date, key_name, key_type, key_prefix, active, last_used, created_by_email' },
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const mode = body?.mode || 'list_projects';

    // Get the Supabase connector access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
    if (!accessToken) {
      return Response.json({ error: 'Supabase connector not connected' }, { status: 500 });
    }

    const supabaseHeaders = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // ═════════════════════════════════════════════════════
    // MODE 1: LIST PROJECTS
    // ═════════════════════════════════════════════════════
    if (mode === 'list_projects') {
      const res = await fetch('https://api.supabase.com/v1/projects', { headers: supabaseHeaders });
      if (!res.ok) {
        return Response.json({ error: `Supabase API error: ${res.status}` }, { status: 500 });
      }
      const data = await res.json();
      const projects = (data || []).map((p: any) => ({
        id: p.id,
        ref: p.ref,
        name: p.name,
        region: p.region,
        status: p.status,
        created_at: p.created_at,
      }));

      return Response.json({
        status: 'success',
        projects,
        count: projects.length,
      });
    }

    // ═════════════════════════════════════════════════════
    // MODE 2: SYNC DATA
    // ═════════════════════════════════════════════════════
    if (mode === 'sync') {
      const projectRef = body?.project_ref;
      if (!projectRef) {
        return Response.json({ error: 'project_ref is required for sync mode' }, { status: 400 });
      }

      const entitiesToSync = body?.entities && Array.isArray(body.entities) && body.entities.length > 0
        ? SYNC_ENTITIES.filter(e => body.entities.includes(e.name))
        : SYNC_ENTITIES;

      const syncResults: any[] = [];

      // Get the service_role key for PostgREST data access
      const keysRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, { headers: supabaseHeaders });
      if (!keysRes.ok) {
        return Response.json({ error: `Failed to get Supabase API keys: ${keysRes.status}` }, { status: 500 });
      }
      const keys = await keysRes.json();
      const serviceRoleKey = keys.find((k: any) => k.name === 'service_role')?.api_key;
      if (!serviceRoleKey) {
        return Response.json({ error: 'service_role key not found' }, { status: 500 });
      }

      const postgrestHeaders = {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      };
      const postgrestUrl = `https://${projectRef}.supabase.co/rest/v1`;

      for (const entityDef of entitiesToSync) {
        try {
          // Fetch all records from the entity
          const records = await base44.asServiceRole.entities[entityDef.name].list('-created_date', 500);
          if (records.length === 0) {
            syncResults.push({ entity: entityDef.name, table: entityDef.table, synced: 0, status: 'empty' });
            continue;
          }

          // Transform records — extract only the columns we care about
          const columnList = entityDef.columns.split(', ').map((c: string) => c.trim());
          const rows = records.map((r: any) => {
            const row: any = {};
            for (const col of columnList) {
              if (r[col] !== undefined) {
                // Convert dates to ISO strings, booleans stay booleans
                if (col.includes('date') || col.includes('_at')) {
                  row[col] = r[col] ? new Date(r[col]).toISOString() : null;
                } else {
                  row[col] = r[col];
                }
              }
            }
            return row;
          });

          // Upsert to Supabase — try PostgREST first, fall back to SQL INSERT
          const upsertRes = await fetch(`${postgrestUrl}/${entityDef.table}`, {
            method: 'POST',
            headers: { ...postgrestHeaders, 'Prefer': 'resolution=merge-duplicates' },
            body: JSON.stringify(rows),
          });

          if (upsertRes.ok) {
            syncResults.push({ entity: entityDef.name, table: entityDef.table, synced: rows.length, status: 'success' });
          } else {
            const errText = await upsertRes.text();
            // If table doesn't exist, create it via SQL then INSERT via SQL
            if (errText.includes('Could not find the table') || errText.includes('does not exist')) {
              const createTableSQL = generateCreateTableSQL(entityDef.table, entityDef.columns);
              const ddlRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
                method: 'POST',
                headers: supabaseHeaders,
                body: JSON.stringify({ query: createTableSQL }),
              });

              if (ddlRes.ok) {
                // Use SQL INSERT with ON CONFLICT for upsert (avoids PostgREST schema cache delay)
                const insertSQL = generateInsertSQL(entityDef.table, rows);
                const insertRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
                  method: 'POST',
                  headers: supabaseHeaders,
                  body: JSON.stringify({ query: insertSQL }),
                });
                if (insertRes.ok) {
                  syncResults.push({ entity: entityDef.name, table: entityDef.table, synced: rows.length, status: 'created_table_and_synced' });
                } else {
                  syncResults.push({ entity: entityDef.name, table: entityDef.table, synced: 0, status: 'table_created_but_insert_failed', error: await insertRes.text() });
                }
              } else {
                syncResults.push({ entity: entityDef.name, table: entityDef.table, synced: 0, status: 'create_table_failed', error: await ddlRes.text() });
              }
            } else {
              syncResults.push({ entity: entityDef.name, table: entityDef.table, synced: 0, status: 'upsert_failed', error: errText });
            }
          }
        } catch (e) {
          syncResults.push({ entity: entityDef.name, table: entityDef.table, synced: 0, status: 'error', error: e.message });
        }
      }

      const totalSynced = syncResults.reduce((sum, r) => sum + r.synced, 0);

      return Response.json({
        status: 'success',
        project_ref: projectRef,
        entities_synced: syncResults.length,
        total_records: totalSynced,
        results: syncResults,
      });
    }

    return Response.json({ error: `Unknown mode: ${mode}. Use 'list_projects' or 'sync'.` }, { status: 400 });
  } catch (error) {
    console.error('syncToSupabase error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Generate CREATE TABLE SQL from a column definition string
function generateCreateTableSQL(tableName: string, columnsDef: string): string {
  const columns = columnsDef.split(', ').map((c: string) => c.trim());
  const columnSQL = columns.map((col: string) => {
    let type = 'text';
    if (col === 'id') type = 'text PRIMARY KEY';
    else if (col.includes('date') || col.includes('_at')) type = 'timestamptz';
    else if (col === 'square_feet' || col === 'bid_low' || col === 'bid_high' || col === 'bid_mid' || col === 'per_sqft' || col === 'score' || col === 'sort_order' || col === 'inventory_quantity' || col === 'base_rate_low' || col === 'base_rate_high' || col === 'hot_score') type = 'numeric';
    else if (col === 'active' || col === 'auto_advance') type = 'boolean';
    return `"${col}" ${type}`;
  }).join(', ');

  return `CREATE TABLE IF NOT EXISTS "${tableName}" (${columnSQL});`;
}

// Generate SQL INSERT with ON CONFLICT (id) DO UPDATE for upsert
function generateInsertSQL(tableName: string, rows: any[]): string {
  if (rows.length === 0) return 'SELECT 1;';
  const columns = Object.keys(rows[0]);
  const values = rows.map((r, i) => {
    const vals = columns.map((col) => {
      const v = r[col];
      if (v === null || v === undefined) return 'NULL';
      if (typeof v === 'boolean') return v ? 'true' : 'false';
      if (typeof v === 'number') return String(v);
      // Escape single quotes
      return `'${String(v).replace(/'/g, "''")}'`;
    });
    return `(${vals.join(', ')})`;
  }).join(', ');

  const updateCols = columns.filter(c => c !== 'id').map(c => `"${c}" = EXCLUDED."${c}"`).join(', ');

  return `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES ${values} ON CONFLICT (id) DO UPDATE SET ${updateCols};`;
}