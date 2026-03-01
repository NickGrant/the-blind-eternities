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


title: Modal popup flickers from default position to saved position on open
status: unstarted
description: Modal currently renders at the default location briefly before applying saved drag offset, causing visible position flicker. Apply saved position at first paint so modal opens directly at persisted coordinates.

---

title: Refine MTG theme implementations for stronger world-accurate art direction
status: unstarted
description: Current themes need deeper visual polish and stronger identity. Lithomancy should shift to lighter white/tan Zendikar-inspired styling with hedron visual motifs; Phyrexian should feel oily and biomechanical with matching UI treatment; remaining themes should receive similarly distinctive directional refinement.

---

title: Disable Roll Die button while roll-result toast is visible
status: unstarted
description: During active roll toast display, the Roll Die control should remain visible but disabled instead of disappearing, to preserve layout stability and prevent accidental clicks on neighboring controls.

