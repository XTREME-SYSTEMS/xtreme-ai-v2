import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Ruler, DollarSign, Image as ImageIcon, CheckCircle } from "lucide-react";
import { FLOOR_SYSTEMS, getFloorSystem } from "@/lib/floorSystems";
import { getSystemRepresentative, getColorsBySystem } from "@/lib/colorChartData";
import { computeBids, buildPrepSummary, SYSTEM_RATES } from "@/lib/bidEngine";
import { generateSpecs, specsToText } from "@/lib/floorSpecs";
import VisualizerPhotoUpload from "@/components/visualizer/VisualizerPhotoUpload";
import VisualizerSystemSelector from "@/components/visualizer/VisualizerSystemSelector";
import VisualizerColorChart from "@/components/visualizer/VisualizerColorChart";
import VisualizerMeasurements from "@/components/visualizer/VisualizerMeasurements";
import VisualizerBidDisplay from "@/components/visualizer/VisualizerBidDisplay";
import VisualizerContactCapture from "@/components/visualizer/VisualizerContactCapture";
import { cn } from "@/lib/utils";

export default function FloorVisualizer() {
  const [photoUrl, setPhotoUrl] = useState("");
  const [systemName, setSystemName] = useState("Metallic Epoxy");
  const [color, setColor] = useState(null);
  const [measurements, setMeasurements] = useState({
    square_feet: 0,
    condition: "fair",
    needs_grinding: true,
    needs_moisture_mitigation: false,
    linear_feet_cracks: 0,
    linear_feet_coving: 0,
    linear_feet_joints: 0,
    patch_count: 0,
    excessive_patch_count: 0,
    large_patch_count: 0,
    demolition_sqft: 0,
    extra_prep: false,
  });
  const [bidTier, setBidTier] = useState("recommended");
  const [finish, setFinish] = useState("High Gloss");
  const [saved, setSaved] = useState(false);

  const floorSystem = getFloorSystem(systemName);

  // Auto-select default color when the color palette (system key) changes.
  // Uses the floor system's defined default_color when available, falling
  // back to the first in-stock color. Only resets when the palette actually
  // changes — switching between systems that share a palette keeps your
  // selection unless the new system has a different default_color.
  useEffect(() => {
    const key = floorSystem?.color_system_key;
    if (key && key !== "none") {
      const palette = getColorsBySystem(key);
      const match = floorSystem.default_color
        ? palette.find(c => c.color_name === floorSystem.default_color)
        : null;
      setColor(match || getSystemRepresentative(key));
    } else {
      setColor(null);
    }
  }, [systemName]);

  // Compute bids
  const bids = useMemo(() => {
    const rates = SYSTEM_RATES[systemName] || { low: floorSystem?.base_rate_low || 5, high: floorSystem?.base_rate_high || 10 };
    return computeBids({
      ...measurements,
      base_rate_low: rates.low,
      base_rate_high: rates.high,
    });
  }, [systemName, measurements]);

  const activeBid = bids.find(b => b.key === bidTier) || bids[1];
  const midPrice = Math.round((activeBid.low + activeBid.high) / 2);
  const perSqft = measurements.square_feet ? (midPrice / measurements.square_feet).toFixed(2) : "—";

  // Generate specs
  const specs = useMemo(() => {
    return generateSpecs(systemName, {
      has_cracks: measurements.linear_feet_cracks > 0,
      has_joints: measurements.linear_feet_joints > 0,
      has_coving: measurements.linear_feet_coving > 0,
      needs_moisture_mitigation: measurements.needs_moisture_mitigation,
      linear_feet_cracks: measurements.linear_feet_cracks,
      linear_feet_joints: measurements.linear_feet_joints,
      linear_feet_coving: measurements.linear_feet_coving,
    });
  }, [systemName, measurements]);

  const prepSummary = buildPrepSummary(measurements);

  // Session data for saving
  const sessionData = {
    photo_url: photoUrl,
    system_name: systemName,
    color_name: color?.color_name || "",
    color_code: color?.code || "",
    color_hex: color?.hex || "",
    square_feet: measurements.square_feet,
    condition: measurements.condition,
    needs_grinding: measurements.needs_grinding,
    needs_moisture_mitigation: measurements.needs_moisture_mitigation,
    linear_feet_cracks: measurements.linear_feet_cracks,
    linear_feet_coving: measurements.linear_feet_coving,
    linear_feet_joints: measurements.linear_feet_joints,
    patch_count: measurements.patch_count,
    excessive_patch_count: measurements.excessive_patch_count,
    large_patch_count: measurements.large_patch_count,
    demolition_sqft: measurements.demolition_sqft,
    extra_prep: measurements.extra_prep,
    bid_tier: bidTier,
    finish,
    bid_low: activeBid.low,
    bid_high: activeBid.high,
    bid_mid: midPrice,
    per_sqft: parseFloat(perSqft) || 0,
    prep_summary: prepSummary,
    specifications: specs,
    status: "bid_generated",
    source: "visualizer",
  };

  if (saved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-4">
        <div className="max-w-md text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-amber-400 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Estimate Saved!</h2>
          <p className="text-white/60 mb-6">
            Thank you! We've received your estimate request for {systemName} flooring.
            Our team will review your project and send a detailed proposal to your email shortly.
          </p>
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-left">
            <div className="text-sm text-white/50">Your Estimate:</div>
            <div className="text-3xl font-bold text-amber-400">${midPrice.toLocaleString()}</div>
            <div className="text-xs text-white/40 mt-1">{systemName} · {color?.color_name || "Standard"} · {measurements.square_feet} sqft</div>
          </div>
          <button
            onClick={() => { setSaved(false); setPhotoUrl(""); setMeasurements({ ...measurements, square_feet: 0 }); }}
            className="mt-6 text-sm text-amber-400 hover:underline"
          >
            Start a new estimate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-amber-400/10 to-transparent">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10">
              <Sparkles className="h-7 w-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Floor Visualizer</h1>
              <p className="text-sm text-white/50">Upload a photo, pick your finish, get an instant estimate</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Step 1: Photo Upload */}
        <Section step={1} icon={ImageIcon} title="Upload Your Floor Photo" subtitle="Show us the space you want to transform">
          <VisualizerPhotoUpload photoUrl={photoUrl} onPhotoUploaded={setPhotoUrl} />
        </Section>

        {/* Step 2: System Selection */}
        <Section step={2} icon={Sparkles} title="Choose Your Floor System" subtitle="Select the type of flooring finish">
          <VisualizerSystemSelector selected={systemName} onSelect={setSystemName} />
          {floorSystem && (
            <p className="mt-3 text-xs text-white/40">{floorSystem.long_description}</p>
          )}
        </Section>

        {/* Step 3: Color Selection */}
        {floorSystem?.color_system_key && floorSystem.color_system_key !== "none" && (
          <Section step={3} icon={Sparkles} title="Pick Your Color" subtitle={`Real manufacturer colors for ${systemName}`}>
            <VisualizerColorChart
              systemKey={floorSystem.color_system_key}
              selected={color?.color_name}
              onSelect={setColor}
            />
            {color && (
              <div className="mt-3 flex items-center gap-2 text-xs text-white/50">
                <div className="h-4 w-4 rounded border border-white/20" style={{ backgroundColor: color.hex }} />
                <span>{color.color_name} ({color.code})</span>
                <span className="text-white/30">·</span>
                <span>{color.collection}</span>
              </div>
            )}
          </Section>
        )}

        {/* Step 4: Measurements */}
        <Section step={4} icon={Ruler} title="Enter Measurements" subtitle="Tell us about your space and floor condition">
          <VisualizerMeasurements values={measurements} onChange={setMeasurements} />
        </Section>

        {/* Step 5: Bid Display */}
        {measurements.square_feet > 0 && (
          <Section step={5} icon={DollarSign} title="Your Instant Estimate" subtitle="Three tiers — pick the one that fits your budget">
            <VisualizerBidDisplay
              bids={bids}
              selectedTier={bidTier}
              onTierSelect={setBidTier}
              sqft={measurements.square_feet}
              finish={finish}
              onFinishChange={setFinish}
            />
          </Section>
        )}

        {/* Step 6: Contact Capture */}
        {measurements.square_feet > 0 && (
          <Section step={6} icon={DollarSign} title="Save Your Estimate" subtitle="Get a detailed proposal emailed to you">
            <VisualizerContactCapture
              sessionData={sessionData}
              onSaved={() => setSaved(true)}
            />
          </Section>
        )}

        {/* Spec Preview */}
        {measurements.square_feet > 0 && specs.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-bold text-white mb-2">Scope of Work Preview</h3>
            <div className="space-y-1.5">
              {specs.map((spec, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="text-amber-400 font-bold shrink-0">{i + 1}.</span>
                  <div>
                    <span className="text-white font-medium">{spec.label}:</span>{" "}
                    <span className="text-white/50">{spec.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ step, icon: Icon, title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/10 text-xs font-bold text-amber-400">
          {step}
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <p className="text-xs text-white/40">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}