# Client Portal Enhancement Implementation Prompt

## Copy-paste this prompt to invoke full implementation:

---

Implement all client portal enhancements from the forensic audit (base44/docs/CLIENT_PORTAL_AUDIT.md). Execute in this order:

## Phase 1: Industry-Aware Generators (C1, C2, E1, E2)
1. Update all 4 backend generators (generateContentTemplates, generateWebsiteContent, generateSocialMediaPack, generateVideoPack) to accept `industry`, `subIndustry`, `businessType`, `financialIntelligence`, `industryAnswers` params and use them in prompts instead of hardcoded "epoxy contractor"
2. Wire financial intelligence (competitor pricing, market insights) into content and website generators
3. Update designPrompts.js logo/brand prompt functions to accept industry context
4. Update all frontend pages to pass industry data from epoxyProfile into generators

## Phase 2: Preview Mode Fix (C3, E3)
5. Create useClientUpdate hook that writes to the correct user (client when previewing, self when not)
6. Replace all base44.auth.updateMe() calls in client portal pages with useClientUpdate

## Phase 3: Revision Cascade Fix (C5, E4)
7. Fix CASCADE map in pipelineNotifications.ts: add profile→all, content→social+video, logo→social
8. Add STEP_RESET_FIELDS for profile

## Phase 4: AI Model Optimization
9. Use claude_opus_4_8 for all text generation (best quality)
10. Use gemini_3_1_pro only where web search is required (add_context_from_internet)

## Phase 5: Re-Analyze, Harden & Optimize
11. Re-audit the system for new gaps after implementations
12. Log new gaps and auto-implement fixes
13. Validate the system end-to-end
14. Harden error handling and optimize performance

Use parallel tool calls for independent file writes. Prefer find_replace for existing files. Test backend functions after changes.