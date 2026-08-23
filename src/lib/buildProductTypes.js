import { Palette, Cpu, ShoppingCart, Network } from "lucide-react";

// ============================================================
// buildProductTypes.js — Product type registry for the Auto Builder
// ------------------------------------------------------------
// Each product type has its own dedicated pipeline (build-type
// templates). This is the most consistent, least failure-prone
// approach: each pipeline is focused and predictable, rather than
// one universal pipeline that tries to be everything.
//
// The pipeline key maps to a PRODUCT_STEPS entry in portalSteps.js,
// which defines the ordered step sequence for that product type.
// ============================================================

export const BUILD_PRODUCT_TYPES = {
  marketing_site: {
    value: "marketing_site",
    label: "Marketing Website",
    description: "Premium multi-page website with custom design system, SEO/AEO optimization, and lead capture. The existing pipeline.",
    icon: Palette,
    pipeline: "demo", // reuses the existing marketing pipeline
    deliverable: "Deployed marketing website",
  },
  web_app: {
    value: "web_app",
    label: "Web App / SaaS",
    description: "Multi-page application with authentication, dashboards, database, and user accounts. Full deployable codebase.",
    icon: Cpu,
    pipeline: "web_app",
    deliverable: "Deployable React + backend codebase",
  },
  ecommerce: {
    value: "ecommerce",
    label: "E-Commerce / Storefront",
    description: "Online store with product catalog, shopping cart, checkout, and payment processing. Full deployable codebase.",
    icon: ShoppingCart,
    pipeline: "ecommerce",
    deliverable: "Deployable storefront with payments",
  },
  platform: {
    value: "platform",
    label: "Platform / Marketplace",
    description: "Multi-sided platform with user roles, listings, interactions, and marketplace dynamics. Full deployable codebase.",
    icon: Network,
    pipeline: "platform",
    deliverable: "Deployable platform codebase",
  },
};

export const DEFAULT_PRODUCT_TYPE = "marketing_site";

export function getProductType(value) {
  return BUILD_PRODUCT_TYPES[value] || BUILD_PRODUCT_TYPES[DEFAULT_PRODUCT_TYPE];
}

export function getProductTypePipeline(value) {
  const type = getProductType(value);
  return type.pipeline;
}

export const PRODUCT_TYPE_OPTIONS = Object.values(BUILD_PRODUCT_TYPES);