# UAT and Release Readiness Checklist

Use this checklist before release candidate sign-off.

Reference smoke script:
- `docs/17-uat-smoke-workflow.md`

## Functional Verification

- [ ] Session start and bootstrap reveal complete successfully
- [ ] Startup reveal behavior matches configured fog-of-war depth
- [ ] Die roll outcomes behave correctly (`blank`, `chaos`, `planeswalk`)
- [ ] Movement flow works end-to-end (select, confirm, auto-complete)
- [ ] Hellride diagonal movement behavior matches configured rules
- [ ] Landing modal opens with expected plane details
- [ ] No invalid FSM transitions are user-reachable
- [ ] Phenomenon replacement behavior matches article-aligned spec

## Visual and Interaction Verification

- [ ] Plane art displays for cached cards
- [ ] Face-down and face-up card states are visually distinct
- [ ] Camera recenter and drag pan behaviors work
- [ ] Double-click inspect behavior works in non-movement states
- [ ] Control bar and modal interaction do not cause distracting layout shifts

## Asset and Data Verification

- [ ] `cards.json` contains expected metadata fields for shipped cards
- [ ] Cached art files exist and are served from `/assets/plane-art`
- [ ] No critical 404 errors in browser console for required assets

## Quality Gates

- [ ] `npm run lint` passes
- [ ] `npm run test:unit` passes
- [ ] `npm run build` passes
- [ ] `ISSUES.md` has no unresolved release-blocking entries

## Release Notes and Documentation

- [ ] Behavior changes documented in relevant docs
- [ ] `docs/16-blind-eternities-article-alignment.md` reviewed and current
- [ ] `ISSUES.md` statuses and resolutions updated
- [ ] Root `README.md` and docs index are current
