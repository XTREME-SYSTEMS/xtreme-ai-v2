# Autonomous Build Factory — Implementation Roadmap

## Goal
Transform the pipeline into a fully autonomous business/system generator with:
1. Employee portal (employees sign in, use pipeline, assigned to builds)
2. Sandbox system (everything created in isolated sandbox → validated → packaged)
3. Recursive forensic audit loop (audit → fix → validate → repeat until 100%)

## Phase 1: Foundation (Entities + Role)
- [ ] Add "employee" role to User entity
- [ ] Create SandboxEnvironment entity
- [ ] Create ValidationPipeline entity
- [ ] Create ProductPackage entity
- [ ] Create EmployeeAssignment entity

## Phase 2: Validation Engine
- [ ] Build runValidationLoop backend function (audit → fix → heal → harden → optimize)
- [ ] Wire validation into processAutoBuildStep (auto-validate after each step)

## Phase 3: Workflows
- [ ] Sandbox Validation Loop workflow (auto-runs after build step)
- [ ] Product Packaging workflow (auto-shelves completed builds)

## Phase 4: Employee Portal UI
- [ ] Employee dashboard page (scoped to assignments)
- [ ] Employee management admin page
- [ ] RLS updates for employee access

## Phase 5: Product Catalog
- [ ] Product catalog page (browse shelved products)
- [ ] Deploy product to client domain

## Phase 6: Recursive Forensic Audit
- [ ] Run forensicAuditAndHarden
- [ ] Fix all findings
- [ ] Re-audit until 100% operational