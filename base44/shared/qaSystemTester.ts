// qaSystemTester.ts — Shared system testing module using Browserbase + Playwright.
// Tests the INTERNAL system: logs in, navigates all pages, clicks every button,
// fills forms, takes screenshots, tests backend functions, and scores the system.
// Used by qaTestSystem (QA Agent) and humanizedTestPortal (Humanized Test Agent).

import { secrets } from 'base44:runtime';

const BB_API = 'https://api.browserbase.com/v1';

export interface QAFinding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  page_url: string;
  page_name: string;
  element_description: string;
  screenshot_url?: string;
  description: string;
  recommended_fix?: string;
}

export interface TestResult {
  pages_tested: number;
  buttons_clicked: number;
  functions_tested: number;
  screenshots_taken: number;
  findings: QAFinding[];
  screenshots: string[];
  score: number;
  logs: string[];
}

// ─── Browserbase Session Management ───────────────────────────

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

// ─── Screenshot Capture & Upload ──────────────────────────────

async function takeScreenshot(svc: any, page: any, name: string): Promise<string | null> {
  try {
    const buffer = await page.screenshot({ type: 'jpeg', quality: 70, fullPage: false });
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    const file = new File([blob], `qa-${name}-${Date.now()}.jpg`, { type: 'image/jpeg' });
    const res = await svc.integrations.Core.UploadFile({ file });
    return res?.file_url || null;
  } catch (e) {
    console.log(`Screenshot upload failed for ${name}: ${e?.message || e}`);
    return null;
  }
}

// ─── Error Collection ─────────────────────────────────────────

function attachErrorListeners(page: any, findings: QAFinding[], currentUrlRef: { url: string }) {
  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      findings.push({
        severity: 'high',
        category: 'console_error',
        page_url: currentUrlRef.url,
        page_name: '',
        element_description: '',
        description: `Console error: ${msg.text().slice(0, 400)}`,
      });
    }
  });
  page.on('pageerror', (err: Error) => {
    findings.push({
      severity: 'critical',
      category: 'console_error',
      page_url: currentUrlRef.url,
      page_name: '',
      element_description: '',
      description: `JS exception: ${(err.message || String(err)).slice(0, 400)}`,
    });
  });
  page.on('response', (response: any) => {
    const status = response.status();
    if (status >= 400 && status !== 404) {
      findings.push({
        severity: status >= 500 ? 'critical' : 'high',
        category: 'navigation_error',
        page_url: currentUrlRef.url,
        page_name: '',
        element_description: '',
        description: `${status} ${response.statusText()} — ${response.url().slice(0, 200)}`,
      });
    }
  });
}

// ─── Login ────────────────────────────────────────────────────

export async function loginToApp(
  page: any, baseUrl: string, email: string, password: string, logs: string[]
): Promise<boolean> {
  try {
    logs.push(`Logging in as ${email}...`);
    await page.goto(`${baseUrl}/login`, { timeout: 25000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Fill email field
    const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="mail" i]').first();
    await emailInput.fill(email);
    await page.waitForTimeout(300);

    // Fill password field
    const pwInput = await page.locator('input[type="password"]').first();
    await pwInput.fill(password);
    await page.waitForTimeout(300);

    // Click submit button
    const submitBtn = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")').first();
    await submitBtn.click();
    await page.waitForTimeout(3000);

    // Check if we're still on the login page (login failed) or navigated away
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/forgot-password')) {
      logs.push('Login failed — still on login page');
      return false;
    }
    logs.push('Login successful');
    return true;
  } catch (e) {
    logs.push(`Login error: ${e?.message || e}`);
    return false;
  }
}

// ─── Page Testing (QA Agent) ──────────────────────────────────

// Safe buttons to click — exclude destructive actions
const DESTRUCTIVE_PATTERNS = [
  /delete/i, /remove/i, /cancel/i, /destroy/i, /purge/i, /archive/i,
  /sign out/i, /log out/i, /logout/i, /disconnect/i, /revoke/i,
];

// Non-destructive buttons to test
const SAFE_BUTTON_PATTERNS = [
  /generate/i, /create/i, /refresh/i, /view/i, /open/i, /edit/i,
  /continue/i, /next/i, /start/i, /run/i, /test/i, /check/i,
  /preview/i, /expand/i, /details/i, /more/i, /filter/i, /search/i,
  /approve/i, /save/i, /update/i, /apply/i, /add/i, /select/i,
];

