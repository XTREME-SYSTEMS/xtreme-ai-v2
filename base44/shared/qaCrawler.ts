// qaCrawler.ts — Shared QA crawler using Browserbase + Playwright.
// Crawls the published app, captures console errors, JS exceptions, network
// failures, broken images, and slow loads. Falls back to fetch-based health
// checks if Browserbase/Playwright is unavailable.

import { secrets } from 'base44:runtime';

const BB_API = 'https://api.browserbase.com/v1';

interface Finding {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  url: string;
  message: string;
}

interface CrawlResult {
  pages_crawled: number;
  findings: Finding[];
  crawled_at: string;
  method: string;
}

async function createBBSession(): Promise<string> {
  const apiKey = secrets.get('BROWSERBASE_API_KEY');
  const projectId = secrets.get('BROWSERBASE_PROJECT_ID');
  if (!apiKey || !projectId) throw new Error('Browserbase secrets not set');
  const res = await fetch(`${BB_API}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-BB-API-Key': apiKey },
    body: JSON.stringify({ projectId }),
  });
  if (!res.ok) throw new Error(`BB session failed (${res.status})`);
  const data = await res.json();
  return data.id;
}

async function releaseBBSession(sessionId: string): Promise<void> {
  const apiKey = secrets.get('BROWSERBASE_API_KEY');
  if (!apiKey) return;
  try {
    await fetch(`${BB_API}/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-BB-API-Key': apiKey },
      body: JSON.stringify({ status: 'REQUEST_RELEASE' }),
    });
  } catch { /* best-effort */ }
}

// Public routes to seed the crawl (beyond links found on the home page).
const SEED_ROUTES = [
  '/', '/pricing', '/free-tools', '/free-audit',
  '/login', '/register', '/forgot-password', '/coupon',
];

/**
 * Crawl the site using a real browser via Browserbase + Playwright.
 * Captures console errors, JS exceptions, network failures, broken images,
 * and slow page loads. Scrolls each page to trigger lazy content.
 */
async function crawlWithBrowser(
  baseUrl: string, maxPages: number, pageTimeout: number
): Promise<CrawlResult> {
  const { chromium } = await import('npm:playwright-core@1.62.1');
  const apiKey = secrets.get('BROWSERBASE_API_KEY');
  const sessionId = await createBBSession();
  const findings: Finding[] = [];
  const visited = new Set<string>();
  const queue: string[] = SEED_ROUTES.map((r) => baseUrl + r);

  try {
    const browser = await chromium.connectOverCDP(
      `wss://connect.browserbase.com?apiKey=${apiKey}&session=${sessionId}`
    );
    const page = await browser.newPage();
    let currentUrl = '';

    page.on('console', (msg: any) => {
      if (msg.type() === 'error') {
        findings.push({ type: 'console_error', severity: 'high', url: currentUrl, message: msg.text().slice(0, 500) });
      }
    });
    page.on('pageerror', (err: Error) => {
      findings.push({ type: 'js_exception', severity: 'critical', url: currentUrl, message: (err.message || String(err)).slice(0, 500) });
    });
    page.on('response', (response: any) => {
      const status = response.status();
      if (status >= 400 && status !== 404) {
        findings.push({ type: 'network_failure', severity: status >= 500 ? 'critical' : 'high', url: currentUrl, message: `${status} ${response.statusText()} — ${response.url().slice(0, 200)}` });
      }
    });

    while (queue.length > 0 && visited.size < maxPages) {
      const url = queue.shift()!;
      if (visited.has(url)) continue;
      visited.add(url);
      currentUrl = url;

      try {
        const start = Date.now();
        await page.goto(url, { timeout: pageTimeout, waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(800);

        // Scroll to bottom to trigger lazy loads
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        }).catch(() => {});
        await page.waitForTimeout(400);

        const loadTime = Date.now() - start;
        if (loadTime > 5000) {
          findings.push({ type: 'slow_load', severity: 'medium', url, message: `Page took ${loadTime}ms to load` });
        }

        // Check for broken images
        const brokenImgs = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('img'))
            .filter((img: any) => img.complete && img.naturalWidth === 0 && img.src && !img.src.startsWith('data:'))
            .map((img: any) => img.src);
        }).catch(() => []);
        for (const src of brokenImgs.slice(0, 5)) {
          findings.push({ type: 'broken_image', severity: 'medium', url, message: `Broken image: ${src.slice(0, 200)}` });
        }

        // Check basic SEO
        const seo = await page.evaluate(() => {
          return {
            title: document.title,
            hasMetaDesc: !!document.querySelector('meta[name="description"]'),
            hasH1: !!document.querySelector('h1'),
            hasSchema: !!document.querySelector('script[type="application/ld+json"]'),
          };
        }).catch(() => ({ title: '', hasMetaDesc: false, hasH1: false, hasSchema: false }));
        if (!seo.hasMetaDesc) findings.push({ type: 'missing_seo', severity: 'low', url, message: 'Missing meta description' });
        if (!seo.hasH1) findings.push({ type: 'missing_seo', severity: 'low', url, message: 'Missing H1 heading' });
        if (!seo.hasSchema) findings.push({ type: 'missing_schema', severity: 'low', url, message: 'No JSON-LD structured data' });

        // Collect internal links
        const links = await page.evaluate((base: string) => {
          return Array.from(document.querySelectorAll('a[href]'))
            .map((a: any) => a.href)
            .filter((href: string) => href.startsWith(base) && !href.includes('#'));
        }, baseUrl).catch(() => []);
        for (const link of links) {
          if (!visited.has(link) && !queue.includes(link)) queue.push(link);
        }
      } catch (err: any) {
        findings.push({ type: 'navigation_error', severity: 'high', url, message: (err?.message || 'Navigation failed').slice(0, 300) });
      }
    }

    await browser.close();
  } finally {
    await releaseBBSession(sessionId);
  }

  return { pages_crawled: visited.size, findings, crawled_at: new Date().toISOString(), method: 'browserbase' };
}

