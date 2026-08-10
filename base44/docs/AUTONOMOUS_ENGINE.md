# Autonomous Implementation Engine — Builder Docs

## Overview
The Autonomous Implementation Engine is a self-driving system that integrates the **Faultline AI** module library into the Lead Gen Near You site factory. It uses LLM credits to generate code, validate it, reflect on failures, and auto-heal until every phase scores 100/100.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   AUTONOMOUS BUILD LOOP                   │
│                  (workflow, every 10 min)                │
│                                                          │
│  ┌──────────┐    ┌───────────┐    ┌──────────────┐       │
│  │ Generate │───▶│ Validate  │───▶│  Reflect     │       │
│  │ (LLM)    │    │ (LLM)     │    │  (LLM)       │       │
│  └──────────┘    └───────────┘    └──────┬───────┘       │
│       │               │                  │               │
│       ▼               ▼                  ▼               │
│  ImplementationPhase  ValidationResult  RepairTask        │
│                                          │               │
│  ┌──────────────────────────────────────┘               │
│  │  ◀── loop until score = 100 or max iterations ──▶    │
│  └───────────────────────────────────────────────┘       │
│                                                          │
│  ┌──────────────────────────────────────────────┐       │
│  │  NIGHTLY FORENSIC AUDIT (workflow, 2am)       │       │
│  │  forensicAuditAndHarden → computeSystemScore  │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

## Entities

| Entity | Purpose |
|---|---|
| **ImplementationPlan** | Master plan — tracks total/completed phases, overall score, autonomous mode |
| **ImplementationPhase** | One phase per Faultline module — holds the AI-generated spec, code, score, iteration count |
| **ValidationResult** | Per-iteration validation — 6 dimension scores, failures, pass/fail |
| **RepairTask** | Auto-generated fix tasks from reflection — linked to the failure that spawned them |
| **SystemHealthScore** | Aggregated system health — written by the nightly audit and the score computer |

## Backend Functions

| Function | Role | LLM? |
|---|---|---|
| `seedImplementationPlan` | Bootstraps the plan + 8 phases from the forensic audit | No |
| `runAutonomousBuild` | Orchestrator — picks next phase, runs generate→validate→reflect | No (calls others) |
| `autonomousCodeSystem` | Generates the implementation spec + code for a phase | ✅ InvokeLLM |
| `validatePhase` | Scores the phase 0-100 across 6 dimensions | ✅ InvokeLLM |
| `sentinelReflect` | Reflects on failures, proposes fixes, creates RepairTasks | ✅ InvokeLLM |
| `forensicAuditAndHarden` | Deep system audit + auto-harden (nightly) | ✅ InvokeLLM |
| `computeSystemScore` | Aggregates phase scores into SystemHealthScore | No |

## Workflows

| Workflow | Trigger | Action |
|---|---|---|
| **Autonomous Build Loop** | Every 10 minutes (interval) | Runs `runAutonomousBuild` → `computeSystemScore` on pass |
| **Auto Heal Loop** | ImplementationPhase → status = "reflecting" | Runs `sentinelReflect` |
| **Nightly Autonomous Operations** | 2am daily (cron) | `forensicAuditAndHarden` → `computeSystemScore` |

## Agents

| Agent | Role |
|---|---|
| **faultline_autocoder** | Generates specs + code for phases (entity/function tool access) |
| **faultline_sentinel** | Validates, scores, reflects, creates repair tasks |

## The 8 Implementation Phases

1. **Forensic Audit & System Health** — Audit→Finding→Evidence→RepairPlan→RepairTask + SystemHealthScore
2. **Launch Pipeline Hardening** — validate→retry→finalize→assignVercelDomain + LaunchProject tracker
3. **Clone Engine** — deepCloneTarget, deterministicClone, heal-to-100
4. **Discovery Engine** — discoverCloneCandidates, discoverTopPerformers, searchTopWebsitesByIndustry
5. **Tool Advisor & RAG Library** — recommendToolStack, PromptTemplate, AiTool
6. **Monitoring & Re-scan Loop** — monitoringOrchestrator, rescanMonitor, MonitoringEvent
7. **Client Success & Churn Scoring** — computeClientSuccess, ClientSuccessScore
8. **Automation Blueprints** — generateAutomationEnhancements, AutomationBlueprint

## Validation Criteria (scored 0-100 each)

- **Completeness** — all deliverables, entities, functions, pages specified with field-level detail
- **Correctness** — valid JSON schemas, Base44 handler pattern, default page exports
- **Integration** — wired into router, navigation, shared modules
- **Security** — admin function guards, no client secrets, RLS considered
- **Performance** — paginated queries, batched LLM calls, no full-table scans
- **Autonomy** — workflow-triggerable, self-logging, no manual intervention

## How to Operate

1. **Seed the plan** — open the Autonomous System dashboard, click "Seed Plan". Creates the plan + 8 phases.
2. **Start the loop** — the Autonomous Build Loop workflow fires every 10 minutes automatically. Each run advances one phase by one iteration.
3. **Monitor** — the dashboard shows phase status, scores, validation results, and repair tasks in real time.
4. **Nightly audit** — at 2am, the forensic auditor runs a deep pass, creates hardening tasks, and updates the system health score.
5. **Implement** — as phases pass validation, the generated specs + code are ready to deploy into the app. Use the autocoder agent or implement directly.

## Credit Usage

Each orchestrator cycle uses ~3 InvokeLLM calls (generate + validate + reflect). At 8 phases × up to 5 iterations = 40 cycles max, that's ~120 LLM calls to reach 100% across the board. The nightly audit adds 1 call/day.