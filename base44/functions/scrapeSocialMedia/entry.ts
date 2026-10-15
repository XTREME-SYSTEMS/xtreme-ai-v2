import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Social Media Scraper — scrapes all company social media posts and videos
// from YouTube, Instagram, Facebook, TikTok, LinkedIn, and X/Twitter.
// Uses InvokeLLM with web search to discover real content (posts, videos,
// reels, shorts, podcasts) from any company's social media presence.
//
// Stores results as XpsAsset records (social_post, marketing_video categories)
// so the auto builder can use them for authentic, brand-specific content.
//
// Input:
//   company_name: string — the company to scrape (e.g. "Xtreme Polishing Systems")
//   social_urls: string[] — optional: known social media profile URLs
//   store: boolean — default true: store results as XpsAsset records
//   max_results: number — default 50: max items to discover

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { company_name, social_urls, store = true, max_results = 50 } = body;

    if (!company_name) {
      return Response.json({ error: 'company_name is required' }, { status: 400 });
    }

    const knownUrls = Array.isArray(social_urls) ? social_urls : [];
    const urlsContext = knownUrls.length > 0
      ? `\n\nKnown social media profile URLs for this company:\n${knownUrls.map(u => `- ${u}`).join('\n')}`
      : '';

    // Use InvokeLLM with web search to discover real social media content
    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a social media scraping agent. Research the company "${company_name}" and find ALL their social media content across every platform.

${urlsContext}

Search for their content on:
1. **YouTube** — videos, shorts, playlists, podcasts (find video URLs, titles, descriptions, thumbnails, durations, view counts)
2. **Instagram** — posts, reels, stories, IGTV (find post URLs, captions, thumbnail URLs, is_reel flag)
3. **Facebook** — page posts, videos, reels (find post URLs, descriptions, thumbnails)
4. **TikTok** — videos, reels (find video URLs, descriptions, thumbnails)
5. **LinkedIn** — company page posts, articles, videos (find post URLs, descriptions)
6. **X/Twitter** — tweets, threads, videos (find tweet URLs, content)

For each piece of content found, provide:
- platform: youtube | instagram | facebook | tiktok | linkedin | x_twitter
- content_type: video | reel | post | short | podcast | thread | article
- title: the title or first line of the content
- description: full caption or description text
- url: direct URL to the content
- thumbnail_url: thumbnail/preview image URL
- video_url: direct video URL (YouTube watch URL, etc.)
- duration_seconds: video duration if known
- view_count: view/play count if visible
- published_date: publication date if visible
- is_video: boolean — true if this is video content
- tags: relevant tags/hashtags

Find up to ${max_results} pieces of content. Focus on their MOST POPULAR and MOST RECENT content. Return REAL content from their actual channels — do not invent or fabricate any posts, URLs, or thumbnails.

If you cannot find a specific piece of data (e.g. view count not visible), use null for that field. Do NOT make up values.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          company_found: { type: 'boolean', description: 'Whether the company was found on social media' },
          channels: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                platform: { type: 'string' },
                profile_url: { type: 'string' },
                follower_count: { type: 'number' },
                verified: { type: 'boolean' },
              },
            },
            description: 'Social media channels/profiles found for this company',
          },
          content: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                platform: { type: 'string' },
                content_type: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                url: { type: 'string' },
                thumbnail_url: { type: 'string' },
                video_url: { type: 'string' },
                duration_seconds: { type: 'number' },
                view_count: { type: 'number' },
                published_date: { type: 'string' },
                is_video: { type: 'boolean' },
                tags: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    });

    const result = llmResult || { company_found: false, channels: [], content: [] };
    const content = result.content || [];
    const channels = result.channels || [];

    // Store results as XpsAsset records
    let stored = 0;
    if (store && content.length > 0) {
      const now = new Date().toISOString();
      const records = content.map((c: any) => ({
        category: c.is_video ? 'marketing_video' : 'social_post',
        name: c.title || `${c.platform} ${c.content_type || 'post'}`,
        description: c.description || '',
        image_url: c.thumbnail_url || '',
        video_url: c.video_url || '',
        thumbnail_url: c.thumbnail_url || '',
        source_url: c.url || '',
        source_platform: c.platform || 'website',
        brand: company_name,
        tags: c.tags || [c.platform, c.content_type].filter(Boolean),
        duration_seconds: c.duration_seconds || 0,
        active: true,
        ingested_at: now,
      }));

      // Bulk create in batches of 100
      for (let i = 0; i < records.length; i += 100) {
        const batch = records.slice(i, i + 100);
        try {
          await base44.asServiceRole.entities.XpsAsset.bulkCreate(batch);
          stored += batch.length;
        } catch (e) {
          console.log(`Batch create ${i} error:`, e.message);
        }
      }
    }

    const breakdown = {
      youtube: content.filter((c: any) => c.platform === 'youtube').length,
      instagram: content.filter((c: any) => c.platform === 'instagram').length,
      facebook: content.filter((c: any) => c.platform === 'facebook').length,
      tiktok: content.filter((c: any) => c.platform === 'tiktok').length,
      linkedin: content.filter((c: any) => c.platform === 'linkedin').length,
      x_twitter: content.filter((c: any) => c.platform === 'x_twitter').length,
      videos: content.filter((c: any) => c.is_video).length,
      posts: content.filter((c: any) => !c.is_video).length,
    };

    return Response.json({
      status: 'success',
      company: company_name,
      company_found: result.company_found,
      channels_found: channels.length,
      channels,
      content_found: content.length,
      content_stored: stored,
      breakdown,
      content: content.slice(0, 20), // return first 20 for preview
    });
  } catch (error) {
    console.error('scrapeSocialMedia error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}