# UX Behavior Specification

This document captures currently implemented runtime UX behavior and clearly separates pending changes.

## Implemented Session Setup

- Setup includes:
  - deck set selection
  - game mode selection (`Blind Eternities`, `Regular Planechase`)
  - rules-profile selection when multiple options exist
  - optional Blind Eternities toggles (`Hellride`, `Prevent immediate backtracking`)
- Session bootstrap is automatic after `Start Session`.
- `How to Use` is available in-app for non-dev users.

## Implemented Turn Flow

- `Roll Die` resolves immediately.
- Outcomes:
  - `blank`: no modal, return to idle
  - `chaos`: open current plane modal
  - `planeswalk`:
    - Blind Eternities: enter movement selection
    - Regular Planechase: replace center plane directly and open modal
- Blind Eternities movement:
  - select highlighted candidate
  - confirm move
  - movement auto-completes
  - landed plane modal opens automatically

## Implemented Movement Affordances

- Cardinal movement candidates are highlighted.
- Hellride diagonal candidates are separately highlighted and selectable when enabled.
- In `CONFIRM_MOVE`, selecting the chosen tile again confirms movement.
- Non-movement inspect behavior:
  - clicking/double-clicking face-up tiles can focus and open modal details.

## Implemented Camera and Layout Behavior

- Camera re-centers on active plane after movement.
- Manual drag pan is available in Blind Eternities map flow.
- Regular Planechase keeps the active plane centered (no pan offset applied).
- Modal is draggable (non-button regions), non-blocking, and keyboard-closeable (`Esc`).

## Implemented Dev UX

- Debug panel starts collapsed in dev mode.
- Current debug actions:
  - roll dice (random)
  - roll dice (chaos)
  - roll dice (planeswalk)
  - show hidden cards
  - session start/restart helpers
  - deck/discard visibility

## Pending UX Changes (Tracked in ISSUES)

- Replace rules-profile wording with numeric Fog-of-War setting (`1` / `2`).
- Remove Hellride toggle and enforce always-on Hellride in Blind Eternities mode.
