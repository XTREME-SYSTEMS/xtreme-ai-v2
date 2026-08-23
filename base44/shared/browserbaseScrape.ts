// browserbaseScrape.ts — Shared Browserbase session management + web scraping.
// Used by runDiscoveryScrape and discoverBusinessLeads to scrape web pages
// using a remote Browserbase browser session.
//
// Approach: create a session via Browserbase REST API, connect via Playwright
// CDP, navigate, extract content. Falls back to direct fetch() if
// Browserbase/Playwright is unavailable (Deno runtime constraints).

import { secrets } from 'base44:runtime';

const BB_API = 'https://api.browserbase.com/v1';

/**
 * Create a new Browserbase browser session.
 */
export async function createSession(): Promise<{ id: string; createdAt: string }> {
  const apiKey = secrets.get('BROWSERBASE_API_KEY');
  const projectId = secrets.get('BROWSERBASE_PROJECT_ID');

  if (!apiKey || !projectId) {
    throw new Error('BROWSERBASE_API_KEY or BROWSERBASE_PROJECT_ID not set');
  }

  const res = await fetch(`${BB_API}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-BB-API-Key': apiKey,
    },
    body: JSON.stringify({ projectId }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Browserbase session creation failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return { id: data.id, createdAt: data.createdAt };
}

/**
 * Release a Browserbase session (free the browser).
 */
export async function releaseSession(sessionId: string): Promise<void> {
  const apiKey = secrets.get('BROWSERBASE_API_KEY');
  if (!apiKey || !sessionId) return;

  try {
    await fetch(`${BB_API}/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-BB-API-Key': apiKey,
      },
      body: JSON.stringify({ status: 'REQUEST_RELEASE' }),
    });
  } catch {
    // Best-effort — don't throw on release failure
  }
}

/**
 * Scrape a URL using Browserbase + Playwright (remote CDP connection).
 * Returns the page title, text content, and raw HTML.
 *
 * Falls back to direct fetch() if Playwright cannot be loaded in the runtime.
 */
export async function scrapeUrl(
  url: string,
  opts?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'; timeout?: number }
): Promise<{ title: string; text: string; html: string; url: string; method: string }> {
  const waitUntil = opts?.waitUntil || 'domcontentloaded';
  const timeout = opts?.timeout || 30000;

  // Try Browserbase + Playwright first
  try {
    const { chromium } = await import('npm:playwright-core@1.62.1');
    const apiKey = secrets.get('BROWSERBASE_API_KEY');
    const session = await createSession();

    try {
      const browser = await chromium.connectOverCDP(
        `wss://connect.browserbase.com?apiKey=${apiKey}&session=${session.id}`
      );
      const page = await browser.newPage();
      await page.goto(url, { timeout, waitUntil });
      const title = await page.title();
      const text = await page.innerText('body').catch(() => '');
      const html = await page.content();
      await browser.close();
      return { title, text: text.slice(0, 50000), html: html.slice(0, 100000), url, method: 'browserbase' };
    } finally {
      await releaseSession(session.id);
    }
  } catch (bbError) {
    // Fall back to direct fetch
    console.log(`Browserbase scrape failed for ${url}, falling back to fetch: ${bbError?.message || bbError}`);
  }

  // Direct fetch fallback
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DiscoveryBot/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(timeout),
  });

  const html = await res.text();
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || '';
  // Strip HTML tags for text content
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50000);

  return { title, text, html: html.slice(0, 100000), url, method: 'fetch' };
}

/**
 * Scrape multiple URLs in sequence (to avoid rate limits).
 */
export async function scrapeUrls(
  urls: string[],
  opts?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'; timeout?: number }
): Promise<Array<{ url: string; title: string; text: string; error?: string }>> {
  const results: Array<{ url: string; title: string; text: string; error?: string }> = [];
  for (const url of urls) {
    try {
      const scraped = await scrapeUrl(url, opts);
      results.push({ url, title: scraped.title, text: scraped.text });
    } catch (err) {
      results.push({ url, title: '', text: '', error: err?.message || 'scrape failed' });
    }
  }
  return results;
}

/**
 * Quick website quality check — fetches a URL and returns basic health signals.
 * Used by discoverBusinessLeads to score business websites.
 */
export async function checkWebsiteHealth(url: string): Promise<{
  url: string;
  status: number;
  has_ssl: boolean;
  is_mobile_friendly: boolean;
  load_time_ms: number;
  html_size: number;
  has_schema: boolean;
  has_meta_description: boolean;
  has_h1: boolean;
  title_length: number;
  issues: Array<{ type: string; severity: string; description: string }>;
}> {
  const start = Date.now();
  const issues: Array<{ type: string; severity: string; description: string }> = [];

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DiscoveryBot/1.0)' },
      signal: AbortSignal.timeout(20000),
      redirect: 'follow',
    });
    const html = await res.text();
    const loadTime = Date.now() - start;

    const hasSsl = url.startsWith('https://');
    const hasSchema = /application\/ld\+json/i.test(html) || /schema\.org/i.test(html);
    const hasMetaDesc = /<meta[^>]+name=["']description["']/i.test(html);
    const hasH1 = /<h1/i.test(html);
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const titleLength = titleMatch?.[1]?.trim().length || 0;
    const isMobileFriendly = /viewport/i.test(html);

    if (!hasSsl) issues.push({ type: 'no_ssl', severity: 'critical', description: 'No HTTPS — site is not secure' });
    if (loadTime > 5000) issues.push({ type: 'slow_load', severity: 'major', description: `Page took ${loadTime}ms to load` });
    if (!isMobileFriendly) issues.push({ type: 'not_mobile_friendly', severity: 'major', description: 'No viewport meta tag — likely not mobile-friendly' });
    if (!hasMetaDesc) issues.push({ type: 'poor_seo', severity: 'major', description: 'Missing meta description — poor SEO' });
    if (!hasSchema) issues.push({ type: 'missing_schema', severity: 'minor', description: 'No structured data (JSON-LD/schema.org)' });
    if (!hasH1) issues.push({ type: 'poor_content', severity: 'minor', description: 'Missing H1 heading' });
    if (titleLength < 10 || titleLength > 70) issues.push({ type: 'poor_seo', severity: 'minor', description: `Title length is ${titleLength} chars (ideal 10-70)` });
    if (html.length < 5000) issues.push({ type: 'poor_content', severity: 'major', description: 'Very little HTML content — likely a thin or broken site' });
    if (res.status >= 400) issues.push({ type: 'broken_website', severity: 'critical', description: `HTTP status ${res.status}` });

    return {
      url,
      status: res.status,
      has_ssl: hasSsl,
      is_mobile_friendly: isMobileFriendly,
      load_time_ms: loadTime,
      html_size: html.length,
      has_schema: hasSchema,
      has_meta_description: hasMetaDesc,
      has_h1: hasH1,
      title_length: titleLength,
      issues,
    };
  } catch (err) {
    return {
      url,
      status: 0,
      has_ssl: url.startsWith('https://'),
      is_mobile_friendly: false,
      load_time_ms: Date.now() - start,
      html_size: 0,
      has_schema: false,
      has_meta_description: false,
      has_h1: false,
      title_length: 0,
      issues: [{ type: 'broken_website', severity: 'critical', description: err?.message || 'Failed to fetch website' }],
    };
  }
}