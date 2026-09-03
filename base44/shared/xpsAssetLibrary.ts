// XPS Asset Library — shared module that loads real Xtreme Polishing Systems
// assets from the XpsAsset entity and formats them for use by the auto builder
// generators. This replaces generic placeholders with authentic XPS products,
// equipment, marketing images, videos, and brand assets.
//
// Used by: autoBuildGenerators.ts, autoBuildSiteGenerator.ts, and any backend
// function that needs real XPS data for prompt injection.

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
let _cache = null;
let _cacheTime = 0;

// Load all XpsAsset records and group by category. Cached for 10 minutes.
export async function loadXpsLibrary(base44) {
  const now = Date.now();
  if (_cache && (now - _cacheTime) < CACHE_TTL_MS) return _cache;

  const all = await base44.asServiceRole.entities.XpsAsset.list("-created_date", 500);
  const library = {
    products: [],
    equipment: [],
    colorCharts: [],
    logos: [],
    brand: [],
    marketingImages: [],
    marketingVideos: [],
    socialPosts: [],
    testimonials: [],
    trainingVideos: [],
    podcasts: [],
    all: all,
  };

  for (const asset of all) {
    if (!asset.active && asset.active !== undefined) continue;
    switch (asset.category) {
      case "product": library.products.push(asset); break;
      case "equipment": library.equipment.push(asset); break;
      case "color_chart": library.colorCharts.push(asset); break;
      case "logo": library.logos.push(asset); break;
      case "brand": library.brand.push(asset); break;
      case "marketing_image": library.marketingImages.push(asset); break;
      case "marketing_video": library.marketingVideos.push(asset); break;
      case "social_post": library.socialPosts.push(asset); break;
      case "testimonial": library.testimonials.push(asset); break;
      case "training_video": library.trainingVideos.push(asset); break;
      case "podcast": library.podcasts.push(asset); break;
    }
  }

  _cache = library;
  _cacheTime = now;
  return library;
}

// Get products relevant to a specific floor system
export async function getProductsForSystem(base44, system) {
  const lib = await loadXpsLibrary(base44);
  if (!system) return lib.products;
  return lib.products.filter(p =>
    p.system_relevance?.includes(system) ||
    p.tags?.includes(system) ||
    p.product_type?.includes(system)
  );
}

// Get equipment list (grinders, polishers, vacuums, etc.)
export async function getEquipmentList(base44) {
  const lib = await loadXpsLibrary(base44);
  return lib.equipment;
}

// Get marketing images, optionally filtered by system
export async function getMarketingImages(base44, count = 10, system = null) {
  const lib = await loadXpsLibrary(base44);
  let images = lib.marketingImages;
  if (system) {
    images = images.filter(img =>
      img.system_relevance?.includes(system) || img.tags?.includes(system)
    );
  }
  return images.slice(0, count);
}

// Get marketing videos (YouTube, Instagram reels)
export async function getMarketingVideos(base44, count = 5) {
  const lib = await loadXpsLibrary(base44);
  return lib.marketingVideos.slice(0, count);
}

// Get brand assets (logos, colors, style guides)
export async function getBrandAssets(base44) {
  const lib = await loadXpsLibrary(base44);
  return { logos: lib.logos, brand: lib.brand };
}

// Get image URLs for a specific category (useful for website generation)
export async function getXpsImageUrls(base44, category, count = 10) {
  const lib = await loadXpsLibrary(base44);
  let assets;
  switch (category) {
    case "product": assets = lib.products; break;
    case "equipment": assets = lib.equipment; break;
    case "marketing": assets = lib.marketingImages; break;
    default: assets = lib.all;
  }
  return assets
    .filter(a => a.image_url)
    .slice(0, count)
    .map(a => ({ url: a.image_url, name: a.name, alt: a.description || a.name }));
}

