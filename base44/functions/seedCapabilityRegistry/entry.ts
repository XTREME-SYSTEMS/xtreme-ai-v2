import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { CAPABILITY_MAP } from "../../shared/capabilityMap.ts";

// Seeds the CapabilityRegistry entity with all capabilities from the
// capability map — both existing and ingested. Run once after ingesting
// new capabilities to keep the registry in sync.
export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const cap of CAPABILITY_MAP) {
      try {
        // Check if this capability already exists
        const existing = await base44.asServiceRole.entities.CapabilityRegistry.filter(
          { name: cap.name },
          undefined,
          1
        );

        const record = {
          name: cap.name,
          category: cap.category,
          source_system: cap.source_systems.join(", "),
          version: "1.0",
          inputs: [],
          outputs: [cap.description],
          dependencies: cap.our_function ? [cap.our_function] : [],
          industries: [],
          endpoint: cap.our_function || "",
          cost_class: cap.priority === "critical" ? "medium" : "low",
          speed_class: "minutes",
          validation_score: cap.status === "have" ? 100 : cap.status === "ingested" ? 90 : 50,
          validation_status: cap.status === "have" || cap.status === "ingested" ? "verified" : "unverified",
          approval_requirement: cap.priority === "critical" ? "preview" : "none",
          owner: "system",
          fallback: cap.status === "gap" ? "manual" : "auto",
        };

        if (existing && existing.length > 0) {
          await base44.asServiceRole.entities.CapabilityRegistry.update(existing[0].id, record);
          updated++;
        } else {
          await base44.asServiceRole.entities.CapabilityRegistry.create(record);
          created++;
        }
      } catch (e: any) {
        errors++;
      }
    }

    return Response.json({
      success: true,
      created,
      updated,
      errors,
      total_capabilities: CAPABILITY_MAP.length,
    });
  } catch (error: any) {
    return Response.json({ error: error.message || "Seed failed" }, { status: 500 });
  }
}