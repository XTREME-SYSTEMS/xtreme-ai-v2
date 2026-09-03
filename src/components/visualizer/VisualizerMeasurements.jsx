import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const CONDITIONS = [
  { key: "good", label: "Good", desc: "Like new, minimal wear" },
  { key: "fair", label: "Fair", desc: "Some wear, minor cracks" },
  { key: "poor", label: "Poor", desc: "Heavy wear, cracks, damage" },
];

export default function VisualizerMeasurements({ values, onChange }) {
  const update = (field, val) => onChange({ ...values, [field]: val });

  return (
    <div className="space-y-4">
      {/* Square footage */}
      <div>
        <Label className="text-xs font-semibold text-white/70">Square Footage</Label>
        <Input
          type="number"
          value={values.square_feet || ""}
          onChange={(e) => update("square_feet", Number(e.target.value))}
          placeholder="e.g. 500"
          className="mt-1 bg-white/5 border-white/10 text-white"
        />
      </div>

      {/* Condition */}
      <div>
        <Label className="text-xs font-semibold text-white/70">Floor Condition</Label>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {CONDITIONS.map((c) => (
            <button
              key={c.key}
              onClick={() => update("condition", c.key)}
              className={cn(
                "rounded-lg border p-2 text-center transition-all",
                values.condition === c.key
                  ? "border-amber-400 bg-amber-400/10 text-amber-400"
                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
              )}
            >
              <div className="text-xs font-semibold">{c.label}</div>
              <div className="text-[10px] text-white/40">{c.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Prep work toggles */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-white/70">Prep Work Required</Label>
        <div className="grid grid-cols-2 gap-2">
          <ToggleChip
            label="Surface Grinding"
            active={values.needs_grinding}
            onToggle={() => update("needs_grinding", !values.needs_grinding)}
          />
          <ToggleChip
            label="Moisture Barrier"
            active={values.needs_moisture_mitigation}
            onToggle={() => update("needs_moisture_mitigation", !values.needs_moisture_mitigation)}
          />
          <ToggleChip
            label="Extra Prep"
            active={values.extra_prep}
            onToggle={() => update("extra_prep", !values.extra_prep)}
          />
        </div>
      </div>

      {/* Detailed measurements */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[11px] text-white/60">Linear Feet of Cracks</Label>
          <Input
            type="number"
            value={values.linear_feet_cracks || ""}
            onChange={(e) => update("linear_feet_cracks", Number(e.target.value))}
            placeholder="0"
            className="mt-1 bg-white/5 border-white/10 text-white text-sm"
          />
        </div>
        <div>
          <Label className="text-[11px] text-white/60">Linear Feet of Joints</Label>
          <Input
            type="number"
            value={values.linear_feet_joints || ""}
            onChange={(e) => update("linear_feet_joints", Number(e.target.value))}
            placeholder="0"
            className="mt-1 bg-white/5 border-white/10 text-white text-sm"
          />
        </div>
        <div>
          <Label className="text-[11px] text-white/60">Linear Feet of Coving</Label>
          <Input
            type="number"
            value={values.linear_feet_coving || ""}
            onChange={(e) => update("linear_feet_coving", Number(e.target.value))}
            placeholder="0"
            className="mt-1 bg-white/5 border-white/10 text-white text-sm"
          />
        </div>
        <div>
          <Label className="text-[11px] text-white/60">Patch Count</Label>
          <Input
            type="number"
            value={values.patch_count || ""}
            onChange={(e) => update("patch_count", Number(e.target.value))}
            placeholder="0"
            className="mt-1 bg-white/5 border-white/10 text-white text-sm"
          />
        </div>
        <div>
          <Label className="text-[11px] text-white/60">Demolition (sqft)</Label>
          <Input
            type="number"
            value={values.demolition_sqft || ""}
            onChange={(e) => update("demolition_sqft", Number(e.target.value))}
            placeholder="0"
            className="mt-1 bg-white/5 border-white/10 text-white text-sm"
          />
        </div>
      </div>
    </div>
  );
}

function ToggleChip({ label, active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-all",
        active
          ? "border-amber-400 bg-amber-400/10 text-amber-400"
          : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
      )}
    >
      {label}
      <div className={cn("h-4 w-4 rounded-full border-2", active ? "border-amber-400 bg-amber-400" : "border-white/20")} />
    </button>
  );
}