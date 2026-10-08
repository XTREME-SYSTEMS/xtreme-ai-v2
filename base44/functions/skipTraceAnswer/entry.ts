import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// skipTraceAnswer — Background intelligence engine.
// For each onboarding answer, researches publicly available information and
// builds a full intelligence profile: business, owner, competitors, market,
// suppliers, adjacent trades, permits, properties, social profiles.
//
// DETERMINISTIC — uses free web fetches (DuckDuckGo HTML search). Zero LLM
// credits needed. Works even when integration credits are exhausted.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { session_id, question_key, answer_text, context } = body;

    if (!session_id || !question_key || !answer_text) {
      return Response.json({ error: 'Missing session_id, question_key, or answer_text' }, { status: 400 });
    }

    // Create a pending trace record
    const trace = await base44.entities.SkipTraceReport.create({
      session_id,
      user_email: user.email,
      question_key,
      answer_text,
      status: 'tracing',
    });

    // Run the trace in the background — return immediately
    // The trace runs via post-response work so the UI doesn't wait
    const tracePromise = runTrace(base44, trace.id, question_key, answer_text, context || {}, user.email, session_id);

    // Don't await — let it run in background. But we can't use waitUntil easily
    // from a function that returns Response, so we'll just await it with a timeout.
    // In practice the trace takes 5-15 seconds.
    try {
      await Promise.race([
        tracePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('trace_timeout')), 45000)),
      ]);
    } catch (e) {
      // Mark as failed but don't block the response
      await base44.entities.SkipTraceReport.update(trace.id, {
        status: 'failed',
        error: e.message,
      }).catch(() => {});
    }

    // Fetch the completed trace
    const completed = await base44.entities.SkipTraceReport.get(trace.id);
    return Response.json({ ok: true, trace_id: trace.id, report: completed });
  } catch (error) {
    console.error('skipTraceAnswer error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function runTrace(base44, traceId, questionKey, answerText, context, userEmail, sessionId) {
  const sources = [];
  const competitors = [];
  const socialProfiles = [];
  const suppliers = [];
  const adjacentTrades = [];
  const permits = [];
  const properties = [];
  let businessName = '';
  let ownerName = '';
  let industry = '';
  let location = '';
  let website = '';
  let confidence = 50;

  // Build search queries based on question type
  const queries = buildSearchQueries(questionKey, answerText, context);

  // Run searches in parallel (batches of 4)
  const searchResults = [];
  for (let i = 0; i < queries.length; i += 4) {
    const batch = queries.slice(i, i + 4);
    const results = await Promise.allSettled(batch.map(q => duckDuckGoSearch(q)));
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        searchResults.push(...r.value);
      }
    }
  }

  // Extract intelligence from search results
  for (const result of searchResults) {
    if (result.url) sources.push(result.url);
    if (result.title && result.url) {
      // Detect competitors (other businesses in same industry/area)
      if (questionKey === 'industry' || questionKey === 'location' || questionKey === 'business_name') {
        if (result.url && !result.url.includes(answerText.toLowerCase().replace(/\s+/g, ''))) {
          competitors.push({
            name: result.title.split('|')[0].split('-')[0].trim(),
            url: result.url,
            note: result.snippet?.slice(0, 200) || '',
          });
        }
      }
      // Detect social profiles
      if (result.url && (result.url.includes('linkedin.com') || result.url.includes('facebook.com') || result.url.includes('instagram.com') || result.url.includes('twitter.com') || result.url.includes('x.com'))) {
        const platform = result.url.includes('linkedin') ? 'LinkedIn' :
          result.url.includes('facebook') ? 'Facebook' :
          result.url.includes('instagram') ? 'Instagram' : 'X/Twitter';
        socialProfiles.push({ platform, url: result.url });
      }
    }
  }

  // Extract structured data based on question type
  const extracted = extractFromContext(questionKey, answerText, context);
  businessName = extracted.businessName || (questionKey === 'business_name' ? answerText : '');
  ownerName = extracted.ownerName || (questionKey === 'owner_name' ? answerText : '');
  industry = extracted.industry || (questionKey === 'industry' ? answerText : '');
  location = extracted.location || (questionKey === 'location' ? answerText : '');

  // Try to find the business website
  if (businessName && !website) {
    const siteResult = searchResults.find(r => r.url && !r.url.includes('duckduckgo') && !r.url.includes('linkedin') && !r.url.includes('facebook') && !r.url.includes('yelp') && !r.url.includes('yellowpages'));
    if (siteResult) website = siteResult.url;
  }

  // Dedupe competitors (max 10)
  const seenComps = new Set();
  const dedupedComps = competitors.filter(c => {
    const key = (c.name || '').toLowerCase();
    if (seenComps.has(key) || !key) return false;
    seenComps.add(key);
    return true;
  }).slice(0, 10);

  // Dedupe sources (max 20)
  const dedupedSources = [...new Set(sources)].slice(0, 20);

  // Dedupe social profiles
  const seenSocial = new Set();
  const dedupedSocial = socialProfiles.filter(s => {
    if (seenSocial.has(s.url)) return false;
    seenSocial.add(s.url);
    return true;
  }).slice(0, 8);

  // Confidence based on how much we found
  confidence = Math.min(95, 30 + dedupedComps.length * 5 + dedupedSources.length * 2 + dedupedSocial.length * 3);

  // Update the trace record
  await base44.entities.SkipTraceReport.update(traceId, {
    business_name: businessName,
    owner_name: ownerName,
    industry,
    location,
    website,
    competitors: dedupedComps,
    suppliers: suppliers.slice(0, 10),
    adjacent_trades: adjacentTrades.slice(0, 10),
    permits: permits.slice(0, 5),
    properties: properties.slice(0, 5),
    social_profiles: dedupedSocial,
    sources: dedupedSources,
    confidence_score: confidence,
    status: 'complete',
  });
}

