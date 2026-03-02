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

title: Add application-appropriate favicon
status: unstarted
priority: medium
description: Replace the default favicon with a project-appropriate icon for Blind Eternities Planechase and ensure it is wired correctly for local/dev and production (including GitHub Pages) builds.

---

title: Improve page title and SEO meta tags
status: unstarted
priority: medium
description: Update the app document head with a stronger, product-appropriate page title and core SEO/social metadata (description, Open Graph, and related tags) for better discoverability and share previews.

---

title: Refactor MapScene into smaller domain-focused collaborators
status: unstarted
priority: medium
description: `src/phaser/scenes/map.scene.ts` has grown into a large multi-responsibility class (theme sync, background loading, camera controls, tile rendering, pointer interactions, art loading, zoom HUD). Split into focused collaborators/services to reduce cognitive load, improve testability, and lower regression risk during gameplay/UI changes.

---

title: Consolidate duplicated theme mappings between Phaser bootstrap and scene/theme tokens
status: unstarted
priority: medium
description: Theme color/theme-id mapping logic is currently duplicated across `src/styles.scss`, `src/phaser/scenes/map.scene.ts`, and `src/phaser/phaser-bootstrap.service.ts`. Extract shared theme metadata into a single source of truth to prevent drift and inconsistent fallback behavior between app shell and Phaser bootstrap.

---

title: Reduce initial bundle pressure by lazy-loading card catalog data
status: unstarted
priority: high
description: `DeckService` currently imports `src/assets/cards.json` directly into the application bundle, increasing initial JS payload and parse time. Move catalog loading to runtime asset fetch (or equivalent lazy mechanism) with caching/error handling to reduce startup cost and improve scalability as card data grows.

---

title: Add contrast/accessibility regression checks for themed UI variants
status: unstarted
priority: medium
description: Theme changes have repeatedly introduced readability regressions. Add repeatable accessibility checks (manual checklist and/or automated lint/test gate) for color contrast and text legibility across all supported themes, especially for Bootstrap component variants.

---

title: Add quality guardrails for PNG optimization workflow
status: unstarted
priority: low
description: The new PNG optimization flow is effective but currently has no quality guardrails. Add configurable quality presets, before/after reporting artifact output, and an optional visual-regression step to ensure aggressive compression does not degrade background art beyond acceptable thresholds.

---

title: Document asset optimization workflow in project docs index/runbook
status: unstarted
priority: low
description: Add documentation for `assets:optimize:themes` and `assets:optimize:themes:dry` (when to run, expected outputs, and commit expectations) in active docs so release prep and contributor workflows stay consistent.

---

title: Disable zoom controls when no cards are present on canvas
status: unstarted
priority: medium
description: Zoom in/out controls should be disabled when there are no rendered cards/tiles on the Phaser canvas to avoid non-functional interactions and reduce user confusion.

---
