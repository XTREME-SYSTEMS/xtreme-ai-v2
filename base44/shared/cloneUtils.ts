// Shared utilities for the clone pipeline functions.
// Used by cloneAndLaunch, legalScanClone, generateRebrandPackage, and provisionApprovedClone.

export function detectIndustry(html, title) {
  const text = (html + ' ' + title).toLowerCase();
  if (text.match(/roof|roofing/)) return 'roofing';
  if (text.match(/garage|epoxy|coating/)) return 'garage floor coating';
  if (text.match(/hvac|air condition|heating/)) return 'hvac';
  if (text.match(/plumb/)) return 'plumbing';
  if (text.match(/dent|dental/)) return 'dental';
  if (text.match(/law|attorney|legal/)) return 'legal';
  if (text.match(/real estate|realtor|property/)) return 'real estate';
  if (text.match(/restaurant|food|dining/)) return 'restaurant';
  return 'general';
}

export function slugify(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Scrape a target URL and return structured data
export async function scrapeTarget(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CloneFactory/1.0)' },
    signal: AbortSignal.timeout(20000), redirect: 'follow'
  });
  const html = await res.text();
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  const colors = [...new Set((html.match(/#[0-9a-fA-F]{6}/g) || []).slice(0, 10))];
  const headings = (html.match(/<h[1-3][^>]*>([^<]*)<\/h[1-3]>/gi) || []).slice(0, 15).map(h => h.replace(/<[^>]+>/g, '').trim());
  const imgUrls = [...new Set((html.match(/<img[^>]+src=["']([^"']+)["']/gi) || []).map(m => m.match(/src=["']([^"']+)/)[1]).filter(u => u && !u.startsWith('data:')))].slice(0, 20);
  return {
    html,
    title: titleMatch ? titleMatch[1].trim() : '',
    meta_description: descMatch ? descMatch[1].trim() : '',
    colors,
    headings,
    imgUrls,
    html_size: html.length
  };
}

// Create a logger that accumulates log lines
export function createLogger() {
  const logs = [];
  const log = (m) => logs.push(`${new Date().toISOString().slice(11, 19)} ${m}`);
  return { logs, log };
}