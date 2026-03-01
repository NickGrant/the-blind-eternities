# AGENTS FILE
----

## Purpose
This file defines project-specific operating instructions for coding agents working in this repository.

## Startup Behavior
- On each new user turn, check for and read these files if they exist:
  - `ROLES.md`
  - `ISSUES.md`
- Treat both files as active project context for planning and execution.
- Only read `ISSUES_ARCHIVE.md` when historical context is explicitly needed.
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
- Treat `ISSUES.md` as the source of truth for current active bug/feature status tracking.
- When the user asks to work issues:
  - prioritize items with `status: unstarted` or `status: reopened`,
  - then continue `status: in-progress` items.
- When beginning implementation of an issue, set `status: in-progress` first.
- After resolving an issue:
  - set `status: complete`,
  - append a `Resolution:` line (1-2 sentences) at the bottom of that issue entry.
- Move the completed issue entry into `ISSUES_ARCHIVE.md` and remove it from `ISSUES.md` to keep active context lean.
- If an issue is reopened:
  - restore it to `ISSUES.md`,
  - keep prior resolution history from archive,
  - append a new `Resolution:` line after the reopen reason when fixed again.
- If the user only requests to `reopen` an issue:
  - move it back to `ISSUES.md` with `status: reopened`,
  - do not begin implementing that issue until the user explicitly asks to work issues or fix that item.
- If the user requests reopen and fix in the same message, reopen then implement immediately.

## Work Loop
- For issue execution, follow this loop: select issue -> mark in-progress -> implement -> verify -> update issue status/resolution -> archive if complete.
- Keep updates short and concrete during multi-issue work.

## Batching Rule
- Default to a small batch of 3-5 issues per pass unless the user requests a different batch size.
- After each batch, report completed items, remaining items, and blockers before continuing.

## Scripted Tasks Rule
- For cache/reseed/image-fetch script requests, always report:
  - script/command run,
  - before and after artifact counts,
  - concrete files or IDs fetched/updated,
  - any failed fetches and reason.

## Doc Hygiene Rule
- Keep active docs concise and current.
- Move historical or superseded detail to archive docs.
- When issue or milestone status changes, update only the minimum relevant active docs plus archive movement.

## Verification Matrix
- UI behavior changes: run relevant unit tests and perform a brief manual UX sanity check.
- Data/script pipeline changes: validate script output and verify expected artifact files exist.
- State/logic changes: run targeted specs first, then broader suite/build when risk justifies it.

## Verification Requirements
- After code changes, run relevant tests/builds when available.
- Report pass/fail status clearly.
- If a requested verification cannot be run, state why.

## Editing Rules
- Keep changes scoped to the requested task.
- Avoid unrelated refactors unless required to safely complete the task.
- Keep documentation and tests aligned with behavior changes.
