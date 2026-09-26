# Persistent Coding Runtime

## Purpose
Continue approved Strategic Minds coding plans when the operator stops typing without pretending a ChatGPT conversation runs forever.

## Architecture
```text
Base44 5-Minute Heartbeat
  -> heartbeat() for existing generation work
  -> persistentCodingSupervisor()
       -> claim one GenerationJob(job_type=coding_packet)
       -> enforce action-class gates
       -> generate bounded DRAFT PATCH BUNDLE
       -> independent LLM validation
       -> PASS: receipt + deterministic next plan step
       -> FAIL: bounded retry with validator feedback
       -> MAX RETRIES: dead letter
       -> PROTECTED ACTION: Approval record + stop
```

## Durable state
Uses existing Base44 entities:
- GenerationJob: work queue, idempotency, attempts, outputs
- Receipt: evidence ledger
- Approval: protected gates

No new database schema is required.

## What keeps working
The scheduled Base44 workflow runs every five minutes even when the ChatGPT conversation is inactive. It can continue through a finite, pre-approved `plan_steps` array until:
1. all steps are generated and independently validated,
2. a protected action is reached,
3. validation exhausts the retry budget, or
4. the chain-depth safety limit is reached.

## What this runtime does today
- persistent plan execution
- bounded code generation
- independent validation
- repair feedback loops
- deterministic next-step enqueue
- idempotency
- stale-work recovery
- retries/backoff
- dead-lettering
- receipts
- approval gates

## What it does NOT claim today
A validated patch is **not automatically applied to GitHub or deployed**. The current AUTO_BUILDER_2 Vercel workflow/agent provisioning adapter returned `not_implemented`, and the connected GitHub accounts could not currently resolve the canonical `Strategic-Minds/AUTO_BUILDER` repository. Until that execution bridge is repaired, the state claim is:

`DRAFT_ONLY_NOT_APPLIED_TO_REPOSITORY`

## Next execution-plane upgrade
When GitHub/Vercel authority is reachable:
1. claim validated draft patch;
2. create disposable sandbox;
3. create branch from verified SHA;
4. apply patch;
5. run lint/typecheck/unit/integration/build;
6. launch preview;
7. independent validator re-fetches branch/preview;
8. create PR/receipt;
9. stop before protected merge/production deploy.

## Required coding_packet payload
Example:
```json
{
  "project_id": "computer-gpt-recovery",
  "objective": "Implement the approved workstation/GPT recovery plan tooling.",
  "action_class": "draft",
  "auto_continue": true,
  "max_attempts": 3,
  "max_chain_depth": 25,
  "allowed_paths": ["docs/", "scripts/", "src/"],
  "forbidden_paths": [".env", "secrets/", "production/"],
  "plan_steps": [
    {
      "title": "Inventory runner",
      "objective": "Create a read-only workstation inventory script.",
      "acceptance_criteria": ["No destructive commands", "Structured JSON output"]
    }
  ]
}
```

## Protected actions
The supervisor will stop for production deploy, protected branch merge, schema/RLS mutation, secrets/env changes, DNS/domain mutation, spend/payment, external messages/public publishing, permission escalation, destructive deletion, or irreversible migration.

## Operational truth
ChatGPT remains the operator-facing planning/orchestration interface. The Base44 scheduled runtime is the persistent worker. Future GitHub/Vercel sandbox workers are the execution plane.