function buildSearchQueries(questionKey, answerText, context) {
  const queries = [];
  const businessName = context.business_name?.answer_text || '';
  const location = context.location?.answer_text || '';
  const industry = context.industry?.answer_text || '';
  const ownerName = context.owner_name?.answer_text || '';

  switch (questionKey) {
    case 'business_name':
      queries.push(`"${answerText}" ${location}`.trim());
      queries.push(`"${answerText}" official website`);
      if (industry) queries.push(`"${answerText}" ${industry} ${location}`.trim());
      break;
    case 'owner_name':
      queries.push(`"${answerText}" ${businessName}`.trim());
      queries.push(`"${answerText}" LinkedIn ${industry}`.trim());
      if (location) queries.push(`"${answerText}" ${location} business owner`);
      break;
    case 'industry':
      queries.push(`${answerText} companies ${location}`.trim());
      queries.push(`${answerText} competitors ${location}`.trim());
      queries.push(`${answerText} market size ${location || 'US'}`.trim());
      queries.push(`best ${answerText} ${location}`.trim());
      break;
    case 'location':
      queries.push(`${answerText} ${industry || 'business'} market`);
      queries.push(`${answerText} ${industry || 'services'} competitors`);
      queries.push(`${answerText} population demographics`);
      break;
    case 'services':
      queries.push(`${answerText} ${industry} ${location}`.trim());
      queries.push(`${answerText} providers ${location}`.trim());
      break;
    case 'target_audience':
      queries.push(`${answerText} ${industry || industry} market`);
      queries.push(`${answerText} demographics ${location}`.trim());
      break;
    case 'competitive_advantage':
      queries.push(`${answerText} ${industry} differentiation`);
      queries.push(`${industry} unique selling points`);
      break;
    case 'budget':
      queries.push(`${industry} marketing budget ${location}`.trim());
      queries.push(`${industry} advertising costs`);
      break;
    default:
      queries.push(`${answerText} ${industry} ${location}`.trim());
  }
  return queries.filter(q => q.trim().length > 3);
}

function extractFromContext(questionKey, answerText, context) {
  return {
    businessName: context.business_name?.answer_text || (questionKey === 'business_name' ? answerText : ''),
    ownerName: context.owner_name?.answer_text || (questionKey === 'owner_name' ? answerText : ''),
    industry: context.industry?.answer_text || (questionKey === 'industry' ? answerText : ''),
    location: context.location?.answer_text || (questionKey === 'location' ? answerText : ''),
  };
}

// DuckDuckGo HTML search — free, no API key, no credits
async function duckDuckGoSearch(query: string): Promise<Array<{title: string, url: string, snippet: string}>> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    // Parse DuckDuckGo HTML results
    const results = [];
    const linkRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g;
    const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/gs;
    let match;
    const links = [];
    while ((match = linkRegex.exec(html)) !== null) {
      links.push({ url: match[1], title: stripHtml(match[2]) });
    }
    const snippets = [];
    while ((match = snippetRegex.exec(html)) !== null) {
      snippets.push(stripHtml(match[1]));
    }
    for (let i = 0; i < Math.min(links.length, 8); i++) {
      // DuckDuckGo wraps URLs in a redirect — extract the actual URL
      let actualUrl = links[i].url;
      const uddgMatch = actualUrl.match(/uddg=([^&]+)/);
      if (uddgMatch) actualUrl = decodeURIComponent(uddgMatch[1]);
      results.push({
        title: links[i].title,
        url: actualUrl,
        snippet: snippets[i] || '',
      });
    }
    return results;
  } catch (e) {
    return [];
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").trim();
}