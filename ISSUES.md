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

title: Add optional Hellride movement (diagonal into unrevealed void only)
status: unstarted
description: Implement Hellride movement as an optional rules toggle/profile behavior: allow diagonal movement only when target diagonal space is currently unoccupied/unrevealed; block if a revealed plane already exists there.

---

title: Enforce strict phenomenon-on-reveal replacement in Blind Eternities fill flow
status: unstarted
description: During board fill after movement, if a phenomenon is drawn, resolve it immediately, prevent it from persisting on the map, and continue drawing until a valid plane occupies that slot.

---

title: Add movement UI affordances for Hellride candidates
status: unstarted
description: When Hellride is enabled, distinguish diagonal Hellride movement options visually from standard adjacent movement options so users can understand available path types.

---

title: Evaluate optional anti-stall/backtrack rule toggle for Blind Eternities
status: unstarted
description: Assess and optionally add a configurable anti-stall movement constraint (for example soft anti-backtrack) while keeping article-aligned behavior as default profile baseline.

---

title: Add Google Analytics tracking for GitHub Pages deployment
status: unstarted
description: Integrate Google Analytics (GA4) in production/GitHub Pages builds to track usage metrics (sessions, page views, key interactions) with environment-based configuration so local/dev builds remain unaffected.

---

title: Hide Rules Profile picker when only one profile option is available
status: unstarted
description: The rules profile selector should not be displayed when there is only one valid profile choice for the selected game mode (for example Regular Planechase). Show the picker only when users can meaningfully choose between multiple profiles.

---

title: Improve "How to Use" copy for player-friendly readability
status: unstarted
description: Current "How to Use" language is too technical and not easy to scan for typical players. Rewrite the section with simpler phrasing, clearer step-by-step guidance, and more concise wording oriented around player actions.

---
