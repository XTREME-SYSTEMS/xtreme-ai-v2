import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Ingest Xtreme Polishing Systems catalog — scrapes products, equipment,
// branding, marketing images, and social media content (Instagram, YouTube)
// from xtremepolishingsystems.com and stores them as XpsAsset records.
// The auto builder then uses these real assets instead of generic placeholders.
//
// Admin-only. Uses InvokeLLM with web search (gemini_3_flash) to research and
// structure the data, then bulkCreates XpsAsset records.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const refresh = body?.refresh !== false; // default true

    // Clear existing records if refreshing
    if (refresh) {
      try {
        await base44.asServiceRole.entities.XpsAsset.deleteMany({});
      } catch (e) {
        console.log('Clear existing (may be empty):', e.message);
      }
    }

    const ingestedAt = new Date().toISOString();
    const allRecords = [];

    // === PARALLEL RESEARCH ===
    // 4 InvokeLLM calls with web search, all running concurrently
    const [productsRes, equipmentRes, socialRes, brandRes] = await Promise.all([
      researchProducts(base44),
      researchEquipment(base44),
      researchSocialMedia(base44),
      researchBranding(base44),
    ]);

    // === PRODUCTS ===
    if (productsRes?.products) {
      for (const p of productsRes.products) {
        allRecords.push({
          category: "product",
          name: p.name || "Unknown Product",
          sku: p.sku || "",
          price: p.price || "",
          description: p.description || "",
          image_url: p.image_url || "",
          source_url: p.product_url || "https://xtremepolishingsystems.com/collections/all",
          source_platform: "website",
          brand: p.brand || "Xtreme Polishing Systems",
          product_type: p.category || p.product_type || "",
          tags: p.tags || [],
          system_relevance: p.system_relevance || [],
          use_cases: p.use_cases || [],
          specifications: p.specifications || {},
          active: true,
          ingested_at: ingestedAt,
        });
      }
    }

    // === EQUIPMENT ===
    if (equipmentRes?.equipment) {
      for (const e of equipmentRes.equipment) {
        allRecords.push({
          category: "equipment",
          name: e.name || "Unknown Equipment",
          description: e.description || "",
          image_url: e.image_url || "",
          source_url: e.source_url || "https://xtremepolishingsystems.com/pages/industry-brands-for-professionals",
          source_platform: "website",
          brand: e.brand || "",
          product_type: e.category || e.product_type || "",
          tags: e.tags || [],
          use_cases: e.use_cases || [],
          active: true,
          ingested_at: ingestedAt,
        });
      }
    }

    // === SOCIAL MEDIA (Instagram + YouTube) ===
    if (socialRes?.posts) {
      for (const s of socialRes.posts) {
        const isVideo = s.video_url || s.platform === "youtube" || s.platform === "instagram";
        allRecords.push({
          category: s.platform === "youtube" ? "marketing_video" : (s.platform === "instagram" && s.is_reel ? "marketing_video" : "social_post"),
          name: s.title || s.description?.substring(0, 80) || "Social Post",
          description: s.description || "",
          image_url: s.thumbnail_url || "",
          video_url: s.video_url || "",
          thumbnail_url: s.thumbnail_url || "",
          source_url: s.post_url || "",
          source_platform: s.platform || "website",
          tags: s.tags || [],
          duration_seconds: s.duration_seconds || 0,
          active: true,
          ingested_at: ingestedAt,
        });
      }
    }

    // === BRANDING ===
    if (brandRes?.assets) {
      for (const b of brandRes.assets) {
        allRecords.push({
          category: b.type === "logo" ? "logo" : (b.type === "marketing_image" ? "marketing_image" : "brand"),
          name: b.name || "Brand Asset",
          description: b.description || "",
          image_url: b.image_url || "",
          source_url: b.source_url || "https://xtremepolishingsystems.com",
          source_platform: "website",
          tags: b.tags || [],
          active: true,
          ingested_at: ingestedAt,
        });
      }
    }

    // === TRAINING / PODCAST VIDEOS ===
    if (socialRes?.training_videos) {
      for (const t of socialRes.training_videos) {
        allRecords.push({
          category: "training_video",
          name: t.title || "Training Video",
          description: t.description || "",
          video_url: t.video_url || "",
          thumbnail_url: t.thumbnail_url || "",
          image_url: t.thumbnail_url || "",
          source_url: t.video_url || "",
          source_platform: "youtube",
          tags: t.tags || ["training", "education"],
          duration_seconds: t.duration_seconds || 0,
          active: true,
          ingested_at: ingestedAt,
        });
      }
    }

    // Bulk create in batches of 200
    let created = 0;
    for (let i = 0; i < allRecords.length; i += 200) {
      const batch = allRecords.slice(i, i + 200);
      try {
        await base44.asServiceRole.entities.XpsAsset.bulkCreate(batch);
        created += batch.length;
      } catch (e) {
        console.log(`Batch ${i} create error:`, e.message);
      }
    }

    return Response.json({
      status: "success",
      totalIngested: created,
      breakdown: {
        products: productsRes?.products?.length || 0,
        equipment: equipmentRes?.equipment?.length || 0,
        socialPosts: socialRes?.posts?.length || 0,
        trainingVideos: socialRes?.training_videos?.length || 0,
        brandAssets: brandRes?.assets?.length || 0,
      },
    });
  } catch (error) {
    console.error('ingestXpsCatalog error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// === RESEARCH FUNCTIONS ===
// Each uses InvokeLLM with web search (gemini_3_flash) to research and structure
// real XPS data from their website and social media.

async function researchProducts(base44) {
  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Research the product catalog at xtremepolishingsystems.com (specifically https://xtremepolishingsystems.com/collections/all and its sub-collections). 

Extract as many real products as you can find (aim for 40-60). For each product, provide:
- name: The exact product name as shown on the site
- sku: The product SKU or model number if available
- price: The sale price as shown (e.g. "$375.00", "From $93.05")
- description: A 1-2 sentence product description
- image_url: The full CDN image URL from xtremepolishingsystems.com/cdn/shop/...
- product_url: The full product page URL
- category: Product type (epoxy_coating, primer, sealer, densifier, flake, quartz, glitter, dye_stain, tooling, accessory, machine, etc.)
- brand: Brand name (Xtreme Polishing Systems, Ameripolish, Husqvarna, Metabo, etc.)
- tags: Relevant tags (metallic, flake, garage, commercial, residential, etc.)
- system_relevance: Which floor systems this is for (metallic, flake, quartz, solid, glitter, dye_stain, polished, repair)
- use_cases: Typical applications (garage floor, commercial kitchen, showroom, warehouse, etc.)

Focus on their main product lines: epoxy coatings (Rockhard, Polyaspartic, Polyurea), primers, sealers, densifiers, color pigments, flake systems, quartz systems, joint fillers, tools, and accessories. Include the XPS brand products and the brands they carry.

Return real, accurate data from the actual website. Do not invent products.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        products: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              sku: { type: "string" },
              price: { type: "string" },
              description: { type: "string" },
              image_url: { type: "string" },
              product_url: { type: "string" },
              category: { type: "string" },
              brand: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              system_relevance: { type: "array", items: { type: "string" } },
              use_cases: { type: "array", items: { type: "string" } },
              specifications: { type: "object" }
            }
          }
        }
      }
    }
  });
  return res;
}

