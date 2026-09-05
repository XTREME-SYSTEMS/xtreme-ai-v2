import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import {
  Loader2, FileText, Calculator, Package, Palette, Layers,
  Search, Check, X, Plus, Download, Copy, Wrench, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Image } from "@/components/ui/image";
import { FLOOR_SYSTEMS } from "@/lib/floorSystems";
import { computeBids, buildPrepSummary, TERMS_TEXT, WARRANTY_TEXT, PRICE_DISCLOSURE, money } from "@/lib/bidEngine";
import { generateSpecs, specsToText } from "@/lib/floorSpecs";

// Product categories for the bid engine — maps to XpsAsset product_type values
const PRODUCT_LAYERS = [
  { key: "primer", label: "Primer / Bond Coat", productTypes: ["primer", "epoxy_coating"], required: true },
  { key: "base_coat", label: "Epoxy Base Coat", productTypes: ["epoxy_coating", "pigment"], required: true },
  { key: "color", label: "Color / Pigment", productTypes: ["metallic", "flake", "quartz", "solid", "glitter", "dye_stain"], required: true, isColor: true },
  { key: "topcoat", label: "Topcoat / Sealer", productTypes: ["sealer", "polyaspartic"], required: true },
  { key: "repair", label: "Repair / Joint Fill", productTypes: ["repair"], required: false },
];

