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

title: Replace SVG theme backgrounds with raster art assets
status: unstarted
priority: high
description: Replace current Phaser theme background SVG files with raster art assets (theme-specific generated renders) for higher visual fidelity. PNG assets now exist and this issue is unblocked. Implementation requirements:
- normalize file naming so each theme key maps cleanly and consistently (for example `phyrexian`, `neon-dynasty`, `lithomancy`, `halo-fountain`; fix current `phyrexia.png` naming mismatch)
- convert/normalize image dimensions and format settings as needed so assets are consistent for runtime loading
- optimize/compress PNG files to reduce transfer and bundle weight while preserving acceptable visual quality
- update Phaser theme background loader mapping to use the raster assets
- remove legacy SVG background files after raster migration is validated

---

title: Add Bootstrap dependency and global stylesheet integration
status: unstarted
priority: high
description: Install Bootstrap 5.3 in project dependencies and wire its stylesheet globally so Bootstrap classes used in templates are actually backed by framework CSS instead of custom reimplementation.

---

title: Remove custom control-bar button-group CSS and use Bootstrap-native button groups
status: unstarted
priority: high
description: Refactor control-bar button group implementation to rely on Bootstrap `btn-group`, `btn-check`, and button variant classes with minimal local overrides. Remove duplicated state/focus/checked styling currently implemented in `control-bar.component.scss`.

---

title: Replace custom switch styling with Bootstrap `form-check form-switch` pattern
status: unstarted
priority: medium
description: Update Fog of War and optional rules switches to Bootstrap switch markup (`form-check form-switch` + `form-check-input`/`form-check-label`) and remove custom switch appearance rules from component SCSS.

---

title: Migrate control bar action buttons to Bootstrap button variants/utilities
status: unstarted
priority: medium
description: Replace custom `control-bar__button*` visual variants with Bootstrap button classes (`btn`, `btn-primary`, `btn-secondary`, `btn-danger`, disabled state) and keep component CSS focused on layout spacing only.

---

title: Refactor modal host shell to Bootstrap modal structure without behavior regression
status: unstarted
priority: high
description: The modal uses fully custom styling and structure. Migrate to Bootstrap modal classes/structure (`modal`, `modal-dialog`, `modal-content`, `modal-header`, `modal-body`, `modal-footer`) while preserving existing project-specific behavior (draggable panel, queued count, keyboard handling, viewport clamping).

---

title: Refactor debug panel controls to Bootstrap button and details styling
status: unstarted
priority: medium
description: Debug panel currently duplicates button/chip/panel styling. Migrate buttons and status chips to Bootstrap classes/utilities and reduce custom CSS to component-specific layout concerns.

---

title: Replace custom error banner styling with Bootstrap alert component pattern
status: unstarted
priority: medium
description: Update error banner to use Bootstrap alert semantics and classes (`alert`, severity variant, heading/body structure) and remove duplicated alert border/background/text styling from local SCSS.

---

title: Reduce app shell panel/card style duplication via Bootstrap cards and utilities
status: unstarted
priority: medium
description: App shell reimplements panel surfaces, headers, spacing, and list presentation. Migrate reusable panel blocks (`Game Controls`, `Event Log`, `Debug`) to Bootstrap card/layout utility classes and keep theme-specific overrides token-based.

---

title: Add Bootstrap-conformance guardrails to documentation
status: unstarted
priority: low
description: Update coding/style guidance docs to require Bootstrap-first implementation for common UI primitives (buttons, groups, switches, alerts, cards, modals) and prohibit duplicating framework component styles unless explicitly justified.

---

title: Phenomena not appearing in live gameplay; validate card data pipeline
status: unstarted
priority: high
description: Phenomenon cards are not surfacing during real gameplay runs. Investigate deck composition and runtime filtering to confirm phenomena are included when expected, and verify `cards.json` contains complete/valid phenomenon metadata required by current detection logic.

---
