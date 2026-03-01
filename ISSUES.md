# ISSUES FILE
----

## Purpose
- `ISSUES.md` tracks active work only.
- Keep this file small and current for day-to-day execution context.
- Historical completed issues are moved to `ISSUES_ARCHIVE.md`.

## How to Use
- Valid statuses for active items:
  - `unstarted`
  - `in-progress`
  - `reopened`
- Valid priorities for active items:
  - `low`
  - `medium`
  - `high`
- When an issue is resolved:
  - set `status: complete`
  - append `Resolution:` (1-2 sentences)
  - move the full completed entry to `ISSUES_ARCHIVE.md`
  - remove the completed entry from this active file

## Active Issues

### Functional

title: Replace "Rules Profile" setup with numeric "Fog of War" setting (1 or 2)
status: unstarted
priority: high
description: Remove the current "Rules Profile" configuration and replace it with a "Fog of War" setting that accepts only numeric values `1` or `2`. Behavior requirements: `1` means only the current square (current plane tile) is face up; on movement, only the destination square is turned face up. `2` means movement reveal follows the article-style directional reveal: after entering destination, reveal current square if needed, then reveal adjacent squares in NESW order until all empty adjacent cardinal squares are face up. Diagonal squares are excluded from this reveal behavior.

---

title: Remove Hellride toggle from setup; Hellride must always be on in Blind Eternities mode
status: unstarted
priority: high
description: Remove user-facing enable/disable controls for Hellride. In Blind Eternities mode, Hellride behavior should always be active and enforced in state/rules flow. Regular Planechase behavior remains unaffected.

---

title: Replace phenomenon ID-prefix heuristic with explicit card-type metadata
status: unstarted
priority: medium
description: Phenomenon handling currently relies on card ID prefix checks (`phenomenon-`). Replace this with explicit card-type metadata in catalog/deck flow so phenomenon detection is data-driven and resilient to naming variance.

---
