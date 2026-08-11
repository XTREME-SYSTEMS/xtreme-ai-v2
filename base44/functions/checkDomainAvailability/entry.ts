import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Checks real-time domain availability via RDAP (Registration Data Access Protocol).
// RDAP is the official WHOIS replacement — 404 = available, 200 = registered.
// No API key needed, completely free.

// Use direct registry RDAP servers — no rate limiting, unlike rdap.org
function getRdapUrl(domain) {
  const tld = domain.split('.').pop();
  if (tld === 'com') return `https://rdap.verisign.com/com/v1/domain/${domain}`;
  if (tld === 'org') return `https://rdap.publicinterestregistry.org/rdap/domain/${domain}`;
  if (tld === 'net') return `https://rdap.verisign.com/net/v1/domain/${domain}`;
  // Fallback to rdap.org for other TLDs
  return `https://rdap.org/domain/${domain}`;
}

async function checkDomain(domain) {
  const rdapUrl = getRdapUrl(domain);
  try {
    const response = await fetch(rdapUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/rdap+json' },
      redirect: 'follow',
    });
    const status = response.status;
    if (status === 404) return { domain, available: true, status: 'AVAILABLE' };
    if (status >= 200 && status < 400) return { domain, available: false, status: 'REGISTERED' };
    // Non-404/non-2xx — try DNS as tiebreaker (only confirms REGISTERED, never AVAILABLE)
    try {
      const dnsRes = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
      const dnsData = await dnsRes.json();
      if (dnsData.Answer && dnsData.Answer.length > 0) {
        return { domain, available: false, status: 'REGISTERED' };
      }
      return { domain, available: null, status: 'UNKNOWN' };
    } catch (dnsErr) {
      return { domain, available: null, status: 'UNKNOWN', error: `RDAP ${status}` };
    }
  } catch (e) {
    return { domain, available: null, status: 'UNKNOWN', error: e.message };
  }
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const domains = body.domains || [];

    if (domains.length === 0) {
      return Response.json({ ok: true, results: [], message: 'No domains provided' });
    }

    // Check in parallel with batches of 10 to avoid rate limiting
    const results = [];
    for (let i = 0; i < domains.length; i += 10) {
      const batch = domains.slice(i, i + 10);
      const batchResults = await Promise.all(batch.map(checkDomain));
      results.push(...batchResults);
    }

    // Update DomainCandidate records with availability status — use bulkUpdate to avoid rate limits
    try {
      const allCandidates = await svc.entities.DomainCandidate.list(null, 500);
      const domainToId = {};
      for (const c of allCandidates) {
        if (c.domain) domainToId[c.domain] = c.id;
      }
      const updates = results
        .filter(r => domainToId[r.domain] && r.status !== 'UNKNOWN')
        .map(r => ({
          id: domainToId[r.domain],
          availability_status: r.status,
          checked_at: new Date().toISOString(),
        }));
      if (updates.length > 0) {
        await svc.entities.DomainCandidate.bulkUpdate(updates);
      }
    } catch (e) {
      console.error('Bulk update failed:', e.message);
    }

    return Response.json({
      ok: true,
      checked: results.length,
      available: results.filter(r => r.status === 'AVAILABLE').length,
      registered: results.filter(r => r.status === 'REGISTERED').length,
      results,
    });
  } catch (error) {
    console.error('checkDomainAvailability error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}