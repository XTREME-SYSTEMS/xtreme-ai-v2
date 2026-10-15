import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Package, Edit3, Check, X, Loader2, ExternalLink, DollarSign } from "lucide-react";
import { SERVICE_CATALOG, CATEGORIES } from "@/lib/serviceCatalog";

// Admin gallery of all packages, tools, and services. Shows every product
// in the system with its price, features, and statistics. The source of
// truth for prices is the create-checkout backend function — this page
// shows the catalog (from serviceCatalog.js) alongside the checkout
// product IDs so the admin knows exactly what to edit and where.
export default function AdminPackages() {
  const [activeCategory, setActiveCategory] = useState("plan");
  const [editing, setEditing] = useState(null);

  const services = SERVICE_CATALOG.filter((s) => s.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-lime-400/30 bg-lime-400/10">
          <Package className="h-5 w-5 text-lime-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Package & Service Gallery</h1>
          <p className="text-sm text-white/50">All products, plans, and à-la-carte tools in one place. Edit prices in the create-checkout function; edit details in serviceCatalog.js.</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? "bg-lime-400 text-black"
                  : "border border-white/15 text-white/60 hover:border-lime-400/50 hover:text-lime-300"
              }`}
            >
              <Icon className="h-4 w-4" /> {cat.label}
            </button>
          );
        })}
      </div>

      {/* Service cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <div key={service.id} className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
              {/* Header */}
              <div className="flex items-start gap-3 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${service.accent}`}>
                  <Icon className="h-5 w-5 text-black" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-white">{service.name}</h3>
                  <p className="truncate text-xs text-white/50">{service.tagline}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 text-sm font-bold text-lime-400">
                    <DollarSign className="h-3 w-3" />{service.price}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="border-t border-white/10 p-4">
                <p className="text-xs text-white/60">{service.description}</p>

                {/* Statistics */}
                {service.statistics && service.statistics.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {service.statistics.map((s, i) => (
                      <span key={i} className="rounded-md border border-lime-400/20 bg-lime-400/10 px-2 py-0.5 text-[10px] font-semibold text-lime-300">
                        {s.value} · {s.label}
                      </span>
                    ))}
                  </div>
                )}

                {/* Features count */}
                <div className="mt-3 text-xs text-white/40">
                  {service.features.length} features · Delivery: {service.deliveryTime}
                </div>

                {/* Product ID — tells admin what to edit in create-checkout */}
                <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Checkout Product ID</div>
                    <code className="text-xs text-lime-400">{service.productId}</code>
                  </div>
                  <a
                    href="https://www.base44.com/app/base44-ide/functions/create-checkout"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-[10px] font-medium text-white/60 hover:border-lime-400/50 hover:text-lime-300"
                  >
                    <Edit3 className="h-3 w-3" /> Edit price
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-5">
        <div className="flex items-start gap-3">
          <Package className="mt-0.5 h-5 w-5 shrink-0 text-lime-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">How to edit products</h3>
            <p className="mt-1 text-xs text-white/60">
              Prices are resolved server-side in the <code className="text-lime-400">create-checkout</code> backend function (the <code className="text-lime-400">PRODUCTS</code> map).
              Product details (features, statistics, descriptions) are in <code className="text-lime-400">src/lib/serviceCatalog.js</code>.
              Portal steps per package are in <code className="text-lime-400">src/lib/portalSteps.js</code> (the <code className="text-lime-400">PRODUCT_STEPS</code> map) — add your product ID there with the steps it should show, and the client portal adapts automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}