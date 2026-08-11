import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { detectIndustry, scrapeTarget } from '../../shared/cloneUtils.ts';
import { withRetry, safeInvoke, captureError } from '../../shared/resilience.ts';
import { markFailed } from '../../shared/pipelineState.ts';

// Deep Legal Scan — scans a cloned site and produces a single-page summary
// of ONLY what legally must change, what can stay, 20 name+domain recommendations,
// images that must be replaced, and exact content blocks that must be replaced.
// The goal: keep as much as legally possible, change only what's required.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const svc = base44.asServiceRole;
    const logs = [];

    // Resolve or create project
    let project;
    if (body.project_id) {
      project = await svc.entities.CloneProject.get(body.project_id);
    } else if (body.target_url) {
      project = await svc.entities.CloneProject.create({
        target_url: body.target_url,
        industry: body.industry || '',
        business_name: body.business_name || '',
        status: 'running', current_step: 'scanning',
        approval_status: 'pending',
        logs: [`Legal scan initiated for ${body.target_url}`]
      });
    } else {
      return Response.json({ error: 'No project_id or target_url provided' }, { status: 400 });
    }

    const log = (m) => logs.push(`${new Date().toISOString().slice(11, 19)} ${m}`);
    const persist = async (updates) => {
      project = { ...project, ...updates };
      await svc.entities.CloneProject.update(project.id, { ...updates, logs: [...(project.logs || []), ...logs] });
      logs.length = 0;
    };

    await svc.entities.CloneProject.update(project.id, { current_step: 'scanning', status: 'running' });

    // ---- Step 1: Scrape the target site (with retry) ----
    log('Scraping target site...');
    const scraped = await withRetry(() => scrapeTarget(project.target_url), { retries: 2, label: 'scrape' });
    const html = scraped.html;
    const imgUrls = scraped.imgUrls;
    const industry = project.industry || detectIndustry(html, scraped.title);

    log(`Scraped ${scraped.html_size} chars, ${imgUrls.length} images, ${scraped.colors.length} colors`);
    await persist({
      scrape: {
        html_size: scraped.html_size,
        title: scraped.title,
        meta_description: scraped.meta_description,
        colors: scraped.colors,
        structure_summary: scraped.headings.join(' | '),
        html_snapshot: html.slice(0, 80000)
      },
      industry
    });

    // ---- Step 2: Deep legal analysis — identify ONLY what must change ----
    log('Running deep legal analysis...');
    const analysisPrompt = `You are a legal compliance analyst specializing in website cloning. Analyze this scraped website HTML and identify ONLY the items that ABSOLUTELY MUST be changed to avoid legal issues (trademark, copyright, personal info). Everything else should be explicitly marked as "can keep" — the goal is to keep as much as legally possible.

Industry: ${industry}
Site title: ${project.scrape?.title || ''}
Images found: ${imgUrls.length}

HTML (truncated to 50000 chars):
${html.slice(0, 50000)}

Return a JSON object with this exact structure:
{
  "risk_level": "low" | "medium" | "high",
  "executive_summary": "2-3 sentence summary of the legal risk and what must change",
  "must_change": {
    "business_name": "the current trademarked business name",
    "logo": { "description": "what the logo looks like", "location": "where it appears" },
    "tagline": "any trademarked tagline or slogan",
    "contact_info": { "phone": "", "email": "", "address": "", "social_links": [] },
    "images_to_replace": [
      { "url": "image url", "description": "what the image shows", "reason": "why it must change (e.g. original company's actual work/team/product photos)", "replacement_prompt": "detailed prompt for generating a replacement" }
    ],
    "content_to_replace": [
      { "section": "which page section", "original_text": "the exact text that must change", "reason": "why (e.g. copyrighted unique copy, company-specific claims)" }
    ],
    "trademarked_terms": ["any trademarked terms or slogans"]
  },
  "can_keep": {
    "page_structure": "description of layout/structure that can be reused",
    "service_descriptions": ["general industry service descriptions that are not copyrighted"],
    "faq_format": "description of FAQ structure that can be reused",
    "color_scheme": "note about colors — similar palette is fine, exact match is okay for general colors",
    "layout": "layout description that can be kept",
    "general_content": ["general industry content that is not copyrighted and can be kept"]
  },
  "name_recommendations": [
    { "name": "new brand name", "domain": "newbrand.com", "rationale": "why this name works", "available": true }
  ]
}

IMPORTANT: Generate exactly 20 name recommendations. For images, only include images that show the original company's actual work, team, products, or proprietary content — stock photos and generic industry images can be kept. For content, only include text blocks that are unique copyrighted copy or company-specific claims — general industry information can be kept.`;

    const analysis = await safeInvoke(base44, {
      prompt: analysisPrompt,
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      timeout: 60000,
      retries: 2,
      label: 'legal analysis',
      response_json_schema: {
        type: 'object',
        properties: {
          risk_level: { type: 'string', enum: ['low', 'medium', 'high'] },
          executive_summary: { type: 'string' },
          must_change: {
            type: 'object',
            properties: {
              business_name: { type: 'string' },
              logo: { type: 'object', properties: { description: { type: 'string' }, location: { type: 'string' } } },
              tagline: { type: 'string' },
              contact_info: { type: 'object', properties: {
                phone: { type: 'string' }, email: { type: 'string' }, address: { type: 'string' },
                social_links: { type: 'array', items: { type: 'string' } }
              } },
              images_to_replace: { type: 'array', items: { type: 'object', properties: {
                url: { type: 'string' }, description: { type: 'string' }, reason: { type: 'string' }, replacement_prompt: { type: 'string' }
              } } },
              content_to_replace: { type: 'array', items: { type: 'object', properties: {
                section: { type: 'string' }, original_text: { type: 'string' }, reason: { type: 'string' }
              } } },
              trademarked_terms: { type: 'array', items: { type: 'string' } }
            }
          },
          can_keep: {
            type: 'object',
            properties: {
              page_structure: { type: 'string' },
              service_descriptions: { type: 'array', items: { type: 'string' } },
              faq_format: { type: 'string' },
              color_scheme: { type: 'string' },
              layout: { type: 'string' },
              general_content: { type: 'array', items: { type: 'string' } }
            }
          },
          name_recommendations: { type: 'array', items: { type: 'object', properties: {
            name: { type: 'string' }, domain: { type: 'string' }, rationale: { type: 'string' }, available: { type: 'boolean' }
          } } }
        }
      },
      fallback: {
        risk_level: 'medium',
        executive_summary: 'Legal scan failed — using conservative defaults. Manual review recommended.',
        must_change: { business_name: '', images_to_replace: [], content_to_replace: [], trademarked_terms: [] },
        can_keep: { page_structure: 'Standard layout', service_descriptions: [], faq_format: 'Standard FAQ', color_scheme: 'Similar palette acceptable', layout: 'Standard', general_content: [] },
        name_recommendations: [],
      },
    });

    log(`Legal scan complete: risk=${analysis.risk_level}, ${(analysis.must_change?.images_to_replace || []).length} images to replace, ${(analysis.must_change?.content_to_replace || []).length} content blocks to replace, ${(analysis.name_recommendations || []).length} name options`);

    // ---- Step 3: Build the single-page summary ----
    const mc = analysis.must_change || {};
    const ck = analysis.can_keep || {};
    const names = analysis.name_recommendations || [];

    const summary = `# Legal Scan Report: ${project.target_url}

## Executive Summary
${analysis.executive_summary || ''}

**Risk Level:** ${analysis.risk_level || 'medium'}

---

## ⚠️ MUST CHANGE (Legal Requirements)

### Business Name
**Current:** ${mc.business_name || 'N/A'}
**Action:** Must replace with a new brand name (see recommendations below)

### Logo
${mc.logo ? `**Description:** ${mc.logo.description || ''}\n**Location:** ${mc.logo.location || ''}` : 'N/A'}

### Tagline
${mc.tagline || 'N/A'}

### Contact Information
${mc.contact_info ? `- **Phone:** ${mc.contact_info.phone || 'N/A'}
- **Email:** ${mc.contact_info.email || 'N/A'}
- **Address:** ${mc.contact_info.address || 'N/A'}
- **Social Links:** ${(mc.contact_info.social_links || []).join(', ') || 'N/A'}` : 'N/A'}

### Trademarked Terms
${(mc.trademarked_terms || []).map(t => `- ${t}`).join('\n') || 'None identified'}

### Images That Must Be Replaced (${(mc.images_to_replace || []).length})
${(mc.images_to_replace || []).map((img, i) => `**${i + 1}.** ${img.description || ''}
   - URL: ${img.url || ''}
   - Reason: ${img.reason || ''}
   - Replacement prompt: ${img.replacement_prompt || ''}`).join('\n\n')}

### Content That Must Be Replaced (${(mc.content_to_replace || []).length})
${(mc.content_to_replace || []).map((c, i) => `**${i + 1}. Section:** ${c.section || ''}
   - Original: "${(c.original_text || '').slice(0, 200)}..."
   - Reason: ${c.reason || ''}`).join('\n\n')}

---

## ✅ CAN KEEP (No Legal Issues)

### Page Structure
${ck.page_structure || 'Standard layout — safe to reuse'}

### Service Descriptions
${(ck.service_descriptions || []).map(s => `- ${s}`).join('\n') || 'General industry descriptions — safe to keep'}

### FAQ Format
${ck.faq_format || 'Standard FAQ structure — safe to reuse'}

### Color Scheme
${ck.color_scheme || 'Similar palette is acceptable'}

### Layout
${ck.layout || 'Standard layout — safe to reuse'}

### General Content
${(ck.general_content || []).map(c => `- ${c}`).join('\n') || 'General industry content — safe to keep'}

---

## 🏷️ Recommended New Business Names (20 Options)
${names.map((n, i) => `**${i + 1}. ${n.name}** — ${n.domain} ${n.available ? '✅ Available' : '⚠️ Check availability'}
   ${n.rationale || ''}`).join('\n\n')}

---

## Next Steps
1. Review the recommendations above
2. Select a new business name and domain
3. Generate the rebrand package (logos, replacement images, replacement content)
4. Approve the rebrand
5. System will autonomously provision Drive, GitHub, Vercel, Supabase, purchase the domain, and fill SEO/AEO gaps`;

    // Auto-select best available name
    const bestName = names.find(n => n.available) || names[0] || { name: project.business_name || 'NewCo', domain: `${industry.replace(/[^a-z0-9]/g, '')}-${Date.now().toString(36).slice(-4)}.com` };

    await persist({
      legal_scan: {
        ...analysis,
        single_page_summary: summary
      },
      selected_name: bestName.name,
      selected_domain: bestName.domain,
      current_step: 'scanned',
      status: 'awaiting_approval'
    });

    log('Legal scan complete — awaiting review');

    return Response.json({
      ok: true,
      project_id: project.id,
      risk_level: analysis.risk_level,
      images_to_replace: (mc.images_to_replace || []).length,
      content_to_replace: (mc.content_to_replace || []).length,
      name_options: names.length,
      summary: summary
    });
  } catch (error) {
    console.error('[legalScanClone]', error);
    try {
      const base44 = createClientFromRequest(req);
      const body = await req.json().catch(() => ({}));
      if (body.project_id) {
        await markFailed(base44.asServiceRole, body.project_id, error, { function: 'legalScanClone' });
      }
    } catch {}
    return Response.json({ error: error.message, ...captureError(error) }, { status: 500 });
  }
}