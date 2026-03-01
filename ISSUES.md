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

title: Add portable LLM context manifest with include/exclude rules
status: unstarted
description: Create a repository-level context manifest (for example `LLM_CONTEXT.md` or `context.manifest.json`) that explicitly defines high-priority include files and low-value exclude paths (generated output, caches, archives, binaries) so the setup is portable across projects and minimizes token waste.

---

title: Introduce reusable project skills for issue workflow and documentation hygiene
status: unstarted
description: Add Codex skills that encapsulate repeated workflows used in this project (issue lifecycle updates, archive movement, doc trimming, release readiness checks) so the process can be reused with minimal prompt overhead in future repos.

---

title: Define context budget and document size guardrails for active docs
status: unstarted
description: Add explicit token/length guardrails for active coordination docs (`AGENTS.md`, `ROLES.md`, `ISSUES.md`) and define trimming/archiving triggers to prevent context bloat over time.

---

title: Add startup verification checklist for agent operating context
status: unstarted
description: Create a concise startup checklist that validates required control files are present, current, and internally consistent (`AGENTS.md`/`ROLES.md`/`ISSUES.md`/docs index), with fallback behavior when files are missing or stale.

---

title: Add optional automation to lint and normalize working docs
status: unstarted
description: Provide a scriptable docs-maintenance pass to normalize formatting, section order, and issue entry schema in active tracking files so context remains machine-friendly and portable between projects.

---

title: Migrate current app into 	he-blind-eternities repo and release as v2.0.0
status: unstarted
description: Pull https://github.com/NickGrant/the-blind-eternities, replace its existing project contents with this application, and prepare the migrated codebase as a major release by setting application version to 2.0.0 (reflecting a breaking/major change from prior repo state). Include any required project metadata/version updates needed for consistency.

---

title: Roll Die remains disabled after chaos modal closes
status: unstarted
description: After a chaos roll triggers a modal, the Roll Die button stays disabled even once the modal is closed and the game returns to idle. Ensure control state re-enables Roll Die correctly after modal dismissal when gameplay is ready for another roll.

