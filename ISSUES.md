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

title: Open plane info modal on initial reveal
status: unstarted
description: When the first plane is revealed at session start, automatically open the plane info modal so players immediately understand the active plane's effects.


---

title: Prevent accidental Quit Session clicks when controls reflow
status: unstarted
description: During chaos/modal transitions, Roll Die buttons disappear and Quit Session shifts under the pointer, making accidental quits too easy. Stabilize control layout and/or add confirmation/guard so quit cannot be triggered unintentionally.

---

title: Hide debug/event panels when dev mode is off and expand canvas area
status: unstarted
description: Dev mode should control visibility of Event Log and Debug sections. When dev mode is disabled, hide both panels and let the Phaser canvas expand to fill available space without introducing page scrollbars.

---

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