async function researchEquipment(base44) {
  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Research the equipment and machine catalog at xtremepolishingsystems.com, specifically the page https://xtremepolishingsystems.com/pages/industry-brands-for-professionals and their equipment collections.

XPS carries equipment from brands like: Husqvarna, Metabo, Makita, Dewalt, Scanmaskin, Bartell Global, Aztec Products, NSS Enterprises, Pioneer Eclipse, Terrco, Onyx (Xtreme Machines), Racatac, U.S. Saws, Portamix, Collomix.

Extract 20-30 real equipment items. For each, provide:
- name: Equipment name (e.g. "Husqvarna PG 280 Floor Grinder", "Metabo W24-180 Dust Extractor")
- description: What it does, key specs
- image_url: CDN image URL from the site
- source_url: Product or collection page URL
- brand: Manufacturer brand
- category: Equipment type (grinder, polisher, vacuum, dust_extractor, buffer, saw, mixer, coving_tool, etc.)
- tags: Relevant tags
- use_cases: What jobs this equipment is used for

Focus on the main equipment categories: floor grinders, concrete polishers, dust extractors/vacuums, floor buffers/scrubbers, hand grinders, mixing equipment, coving tools, and surface prep machines.

Return real, accurate data. Do not invent equipment.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        equipment: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              image_url: { type: "string" },
              source_url: { type: "string" },
              brand: { type: "string" },
              category: { type: "string" },
              product_type: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              use_cases: { type: "array", items: { type: "string" } }
            }
          }
        }
      }
    }
  });
  return res;
}