/**
 * Fallback: fetch-based health check for each seed route.
 * Checks HTTP status, SSL, basic HTML structure, and load time.
 */
async function crawlWithFetch(
  baseUrl: string, maxPages: number
): Promise<CrawlResult> {
  const findings: Finding[] = [];
  const urls = SEED_ROUTES.slice(0, maxPages).map((r) => baseUrl + r);
  let crawled = 0;

  for (const url of urls) {
    crawled++;
    const start = Date.now();
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; QABot/1.0)' },
        signal: AbortSignal.timeout(20000),
        redirect: 'follow',
      });
      const html = await res.text();
      const loadTime = Date.now() - start;

      if (res.status >= 400) {
        findings.push({ type: 'network_failure', severity: res.status >= 500 ? 'critical' : 'high', url, message: `${res.status} ${res.statusText}` });
      }
      if (loadTime > 5000) {
        findings.push({ type: 'slow_load', severity: 'medium', url, message: `Page took ${loadTime}ms to load` });
      }
      if (!/<meta[^>]+name=["']description["']/i.test(html)) {
        findings.push({ type: 'missing_seo', severity: 'low', url, message: 'Missing meta description' });
      }
      if (!/<h1/i.test(html)) {
        findings.push({ type: 'missing_seo', severity: 'low', url, message: 'Missing H1 heading' });
      }
      if (!/application\/ld\+json/i.test(html)) {
        findings.push({ type: 'missing_schema', severity: 'low', url, message: 'No JSON-LD structured data' });
      }
    } catch (err: any) {
      findings.push({ type: 'navigation_error', severity: 'high', url, message: (err?.message || 'Fetch failed').slice(0, 300) });
    }
  }

  return { pages_crawled: crawled, findings, crawled_at: new Date().toISOString(), method: 'fetch' };
}

/**
 * Crawl the site — tries Browserbase + Playwright first, falls back to fetch.
 */
export async function crawlSite(
  baseUrl: string,
  opts?: { maxPages?: number; timeout?: number }
): Promise<CrawlResult> {
  const maxPages = opts?.maxPages || 10;
  const timeout = opts?.timeout || 25000;

  try {
    return await crawlWithBrowser(baseUrl, maxPages, timeout);
  } catch (err) {
    console.log(`Browserbase crawl failed, falling back to fetch: ${err?.message || err}`);
    return await crawlWithFetch(baseUrl, maxPages);
  }
}