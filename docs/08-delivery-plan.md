# Blind Eternities Planechase - Delivery Plan

## Purpose

This document tracks forward-looking delivery only.
Historical milestone detail has been moved to:

- `docs/archive/08-delivery-plan-history.md`

## Current Status

- Milestones 0-6: Complete
- Runtime now operates in issue-driven execution mode
- Active backlog source of truth: `ISSUES.md`
- Completed issue history: `ISSUES_ARCHIVE.md`
- Core docs consolidated and drift-reconciled on March 1, 2026

## Current Delivery Model

1. Capture and prioritize active issues in `ISSUES.md`
2. Implement in scoped batches
3. Verify with:
   - `npm run test:unit`
   - `npm run build`
4. Move completed entries to `ISSUES_ARCHIVE.md`
5. Keep docs synchronized with runtime behavior

## Forward Roadmap

### Milestone 7 - UAT Corrections and Flow Integrity

Status: In issue-driven execution

Goal:
- Resolve UAT behavior gaps in controls, bootstrap flow, and facilitator workflows

### Milestone 8 - Phenomenon Card Support

Status: In progress

Goal:
- Finalize article-aligned phenomenon semantics and add acceptance tests for enter-plane vs phenomenon ordering

Primary specification:
- `docs/15-phenomenon-support-spec.md`
- `docs/16-blind-eternities-article-alignment.md`

### Milestone 9 - Play Modes and Player Onboarding

Status: Complete

Goal:
- Complete migration from profile wording to numeric Fog-of-War configuration (`0` / `1`)
- Finalize Blind Eternities setup simplification (always-on Hellride)
- Keep onboarding/help content synchronized with active controls

Primary scope source:
- `ISSUES.md`
- `docs/13-ux-behavior-spec.md`

## Change Policy

Any scope or behavior change requires:
1. Update affected docs in the same change
2. Explicit acknowledgment of scope change
3. Re-validation against DoR and DoD
