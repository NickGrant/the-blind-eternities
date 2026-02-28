# Blind Eternities Planechase Documentation

This folder contains authoritative project documentation for architecture, delivery, operations, testing, and release readiness.

## Documentation Index

1. `01-system-architecture.md`  
   System boundaries, ownership, state model, and service responsibilities.

2. `02-runtime-flow-fsm.md`  
   Runtime state machine and allowed transitions.

3. `03-build-time-pipeline.md`  
   Build-time data and asset flow expectations.

4. `04-risks-assumptions.md`  
   Explicit risk register, assumptions, and deferred decisions.

5. `05-operational-considerations.md`  
   Non-functional expectations and operational guardrails.

6. `06-definition-of-ready.md`  
   Entry criteria for starting work items.

7. `07-definition-of-done.md`  
   Completion criteria for implementation and validation.

8. `08-delivery-plan.md`  
   Milestone plan and post-milestone execution policy.

9. `09-testing-standards.md`  
   Testing scope and quality standards.

10. `10-contributor-runbook.md`  
    Repository workflow rules for contributors and coding agents.

11. `11-card-art-data-pipeline.md`  
    Operational runbook for card metadata and art ingestion/sync.

12. `12-assets-serving-troubleshooting.md`  
    Troubleshooting for asset serving and `/assets` 404s.

13. `13-ux-behavior-spec.md`  
    Consolidated runtime UX behavior specification.

14. `14-uat-release-checklist.md`  
    UAT and release-readiness checklist.

15. `15-phenomenon-support-spec.md`  
    Draft specification for Phenomenon play pattern, backend flow, and UX flow.

## Usage Rules

- Update documentation when behavior or scope changes.
- Prefer doc-first updates for architecture-impacting changes.
- Use `ISSUES.md` for active work tracking and status changes.
