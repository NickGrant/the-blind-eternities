# AGENTS FILE
----

## Purpose
This file defines project-specific operating instructions for coding agents working in this repository.

## Startup Behavior
- On each new user turn, check for and read these files if they exist:
  - `ROLES.md`
  - `ISSUES.md`
- Treat both files as active project context for planning and execution.
- If either file is missing, continue normally and note the missing file only when relevant.

## Instruction Precedence
- Follow platform/system/developer safety instructions first.
- Then follow this `AGENTS.md`.
- Then follow `ROLES.md` and `ISSUES.md`.
- Then follow user task details.

## Roles Workflow (`ROLES.md`)
- If the user says `assume role <name>` (or equivalent phrasing), load role definition from `ROLES.md` and apply it.
- Persist the active role until:
  - the user says `drop role`, or
  - the user requests a different role.
- If a role name is unknown, state that briefly and continue with default behavior.
- Role guidance must not override higher-priority safety instructions.

## Issues Workflow (`ISSUES.md`)
- Treat `ISSUES.md` as the source of truth for current bug/feature status tracking.
- When the user asks to work issues:
  - prioritize items with `status: unstarted` or `status: reopened`,
  - then continue `status: in-progress` items.
- After resolving an issue:
  - set `status: complete`,
  - append a `Resolution:` line (1-2 sentences) at the bottom of that issue entry.
- If an issue is reopened:
  - keep prior resolution history,
  - append a new `Resolution:` line after the reopen reason when fixed again.
- Do not remove historical `Resolution:` lines unless user explicitly asks.

## Verification Requirements
- After code changes, run relevant tests/builds when available.
- Report pass/fail status clearly.
- If a requested verification cannot be run, state why.

## Editing Rules
- Keep changes scoped to the requested task.
- Avoid unrelated refactors unless required to safely complete the task.
- Keep documentation and tests aligned with behavior changes.

