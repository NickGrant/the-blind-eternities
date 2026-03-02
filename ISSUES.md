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
  - `blocked`
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

title: Add lint/type-style quality gate to prevent regressions
status: unstarted
priority: high
description: The project currently relies on tests/build only and has no lint command in package scripts. Add a lint gate (and optional formatting check) wired into local verification and CI to catch maintainability and style regressions early.

---

title: Split ControlBarComponent into setup and in-session subcomponents
status: unstarted
priority: medium
description: `ControlBarComponent` is handling setup config, active play controls, quit-confirm flow, and help content in one class/template. Refactor into smaller focused components to reduce coupling and simplify long-term maintenance.

---

title: Add a repeatable UAT smoke test workflow for core gameplay loop
status: unstarted
priority: high
description: There is no automated or scripted browser smoke test that covers start session -> roll die -> move/resolve -> modal close across both Blind Eternities and Planechase modes. Add a repeatable UAT smoke flow and document pass criteria.

---

title: Add card-art coverage report to data pipeline
status: unstarted
priority: medium
description: The team does not have a single command that reports total playable cards, cached art count, and missing-art IDs by type/set. Add an artifact coverage report script to reduce uncertainty about when image fetching is complete.

---

title: Support ?dev-mode URL param outside dev builds
status: unstarted
priority: medium
description: Add support for a `?dev-mode` URL query parameter that enables dev mode even when running non-dev environments (for example production/GitHub Pages), with safe defaults when the parameter is absent.

---

title: Slightly reduce switch height and increase spacing between switches
status: unstarted
priority: medium
description: Tune setup switch styling by reducing switch control height slightly and adding more vertical spacing between stacked switches for better visual balance.

---

### Documentation

title: Update docs to reflect fog-of-war values 0/1 and current setup UX
status: unstarted
priority: high
description: Several active docs still reference legacy fog values (`1`/`2`) and outdated profile wording. Update delivery/runtime/UX/article-alignment docs to match implemented `0/1` behavior and current setup labels.
