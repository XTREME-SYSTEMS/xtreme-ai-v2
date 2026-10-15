import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { COLOR_DATA } from "../../shared/xpsColorData.ts";

// Ingest Xtreme Polishing Systems catalog — directly scrapes the Shopify
// products.json API for ALL 445 products with real image URLs, ingests all
// 150+ color charts from the shared color data, researches Polished Concrete
// University training content, and scrapes XPS social media (Instagram/YouTube).
// Stores everything as XpsAsset records for the auto builder to use.

const EQUIPMENT_TAGS = ["dust collector", "grinder", "polisher", "vacuum", "buffer", "floor machine", "saw", "mixer", "sprayer", "equipment", "machine", "tool", "blower", "extractor", "scrubber"];
const SYSTEM_KEYWORDS: Record<string, string[]> = {
  metallic: ["metallic", "cm-", "xps-0", "xps-6", "xps-7", "metallic pigment"],
  flake: ["flake", "fb-", "paint chip", "vinyl flake"],
  quartz: ["quartz", "qb-", "quartz sand"],
  solid: ["solid", "pigment", "standard color", "safety color", "epoxy color"],
  glitter: ["glitter", "gl-", "sparkle"],
  dye_stain: ["dye", "stain", "ameripolish", "acid stain", "concrete dye"],
  polished: ["densifier", "polishing", "polished", "grit", "pad", "resin"],
  repair: ["repair", "joint fill", "crack", "patch", "sealer", "caulk"],
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&[^;]+;/g, " ").replace(/\s{2,}/g, " ").trim();
}

function isEquipment(product: any): boolean {
  const text = `${product.title} ${product.tags || ""} ${product.product_type || ""}`.toLowerCase();
  return EQUIPMENT_TAGS.some(t => text.includes(t));
}

function getSystemRelevance(product: any): string[] {
  const text = `${product.title} ${product.tags || ""} ${product.body_html || ""}`.toLowerCase();
  const systems: string[] = [];
  for (const [system, keywords] of Object.entries(SYSTEM_KEYWORDS)) {
    if (keywords.some(k => text.includes(k))) systems.push(system);
  }
  return systems;
}

