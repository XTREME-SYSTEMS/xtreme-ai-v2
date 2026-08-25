// Researches trending categories of digital products, websites, apps, and
// business ideas that people want or need right now. Uses InvokeLLM with
// web search (gemini_3_flash) to find trending topics, then saves/updates
// TrendingCategory records. Also seeds system capabilities (marketing site,
// web app, e-commerce, platform) as categories. Called on first load by
// the Vision Generator and weekly via a scheduled workflow.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

const SYSTEM_CAPABILITIES = [
  { name: "Marketing Website", icon: "🌐", description: "Premium marketing website for any local service business", market_size: "Every business needs one", profitability: "High — one-time + monthly SEO" },
  { name: "Web App / SaaS", icon: "💻", description: "Full web application with auth, database, and recurring revenue", market_size: "Massive and growing SaaS market", profitability: "Very High — recurring revenue" },
  { name: "E-Commerce Store", icon: "🛍️", description: "Online store with product catalog, cart, and checkout", market_size: "Trillion-dollar e-commerce market", profitability: "High — product margins + volume" },
  { name: "Platform / Marketplace", icon: "🏗️", description: "Multi-sided marketplace connecting buyers and sellers", market_size: "Large but requires critical mass", profitability: "Very High — take-rate on every transaction" },
];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Check if categories exist and are fresh (updated within 7 days)
    const existing = await base44.asServiceRole.entities.TrendingCategory.filter(
      { active: true }, "-trending_score", 50
    );

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fresh = existing?.some(c => c.last_updated && new Date(c.last_updated) > weekAgo);

    if (fresh && existing.length >= 12) {
      return Response.json({ categories: existing, cached: true });
    }

    // Seed system capabilities if they don't exist
    for (const cap of SYSTEM_CAPABILITIES) {
      const exists = existing?.find(c => c.name === cap.name);
      if (!exists) {
        await base44.asServiceRole.entities.TrendingCategory.create({
          ...cap,
          subcategories: [],
          trending_score: 100,
          is_system_capability: true,
          active: true,
          last_updated: new Date().toISOString(),
        });
      }
    }

    // Research trending categories using LLM with web search
    const year = new Date().getFullYear();
    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Research the top 20 trending categories of digital products, websites, apps, and business ideas that people want or need right now in ${year}. For each category provide: name (short, 2-4 words), description (1 sentence), icon (a single emoji that best represents it), subcategories (3-5 sub-topics each with a name and 1-sentence description), trending_score (0-100, higher = more trending right now), market_size (brief), and profitability (brief). Focus on categories that are: 1) High demand — people actively searching, 2) Profitable — people willing to pay, 3) Buildable with AI/automation, 4) Trending upward. Include diverse categories: AI tools, health/wellness, productivity, finance/crypto, education, e-commerce, social media, content creation, local services, SaaS, gaming, real estate, travel, food, legal, HR, dev tools, and more. Return as JSON.`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          categories: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                icon: { type: "string" },
                subcategories: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                    },
                  },
                },
                trending_score: { type: "number" },
                market_size: { type: "string" },
                profitability: { type: "string" },
              },
            },
          },
        },
      },
    });

    const categories = (llmRes as any)?.categories || [];
    const now = new Date().toISOString();

    // Save/update each category
    for (const cat of categories) {
      if (!cat?.name) continue;
      const existingCat = existing?.find(c => c.name === cat.name);
      if (existingCat) {
        await base44.asServiceRole.entities.TrendingCategory.update(existingCat.id, {
          ...cat,
          last_updated: now,
        });
      } else {
        await base44.asServiceRole.entities.TrendingCategory.create({
          ...cat,
          is_system_capability: false,
          active: true,
          last_updated: now,
        });
      }
    }

    // Return all active categories sorted by trending score
    const all = await base44.asServiceRole.entities.TrendingCategory.filter(
      { active: true }, "-trending_score", 50
    );

    return Response.json({ categories: all, cached: false, researched: categories.length });
  } catch (error) {
    console.error("researchTrendingCategories error:", error);
    return Response.json({ error: (error as any)?.message || "Research failed" }, { status: 500 });
  }
}