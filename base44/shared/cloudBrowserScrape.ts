// cloudBrowserScrape.ts — Client for the self-hosted cloud browser engine.
// Connects to the Playwright-based browser API server (the user's
// Browserbase replacement) using ENGINE_URL and ENGINE_API_KEY secrets.
//
// API surface (from the browser-engine server.js):
//   POST /sessions            → { id, ... }
//   POST /sessions/:id/action → action-specific result
//   DELETE /sessions/:id      → close session
//
// Actions: goto, click, type, extract_text, extract_html, extract_table,
//          extract_json, ai_extract, crawl, paginate, screenshot,
//          solve_captcha, wait_for_selector, wait_for_timeout, scroll, etc.

import { secrets } from 'base44:runtime';

async function getEngineConfig() {
  const url = secrets.get('ENGINE_URL');
  const key = secrets.get('ENGINE_API_KEY');
  if (!url || !key) {
    throw new Error('Cloud browser engine not configured. Set ENGINE_URL and ENGINE_API_KEY secrets.');
  }
  return { baseUrl: url.replace(/\/$/, ''), key };
}

export async function isEngineConfigured() {
  try {
    await getEngineConfig();
    return true;
  } catch {
    return false;
  }
}

async function engineFetch(path, options = {}) {
  const { baseUrl, key } = await getEngineConfig();
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) {
    const errMsg = typeof body === 'object' && body?.error ? body.error : `Engine error ${res.status}: ${text.slice(0, 200)}`;
    throw new Error(errMsg);
  }
  return body;
}

export async function createSession(opts = {}) {
  return engineFetch('/sessions', {
    method: 'POST',
    body: JSON.stringify({
      viewport: { width: 1280, height: 800 },
      ...opts,
    }),
  });
}

export async function closeSession(sessionId) {
  if (!sessionId) return;
  try {
    await engineFetch(`/sessions/${sessionId}`, { method: 'DELETE' });
  } catch { /* best-effort */ }
}

export async function executeAction(sessionId, action, params = {}) {
  return engineFetch(`/sessions/${sessionId}/action`, {
    method: 'POST',
    body: JSON.stringify({ action, ...params }),
  });
}

// High-level: scrape a URL — navigate, wait for content, extract text + HTML.
// Returns the raw page content for AI analysis.
export async function scrapePage(url, opts = {}) {
  const { timeout = 45000, waitMs = 3000, screenshot = false } = opts;
  const session = await createSession();
  try {
    await executeAction(session.id, 'goto', { url, timeout, waitUntil: 'domcontentloaded' });
    // Wait for dynamic content (JS-rendered pages like Facebook, Reddit)
    if (waitMs > 0) {
      await executeAction(session.id, 'wait_for_timeout', { timeout: waitMs });
    }
    // Scroll down to load more content (infinite scroll pages)
    try {
      await executeAction(session.id, 'scroll', { direction: 'down', amount: 2000 });
      await executeAction(session.id, 'wait_for_timeout', { timeout: 1500 });
      await executeAction(session.id, 'scroll', { direction: 'down', amount: 2000 });
      await executeAction(session.id, 'wait_for_timeout', { timeout: 1500 });
    } catch { /* some pages may not support scroll */ }

    const textResult = await executeAction(session.id, 'extract_text', {});
    const htmlResult = await executeAction(session.id, 'extract_html', {});

    let screenshotUrl = null;
    if (screenshot) {
      try {
        const ss = await executeAction(session.id, 'screenshot', { fullPage: true });
        screenshotUrl = ss?.screenshot || ss?.url || ss?.data || null;
      } catch { /* screenshot optional */ }
    }

    const text = textResult?.text || textResult?.data || textResult?.value || '';
    const html = htmlResult?.html || htmlResult?.data || htmlResult?.value || '';

    return {
      url,
      text: typeof text === 'string' ? text : JSON.stringify(text),
      html: typeof html === 'string' ? html : JSON.stringify(html),
      screenshot_url: screenshotUrl,
      sessionId: session.id,
      method: 'cloud-browser',
    };
  } finally {
    await closeSession(session.id);
  }
}

// High-level: scrape a page with login/cookie context (for Facebook groups
// that require authentication). Pass imported cookies to start logged in.
export async function scrapePageWithCookies(url, cookies = [], opts = {}) {
  const { timeout = 45000, waitMs = 3000 } = opts;
  const session = await createSession();
  try {
    // Import cookies before navigating (for authenticated sessions)
    if (cookies?.length) {
      try {
        await executeAction(session.id, 'import_cookies', { cookies });
      } catch { /* cookies may fail on some engines */ }
    }
    await executeAction(session.id, 'goto', { url, timeout, waitUntil: 'domcontentloaded' });
    if (waitMs > 0) {
      await executeAction(session.id, 'wait_for_timeout', { timeout: waitMs });
    }
    try {
      await executeAction(session.id, 'scroll', { direction: 'down', amount: 2000 });
      await executeAction(session.id, 'wait_for_timeout', { timeout: 1500 });
    } catch {}

    const textResult = await executeAction(session.id, 'extract_text', {});
    const htmlResult = await executeAction(session.id, 'extract_html', {});

    const text = textResult?.text || textResult?.data || textResult?.value || '';
    const html = htmlResult?.html || htmlResult?.data || htmlResult?.value || '';

    return {
      url,
      text: typeof text === 'string' ? text : JSON.stringify(text),
      html: typeof html === 'string' ? html : JSON.stringify(html),
      sessionId: session.id,
      method: 'cloud-browser-auth',
    };
  } finally {
    await closeSession(session.id);
  }
}

// High-level: crawl multiple pages with pagination
export async function scrapePaginated(url, maxPages = 3, opts = {}) {
  const { timeout = 45000, waitMs = 2000 } = opts;
  const session = await createSession();
  const pages = [];
  try {
    await executeAction(session.id, 'goto', { url, timeout, waitUntil: 'domcontentloaded' });
    if (waitMs > 0) await executeAction(session.id, 'wait_for_timeout', { timeout: waitMs });

    for (let i = 0; i < maxPages; i++) {
      const textResult = await executeAction(session.id, 'extract_text', {});
      const htmlResult = await executeAction(session.id, 'extract_html', {});
      pages.push({
        page: i + 1,
        text: textResult?.text || textResult?.data || '',
        html: htmlResult?.html || htmlResult?.data || '',
      });
      if (i < maxPages - 1) {
        try {
          await executeAction(session.id, 'paginate', {});
          await executeAction(session.id, 'wait_for_timeout', { timeout: waitMs });
        } catch {
          break; // no more pages
        }
      }
    }
    return { url, pages, sessionId: session.id, method: 'cloud-browser-paginated' };
  } finally {
    await closeSession(session.id);
  }
}