async function testPageButtons(
  page: any, url: string, pageName: string, svc: any, findings: QAFinding[], logs: string[]
): Promise<{ buttonsClicked: number; screenshotUrl: string | null }> {
  let buttonsClicked = 0;
  let screenshotUrl: string | null = null;

  try {
    await page.goto(url, { timeout: 25000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Scroll to trigger lazy loads
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});

    // Take a screenshot of the page
    screenshotUrl = await takeScreenshot(svc, page, pageName.replace(/[^a-z0-9]/gi, '-').toLowerCase());

    // Check for broken images
    const brokenImgs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .filter((img: any) => img.complete && img.naturalWidth === 0 && img.src && !img.src.startsWith('data:'))
        .map((img: any) => img.src);
    }).catch(() => []);
    for (const src of brokenImgs.slice(0, 3)) {
      findings.push({
        severity: 'medium',
        category: 'broken_image',
        page_url: url,
        page_name: pageName,
        element_description: `Image: ${src.slice(0, 100)}`,
        description: `Broken image on ${pageName}: ${src.slice(0, 200)}`,
      });
    }

    // Check for empty content areas (possible render failures)
    const emptyAreas = await page.evaluate(() => {
      const main = document.querySelector('main') || document.body;
      const text = main?.textContent?.trim() || '';
      return text.length < 20;
    }).catch(() => false);
    if (emptyAreas) {
      findings.push({
        severity: 'high',
        category: 'visual_bug',
        page_url: url,
        page_name: pageName,
        element_description: 'Page content area',
        description: `Page "${pageName}" appears to have no visible content — possible render failure.`,
        screenshot_url: screenshotUrl || undefined,
      });
    }

    // Find all clickable buttons (non-destructive)
    const buttons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a[href], [role="button"]'));
      return btns
        .filter((b: any) => {
          const text = (b.textContent || b.getAttribute('aria-label') || '').trim();
          if (!text || text.length > 50) return false;
          if (b.disabled || b.getAttribute('aria-disabled') === 'true') return false;
          return true;
        })
        .slice(0, 8) // Limit to 8 buttons per page for time safety
        .map((b: any) => ({
          text: (b.textContent || b.getAttribute('aria-label') || '').trim().slice(0, 50),
          tag: b.tagName,
          href: b.getAttribute('href') || '',
        }));
    }).catch(() => []);

    // Click each safe button and check for errors
    for (const btn of buttons) {
      const isDestructive = DESTRUCTIVE_PATTERNS.some((p) => p.test(btn.text));
      if (isDestructive) {
        logs.push(`  Skipping destructive button: "${btn.text}"`);
        continue;
      }

      try {
        const beforeErrorCount = findings.length;
        // Try to click the button by text
        const locator = page.locator(`button:has-text("${btn.text}"), a:has-text("${btn.text}"), [role="button"]:has-text("${btn.text}")`).first();
        if (await locator.count() > 0) {
          await locator.click({ timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(800);
          buttonsClicked++;

          // Check if new errors appeared after clicking
          const newErrors = findings.length - beforeErrorCount;
          if (newErrors > 0) {
            findings.push({
              severity: 'high',
              category: 'broken_button',
              page_url: url,
              page_name: pageName,
              element_description: `Button: "${btn.text}"`,
              description: `Clicking "${btn.text}" on ${pageName} triggered ${newErrors} error(s).`,
              recommended_fix: 'Check the click handler and any API calls this button triggers.',
            });
          }

          // Navigate back to the page if we left it
          if (page.url() !== url) {
            await page.goto(url, { timeout: 15000, waitUntil: 'domcontentloaded' }).catch(() => {});
            await page.waitForTimeout(800);
          }
        }
      } catch (e) {
        // Button click failed — record it
        findings.push({
          severity: 'medium',
          category: 'broken_button',
          page_url: url,
          page_name: pageName,
          element_description: `Button: "${btn.text}"`,
          description: `Failed to click "${btn.text}" on ${pageName}: ${(e as Error)?.message?.slice(0, 200)}`,
        });
      }
    }
  } catch (e) {
    findings.push({
      severity: 'high',
      category: 'navigation_error',
      page_url: url,
      page_name: pageName,
      element_description: '',
      description: `Failed to navigate to ${pageName} (${url}): ${(e as Error)?.message?.slice(0, 300)}`,
    });
  }

  return { buttonsClicked, screenshotUrl };
}

// ─── Backend Function Testing ─────────────────────────────────