function getProductType(product: any, isEquip: boolean): string {
  if (isEquip) {
    const text = `${product.title} ${product.tags || ""}`.toLowerCase();
    if (text.includes("vacuum") || text.includes("dust") || text.includes("extractor")) return "dust_extractor";
    if (text.includes("grinder")) return "grinder";
    if (text.includes("polisher") || text.includes("polishing")) return "polisher";
    if (text.includes("buffer") || text.includes("scrubber")) return "buffer";
    if (text.includes("saw")) return "saw";
    if (text.includes("mixer")) return "mixer";
    return "equipment";
  }
  const text = `${product.title} ${product.tags || ""}`.toLowerCase();
  if (text.includes("primer")) return "primer";
  if (text.includes("sealer")) return "sealer";
  if (text.includes("densifier")) return "densifier";
  if (text.includes("flake")) return "flake";
  if (text.includes("quartz")) return "quartz";
  if (text.includes("metallic") || text.includes("pigment")) return "pigment";
  if (text.includes("polyurea") || text.includes("polyaspartic")) return "polyaspartic";
  if (text.includes("epoxy") || text.includes("coating")) return "epoxy_coating";
  if (text.includes("joint") || text.includes("repair") || text.includes("patch")) return "repair";
  if (text.includes("tool") || text.includes("trowel") || text.includes("roller") || text.includes("squeegee")) return "tool";
  return "accessory";
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const refresh = body?.refresh !== false;

    // Clear existing records
    if (refresh) {
      try { await base44.asServiceRole.entities.XpsAsset.deleteMany({}); } catch (e) {
        console.log('Clear existing:', e.message);
      }
    }

    const ingestedAt = new Date().toISOString();
    const allRecords: any[] = [];

    // === 1. FETCH ALL XPS PRODUCTS VIA SHOPIFY JSON API ===
    // Shopify exposes /products.json?limit=250 — structured JSON with real
    // product names, SKUs, prices, descriptions, and CDN image URLs.
    // Requires a User-Agent header or Shopify may block the request.
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    async function fetchShopifyPage(pageNum: number): Promise<any[]> {
      try {
        const url = `https://xtremepolishingsystems.com/products.json?limit=250&page=${pageNum}`;
        const res = await fetch(url, { headers: fetchHeaders });
        if (!res.ok) {
          console.log(`Shopify page ${pageNum} HTTP ${res.status}`);
          return [];
        }
        const data = await res.json();
        const prods = data.products || [];
        console.log(`Shopify page ${pageNum}: ${prods.length} products`);
        return prods;
      } catch (e) {
        console.log(`Shopify page ${pageNum} error: ${e.message}`);
        return [];
      }
    }

    const [page1Products, page2Products] = await Promise.all([
      fetchShopifyPage(1),
      fetchShopifyPage(2),
    ]);

    const shopifyProducts = [...page1Products, ...page2Products];
    console.log(`Total fetched from Shopify: ${shopifyProducts.length} products`);

    for (const p of shopifyProducts) {
      const equip = isEquipment(p);
      const description = stripHtml(p.body_html || "").substring(0, 500);
      const image = p.images?.[0]?.src || "";
      const price = p.variants?.[0]?.price ? `$${p.variants[0].price}` : "";
      const sku = p.variants?.[0]?.sku || "";
      const tags = typeof p.tags === "string" && p.tags
        ? p.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : Array.isArray(p.tags) ? p.tags : [];

      allRecords.push({
        category: equip ? "equipment" : "product",
        name: p.title || "Unknown Product",
        sku,
        price,
        description,
        image_url: image,
        source_url: `https://xtremepolishingsystems.com/products/${p.handle}`,
        source_platform: "website",
        brand: p.vendor || "Xtreme Polishing Systems",
        product_type: getProductType(p, equip),
        tags,
        system_relevance: getSystemRelevance(p),
        use_cases: [],
        active: p.variants?.[0]?.available !== false,
        ingested_at: ingestedAt,
      });
    }

    // === 2. INGEST ALL COLOR CHARTS ===
    for (const color of COLOR_DATA) {
      allRecords.push({
        category: "color_chart",
        name: `${color.color_name} (${color.system})`,
        sku: color.code,
        description: `${color.system.charAt(0).toUpperCase() + color.system.slice(1)} color from the ${color.collection}. Sheen: ${color.sheen}. ${color.in_stock ? "In stock." : "Special order."}`,
        image_url: color.image_url || "",
        source_url: "https://xtremepolishingsystems.com/pages/color-charts",
        source_platform: "website",
        brand: color.system === "dye_stain" ? "Ameripolish" : "Xtreme Polishing Systems",
        product_type: color.system,
        tags: [color.system, color.collection, color.sheen, color.in_stock ? "in_stock" : "special_order"],
        system_relevance: [color.system],
        specifications: { hex: color.hex, sheen: color.sheen, collection: color.collection, in_stock: color.in_stock, rank: color.rank },
        active: true,
        ingested_at: ingestedAt,
      });
    }

    // === 3. RESEARCH POLISHED CONCRETE UNIVERSITY + SOCIAL MEDIA IN PARALLEL ===
    const [pcuRes, socialRes] = await Promise.all([
      researchPCU(base44),
      researchSocialMedia(base44),
    ]);

    // PCU training courses
    if (pcuRes?.courses) {
      for (const course of pcuRes.courses) {
        allRecords.push({
          category: "training_video",
          name: course.title,
          description: course.description,
          source_url: "https://www.polishedconcreteuniversity.com/class-information/",
          source_platform: "website",
          brand: "Polished Concrete University",
          tags: ["training", "certification", "education", ...course.topics],
          use_cases: course.topics,
          active: true,
          ingested_at: ingestedAt,
        });
      }
    }

    // PCU marketing content / company info
    if (pcuRes?.marketing_content) {
      allRecords.push({
        category: "brand",
        name: "Polished Concrete University — Company Info",
        description: pcuRes.marketing_content,
        source_url: "https://www.polishedconcreteuniversity.com",
        source_platform: "website",
        brand: "Polished Concrete University",
        tags: ["training", "education", "certification", "marketing"],
        active: true,
        ingested_at: ingestedAt,
      });
    }

    // Social media content
    if (socialRes?.posts) {
      for (const s of socialRes.posts) {
        const isVideo = s.platform === "youtube" || (s.platform === "instagram" && s.is_reel);
        allRecords.push({
          category: isVideo ? "marketing_video" : "social_post",
          name: s.title || "Social Post",
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

    // Training/educational videos
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

    // === 4. BULK CREATE IN BATCHES ===
    let created = 0;
    for (let i = 0; i < allRecords.length; i += 200) {
      const batch = allRecords.slice(i, i + 200);
      try {
        await base44.asServiceRole.entities.XpsAsset.bulkCreate(batch);
        created += batch.length;
      } catch (e) {
        console.log(`Batch ${i} error:`, e.message);
      }
    }

    const breakdown = {
      products: allRecords.filter(r => r.category === "product").length,
      equipment: allRecords.filter(r => r.category === "equipment").length,
      colorCharts: allRecords.filter(r => r.category === "color_chart").length,
      socialPosts: allRecords.filter(r => r.category === "social_post").length,
      marketingVideos: allRecords.filter(r => r.category === "marketing_video").length,
      trainingVideos: allRecords.filter(r => r.category === "training_video").length,
      brandAssets: allRecords.filter(r => r.category === "brand").length,
    };

    return Response.json({
      status: "success",
      totalIngested: created,
      breakdown,
    });
  } catch (error) {
    console.error('ingestXpsCatalog error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Research Polished Concrete University — training courses, curriculum, marketing content
async function researchPCU(base44: any) {
  return await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Research polishedconcreteuniversity.com — the training/certification subsidiary of Xtreme Polishing Systems.

They offer two 5-day certification courses in Pompano Beach, FL ($1750 each):
1. Concrete Polishing Certification: Repair (holes, cracks, expansion joints, structural), Finish, Maintenance, Concrete Stain Logos + Images, Tool/equipment selection, Hands-on training, Marketing/Lead Generation, Bidding, Lifetime Phone Support
2. Epoxy Resin Certification: Moisture Testing, Cove Bases, Surface Preparation, Mixing/Ratios/Pouring, Embedding/Clear Coats, Coating types (Epoxy, Urethane, Polyaspartic, Water Based), Finishes (Glitter, Paint Chip, Vinyl Flake, Quartz, Metallic), Countertops/Floors/Decals, Tool selection, Hands-on training, Marketing, Bidding, Lifetime Support

They also have a YouTube playlist of student testimonials: https://youtube.com/playlist?list=PLfOIJH0IxLS-2wxIIVh5phOowITQGnO7y

Return JSON with:
- courses: array of { title, description, topics[] } — one per certification course
- marketing_content: a 2-3 paragraph company description suitable for marketing copy, mentioning their parent company XPS, 30 years of experience, hands-on training, and lifetime support`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        courses: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              topics: { type: "array", items: { type: "string" } }
            }
          }
        },
        marketing_content: { type: "string" }
      }
    }
  });
}

// Research XPS social media — Instagram, YouTube, podcast
async function researchSocialMedia(base44: any) {
  return await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Research the social media content of Xtreme Polishing Systems (XPS). Their channels:
- Instagram: https://www.instagram.com/xtremepolishingsystems/ (industry-leading products, equipment, training & tools)
- YouTube: https://www.youtube.com/c/XtremePolishingSystems (66.8K subscribers, 546 videos — epoxy techniques, concrete polishing tutorials, product demos, "Epoxy Will Change Your Life" podcast)
- Facebook: Xtreme Polishing Systems
- TikTok: @xps_uk

Find 15-20 of their most popular social posts and videos. For each: title, description, platform, post_url, video_url (YouTube watch URL), thumbnail_url, is_reel (for Instagram), tags, duration_seconds.

Also find 10-15 of their best training/educational YouTube videos (546 total covering epoxy techniques, concrete polishing, product demos, podcast episodes). For each: title, description, video_url, thumbnail_url, tags, duration_seconds.

Return real content from their actual channels. Do not invent posts.`,
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
}