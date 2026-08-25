import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Every entity in the app except User (built-in, invite-only) and ArchiveRecord
// (the destination — would loop forever). When invoked, this function reads all
// records from each entity, copies a JSON snapshot into ArchiveRecord, then
// deletes the originals so the pipeline starts clean.
const ENTITY_NAMES = [
  "SystemAlert", "AutoBuild", "ArchitectProposal", "SystemOptimization",
  "PortalStudioProject", "VisionCortexIdea", "ClientProject", "DiscoveryRun",
  "BusinessLead", "IdeaCandidate", "GenerationJob", "ServiceCatalogEntry",
  "SocialAccount", "SocialMediaAsset", "Base44Purchase", "WalkthroughProject",
  "ClientDomain", "PromoCode", "RevisionThread", "Approval",
  "EsignDocument", "Receipt", "DomainPortfolio", "CloneProject",
  "BrandProject", "DomainCandidate", "CitationDirectory", "SerpBlueprint",
  "SeoStandardChecklist", "RankPage", "RankEngine", "RankAlert",
  "BacklinkProspect", "ProvisioningRecord", "Market", "RankKeyword",
  "RankCitation", "TemplateLibrary", "WebsiteFactoryProject", "PromptLibrary",
  "ImplementationPlan", "ValidationResult", "ImplementationPhase", "SystemHealthScore",
  "RepairTask", "Expense", "Account", "Invoice",
  "Quote", "Contact", "Campaign", "Activity",
  "Deal", "SeoLaunchKit", "MarketSeo", "CompetitorInsight",
  "MarketPricing", "AuditRequest", "CouponLead", "Industry",
  "Backlink", "SeoPage", "GeneratorRegistry", "Competitor",
  "RepairJob", "Experiment", "Tactic", "PresenceAudit",
  "BusinessSource", "MarketingPack", "ValidationRun", "LeadGenConcept",
  "CapabilityRegistry", "WebsiteGenome", "ProposalPackage", "IndustryDNA",
  "AuditEvidence", "BusinessProspect", "SourceAdapterRegistry", "BrandPack",
  "OperatorDecision", "IntentMap", "BuildProject", "CustomerProfile",
  "TacticScore", "ExperimentMetric", "SearchOpportunity", "WebsitePack",
];

// Strip large nested object/array fields so the JSON snapshot fits in a
// single entity field. Scalar fields and small objects are preserved; big
// generated blobs (architecture specs, website content, image arrays) are
// replaced with a size placeholder so we at least know what was dropped.
function shrinkRecord(record) {
  const clone = { ...record };
  for (const key of Object.keys(clone)) {
    const val = clone[key];
    if (val && typeof val === 'object') {
      const str = JSON.stringify(val);
      if (str.length > 2000) {
        clone[key] = `[stripped: ${str.length} chars]`;
      }
    }
  }
  return clone;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }
    const svc = base44.asServiceRole;
    const archivedAt = new Date().toISOString();
    const results = [];
    // Optional: restrict to specific entities by passing { entities: ["AutoBuild"] }
    const body = await req.json().catch(() => ({}));
    const targetNames = body.entities || ENTITY_NAMES;

    for (const entityName of targetNames) {
      try {
        const entity = svc.entities[entityName];
        if (!entity) {
          results.push({ entity: entityName, error: 'not found' });
          continue;
        }
        let totalArchived = 0;
        // Read → archive → delete in batches of 500. Deleting each batch means
        // the next list() returns the next batch automatically.
        // Safety cap at 20 batches (10k records) per entity to stay in timeout.
        for (let batch = 0; batch < 20; batch++) {
          const records = await entity.list('-created_date', 500);
          if (!records || records.length === 0) break;
          const archiveRecords = records.map((r) => ({
            source_entity: entityName,
            source_id: r.id || '',
            source_created_date: r.created_date || '',
            source_data: JSON.stringify(shrinkRecord(r)),
            archived_at: archivedAt,
          }));
          await svc.entities.ArchiveRecord.bulkCreate(archiveRecords);
          const ids = records.map((r) => r.id).filter(Boolean);
          if (ids.length > 0) {
            await entity.deleteMany({ id: { $in: ids } });
          }
          totalArchived += records.length;
          if (records.length < 500) break;
        }
        results.push({ entity: entityName, archived: totalArchived });
      } catch (e) {
        results.push({ entity: entityName, error: e.message });
      }
    }

    const totalArchived = results.reduce((sum, r) => sum + (r.archived || 0), 0);
    return Response.json({ archivedAt, totalArchived, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}