# UAT and Release Readiness Checklist

Use this checklist before release candidate sign-off.

Reference smoke script:
- `docs/17-uat-smoke-workflow.md`

## Functional Verification

- [x] Session start and bootstrap reveal complete successfully
- [x] Startup reveal behavior matches configured fog-of-war depth
- [x] Die roll outcomes behave correctly (`blank`, `chaos`, `planeswalk`)
- [x] Movement flow works end-to-end (select, confirm, auto-complete)
- [x] Hellride diagonal movement behavior matches configured rules
- [x] Landing modal opens with expected plane details
- [x] No invalid FSM transitions are user-reachable
- [x] Phenomenon replacement behavior matches article-aligned spec

## Visual and Interaction Verification

- [x] Plane art displays for cached cards
- [x] Face-down and face-up card states are visually distinct
- [x] Camera recenter and drag pan behaviors work
- [x] Double-click inspect behavior works in non-movement states
- [x] Control bar and modal interaction do not cause distracting layout shifts

## Asset and Data Verification

- [x] `cards.json` contains expected metadata fields for shipped cards
- [x] Cached art files exist and are served from `/assets/plane-art`
- [x] No critical 404 errors in browser console for required assets

## Quality Gates

- [x] `npm run lint` passes
- [x] `npm run test:unit` passes
- [x] `npm run build` passes
- [x] `ISSUES.md` has no unresolved release-blocking entries

## Release Notes and Documentation

- [x] Behavior changes documented in relevant docs
- [x] `docs/16-blind-eternities-article-alignment.md` reviewed and current
- [x] `ISSUES.md` statuses and resolutions updated
- [x] Root `README.md` and docs index are current