// Safe (read-only / idempotent) functions to test
const SAFE_FUNCTIONS = [
  'getPipelineStatus',
  'getPipelineSignals',
  'pipelineHealth',
  'computeSystemScore',
  'systemSelfReflection',
  'getFinancialIntelligence',
  'analyzeCompetitorGaps',
  'checkDomainAvailability',
  'validate-promo-code',
  'getIndustryOnboarding',
];

export async function testBackendFunctions(
  svc: any, findings: QAFinding[], logs: string[]
): Promise<number> {
  let tested = 0;
  for (const fnName of SAFE_FUNCTIONS) {
    try {
      const res = await svc.functions.invoke(fnName, {}).catch((e: any) => ({ error: e?.message || String(e) }));
      tested++;
      if (res?.error) {
        findings.push({
          severity: 'medium',
          category: 'broken_function',
          page_url: '',
          page_name: 'Backend',
          element_description: `Function: ${fnName}`,
          description: `Backend function "${fnName}" returned an error: ${res.error.slice(0, 300)}`,
          recommended_fix: 'Check the function logs and fix the error.',
        });
      }
    } catch (e: any) {
      tested++;
      findings.push({
        severity: 'medium',
        category: 'broken_function',
        page_url: '',
        page_name: 'Backend',
        element_description: `Function: ${fnName}`,
        description: `Backend function "${fnName}" threw: ${(e?.message || String(e)).slice(0, 300)}`,
        recommended_fix: 'Check the function deployment and runtime errors.',
      });
    }
  }
  logs.push(`Tested ${tested} backend functions`);
  return tested;
}

// ─── Humanized Form Filling ───────────────────────────────────

const TEST_BUSINESS_DATA = {
  businessName: 'Apex Epoxy Floors',
  industry: 'epoxy',
  subIndustry: 'garage-floor-coatings',
  email: 'test-qa@lead-growth-forge.base44.app',
  phone: '(937) 555-0142',
  primaryLocation: 'Dayton, OH',
  address: '123 Industrial Blvd, Dayton, OH 45402',
  zip: '45402',
  radius: '50 miles',
  yearsInBusiness: '3',
  services: ['Garage Floor Coatings', 'Commercial Epoxy', 'Polished Concrete', 'Concrete Sealing'],
  tagline: 'Dayton\'s #1 Epoxy Floor Specialists',
  businessStage: 'new',
  businessType: 'local service business',
};

export async function fillFormFields(
  page: any, logs: string[]
): Promise<number> {
  let fieldsFilled = 0;

  // Fill text inputs
  const inputs = await page.locator('input[type="text"], input[type="email"], input[type="tel"], input[type="number"], textarea:not([disabled])').all().catch(() => []);
  for (const input of inputs.slice(0, 10)) {
    try {
      const placeholder = await input.getAttribute('placeholder') || '';
      const name = await input.getAttribute('name') || '';
      const label = await input.getAttribute('aria-label') || '';
      const clue = (placeholder + ' ' + name + ' ' + label).toLowerCase();

      let value = '';
      if (clue.includes('business') || clue.includes('company') || clue.includes('name')) value = TEST_BUSINESS_DATA.businessName;
      else if (clue.includes('email') || clue.includes('mail')) value = TEST_BUSINESS_DATA.email;
      else if (clue.includes('phone') || clue.includes('tel')) value = TEST_BUSINESS_DATA.phone;
      else if (clue.includes('address') || clue.includes('street')) value = TEST_BUSINESS_DATA.address;
      else if (clue.includes('zip') || clue.includes('postal')) value = TEST_BUSINESS_DATA.zip;
      else if (clue.includes('location') || clue.includes('city')) value = TEST_BUSINESS_DATA.primaryLocation;
      else if (clue.includes('radius') || clue.includes('area')) value = TEST_BUSINESS_DATA.radius;
      else if (clue.includes('year')) value = TEST_BUSINESS_DATA.yearsInBusiness;
      else if (clue.includes('tagline') || clue.includes('slogan')) value = TEST_BUSINESS_DATA.tagline;
      else value = 'Test input value';

      if (value) {
        await input.fill(value).catch(() => {});
        fieldsFilled++;
        await page.waitForTimeout(200);
      }
    } catch { /* skip */ }
  }

  // Click checkboxes (first few only)
  const checkboxes = await page.locator('input[type="checkbox"]:not([disabled]):not([checked])').all().catch(() => []);
  for (const cb of checkboxes.slice(0, 3)) {
    try {
      await cb.click().catch(() => {});
      fieldsFilled++;
      await page.waitForTimeout(150);
    } catch { /* skip */ }
  }

  // Select first option in dropdowns
  const selects = await page.locator('select:not([disabled])').all().catch(() => []);
  for (const sel of selects.slice(0, 3)) {
    try {
      await sel.selectOption({ index: 1 }).catch(() => {});
      fieldsFilled++;
      await page.waitForTimeout(150);
    } catch { /* skip */ }
  }

  logs.push(`  Filled ${fieldsFilled} form fields`);
  return fieldsFilled;
}

