import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Checks real-time domain availability via RDAP (Registration Data Access Protocol).
// RDAP is the official WHOIS replacement — 404 = available, 200 = registered.
// No API key needed, completely free.

async function checkDomain(domain) {
  try {
    const response = await fetch(`https://rdap.org/domain/${domain}`, {
      method: 'GET',
      headers: { 'Accept': 'application/rdap+json' },
      redirect: 'follow',
    });
    const status = response.status;
    if (status === 404) return { domain, available: true, status: 'AVAILABLE' };
    if (status >= 200 && status < 400) return { domain, available: false, status: 'REGISTERED' };
    // Fallback: use Google DNS over HTTPS — if DNS resolves, domain is likely registered
    try {
      const dnsRes = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
      const dnsData = await dnsRes.json();
      if (dnsData.Answer && dnsData.Answer.length > 0) {
        return { domain, available: false, status: 'REGISTERED' };
      }
      return { domain, available: null, status: 'UNKNOWN' };
    } catch (dnsErr) {
      return { domain, available: null, status: 'UNKNOWN', error: `RDAP ${status}, DNS ${dnsErr.message}` };
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

    // Update DomainCandidate records with availability status
    for (const r of results) {
      try {
        const existing = await svc.entities.DomainCandidate.filter({ domain: r.domain }, null, 1);
        if (existing && existing.length > 0) {
          await svc.entities.DomainCandidate.update(existing[0].id, {
            availability_status: r.status,
            checked_at: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error(`Failed to update ${r.domain}:`, e.message);
      }
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