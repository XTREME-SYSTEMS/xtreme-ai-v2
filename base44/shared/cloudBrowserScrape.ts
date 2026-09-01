// cloudBrowserScrape.ts — Client for the self-hosted cloud browser engine.
// Connects to the Playwright-based browser API server using ENGINE_URL and
// ENGINE_API_KEY secrets.
//
// Engine API (v3.0.0):
//   POST /sessions              → { sessionId, status, cdpUrl, ... }
//   POST /sessions/:id/execute  → action-specific result
//   GET  /sessions/:id          → session status
//   DELETE /sessions/:id        → close session
//
// Execute body: { action_type: <action>, ...action-specific-fields }
//   - goto:            { action_type: 'goto', value: <url> }
//   - wait_for_timeout: { action_type: 'wait_for_timeout', value: <ms> }
//   - scroll:          { action_type: 'scroll', value: 'down' | 'up' }
//   - extract_text:    { action_type: 'extract_text', selector: <css> }
//   - extract_html:    { action_type: 'extract_html', selector: <css> }
//   - screenshot:       { action_type: 'screenshot', value: true }
//   - import_cookies:  { action_type: 'import_cookies', cookies: [...] }
//
// Responses: extract_text/extract_html return content in `data` field;
// screenshot returns `url` and `base64`.

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
  const result = await engineFetch('/sessions', {
    method: 'POST',
    body: JSON.stringify({
      viewport: { width: 1280, height: 800 },
      ...opts,
    }),
  });
  // Normalize: engine returns sessionId, we use id internally
  if (result && result.sessionId && !result.id) {
    result.id = result.sessionId;
  }
  return result;
}

export async function closeSession(sessionId) {
  if (!sessionId) return;
  try {
    await engineFetch(`/sessions/${sessionId}`, { method: 'DELETE' });
  } catch { /* best-effort */ }
}

export async function executeAction(sessionId, actionType, params = {}) {
  return engineFetch(`/sessions/${sessionId}/execute`, {
    method: 'POST',
    body: JSON.stringify({ action_type: actionType, ...params }),
  });
}

// High-level: scrape a URL — navigate, wait for content, extract text + HTML.
// Returns the raw page content for AI analysis.
export async function scrapePage(url, opts = {}) {
  const { timeout = 45000, waitMs = 3000, screenshot = false } = opts;
  const session = await createSession();
  try {
    await executeAction(session.id, 'goto', { value: url });
    // Wait for dynamic content (JS-rendered pages like Facebook, Reddit)
    if (waitMs > 0) {
      await executeAction(session.id, 'wait_for_timeout', { value: waitMs });
    }
    // Scroll down to load more content (infinite scroll pages)
    try {
      await executeAction(session.id, 'scroll', { value: 'down' });
      await executeAction(session.id, 'wait_for_timeout', { value: 1500 });
      await executeAction(session.id, 'scroll', { value: 'down' });
      await executeAction(session.id, 'wait_for_timeout', { value: 1500 });
    } catch { /* some pages may not support scroll */ }

    const textResult = await executeAction(session.id, 'extract_text', { selector: 'body' });
    const htmlResult = await executeAction(session.id, 'extract_html', { selector: 'body' });

    let screenshotUrl = null;
    if (screenshot) {
      try {
        const ss = await executeAction(session.id, 'screenshot', { value: true });
        screenshotUrl = ss?.url || null;
      } catch { /* screenshot optional */ }
    }

    return {
      url,
      text: textResult?.data || '',
      html: htmlResult?.data || '',
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
    await executeAction(session.id, 'goto', { value: url });
    if (waitMs > 0) {
      await executeAction(session.id, 'wait_for_timeout', { value: waitMs });
    }
    try {
      await executeAction(session.id, 'scroll', { value: 'down' });
      await executeAction(session.id, 'wait_for_timeout', { value: 1500 });
    } catch {}

    const textResult = await executeAction(session.id, 'extract_text', { selector: 'body' });
    const htmlResult = await executeAction(session.id, 'extract_html', { selector: 'body' });

    return {
      url,
      text: textResult?.data || '',
      html: htmlResult?.data || '',
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
    await executeAction(session.id, 'goto', { value: url });
    if (waitMs > 0) await executeAction(session.id, 'wait_for_timeout', { value: waitMs });

    for (let i = 0; i < maxPages; i++) {
      const textResult = await executeAction(session.id, 'extract_text', { selector: 'body' });
      const htmlResult = await executeAction(session.id, 'extract_html', { selector: 'body' });
      pages.push({
        page: i + 1,
        text: textResult?.data || '',
        html: htmlResult?.data || '',
      });
      if (i < maxPages - 1) {
        try {
          await executeAction(session.id, 'scroll', { value: 'down' });
          await executeAction(session.id, 'wait_for_timeout', { value: waitMs });
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