# Contributor Runbook

This runbook defines how to contribute safely and consistently.

## Primary Workflow Sources

- `ISSUES.md`: active backlog only
- `ISSUES_ARCHIVE.md`: completed issue history
- `ROLES.md`: role-specific behavior expectations
- `AGENTS.md`: agent operating rules and file-loading behavior

## Standard Work Sequence

1. Confirm target issue(s) and status in `ISSUES.md`.
2. Implement scoped changes.
3. Run verification commands:
   - `npm run test:unit`
   - `npm run build`
4. Update `ISSUES.md`:
   - set status to `complete` when finished
   - append `Resolution:` line (1-2 sentences)
   - move completed entries to `ISSUES_ARCHIVE.md`
   - if reopened, move issue back to `ISSUES.md` and append another `Resolution:` line when fixed again
5. Commit code + doc changes together when behavior changed.

## Roles and Decision Boundaries

- Role behavior is opt-in via user request (for example: "assume role Senior Developer").
- Active role persists until `drop role` or role switch request.
- Role guidance cannot override platform/system safety constraints.

## Scope and Quality Expectations

- Keep changes focused on requested issues.
- Avoid introducing undocumented features.
- Update docs when runtime behavior or operational workflow changes.
- Treat failing tests/build as blockers unless user explicitly accepts risk.
