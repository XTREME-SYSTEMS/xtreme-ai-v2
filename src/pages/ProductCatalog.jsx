import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, Panel, LoadingButton, EmptyState } from "@/components/ui";
import { Package, Eye, Play, CheckCircle, AlertCircle, Clock, Boxes } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProductCatalog() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadPackages();
    const unsub = base44.entities.ProductPackage.subscribe(() => loadPackages());
    return unsub;
  }, []);

  const loadPackages = async () => {
    try {
      const list = await base44.entities.ProductPackage.list("-packaged_at", 50);
      setPackages(list || []);
    } catch (e) {
      console.error("Failed to load packages:", e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === "all" ? packages : packages.filter((p) => p.product_type === filter);

  const stats = {
    total: packages.length,
    deployed: packages.filter((p) => p.status === "deployed").length,
    avgScore: packages.length > 0 ? Math.round(packages.reduce((sum, p) => sum + (p.validation_score || 0), 0) / packages.length) : 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Catalog"
        subtitle="Finished, validated products ready for deployment"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-1">
            <Boxes className="h-4 w-4" /> Total Packages
          </div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-1">
            <CheckCircle className="h-4 w-4" /> Deployed
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.deployed}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-1">
            <Package className="h-4 w-4" /> Avg Validation Score
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.avgScore}%</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "marketing_site", "web_app", "ecommerce", "platform"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-amber-400 text-black"
                : "border border-white/10 text-white/60 hover:bg-white/5"
            }`}
          >
            {f === "all" ? "All Products" : f.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Packages grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-amber-400" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Completed and validated builds will appear here as packaged products."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded-xl border border-white/10 bg-zinc-900 p-5 hover:border-amber-400/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{pkg.name}</h3>
                  <p className="text-xs text-white/40">{pkg.industry || "General"}</p>
                </div>
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                  pkg.status === "deployed" ? "bg-green-500/20 text-green-400" : "bg-amber-400/20 text-amber-400"
                }`}>
                  {pkg.status}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <div className="text-xs text-white/40 mb-1">Validation Score</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${pkg.validation_score}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-amber-400">{pkg.validation_score}%</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {(pkg.tags || []).slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/50">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                {pkg.preview_url && (
                  <a
                    href={pkg.preview_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
                  >
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </a>
                )}
                {pkg.deployed_url && (
                  <a
                    href={pkg.deployed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-green-500/30 px-3 py-1.5 text-xs text-green-400 hover:bg-green-500/10"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Live
                  </a>
                )}
                <Link
                  to={`/auto-builder?build=${pkg.build_id}`}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
                >
                  <Package className="h-3.5 w-3.5" /> Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}