import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Generates technical SEO assets: llms.txt, robots.txt with AI bot rules, schema recommendations.
// Fills the "llms.txt File", "AI Crawler Access", "robots.txt AI Bot Allow Rules" methods.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const portfolioId = req.body?.portfolio_id;

    let portfolios;
    if (portfolioId) {
      portfolios = [await svc.entities.DomainPortfolio.get(portfolioId)];
    } else {
      portfolios = await svc.entities.DomainPortfolio.filter(
        { status: { $in: ['active', 'gsc_submitted', 'ranking', 'deployed'] } },
        '-created_date', 100
      );
    }

    const AI_BOTS = [
      'GPTBot', 'Claude-Web', 'ClaudeBot', 'PerplexityBot', 'CCBot',
      'Google-Extended', 'anthropic-ai', 'Bytespider', 'Applebot',
      'cohere-ai', 'meta-externalagent', 'AI2Bot', 'Diffbot',
    ];

    const results = [];

    for (const p of portfolios) {
      const siteUrl = p.site_url || `https://${p.domain}`;
      const niche = p.niche || 'general';
      const domain = p.domain;

      // Generate llms.txt — structured info for LLMs
      const llmsTxt = [
        `# ${domain}`,
        `# ${niche} services`,
        '',
        `## About`,
        `${domain} provides ${niche} services. We serve customers nationwide.`,
        '',
        `## Services`,
        `- ${niche} services`,
        `- Free quotes and consultations`,
        '',
        `## Service Areas`,
        `- Nationwide coverage`,
        '',
        `## Contact`,
        `- Website: ${siteUrl}`,
        `- Email: contact@${domain}`,
        '',
        `## FAQ`,
        `Q: What areas do you serve?`,
        `A: We serve customers nationwide.`,
        `Q: Do you offer free quotes?`,
        `A: Yes, we offer free quotes and consultations.`,
        '',
        `## Differentiators`,
        `- Licensed and insured`,
        `- Experienced professionals`,
        `- Customer satisfaction guaranteed`,
      ].join('\n');

      // Generate robots.txt with AI bot allow rules
      const robotsLines = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /api/',
        '',
        '# AI Crawlers — explicitly allowed for AI search visibility',
        ...AI_BOTS.map(bot => `User-agent: ${bot}\nAllow: /`),
        '',
        `Sitemap: ${siteUrl}/sitemap.xml`,
        `Host: ${domain}`,
      ];
      const robotsTxt = robotsLines.join('\n');

      // Generate schema recommendations
      const schemaRecommendations = [
        { type: 'Organization', status: 'recommended', reason: 'Knowledge panel eligibility' },
        { type: 'LocalBusiness', status: 'recommended', reason: 'Local SEO + map visibility' },
        { type: 'WebSite', status: 'recommended', reason: 'Sitelinks search box' },
        { type: 'BreadcrumbList', status: 'recommended', reason: 'Breadcrumb rich results' },
        { type: 'FAQPage', status: 'recommended', reason: 'FAQ rich results + AI extraction' },
        { type: 'Service', status: 'recommended', reason: 'Service rich results' },
        { type: 'Article', status: 'recommended', reason: 'Article rich results' },
        { type: 'VideoObject', status: 'optional', reason: 'Video rich results' },
        { type: 'QAPage', status: 'optional', reason: 'Q&A rich results + AI extraction' },
        { type: 'Speakable', status: 'optional', reason: 'Voice search optimization' },
      ];

      results.push({
        domain,
        site_url: siteUrl,
        llms_txt: llmsTxt,
        robots_txt: robotsTxt,
        ai_bots_allowed: AI_BOTS,
        schema_recommendations: schemaRecommendations,
        assets_generated: ['llms.txt', 'robots.txt', 'schema-recommendations'],
      });
    }

    return Response.json({
      ok: true,
      portfolios_processed: results.length,
      ai_bots_configured: AI_BOTS.length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}