// Format the library as a concise string for LLM prompt injection.
// This gives the LLM real XPS product names, equipment, and image URLs
// to use instead of generic placeholders.
export async function formatLibraryForPrompt(base44, opts = {}) {
  const lib = await loadXpsLibrary(base44);
  const { maxProducts = 30, maxEquipment = 15, maxImages = 10, maxVideos = 5 } = opts;

  const sections = [];

  // Products
  if (lib.products.length > 0) {
    const products = lib.products.slice(0, maxProducts);
    sections.push("=== REAL XPS PRODUCTS (use these exact product names, SKUs, and images) ===");
    for (const p of products) {
      const parts = [p.name];
      if (p.sku) parts.push(`SKU: ${p.sku}`);
      if (p.price) parts.push(`Price: ${p.price}`);
      if (p.product_type) parts.push(`Type: ${p.product_type}`);
      if (p.image_url) parts.push(`Image: ${p.image_url}`);
      if (p.description) parts.push(`Desc: ${p.description.substring(0, 120)}`);
      sections.push(`- ${parts.join(" | ")}`);
    }
  }

  // Equipment
  if (lib.equipment.length > 0) {
    const equipment = lib.equipment.slice(0, maxEquipment);
    sections.push("\n=== REAL XPS EQUIPMENT (reference these machines, not generic ones) ===");
    for (const e of equipment) {
      const parts = [e.name];
      if (e.brand) parts.push(`Brand: ${e.brand}`);
      if (e.product_type) parts.push(`Type: ${e.product_type}`);
      if (e.image_url) parts.push(`Image: ${e.image_url}`);
      if (e.description) parts.push(`Desc: ${e.description.substring(0, 120)}`);
      sections.push(`- ${parts.join(" | ")}`);
    }
  }

  // Marketing images
  if (lib.marketingImages.length > 0) {
    const images = lib.marketingImages.slice(0, maxImages);
    sections.push("\n=== REAL XPS MARKETING IMAGES (use these URLs for hero/gallery sections) ===");
    for (const img of images) {
      sections.push(`- ${img.name}: ${img.image_url}`);
    }
  }

  // Marketing videos
  if (lib.marketingVideos.length > 0) {
    const videos = lib.marketingVideos.slice(0, maxVideos);
    sections.push("\n=== REAL XPS VIDEOS (reference for video generation) ===");
    for (const v of videos) {
      const parts = [v.name];
      if (v.video_url) parts.push(`URL: ${v.video_url}`);
      if (v.thumbnail_url) parts.push(`Thumb: ${v.thumbnail_url}`);
      sections.push(`- ${parts.join(" | ")}`);
    }
  }

  // Color charts
  if (lib.colorCharts.length > 0) {
    const bySystem: Record<string, any[]> = {};
    for (const c of lib.colorCharts) {
      const sys = c.product_type || "other";
      if (!bySystem[sys]) bySystem[sys] = [];
      bySystem[sys].push(c);
    }
    sections.push("\n=== REAL XPS COLOR CHARTS (use these exact color names and codes) ===");
    for (const [sys, colors] of Object.entries(bySystem)) {
      const sample = colors.slice(0, 8);
      sections.push(`- ${sys.toUpperCase()}: ${colors.length} colors available. Examples: ${sample.map(c => `${c.name} (${c.sku})`).join(", ")}`);
    }
  }

  // Brand assets
  if (lib.logos.length > 0 || lib.brand.length > 0) {
    sections.push("\n=== XPS BRAND ASSETS ===");
    for (const l of lib.logos) sections.push(`- Logo: ${l.name} — ${l.image_url}`);
    for (const b of lib.brand) sections.push(`- Brand: ${b.name} — ${b.description || ""}`);
  }

  return sections.join("\n");
}

// Get a concise product list for a specific floor system (for bid engine / specs)
export async function formatProductsForSystem(base44, system) {
  const products = await getProductsForSystem(base44, system);
  if (!products.length) return "";
  const lines = [`=== XPS PRODUCTS FOR ${system.toUpperCase()} ===`];
  for (const p of products.slice(0, 15)) {
    const parts = [p.name];
    if (p.sku) parts.push(`(${p.sku})`);
    if (p.price) parts.push(`— ${p.price}`);
    lines.push(`- ${parts.join(" ")}`);
  }
  return lines.join("\n");
}

// Clear the cache (useful after ingestion)
export function clearXpsLibraryCache() {
  _cache = null;
  _cacheTime = 0;
}