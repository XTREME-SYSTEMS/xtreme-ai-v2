import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { scrapeUrl } from "../../shared/browserbaseScrape.ts";

// Automated XPS Inventory Sync System
// Keeps the platform always aware of product quantities from xtremepolishingsystems.com.
//
// Two-tier approach:
// 1. PRIMARY: Shopify products.json API — fast, returns all 445 products in 2 calls.
//    Gets variant availability (in stock / out of stock) and inventory_quantity (when exposed).
// 2. ENHANCEMENT: Cloud browser (Browserbase) — scrapes individual product pages to extract
//    detailed stock text ("In Stock", "Only 3 left", "Out of Stock") for products where the
//    API doesn't return inventory_quantity. Rotates through the catalog (5 per run) so all
//    products get cloud-verified over time.
//
// Updates XpsAsset records with: active, inventory_quantity, inventory_status, last_synced.

const SHOPIFY_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Cloud browser batch size — how many product pages to scrape per run.
// Browserbase takes ~10-15 seconds per page, so 5 keeps us well under the timeout.
const CLOUD_BROWSER_BATCH = 5;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const cloudBrowserEnabled = body?.cloud_browser !== false;
    const now = new Date().toISOString();

    const report = {
      shopifyProducts: 0,
      matched: 0,
      updated: 0,
      created: 0,
      inStock: 0,
      outOfStock: 0,
      lowStock: 0,
      cloudBrowserScraped: 0,
      cloudBrowserFailed: 0,
      errors: [],
    };

    // === 1. FETCH ALL PRODUCTS FROM SHOPIFY API ===
    const [page1Res, page2Res] = await Promise.all([
      fetch('https://xtremepolishingsystems.com/products.json?limit=250&page=1', { headers: SHOPIFY_HEADERS }),
      fetch('https://xtremepolishingsystems.com/products.json?limit=250&page=2', { headers: SHOPIFY_HEADERS }),
    ]);

    const [page1Data, page2Data] = await Promise.all([
      page1Res.ok ? page1Res.json() : { products: [] },
      page2Res.ok ? page2Res.json() : { products: [] },
    ]);

    const shopifyProducts = [...(page1Data.products || []), ...(page2Data.products || [])];
    report.shopifyProducts = shopifyProducts.length;
    console.log(`Shopify API returned ${shopifyProducts.length} products`);

    // === 2. LOAD ALL XPS ASSET RECORDS (products + equipment only) ===
    const allAssets = await base44.asServiceRole.entities.XpsAsset.list("-created_date", 500);
    const productAssets = allAssets.filter(a => a.category === "product" || a.category === "equipment");
    console.log(`Found ${productAssets.length} product/equipment assets in database`);

    // Build lookup index by SKU and by source_url handle
    const assetsBySku = {};
    const assetsByHandle = {};
    for (const asset of productAssets) {
      if (asset.sku) assetsBySku[asset.sku] = asset;
      if (asset.source_url) {
        const handle = asset.source_url.split('/products/')[1];
        if (handle) assetsByHandle[handle] = asset;
      }
    }

    // === 3. SYNC EACH SHOPIFY PRODUCT TO XPS ASSET ===
    const updates = [];
    const newAssets = [];
    const needsCloudBrowser = [];

    const EQUIPMENT_TAGS = ["dust collector", "grinder", "polisher", "vacuum", "buffer", "floor machine", "saw", "mixer", "sprayer", "equipment", "machine", "tool", "blower", "extractor", "scrubber"];

    for (const p of shopifyProducts) {
      const sku = p.variants?.[0]?.sku || "";
      const handle = p.handle;
      let asset = sku ? assetsBySku[sku] : null;
      if (!asset && handle) asset = assetsByHandle[handle];

      // Get inventory data from Shopify
      const variant = p.variants?.[0];
      const available = variant?.available !== false;
      const invQty = typeof variant?.inventory_quantity === 'number' ? variant.inventory_quantity : null;

      let invStatus = "unknown";
      if (invQty !== null) {
        if (invQty === 0) invStatus = "out_of_stock";
        else if (invQty <= 5) invStatus = "low_stock";
        else invStatus = "in_stock";
      } else {
        invStatus = available ? "in_stock" : "out_of_stock";
      }

      if (invStatus === "in_stock") report.inStock++;
      else if (invStatus === "out_of_stock") report.outOfStock++;
      else if (invStatus === "low_stock") report.lowStock++;

      if (asset) {
        // UPDATE existing asset
        report.matched++;
        updates.push({
          id: asset.id,
          active: available,
          inventory_quantity: invQty,
          inventory_status: invStatus,
          last_synced: now,
          specifications: {
            ...(asset.specifications || {}),
            in_stock: available,
          },
        });
      } else {
        // CREATE new asset — product doesn't exist in DB yet
        const text = `${p.title} ${p.tags || ""} ${p.product_type || ""}`.toLowerCase();
        const isEquipment = EQUIPMENT_TAGS.some(t => text.includes(t));
        const image = p.images?.[0]?.src || "";
        const price = variant?.price ? `$${variant.price}` : "";
        const tags = typeof p.tags === "string" && p.tags
          ? p.tags.split(",").map(t => t.trim()).filter(Boolean)
          : Array.isArray(p.tags) ? p.tags : [];

        newAssets.push({
          category: isEquipment ? "equipment" : "product",
          name: p.title || "Unknown Product",
          sku,
          price,
          description: (p.body_html || "").replace(/<[^>]+>/g, "").replace(/\s{2,}/g, " ").trim().substring(0, 500),
          image_url: image,
          source_url: `https://xtremepolishingsystems.com/products/${p.handle}`,
          source_platform: "website",
          brand: p.vendor || "Xtreme Polishing Systems",
          product_type: p.product_type || "",
          tags,
          active: available,
          inventory_quantity: invQty,
          inventory_status: invStatus,
          last_synced: now,
          ingested_at: now,
          specifications: { in_stock: available },
        });
      }

      // If API didn't return inventory_quantity, mark for cloud browser enhancement
      if (invQty === null && cloudBrowserEnabled) {
        const assetId = asset?.id || null;
        needsCloudBrowser.push({
          assetId,
          handle: p.handle,
          title: p.title,
          url: `https://xtremepolishingsystems.com/products/${p.handle}`,
          isNew: !asset,
        });
      }
    }

    report.created = newAssets.length;

    // === 4. BULK UPDATE + CREATE ASSETS ===
    // Update existing assets
    for (let i = 0; i < updates.length; i += 100) {
      const batch = updates.slice(i, i + 100);
      try {
        await base44.asServiceRole.entities.XpsAsset.bulkUpdate(batch);
        report.updated += batch.length;
      } catch (e) {
        report.errors.push(`Batch update ${i} failed: ${e.message}`);
      }
    }
    console.log(`Updated ${report.updated} existing assets`);

    // Create new product/equipment assets
    for (let i = 0; i < newAssets.length; i += 100) {
      const batch = newAssets.slice(i, i + 100);
      try {
        const created = await base44.asServiceRole.entities.XpsAsset.bulkCreate(batch);
        // Update needsCloudBrowser with newly created asset IDs
        const createdIds = (created || []).map(c => c.id);
        for (const item of needsCloudBrowser) {
          if (item.isNew && !item.assetId && createdIds.length > 0) {
            item.assetId = createdIds.shift();
          }
        }
      } catch (e) {
        report.errors.push(`Batch create ${i} failed: ${e.message}`);
      }
    }
    console.log(`Created ${newAssets.length} new product assets`);

    // === 5. CLOUD BROWSER ENHANCEMENT ===
    // Scrape a rotating batch of product pages that need detailed stock info.
    // Rotate through the catalog so all products get cloud-verified over time.
    if (cloudBrowserEnabled && needsCloudBrowser.length > 0) {
      // Pick a rotating batch — use current hour as offset so different products are scraped each run
      const hourOffset = new Date().getHours();
      const startIndex = (hourOffset * CLOUD_BROWSER_BATCH) % needsCloudBrowser.length;
      const batch = [];
      for (let i = 0; i < CLOUD_BROWSER_BATCH && i < needsCloudBrowser.length; i++) {
        batch.push(needsCloudBrowser[(startIndex + i) % needsCloudBrowser.length]);
      }

      console.log(`Cloud browser: scraping ${batch.length} product pages (offset ${startIndex} of ${needsCloudBrowser.length})`);

      for (const item of batch) {
        try {
          const scraped = await scrapeUrl(item.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
          const pageText = (scraped.text || '').toLowerCase();

          // Extract stock info from page text
          let invStatus = "unknown";
          let invQty = null;

          if (pageText.includes('out of stock') || pageText.includes('sold out') || pageText.includes('unavailable')) {
            invStatus = "out_of_stock";
            invQty = 0;
          } else if (pageText.includes('only') && pageText.match(/only\s*(\d+)\s*(left|remaining|in stock)/)) {
            const match = pageText.match(/only\s*(\d+)\s*(left|remaining|in stock)/);
            invQty = parseInt(match[1]);
            invStatus = invQty <= 5 ? "low_stock" : "in_stock";
          } else if (pageText.includes('in stock') || pageText.includes('available')) {
            invStatus = "in_stock";
          }

          if (invStatus !== "unknown") {
            await base44.asServiceRole.entities.XpsAsset.update(item.assetId, {
              inventory_quantity: invQty,
              inventory_status: invStatus,
              last_synced: now,
            });
            report.cloudBrowserScraped++;
          }
        } catch (e) {
          report.cloudBrowserFailed++;
          report.errors.push(`Cloud browser scrape failed for ${item.title}: ${e.message}`);
        }
      }
    }

    // === 6. RETURN SYNC REPORT ===
    return Response.json({
      status: "success",
      syncedAt: now,
      ...report,
      cloudBrowserPending: needsCloudBrowser.length - report.cloudBrowserScraped,
      nextBatchIn: "6 hours",
    });
  } catch (error) {
    console.error('syncXpsInventory error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}