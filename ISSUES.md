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

title: Add player-facing "How to Use" help section
status: unstarted
description: Add an accessible in-app help section explaining controls and flow (starting a session, rolling, moving/planeswalking behavior per mode, modal usage, and debug-mode visibility notes). Content should be visible to non-dev users.

---

title: Modal should be draggable from all non-button regions
status: unstarted
description: Modal dragging should be available from anywhere on the modal surface except interactive buttons, so users are not limited to header-only drag behavior while preserving button click intent.

---

title: Add Blind Eternities classic reveal profile (center + four adjacent face-up at start)
status: unstarted
description: Add a rules-profile option for Blind Eternities that follows the article-aligned startup reveal pattern (center plus N/E/S/W face-up on session start) while preserving deterministic deck usage and modal flow.

---

title: Add optional Hellride movement (diagonal into unrevealed void only)
status: unstarted
description: Implement Hellride movement as an optional rules toggle/profile behavior: allow diagonal movement only when target diagonal space is currently unoccupied/unrevealed; block if a revealed plane already exists there.

---

title: Enforce strict phenomenon-on-reveal replacement in Blind Eternities fill flow
status: unstarted
description: During board fill after movement, if a phenomenon is drawn, resolve it immediately, prevent it from persisting on the map, and continue drawing until a valid plane occupies that slot.

---

title: Enforce ordered reveal pipeline phases for Blind Eternities turn resolution
status: unstarted
description: Refactor movement/reveal sequencing into explicit ordered phases (move -> land/enter effects -> board fill -> phenomenon resolve/replace -> finalize) and add deterministic log markers for each phase.

---

title: Add variant rules profile system across modes
status: unstarted
description: Introduce a first-class rules profile model (for example Blind Eternities Article, Blind Eternities Fog-of-War, Regular Planechase) to keep behavior differences explicit, testable, and selectable at session start.

---

title: Add movement UI affordances for Hellride candidates
status: unstarted
description: When Hellride is enabled, distinguish diagonal Hellride movement options visually from standard adjacent movement options so users can understand available path types.

---

title: Expand in-app rules/help content with mode and variant-specific behavior
status: unstarted
description: Extend the planned How-to-Use surface to include mode/profile-specific rules (startup reveal pattern, planeswalk behavior, Hellride eligibility, and phenomenon replacement handling).

---

title: Add runtime telemetry/log context for mode and variant outcomes
status: unstarted
description: Include game mode/rules profile and key variant outcomes (hellride used, phenomenon replacement chain count, reveal phase markers) in event logs to improve UAT diagnosis and reproducibility.

---

title: Evaluate optional anti-stall/backtrack rule toggle for Blind Eternities
status: unstarted
description: Assess and optionally add a configurable anti-stall movement constraint (for example soft anti-backtrack) while keeping article-aligned behavior as default profile baseline.

---

title: Newlines in card text are not rendered in modal/body display
status: unstarted
description: Card rules text newline characters are currently flattened in HTML rendering. Improve text parsing/rendering so intended line breaks and paragraph spacing are preserved for readability.