// ─── Scoring ──────────────────────────────────────────────────

export function scoreSystem(findings: QAFinding[], pagesTested: number, buttonsClicked: number): number {
  const critical = findings.filter((f) => f.severity === 'critical').length;
  const high = findings.filter((f) => f.severity === 'high').length;
  const medium = findings.filter((f) => f.severity === 'medium').length;
  const low = findings.filter((f) => f.severity === 'low').length;

  let score = 100;
  score -= critical * 15;
  score -= high * 7;
  score -= medium * 3;
  score -= low * 1;

  // Bonus for coverage
  if (pagesTested > 10) score += 3;
  if (buttonsClicked > 20) score += 2;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ─── Main Test Runner ─────────────────────────────────────────

export async function runSystemTest(
  svc: any,
  baseUrl: string,
  opts: {
    pages: { url: string; name: string; system: string }[];
    loginEmail?: string;
    loginPassword?: string;
    testFunctions?: boolean;
    fillForms?: boolean;
    agentType: 'qa_agent' | 'humanized_test';
    targetSystem: string;
  }
): Promise<TestResult> {
  const findings: QAFinding[] = [];
  const screenshots: string[] = [];
  const logs: string[] = [`Starting ${opts.agentType} on ${opts.targetSystem}...`];
  let buttonsClicked = 0;
  let functionsTested = 0;

  const apiKey = secrets.get('BROWSERBASE_API_KEY');
  const sessionId = await createBBSession();
  const currentUrlRef = { url: baseUrl };

  try {
    const { chromium } = await import('npm:playwright-core@1.62.1');
    const browser = await chromium.connectOverCDP(
      `wss://connect.browserbase.com?apiKey=${apiKey}&session=${sessionId}`
    );
    const page = await browser.newPage();
    page.setViewportSize({ width: 390, height: 844 }); // Mobile viewport

    attachErrorListeners(page, findings, currentUrlRef);

    // Login if credentials provided
    if (opts.loginEmail && opts.loginPassword) {
      const loggedIn = await loginToApp(page, baseUrl, opts.loginEmail, opts.loginPassword, logs);
      if (!loggedIn) {
        logs.push('Login failed — testing public pages only');
      }
    }

    // Test each page
    for (const pg of opts.pages) {
      currentUrlRef.url = pg.url;
      logs.push(`Testing page: ${pg.name} (${pg.url})`);

      const result = await testPageButtons(page, pg.url, pg.name, svc, findings, logs);
      buttonsClicked += result.buttonsClicked;
      if (result.screenshotUrl) screenshots.push(result.screenshotUrl);

      // If humanized test, fill forms on this page
      if (opts.fillForms) {
        await fillFormFields(page, logs);
        // Take a screenshot after filling
        const afterShot = await takeScreenshot(svc, page, `${pg.name}-filled`.replace(/[^a-z0-9]/gi, '-').toLowerCase());
        if (afterShot) screenshots.push(afterShot);
      }
    }

    // Test backend functions
    if (opts.testFunctions) {
      functionsTested = await testBackendFunctions(svc, findings, logs);
    }

    await browser.close();
  } catch (e) {
    logs.push(`Test error: ${e?.message || e}`);
    findings.push({
      severity: 'critical',
      category: 'navigation_error',
      page_url: baseUrl,
      page_name: 'System',
      element_description: '',
      description: `Test runner error: ${(e as Error)?.message?.slice(0, 400)}`,
    });
  } finally {
    await releaseBBSession(sessionId);
  }

  const score = scoreSystem(findings, opts.pages.length, buttonsClicked);
  logs.push(`Test complete: ${findings.length} findings, score ${score}/100`);

  return {
    pages_tested: opts.pages.length,
    buttons_clicked: buttonsClicked,
    functions_tested: functionsTested,
    screenshots_taken: screenshots.length,
    findings,
    screenshots,
    score,
    logs,
  };
}