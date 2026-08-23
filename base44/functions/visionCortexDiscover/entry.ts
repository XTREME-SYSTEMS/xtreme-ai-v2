import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';
import { scrapeUrl } from '../../shared/browserbaseScrape.ts';
import { VISION_SOURCES, IDEA_EXTRACTION_SCHEMA } from '../../shared/visionCortexFramework.ts';

// visionCortexDiscover — Phase 1 of the Vision Cortex daily cycle.
// Scrapes social media, Reddit, Product Hunt, Hacker News, AI websites,
// app directories, and elite websites using Browserbase to find raw ideas,
// problems, and opportunities. Extracts up to 50 ideas per run.
//
// Called by:
// - The "Vision Cortex Daily Cycle" workflow (every 24 hours)
// - Manually from the Vision Cortex dashboard
//
// Flow: scrape N sources → LLM extracts ideas from each → save as VisionCortexIdea
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const {
      max_sources = 6,
      max_ideas_per_source = 10,
      max_total = 50,
      triggered_by = 'manual',
      custom_sources = [],
    } = body;

    // Select sources — shuffle and pick max_sources, plus any custom URLs
    const sources = [...VISION_SOURCES];
    // Simple shuffle
    for (let i = sources.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sources[i], sources[j]] = [sources[j], sources[i]];
    }
    const selectedSources = sources.slice(0, max_sources);

    // Add custom sources if provided
    const allSources = [
      ...selectedSources,
      ...custom_sources.map((url: string, idx: number) => ({
        id: `custom_${idx}`,
        label: `Custom: ${url}`,
        url,
        category: 'elite' as const,
        scrape_prompt: 'Find ideas, problems, discussions about products, apps, or systems that could be built.',
      })),
    ];

    // Create a DiscoveryRun to track this cycle
    const run = await base44.asServiceRole.entities.DiscoveryRun.create({
      run_type: 'idea_discovery',
      source: 'vision_cortex',
      industry: 'multi-source',
      search_criteria: {
        max_sources: allSources.length,
        max_ideas_per_source,
        max_total,
        sources: allSources.map((s: any) => s.id),
      },
      status: 'running',
      started_at: new Date().toISOString(),
      triggered_by,
      logs: [
        `[${new Date().toISOString()}] Vision Cortex discovery started — ${allSources.length} sources, max ${max_total} ideas`,
        `[${new Date().toISOString()}] Sources: ${allSources.map((s: any) => s.label).join(', ')}`,
      ],
    });

    try {
      const allIdeas: any[] = [];
      const scrapeLogs: string[] = [];

      // Phase 1: Scrape each source and extract ideas
      for (const source of allSources) {
        if (allIdeas.length >= max_total) break;

        try {
          scrapeLogs.push(`[${new Date().toISOString()}] Scraping ${source.label} (${source.url})`);

          const scraped = await scrapeUrl(source.url, {
            waitUntil: 'domcontentloaded',
            timeout: 25000,
          });

          // Use LLM to extract ideas from the scraped content
          const extractionPrompt = `You are an elite startup idea extractor. Below is scraped content from ${source.label} (${source.url}).

${source.scrape_prompt}

Extract up to ${max_ideas_per_source} DISTINCT, high-potential startup ideas from this content. Each idea should be a real problem or opportunity that could be solved by a new app, website, or platform.

For each idea provide:
- title: A concise, memorable name for the app/website/business
- description: What it does and why it matters (2-3 sentences)
- problem_statement: The specific problem it solves — be concrete
- proposed_solution: How it solves the problem — the core mechanism
- target_audience: Who would use this — be specific
- source: "${source.id}"
- source_url: A real URL from the content (or "${source.url}")
- source_snippet: A brief quote or summary from the content that inspired this idea
- industry: The primary industry
- sub_industry: The sub-industry or niche
- product_type: "web_app", "ecommerce", "platform", or "marketing_site"
- keywords: 5-10 relevant search keywords
- competitors: Known competitors or similar products

Focus on ideas that are:
1. Solving REAL problems people complain about
2. Feasible to build as a web app or website
3. Monetizable (clear path to revenue)
4. Not tarpit ideas (concepts that look good but structurally never work)

SCRAPED CONTENT (first 15000 chars):
${scraped.text.slice(0, 15000)}`;

          const extractionResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: extractionPrompt,
            response_json_schema: IDEA_EXTRACTION_SCHEMA,
            model: 'gemini_3_flash',
          });

          const extractedIdeas = (extractionResponse as any)?.ideas || [];
          scrapeLogs.push(`[${new Date().toISOString()}] Extracted ${extractedIdeas.length} ideas from ${source.label}`);

          // Add scraped content reference to each idea
          for (const idea of extractedIdeas) {
            if (allIdeas.length >= max_total) break;
            allIdeas.push({
              ...idea,
              scraped_content: scraped.text.slice(0, 5000),
            });
          }
        } catch (sourceErr: any) {
          scrapeLogs.push(`[${new Date().toISOString()}] ERROR scraping ${source.label}: ${sourceErr?.message || sourceErr}`);
        }

        // Brief pause between sources to avoid rate limits
        await new Promise((r) => setTimeout(r, 1500));
      }

      // Phase 2: Save all ideas as VisionCortexIdea records
      const savedIdeas = [];
      for (const idea of allIdeas) {
        try {
          const saved = await base44.asServiceRole.entities.VisionCortexIdea.create({
            title: idea.title,
            description: idea.description,
            problem_statement: idea.problem_statement || '',
            proposed_solution: idea.proposed_solution || '',
            target_audience: idea.target_audience || '',
            source: idea.source || 'browserbase_scrape',
            source_url: idea.source_url || '',
            source_snippet: idea.source_snippet || '',
            scraped_content: idea.scraped_content || '',
            industry: idea.industry || 'General',
            sub_industry: idea.sub_industry || '',
            product_type: idea.product_type || 'web_app',
            keywords: idea.keywords || [],
            competitors: idea.competitors || [],
            monetization_model: idea.monetization_model || 'subscription',
            status: 'discovered',
            discovery_run_id: run.id,
            logs: [`[${new Date().toISOString()}] Discovered by Vision Cortex from ${idea.source}`],
          });
          savedIdeas.push(saved);
        } catch (saveErr: any) {
          scrapeLogs.push(`[${new Date().toISOString()}] Error saving idea "${idea.title}": ${saveErr?.message || saveErr}`);
        }
      }

      // Update the run
      await base44.asServiceRole.entities.DiscoveryRun.update(run.id, {
        status: 'complete',
        items_found: savedIdeas.length,
        completed_at: new Date().toISOString(),
        logs: [...run.logs, ...scrapeLogs, `[${new Date().toISOString()}] Vision Cortex discovery complete — ${savedIdeas.length} ideas saved`],
      });

      return Response.json({
        ok: true,
        run_id: run.id,
        sources_scraped: allSources.length,
        ideas_discovered: allIdeas.length,
        ideas_saved: savedIdeas.length,
        ideas: savedIdeas.map((i: any) => ({
          id: i.id,
          title: i.title,
          source: i.source,
          industry: i.industry,
        })),
      });
    } catch (discoverErr: any) {
      await base44.asServiceRole.entities.DiscoveryRun.update(run.id, {
        status: 'failed',
        error: discoverErr?.message || 'Discovery failed',
        completed_at: new Date().toISOString(),
        logs: [...run.logs, `[${new Date().toISOString()}] ERROR: ${discoverErr?.message || discoverErr}`],
      });
      throw discoverErr;
    }
  } catch (error) {
    console.error('visionCortexDiscover error', error?.message || error);
    return Response.json({ error: error?.message || 'server error' }, { status: 500 });
  }
}