export default function BidEngine() {
  const [xpsProducts, setXpsProducts] = useState([]);
  const [colorCharts, setColorCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [quote, setQuote] = useState(null);

  // Project info
  const [projectName, setProjectName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [squareFeet, setSquareFeet] = useState(500);
  const [condition, setCondition] = useState("fair");
  const [needsGrinding, setNeedsGrinding] = useState(true);
  const [needsMoisture, setNeedsMoisture] = useState(false);
  const [linearFeetCracks, setLinearFeetCracks] = useState(0);
  const [linearFeetJoints, setLinearFeetJoints] = useState(0);
  const [linearFeetCoving, setLinearFeetCoving] = useState(0);

  // Selected system + products
  const [selectedSystem, setSelectedSystem] = useState(FLOOR_SYSTEMS[0].name);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [selectedColor, setSelectedColor] = useState(null);
  const [pickerLayer, setPickerLayer] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => { document.title = "Bid Engine · Xtreme AI"; loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [products, colors] = await Promise.all([
        base44.entities.XpsAsset.list("-created_date", 500),
        base44.entities.ColorChart.list("rank", 500),
      ]);
      setXpsProducts(products || []);
      setColorCharts(colors || []);
      // Auto-select default products for the first system
      autoSelectProducts(FLOOR_SYSTEMS[0], products || [], colors || []);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const autoSelectProducts = (system, products, colors) => {
    const sysKey = system.color_system_key;
    const picks = {};

    // Primer
    picks.primer = products.find(p => p.product_type === "primer" || (p.tags || []).includes("primer"))?.id || null;

    // Base coat
    picks.base_coat = products.find(p => p.product_type === "epoxy_coating" || (p.tags || []).includes("epoxy"))?.id || null;

    // Topcoat
    picks.topcoat = products.find(p => p.product_type === "sealer" || (p.tags || []).includes("sealer") || (p.tags || []).includes("topcoat"))?.id || null;

    // Repair
    picks.repair = products.find(p => p.product_type === "repair" || (p.tags || []).includes("repair"))?.id || null;

    setSelectedProducts(picks);

    // Color — pick the default color for the system
    const defaultColor = colors.find(c => c.system === sysKey && c.color_name === system.default_color)
      || colors.find(c => c.system === sysKey);
    setSelectedColor(defaultColor?.id || null);
  };

  const handleSystemChange = (systemName) => {
    const system = FLOOR_SYSTEMS.find(s => s.name === systemName);
    setSelectedSystem(systemName);
    autoSelectProducts(system, xpsProducts, colorCharts);
    setQuote(null);
  };

  const system = FLOOR_SYSTEMS.find(s => s.name === selectedSystem) || FLOOR_SYSTEMS[0];

  const filteredProducts = useMemo(() => {
    if (!pickerLayer) return [];
    const layer = PRODUCT_LAYERS.find(l => l.key === pickerLayer);
    if (!layer) return [];
    return xpsProducts.filter(p => {
      const matchType = layer.productTypes.includes(p.product_type);
      const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [pickerLayer, xpsProducts, search]);

  const filteredColors = useMemo(() => {
    return colorCharts.filter(c => c.system === system.color_system_key);
  }, [colorCharts, system]);

  const generateQuote = async () => {
    setGenerating(true);
    try {
      const input = {
        system_name: selectedSystem,
        base_rate_low: system.base_rate_low,
        base_rate_high: system.base_rate_high,
        square_feet: Number(squareFeet),
        condition,
        needs_grinding: needsGrinding,
        needs_moisture_mitigation: needsMoisture,
        linear_feet_cracks: Number(linearFeetCracks),
        linear_feet_joints: Number(linearFeetJoints),
        linear_feet_coving: Number(linearFeetCoving),
      };

      const bids = computeBids(input);
      const prepSummary = buildPrepSummary(input);
      const specs = generateSpecs(selectedSystem, {
        linear_feet_cracks: Number(linearFeetCracks),
        needs_moisture_mitigation: needsMoisture,
        linear_feet_joints: Number(linearFeetJoints),
        linear_feet_coving: Number(linearFeetCoving),
      });
      const specsText = specsToText(specs);

      // Build product line items
      const productItems = [];
      for (const layer of PRODUCT_LAYERS) {
        const productId = selectedProducts[layer.key];
        if (!productId) continue;
        const product = xpsProducts.find(p => p.id === productId);
        if (!product) continue;
        const priceNum = parseFloat((product.price || "").replace(/[^0-9.]/g, "")) || 0;
        // Estimate quantity: 1 kit per ~250 sqft for coatings, 1 per ~500 sqft for primers
        const coveragePerUnit = layer.key === "primer" ? 500 : layer.key === "topcoat" ? 400 : 250;
        const qty = Math.ceil(Number(squareFeet) / coveragePerUnit);
        const lineTotal = priceNum * qty;
        productItems.push({
          layer: layer.label,
          name: product.name,
          sku: product.sku || "—",
          price: priceNum,
          qty,
          lineTotal,
          image_url: product.image_url,
        });
      }

      // Color line item
      const color = colorCharts.find(c => c.id === selectedColor);
      if (color) {
        productItems.push({
          layer: "Color / Pigment",
          name: color.color_name,
          sku: color.code,
          price: 0, // color included in system pricing
          qty: 1,
          lineTotal: 0,
          image_url: color.image_url,
          hex: color.hex,
        });
      }

      const materialsTotal = productItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const recommendedBid = bids.find(b => b.key === "recommended") || bids[1] || bids[0];
      const laborTotal = (recommendedBid.mid || ((recommendedBid.low + recommendedBid.high) / 2)) - materialsTotal;
      const grandTotal = recommendedBid.mid || Math.round((recommendedBid.low + recommendedBid.high) / 2 / 25) * 25;

      // Build proposal text
      const today = new Date().toLocaleDateString();
      const proposal = `PROFESSIONAL FLOORING PROPOSAL
${"=".repeat(50)}

Date: ${today}
Project: ${projectName || "Flooring Project"}
Customer: ${customerName || "—"}
Prepared by: Xtreme AI Systems

PROJECT SUMMARY
${"-".repeat(50)}
Floor System: ${selectedSystem}
Square Footage: ${squareFeet} sq ft
Condition: ${condition.toUpperCase()}
Prep Work: ${prepSummary}

SELECTED PRODUCTS (XPS Inventory)
${"-".repeat(50)}
${productItems.map((item, i) => `${i + 1}. ${item.layer}: ${item.name} (SKU: ${item.sku})
   ${item.qty > 1 ? `Qty: ${item.qty} units` : "Qty: 1 unit"} × ${money(item.price)} = ${money(item.lineTotal)}`).join("\n")}

Materials Subtotal: ${money(materialsTotal)}
Labor & Prep Subtotal: ${money(Math.max(0, laborTotal))}

PRICING OPTIONS
${"-".repeat(50)}
${bids.map(b => `${b.label}: ${money(b.low)} – ${money(b.high)} (${b.blurb})`).join("\n")}

SCOPE OF WORK
${"-".repeat(50)}
${specsText}

TERMS & CONDITIONS
${"-".repeat(50)}
${TERMS_TEXT}

WARRANTY
${"-".repeat(50)}
${WARRANTY_TEXT}

${PRICE_DISCLOSURE}
`;

      // Save as VisualizerSession
      const session = await base44.entities.VisualizerSession.create({
        system_name: selectedSystem,
        color_name: color?.color_name || "",
        color_code: color?.code || "",
        color_hex: color?.hex || "",
        square_feet: Number(squareFeet),
        condition,
        needs_grinding: needsGrinding,
        needs_moisture_mitigation: needsMoisture,
        linear_feet_cracks: Number(linearFeetCracks),
        linear_feet_joints: Number(linearFeetJoints),
        linear_feet_coving: Number(linearFeetCoving),
        customer_name: customerName,
        customer_email: customerEmail,
        bid_tier: "recommended",
        bid_low: recommendedBid.low,
        bid_high: recommendedBid.high,
        bid_mid: grandTotal,
        prep_summary: prepSummary,
        specifications: specs.map(s => ({ label: s.label, detail: s.detail })),
        proposal_text: proposal,
        status: "bid_generated",
        source: "bid_engine",
      });

      setQuote({
        proposal,
        productItems,
        bids,
        materialsTotal,
        laborTotal: Math.max(0, laborTotal),
        grandTotal,
        sessionId: session.id,
        specs,
      });
    } catch (err) {
      console.error("Quote generation error:", err);
      alert("Failed to generate quote: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const copyProposal = () => {
    navigator.clipboard.writeText(quote.proposal);
  };

  const downloadProposal = () => {
    const blob = new Blob([quote.proposal], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proposal-${projectName || "flooring"}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="rounded-xl border border-amber-400/40 bg-amber-400/5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <Calculator className="h-4 w-4" /> XPS-Powered Bid Engine
        </div>
        <h1 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Professional Quote Generator</h1>
        <p className="mt-1 text-sm text-white/60">
          Generate professional flooring quotes using real XPS inventory products, authentic color charts,
          and calibrated 2025 national average pricing. Select products directly from the catalog.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: Project Setup */}
        <div className="lg:col-span-1 space-y-4">
          {/* Project Info */}
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <FileText className="h-4 w-4 text-amber-400" /> Project Information
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project name"
                className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-400/50 focus:outline-none"
              />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
                className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-400/50 focus:outline-none"
              />
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Customer email (optional)"
                className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-400/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Floor System */}
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Layers className="h-4 w-4 text-amber-400" /> Floor System
            </div>
            <select
              value={selectedSystem}
              onChange={(e) => handleSystemChange(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-amber-400/50 focus:outline-none"
            >
              {FLOOR_SYSTEMS.map(s => (
                <option key={s.name} value={s.name}>{s.name} (${s.base_rate_low}-${s.base_rate_high}/sqft)</option>
              ))}
            </select>
            <p className="mt-2 text-xs text-white/40">{system.short_description}</p>
          </div>

          {/* Measurements */}
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Calculator className="h-4 w-4 text-amber-400" /> Measurements & Prep
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-white/50">Square Feet</label>
                <input
                  type="number"
                  value={squareFeet}
                  onChange={(e) => setSquareFeet(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-amber-400/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-white/50">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-amber-400/50 focus:outline-none"
                >
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="grinding" checked={needsGrinding} onChange={(e) => setNeedsGrinding(e.target.checked)} className="accent-amber-400" />
                <label htmlFor="grinding" className="text-xs text-white/60">Needs grinding</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="moisture" checked={needsMoisture} onChange={(e) => setNeedsMoisture(e.target.checked)} className="accent-amber-400" />
                <label htmlFor="moisture" className="text-xs text-white/60">Moisture mitigation</label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-white/50">Cracks (lf)</label>
                  <input type="number" value={linearFeetCracks} onChange={(e) => setLinearFeetCracks(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-amber-400/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/50">Joints (lf)</label>
                  <input type="number" value={linearFeetJoints} onChange={(e) => setLinearFeetJoints(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-amber-400/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/50">Coving (lf)</label>
                  <input type="number" value={linearFeetCoving} onChange={(e) => setLinearFeetCoving(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-amber-400/50 focus:outline-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Product Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Package className="h-4 w-4 text-amber-400" /> XPS Product Selection
            </div>
            <p className="mb-3 text-xs text-white/40">
              Products auto-selected from XPS inventory based on the chosen floor system. Click any product to swap it.
            </p>
            <div className="space-y-2">
              {PRODUCT_LAYERS.map((layer) => {
                const productId = selectedProducts[layer.key];
                const product = xpsProducts.find(p => p.id === productId);
                return (
                  <button
                    key={layer.key}
                    onClick={() => { setPickerLayer(layer.key); setSearch(""); }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-all",
                      pickerLayer === layer.key
                        ? "border-amber-400 bg-amber-400/10"
                        : "border-white/10 hover:border-white/25"
                    )}
                  >
                    {product?.image_url ? (
                      <Image src={product.image_url} className="h-10 w-10 shrink-0 rounded" fittingType="fill" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white/5">
                        <Package className="h-5 w-5 text-white/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white">{layer.label}</div>
                      <div className="truncate text-xs text-white/50">
                        {product ? `${product.name} · ${product.sku || "no SKU"}` : "Not selected"}
                      </div>
                    </div>
                    {layer.required && !product && <X className="h-4 w-4 text-red-400" />}
                    {product && <Check className="h-4 w-4 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selection */}
          <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Palette className="h-4 w-4 text-amber-400" /> Color Selection
            </div>
            {filteredColors.length === 0 ? (
              <p className="text-xs text-white/40">No colors found for this system. Run XPS ingestion to populate color charts.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {filteredColors.slice(0, 24).map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-all",
                      selectedColor === color.id
                        ? "border-amber-400 bg-amber-400/10"
                        : "border-white/10 hover:border-white/25"
                    )}
                  >
                    {color.image_url ? (
                      <Image src={color.image_url} className="h-10 w-10 rounded" fittingType="fill" />
                    ) : (
                      <div className="h-10 w-10 rounded border border-white/10" style={{ backgroundColor: color.hex || "#666" }} />
                    )}
                    <span className="text-[9px] text-white/60 text-center leading-tight">{color.color_name}</span>
                  </button>
                ))}
              </div>
            )}
            {filteredColors.length > 24 && (
              <p className="mt-2 text-xs text-white/40">Showing 24 of {filteredColors.length} colors</p>
            )}
          </div>
        </div>

        {/* Right: Product Picker / Quote */}
        <div className="lg:col-span-1 space-y-4">
          {pickerLayer && (
            <div className="rounded-xl border border-amber-400/40 bg-zinc-950 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Package className="h-4 w-4 text-amber-400" /> Select {PRODUCT_LAYERS.find(l => l.key === pickerLayer)?.label}
                </div>
                <button onClick={() => setPickerLayer(null)} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products or SKUs…"
                  className="w-full rounded-lg border border-white/10 bg-black py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-amber-400/50 focus:outline-none"
                />
              </div>
              <div className="max-h-80 space-y-1.5 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <p className="py-4 text-center text-xs text-white/40">No products found. Try a different search.</p>
                ) : (
                  filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setSelectedProducts(prev => ({ ...prev, [pickerLayer]: product.id }));
                        setPickerLayer(null);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-all",
                        selectedProducts[pickerLayer] === product.id
                          ? "border-amber-400 bg-amber-400/10"
                          : "border-white/10 hover:border-white/25"
                      )}
                    >
                      {product.image_url ? (
                        <Image src={product.image_url} className="h-10 w-10 shrink-0 rounded" fittingType="fill" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white/5">
                          <Package className="h-5 w-5 text-white/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-xs font-medium text-white">{product.name}</div>
                        <div className="text-xs text-white/40">{product.sku || "no SKU"} · {product.price || "—"}</div>
                      </div>
                      {selectedProducts[pickerLayer] === product.id && <Check className="h-4 w-4 text-amber-400" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Generate Quote Button */}
          <button
            onClick={generateQuote}
            disabled={generating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-black transition-colors hover:bg-amber-300 disabled:opacity-50"
          >
            {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating Quote…</> : <><FileText className="h-4 w-4" /> Generate Professional Quote</>}
          </button>

          {/* Quote Display */}
          {quote && (
            <div className="rounded-xl border border-emerald-400/40 bg-zinc-950 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                  <Check className="h-4 w-4" /> Quote Generated
                </div>
                <div className="flex gap-1.5">
                  <button onClick={copyProposal} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/60 hover:border-amber-400/50 hover:text-amber-400">
                    <Copy className="h-3 w-3" />
                  </button>
                  <button onClick={downloadProposal} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/60 hover:border-amber-400/50 hover:text-amber-400">
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Bid tiers */}
              <div className="mb-3 grid grid-cols-3 gap-2">
                {quote.bids.map((bid) => (
                  <div
                    key={bid.key}
                    className={cn(
                      "rounded-lg border p-2 text-center",
                      bid.key === "recommended" ? "border-amber-400/50 bg-amber-400/10" : "border-white/10"
                    )}
                  >
                    <div className="text-[10px] font-semibold uppercase text-white/50">{bid.label}</div>
                    <div className="text-sm font-bold text-white">{money(bid.low)}</div>
                    <div className="text-[10px] text-white/40">to {money(bid.high)}</div>
                  </div>
                ))}
              </div>

              {/* Product line items */}
              <div className="space-y-1.5">
                {quote.productItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="text-white/40">{item.layer}:</span>
                    <span className="flex-1 truncate text-white/70">{item.name}</span>
                    {item.lineTotal > 0 && <span className="text-white/60">{money(item.lineTotal)}</span>}
                  </div>
                ))}
              </div>

              <div className="mt-3 border-t border-white/10 pt-2 text-xs">
                <div className="flex justify-between"><span className="text-white/50">Materials:</span><span className="text-white">{money(quote.materialsTotal)}</span></div>
                <div className="flex justify-between"><span className="text-white/50">Labor & Prep:</span><span className="text-white">{money(quote.laborTotal)}</span></div>
                <div className="mt-1 flex justify-between border-t border-white/10 pt-1">
                  <span className="font-semibold text-white">Grand Total:</span>
                  <span className="font-bold text-amber-400">{money(quote.grandTotal)}</span>
                </div>
              </div>

              <div className="mt-2 text-[10px] text-white/30">
                Saved to Visualizer Inbox · Session ID: {quote.sessionId?.slice(0, 8)}…
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Proposal Preview */}
      {quote && (
        <div className="mt-4 rounded-xl border border-white/10 bg-zinc-950 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
            <Eye className="h-4 w-4 text-amber-400" /> Full Proposal Preview
          </div>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black p-4 text-xs text-white/70">
            {quote.proposal}
          </pre>
        </div>
      )}
    </div>
  );
}