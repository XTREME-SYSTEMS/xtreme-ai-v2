import { base44 } from "@/api/base44Client";

// Service Catalog API — fetches rich product/line-item data from the
// ServiceCatalogEntry backend entity. Falls back to the local keyword
// matching library if the entity hasn't been seeded yet.

import { getLineItemDetail } from "@/lib/lineItemDetails";

// Cache for the full catalog so we only fetch once per session.
let _catalogCache = null;
let _catalogPromise = null;

// Fetch all active ServiceCatalogEntry records. Cached per session.
async function fetchCatalog() {
  if (_catalogCache) return _catalogCache;
  if (_catalogPromise) return _catalogPromise;
  _catalogPromise = (async () => {
    try {
      const entries = await base44.entities.ServiceCatalogEntry.filter(
        { active: true },
        "-updated_date",
        200
      );
      _catalogCache = entries || [];
    } catch (e) {
      // Entity may not be seeded yet — fall back to local matching.
      _catalogCache = [];
    }
    return _catalogCache;
  })();
  return _catalogPromise;
}

// Get line-item details for a specific product's features.
// Returns a map: { [featureText]: { description, whatYouGet, howItWorks, seoValue, aeoValue } }
// Uses the backend entity if available, falls back to local keyword matching.
export async function getProductLineItemDetails(productId) {
  const catalog = await fetchCatalog();
  const entry = catalog.find((e) => e.product_id === productId);

  if (entry && entry.features && entry.features.length > 0) {
    // Use backend entity data
    const map = {};
    for (const f of entry.features) {
      if (f.text) {
        map[f.text] = {
          description: f.detail || "",
          whatYouGet: f.what_you_get || [],
          howItWorks: f.how_it_works || "",
          seoValue: f.seo_value || "",
          aeoValue: f.aeo_value || "",
          category: f.category || "",
        };
      }
    }
    return map;
  }

  // Fallback: use local keyword matching
  return null;
}

// Get details for a single line item text — tries backend first, then local.
export async function getLineItemDetailAsync(text, productId) {
  if (productId) {
    const productMap = await getProductLineItemDetails(productId);
    // Only use backend data if it has a non-empty description — otherwise
    // fall back to the local keyword library which has full descriptions.
    if (productMap && productMap[text] && productMap[text].description) {
      return productMap[text];
    }
  }
  // Fallback to local
  return getLineItemDetail(text);
}

// Clear the cache (useful after seeding)
export function clearCatalogCache() {
  _catalogCache = null;
  _catalogPromise = null;
}