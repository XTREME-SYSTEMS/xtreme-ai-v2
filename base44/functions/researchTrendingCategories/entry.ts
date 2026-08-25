// Researches trending categories of digital products, websites, apps, and
// business ideas that people want or need right now. Uses InvokeLLM with
// web search (gemini_3_flash) to find trending topics, then saves/updates
// TrendingCategory records. Also seeds system capabilities (marketing site,
// web app, e-commerce, platform) as categories. Called on first load by
// the Vision Generator and weekly via a scheduled workflow.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// This system is exclusively focused on epoxy & concrete contracting.
// The trending categories below are the 5 supported niches — no universal
// categories, no system capabilities, no other industries.
const EPOXY_CONCRETE_CATEGORIES = [
  {
    name: "Epoxy Flooring",
    icon: "🎨",
    description: "Garage floors, basement floors, metallic epoxy, flake systems, self-leveling epoxy for residential & commercial",
    market_size: "$9.4B global (2025) → $16.4B (2033), 7.2% CAGR",
    profitability: "High — $3-$15/SF, 1-2 day installs, strong recurring maintenance",
  },
  {
    name: "Epoxy Coatings",
    icon: "🛡️",
    description: "Concrete coatings, protective coatings, warehouse floors, anti-slip, food-grade, chemical-resistant epoxy",
    market_size: "$45B global coating market, epoxy is 40%+ share",
    profitability: "Very High — commercial/industrial contracts, large SF projects",
  },
  {
    name: "Epoxy Contractors",
    icon: "👷",
    description: "Full-service epoxy installation — residential, commercial, industrial, repair & resurfacing",
    market_size: "$3B US market (2024) → $5.4B (2033)",
    profitability: "High — diversified residential + commercial + industrial revenue",
  },
  {
    name: "Polished Concrete",
    icon: "✨",
    description: "Grind & seal, burnished concrete, stained concrete, densification — commercial & residential",
    market_size: "$3.7B floor coatings (2025), polished is fastest growing segment",
    profitability: "High — $4-$15/SF, low material cost, high labor margin",
  },
  {
    name: "Decorative Concrete",
    icon: "🏛️",
    description: "Stamped concrete, overlays, micro-toppings, stained concrete, resurfacing, exposed aggregate",
    market_size: "$4-$25/SF, growing with outdoor living & patio trends",
    profitability: "Very High — premium decorative finishes, high per-SF margin",
  },
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

    // Seed epoxy/concrete categories if they don't exist
    for (const cat of EPOXY_CONCRETE_CATEGORIES) {
      const exists = existing?.find(c => c.name === cat.name);
      if (!exists) {
        await base44.asServiceRole.entities.TrendingCategory.create({
          ...cat,
          subcategories: [],
          trending_score: 95,
          is_system_capability: true,
          active: true,
          last_updated: new Date().toISOString(),
        });
      }
    }

    // Research trending sub-categories within the epoxy & concrete industry
    const year = new Date().getFullYear();
    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Research the top trending sub-categories and emerging opportunities WITHIN the epoxy flooring, epoxy coatings, polished concrete, and decorative concrete contracting industry in ${year}. For each sub-category provide: name (short, 2-4 words), description (1 sentence about what it is and why it's trending), icon (a single emoji), subcategories (3-5 specific services or niches within it), trending_score (0-100, higher = more trending right now), market_size (brief), and profitability (brief). Focus on: metallic epoxy floors, garage floor coatings, commercial epoxy, industrial coatings, polished concrete, stamped concrete, concrete overlays, micro-toppings, 3D epoxy, food-safe epoxy, warehouse floors, anti-slip coatings, decorative resurfacing, and other emerging epoxy/concrete trends. Return as JSON.`,
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