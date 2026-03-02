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
   - `npm run test:contrast` (for theme/accessibility-sensitive UI changes)
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

## Asset Optimization Workflow

- Theme backgrounds can be normalized/optimized with:
  - `npm run assets:optimize:themes`
  - `npm run assets:optimize:themes:dry`
- Guardrail run (no file writes) for quality and report output:
  - `npm run assets:optimize:themes:guardrail`
- When running optimization in a change set:
  - include before/after size summary in PR/issue notes
  - commit both optimized assets and any generated report intended for review

## Frontend Structure Standards

- Prefer standalone template/style files for Angular components:
  - component logic in `*.component.ts`
  - template in `*.component.html`
  - styles in `*.component.scss`
- Use Bootstrap-first implementation for common UI primitives:
  - buttons, button groups, switches/checks, alerts, cards, and modal shell structure
  - use component SCSS for layout and theme-token overrides, not full component reimplementation
- If Bootstrap behavior/styling must be overridden, document why in the PR/issue and keep overrides scoped to tokens/utilities.
- Avoid non-trivial inline template/style blocks in component decorators.
- Use BEM-style class naming for component-level styles.
- Use tokenized styling through CSS variables (`--be-*`) instead of repeated hardcoded values.
- Keep SCSS selectors nested under the component block to preserve readable scope.
