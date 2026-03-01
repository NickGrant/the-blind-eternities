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
- When an issue is resolved:
  - set `status: complete`
  - append `Resolution:` (1-2 sentences)
  - move the full completed entry to `ISSUES_ARCHIVE.md`
  - remove the completed entry from this active file

## Active Issues

### Functional

title: Add legal notice for third-party card metadata and cached art assets
status: unstarted
description: Create a legal documentation file stating project does not claim ownership of `cards.json` source data or cached plane art images and provide proper attribution/source disclaimer language.

---

title: Prevent duplicate modal open/queue entries for same target
status: unstarted
description: A modal that is already active or already queued (for example same plane like `kessig`) should not be opened or queued again. Deduplicate modal enqueue/open behavior by modal identity.

---

title: Starting tile double-click does not open modal; verify tile instantiation consistency
status: unstarted
description: Double-clicking the starting tile does not open its modal. Investigate whether the starting tile is created/instantiated differently from other tiles and normalize behavior so inspection interactions are consistent.

---

title: Modal should be draggable and remember position
status: unstarted
description: Active modal panel should support click-and-drag repositioning and persist its last position across modal opens within the session.

---

title: Increase modal close button size and click target
status: unstarted
description: Modal close button should be visually larger with a larger interactive hit area for better usability.

---

title: Establish a consistent and appealing visual style system
status: unstarted
description: Application UI needs a cohesive visual language across layout, typography, surfaces, spacing, and interactive elements.

---

title: Add switchable MTG-themed visual themes with persisted preference
status: unstarted
description: Implement user-selectable visual themes that control UI background images/colors, border colors, text colors, and related styling tokens. Support four themes: Phyrexian, Neon Dynasty, Lithomancy, and Halo Fountain; remember user selection across sessions.

---

title: Add AGENTS role-command guidance for task execution patterns
status: unstarted
description: Update `AGENTS.md` with explicit command-style guidance for assuming specific roles and running their expected tasks (for example: Senior Developer for code review/optimization and best-practice refactors, Technical Product Manager for issue/doc review and updates, etc.).

---

title: Move default set selection to shared set-config source
status: unstarted
description: Setup default selection currently hardcodes `OPCA` in UI logic. Default set behavior should be sourced from shared plane-set configuration to avoid future config drift.

---

title: Replace browser confirm quit flow with app-native confirm interaction
status: unstarted
description: `window.confirm` in control flow is blocking and hard to style/test. Replace with app-native confirmation behavior (modal/intent-based) to keep UX and architecture consistent.

---

title: Avoid event-log projection work when dev panels are hidden
status: unstarted
description: App currently computes reversed/sliced event-log view on state updates even when Event Log is hidden. Gate or defer this work when dev-mode panels are not visible.
