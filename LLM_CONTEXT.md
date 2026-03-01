# LLM Context Manifest
----

## Purpose
- Define a portable, low-noise context loading pattern for this project.
- Minimize token waste while preserving high-value decision context.

## Always Include (First Pass)
- `AGENTS.md`
- `ROLES.md` (if present)
- `ISSUES.md`
- `docs/README.md`

## Include On Demand
- `docs/08-delivery-plan.md` for roadmap/milestones
- `docs/13-ux-behavior-spec.md` for UX behavior questions
- `docs/14-uat-release-checklist.md` for UAT/release checks
- `docs/11-card-art-data-pipeline.md` for art/data pipeline work
- `ISSUES_ARCHIVE.md` only for historical context and reopened items

## Prefer Excluding From LLM Context
- `dist/`
- `node_modules/`
- binary assets (`*.jpg`, `*.png`, audio/video files)
- generated bundles and lock output not relevant to the task
- historical/archive docs unless explicitly needed

## Context Budget Guardrails
- Keep `AGENTS.md` under ~220 lines.
- Keep `ROLES.md` under ~180 lines.
- Keep `ISSUES.md` under ~150 lines (active items only).
- Move resolved/historical content to archives immediately.

## Portability Rules
- Keep this file repo-agnostic where possible.
- Prefer references to role/workflow patterns over app-specific implementation details.
- Reuse this file as a template when bootstrapping other projects.
