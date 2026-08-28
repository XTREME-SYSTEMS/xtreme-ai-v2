// vercelRegistrar — shared helpers for purchasing domains through Vercel's
// Registrar API. Used by purchaseDomainViaVercel (client-domain flow) and
// purchaseBuildDomain (AutoBuild flow) so the API calls and contact-building
// logic live in one place.

export function addParam(url: string, param: string): string {
  return url.includes("?") ? `${url}&${param}` : `${url}?${param}`;
}

export function vercelHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export function vercelTeamQuery(team?: string | null): string {
  return team ? `?teamId=${encodeURIComponent(team)}` : "";
}

/**
 * Build a Vercel Registrar registrant contact object from a profile-like
 * object (user.epoxyProfile or build.profile) with sensible fallbacks.
 */
export function buildRegistrantContact(
  profile: any,
  fallbackEmail: string,
  fallbackName: string,
): any {
  const p = profile || {};
  const fullName = (fallbackName || p.businessName || fallbackEmail || "Owner").trim();
  const nameParts = fullName.split(/\s+/);
  const firstName = nameParts[0] || "Owner";
  const lastName = nameParts.slice(1).join(" ") || firstName;
  const locParts = (p.primaryLocation || p.location || p.address || "")
    .split(",").map((x: string) => x.trim());
  return {
    firstName,
    lastName,
    email: p.email || fallbackEmail,
    phone: p.phone || "",
    address1: p.address || "",
    city: locParts[0] || "",
    state: locParts[1] || "",
    zip: p.zip || "",
    country: "US",
  };
}

/** Check if a domain is available for purchase. */
export async function checkDomainAvailability(
  token: string,
  team: string | undefined,
  domain: string,
): Promise<{ available: boolean; raw?: any }> {
  const qs = vercelTeamQuery(team);
  const dom = encodeURIComponent(domain);
  const res = await fetch(
    `https://api.vercel.com/v1/registrar/domains/${dom}/availability${qs}`,
    { headers: vercelHeaders(token) },
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Availability check failed: ${res.status} ${t}`);
  }
  const data = await res.json();
  return { available: !!data.available, raw: data };
}

/** Get the purchase price for a domain for a given number of years. */
export async function getDomainPrice(
  token: string,
  team: string | undefined,
  domain: string,
  years: number = 1,
): Promise<{ price: number | null; raw?: any }> {
  const qs = vercelTeamQuery(team);
  const dom = encodeURIComponent(domain);
  const res = await fetch(
    `https://api.vercel.com/v1/registrar/domains/${dom}/price${addParam(qs, `years=${years}`)}`,
    { headers: vercelHeaders(token) },
  );
  if (!res.ok) return { price: null };
  const data = await res.json();
  const price = data?.purchasePrice?.amount ?? data?.purchasePrice ?? data?.price ?? null;
  return { price, raw: data };
}

/** Purchase a domain through Vercel's Registrar API. */
export async function buyDomain(
  token: string,
  team: string | undefined,
  domain: string,
  opts: { years: number; autoRenew: boolean; contact: any; expectedPrice?: number | null },
): Promise<any> {
  const qs = vercelTeamQuery(team);
  const dom = encodeURIComponent(domain);
  const body: any = {
    autoRenew: String(opts.autoRenew),
    years: String(opts.years),
    contactInformation: opts.contact,
  };
  if (opts.expectedPrice != null) body.expectedPrice = opts.expectedPrice;
  const res = await fetch(`https://api.vercel.com/v1/registrar/domains/${dom}/buy${qs}`, {
    method: "POST",
    headers: vercelHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Buy failed: ${res.status} ${t}`);
  }
  return await res.json();
}

/** Attach a domain to a Vercel project. Returns true on success. */
export async function attachDomainToProject(
  token: string,
  team: string | undefined,
  projectId: string,
  domain: string,
): Promise<boolean> {
  const qs = vercelTeamQuery(team);
  const res = await fetch(
    `https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}/domains${qs}`,
    { method: "POST", headers: vercelHeaders(token), body: JSON.stringify({ name: domain }) },
  );
  return res.ok;
}

/** Normalize a domain string: strip protocol, www, paths. */
export function normalizeDomain(input: string): string {
  return input.toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .trim();
}