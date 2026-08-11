import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { safeInvoke, parallelSafe, safeUpdate, captureError } from '../../shared/resilience.ts';
import { markFailed } from '../../shared/pipelineState.ts';

// Rebrand Package Generator — takes a legal scan and generates ALL replacement
// assets: logos, replacement images (for each identified image), replacement
// content (for each identified block), new brand colors, tagline, and hero content.
// Combines everything into a single rebrand package ready for approval.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const svc = base44.asServiceRole;
    const logs = [];

    if (!body.project_id) return Response.json({ error: 'project_id required' }, { status: 400 });
    const project = await svc.entities.CloneProject.get(body.project_id);

    if (!project.legal_scan) return Response.json({ error: 'Legal scan not found — run legalScanClone first' }, { status: 400 });

    const log = (m) => logs.push(`${new Date().toISOString().slice(11, 19)} ${m}`);
    await safeUpdate(svc, 'CloneProject', project.id, { current_step: 'generating_rebrand', status: 'running', logs: [...(project.logs || []), ...logs] });
    logs.length = 0;

    const mc = project.legal_scan.must_change || {};
    const name = body.selected_name || project.selected_name || 'NewCo';
    const domain = body.selected_domain || project.selected_domain || 'newco.com';
    const industry = project.industry || 'general';

    // Update selected name/domain if changed
    if (body.selected_name || body.selected_domain) {
      await safeUpdate(svc, 'CloneProject', project.id, { selected_name: name, selected_domain: domain });
    }

    log(`Generating rebrand package for "${name}" (${domain})...`);

    // ---- Step 1: Generate new brand identity (colors, tagline, voice) ----
    log('Generating brand identity...');
    const brandPrompt = `Create a new brand identity for "${name}", a ${industry} business replacing "${mc.business_name || 'the original'}". The original tagline "${mc.tagline || ''}" must be replaced. Return JSON: { "tagline": string, "voice": string (brand voice description), "colors": { "primary": hex, "accent": hex } }`;
    const brand = await safeInvoke(base44, {
      prompt: brandPrompt, model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          tagline: { type: 'string' }, voice: { type: 'string' },
          colors: { type: 'object', properties: { primary: { type: 'string' }, accent: { type: 'string' } } }
        }
      },
      fallback: { tagline: '', voice: 'professional and trustworthy', colors: { primary: '#0a0a0a', accent: '#D4FF4D' } },
      label: 'brand identity',
    });

    // ---- Step 2: Generate 3 logo options in parallel ----
    log('Generating 3 logo options...');
    const logoStyles = ['minimalist geometric', 'bold emblem badge', 'modern abstract monogram'];
    const logoPrompts = logoStyles.map(style =>
      `Professional logo for "${name}", a ${industry} company. Style: ${style}. Colors: ${brand.colors?.primary || '#0a0a0a'} and ${brand.colors?.accent || '#D4FF4D'}. Clean, scalable, on white background. Brand name "${name}" integrated into the logo design.`
    );
    const logoResults = await parallelSafe(logoPrompts.map(p => () =>
      base44.integrations.Core.GenerateImage({ prompt: p })
    ));
    const logos = logoResults.filter(r => r.ok).map((r, i) => ({ url: r.result.url, prompt: logoPrompts[i], style: logoStyles[i] }));
    if (logos.length < logoResults.length) log(`${logoResults.length - logos.length} logo(s) failed`);
    log(`Generated ${logos.length} logos`);

    // ---- Step 3: Generate replacement images for each identified image ----
    const imagesToReplace = mc.images_to_replace || [];
    log(`Generating ${imagesToReplace.length} replacement images...`);
    const imageResults = await parallelSafe(imagesToReplace.slice(0, 5).map(img => () =>
      base44.integrations.Core.GenerateImage({ prompt: img.replacement_prompt || `Professional ${industry} image, high quality, no text` })
        .then(r => ({ original_url: img.url, new_url: r.url, description: img.description, prompt: img.replacement_prompt }))
    ));
    const replacementImages = imageResults.filter(r => r.ok).map(r => r.result);
    if (replacementImages.length < imageResults.length) log(`${imageResults.length - replacementImages.length} image(s) failed`);
    log(`Generated ${replacementImages.length} replacement images`);

    // ---- Step 4: Generate replacement content for each identified block ----
    const contentToReplace = mc.content_to_replace || [];
    let replacementContent = [];
    if (contentToReplace.length > 0) {
      log(`Generating ${contentToReplace.length} replacement content blocks...`);
      const contentPrompt = `You are rebranding a ${industry} website from "${mc.business_name || ''}" to "${name}". For each content block below, write a unique replacement that conveys the same information but in original words. Return JSON: { "replacements": [ { "section": string, "original_text": string, "new_text": string } ] }

Content blocks to replace:
${contentToReplace.map((c, i) => `${i + 1}. Section: ${c.section}\n   Original: "${(c.original_text || '').slice(0, 500)}"\n   Reason: ${c.reason}`).join('\n\n')}

New brand: ${name}
New tagline: ${brand.tagline || ''}
Brand voice: ${brand.voice || ''}`;

      const contentResult = await safeInvoke(base44, {
        prompt: contentPrompt, model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            replacements: { type: 'array', items: { type: 'object', properties: {
              section: { type: 'string' }, original_text: { type: 'string' }, new_text: { type: 'string' }
            } } }
          }
        },
        fallback: { replacements: [] },
        label: 'replacement content',
      });
      replacementContent = contentResult.replacements || [];
      log(`Generated ${replacementContent.length} replacement content blocks`);
    }

    // ---- Step 5: Generate hero content + services + FAQ ----
    log('Generating hero content, services, and FAQ...');
    const heroPrompt = `Generate complete hero section content for "${name}", a ${industry} business. Tagline: ${brand.tagline || ''}. Return JSON: { "headline": string, "subhead": string, "about": string (2 paragraphs), "services": [ { "title": string, "description": string } ], "faq": [ { "question": string, "answer": string } ] }`;
    const heroResult = await safeInvoke(base44, {
      prompt: heroPrompt, model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          headline: { type: 'string' }, subhead: { type: 'string' }, about: { type: 'string' },
          services: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' } } } },
          faq: { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, answer: { type: 'string' } } } }
        }
      },
      fallback: { headline: name, subhead: '', about: '', services: [], faq: [] },
      label: 'hero content',
    });

    const rebrandPackage = {
      new_brand: {
        name,
        tagline: brand.tagline || '',
        voice: brand.voice || '',
        colors: brand.colors || { primary: '#0a0a0a', accent: '#D4FF4D' }
      },
      logos,
      replacement_images: replacementImages,
      replacement_content: replacementContent,
      hero_content: {
        headline: heroResult.headline || '',
        subhead: heroResult.subhead || '',
        about: heroResult.about || ''
      },
      services: heroResult.services || [],
      faq: heroResult.faq || []
    };

    log('Rebrand package complete');
    await safeUpdate(svc, 'CloneProject', project.id, {
      rebrand_package: rebrandPackage,
      current_step: 'rebrand_ready',
      status: 'awaiting_approval',
      logs: [...(project.logs || []), ...logs]
    });

    return Response.json({
      ok: true,
      project_id: project.id,
      logos: logos.length,
      replacement_images: replacementImages.length,
      replacement_content: replacementContent.length,
      services: (heroResult.services || []).length,
      faq: (heroResult.faq || []).length
    });
  } catch (error) {
    console.error('[generateRebrandPackage]', error);
    try {
      const base44 = createClientFromRequest(req);
      const body = await req.json().catch(() => ({}));
      if (body.project_id) {
        await markFailed(base44.asServiceRole, body.project_id, error, { function: 'generateRebrandPackage' });
      }
    } catch {}
    return Response.json({ error: error.message, ...captureError(error) }, { status: 500 });
  }
}