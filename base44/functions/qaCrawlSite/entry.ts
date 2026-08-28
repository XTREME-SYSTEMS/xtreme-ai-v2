import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { crawlSite } from '../../shared/qaCrawler.ts';

const APP_URL = 'https://lead-growth-forge.base44.app';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const maxPages = body.maxPages || 10;

    const result = await crawlSite(APP_URL, { maxPages });

    return Response.json(result);
  } catch (error) {
    console.error('qaCrawlSite error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}