async function researchSocialMedia(base44) {
  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Research the social media content of Xtreme Polishing Systems (XPS). Their channels are:
- Instagram: https://www.instagram.com/xtremepolishingsystems/
- YouTube: https://www.youtube.com/c/XtremePolishingSystems (66.8K subscribers, 546 videos)
- Facebook: Xtreme Polishing Systems
- TikTok: @xps_uk (UK branch)

Find 15-20 of their most popular and recent social media posts and videos. For each:
- title: Post or video title
- description: Caption or description
- platform: "instagram", "youtube", "facebook", or "tiktok"
- post_url: Full URL to the post/video
- video_url: Direct video URL if available (YouTube watch URL)
- thumbnail_url: Thumbnail image URL
- is_reel: true if Instagram reel
- tags: Relevant tags (epoxy, garage, metallic, before_after, tutorial, etc.)
- duration_seconds: Video duration if known

Also find 10-15 of their best training/educational YouTube videos (they have 546 videos covering epoxy techniques, concrete polishing tutorials, product demos, and their "Epoxy Will Change Your Life" podcast). For training videos, include:
- title: Video title
- description: What it teaches
- video_url: YouTube URL
- thumbnail_url: Thumbnail image URL
- tags: Topics covered (metallic epoxy, flake system, polishing, joint fill, etc.)

Return real content from their actual channels. Do not invent posts or videos.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        posts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              platform: { type: "string" },
              post_url: { type: "string" },
              video_url: { type: "string" },
              thumbnail_url: { type: "string" },
              is_reel: { type: "boolean" },
              tags: { type: "array", items: { type: "string" } },
              duration_seconds: { type: "number" }
            }
          }
        },
        training_videos: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              video_url: { type: "string" },
              thumbnail_url: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              duration_seconds: { type: "number" }
            }
          }
        }
      }
    }
  });
  return res;
}

async function researchBranding(base44) {
  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Research the branding and marketing assets of Xtreme Polishing Systems (xtremepolishingsystems.com). 

Find:
1. Their logo image URL(s) — check their website header, footer, and about pages
2. Their brand colors (primary, secondary, accent colors with hex codes if visible)
3. Their tagline or slogan
4. Marketing/banner images from their homepage and collection pages (CDN image URLs from xtremepolishingsystems.com/cdn/shop/...)
5. Their "About Us" company description and mission
6. Their brand voice description (professional, contractor-focused, etc.)

For each asset, provide:
- name: Asset name (e.g. "XPS Logo", "Homepage Hero Banner", "Brand Color - Primary")
- type: "logo", "marketing_image", or "brand"
- description: Description or context
- image_url: CDN image URL if applicable
- source_url: Page where found
- tags: Relevant tags

Return real data from their actual website. Do not invent assets.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        assets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              type: { type: "string" },
              description: { type: "string" },
              image_url: { type: "string" },
              source_url: { type: "string" },
              tags: { type: "array", items: { type: "string" } }
            }
          }
        }
      }
    }
  });
  return res;
}