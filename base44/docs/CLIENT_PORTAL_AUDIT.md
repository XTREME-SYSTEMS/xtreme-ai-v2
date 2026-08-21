# Client Portal Forensic Audit — 2026-08-21

## CRITICAL GAPS

### C1. Industry Data Collected But Not Used
- BusinessProfile wizard collects `industry`, `subIndustry`, `businessType`, `financialIntelligence`, `industryAnswers`
- Every generator prompt is hardcoded for "epoxy contractor"
- Files affected: generateContentTemplates, generateWebsiteContent, generateSocialMediaPack, generateVideoPack, designPrompts.js, clientSteps.js

### C2. Financial Intelligence Is a Dead End
- getFinancialIntelligence returns competitor pricing, retail tiers, market insights
- Data stored on profile but never consumed by any generator or enhancement

### C3. Preview Mode Writes Go to Wrong User
- Admin preview uses useClientUser for display (correct)
- But all generators call base44.auth.updateMe() — writes to ADMIN's record, not client's
- Preview mode is effectively read-only; interactions corrupt admin profile

### C4. No Client Project Entity
- All creative work stored on User record via updateMe()
- No versioning, no multi-market, no asset management
- Revision cascades $unset fields directly on User — destructive with no backup

### C5. Revision Cascade Is Incomplete
- Missing: profile → everything, content → social+video, logo → social
- No cascade for enhancements or signatures

## SIGNIFICANT GAPS

### S1. Two Gating Systems Can Conflict
- StepCoach uses localStorage (clearable, shared between sessions)
- useStepGate checks real data
- Clearing localStorage bypasses the gate

### S2. Business Stage Not Used
- Wizard collects rebrand/enhance/new stages
- Flow is identical for all three
- Rebranding client forced through logo generation

### S3. No Track-Aware Steps
- useClientTrack determines elite/pro/deposit/web-pack
- All clients go through same 13 steps
- Web-pack client (website only) sees social media and video steps

### S4. No Asset Download
- Clients can see assets but can't download any
- No download buttons, no zip export, no delivery mechanism

### S5. No Draft Saving
- BusinessProfile wizard doesn't save until final submit
- Browser close = all progress lost

### S6. No Two-Way Communication
- Request Revision is one-way email
- Client can't see if revision was received or being worked on
- Assistant chat doesn't persist across refreshes

### S7. No Automated Contract Generation
- generateContract function exists
- Signatures step waits for manual EsignDocument creation

### S8. Enhancements Are Static
- ENHANCEMENTS array hardcoded with fixed prices
- Not informed by industry, financial intelligence, or package

### S9. Auto-Generation Race Conditions
- Multiple generators auto-trigger on mount via useEffect[profile]
- Profile fetch async can trigger generation multiple times

## ENHANCEMENT RECOMMENDATIONS

### E1. Make all generators industry-aware (HIGH IMPACT, LOW EFFORT)
### E2. Wire financial intelligence into generators (HIGH IMPACT, LOW EFFORT)
### E3. Fix preview mode writes (HIGH IMPACT, LOW EFFORT)
### E4. Add profile to revision cascade (HIGH IMPACT, LOW EFFORT)
### E5. Create ClientProject entity (HIGH IMPACT, HIGH EFFORT)
### E6. Business stage-aware flow (HIGH IMPACT, MEDIUM EFFORT)
### E7. Track-aware steps (MEDIUM IMPACT, MEDIUM EFFORT)
### E8. Dynamic enhancements (MEDIUM IMPACT, MEDIUM EFFORT)
### E9. Asset download & delivery (MEDIUM IMPACT, MEDIUM EFFORT)
### E10. Two-way messaging (MEDIUM IMPACT, HIGH EFFORT)
### E11. AI quality scoring (MEDIUM IMPACT, MEDIUM EFFORT)
### E12. Analytics tracking (LOW IMPACT, LOW EFFORT)
### E13. Project timeline & ETA (MEDIUM IMPACT, LOW EFFORT)
### E14. Draft saving (MEDIUM IMPACT, LOW EFFORT)
### E15. Error boundaries (LOW IMPACT, LOW EFFORT)

## AI MODEL OPTIMIZATION
- Current: gemini_3_1_pro for web-search tasks, default for others
- Recommended: claude_opus_4_8 for pure generation, gemini_3_1_pro for web search
- All generators should specify the best model explicitly