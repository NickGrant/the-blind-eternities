# UX Behavior Specification

This addendum captures currently agreed runtime UX behavior.

## Session and Turn Flow

- Session starts in setup state and transitions through bootstrap automatically.
- Setup includes game mode selection:
  - `Blind Eternities` (map-adjacency movement)
  - `Regular Planechase` (single active plane replacement)
- Dice roll from control bar resolves immediately (or via debug overrides in dev).
- Planeswalk flow:
  - select highlighted adjacent plane
  - confirm move
  - movement completes automatically
  - in `Regular Planechase`, planeswalk replaces the active plane directly and does not enter adjacency selection flow

## Map Interaction

- Active party plane is camera-centered on movement.
- Drag pan is supported for manual camera movement.
- Double-click behavior:
  - in non-movement states, double-clicking a face-up plane opens that plane modal and centers camera on it
  - in confirm-move state, second click on selected plane confirms movement

## Modal Behavior

- Landing on a new plane opens that plane modal automatically.
- Modal queue enforces single-active modal sequencing.
- Modal body prefers full plane `rulesText` and falls back to `chaosText` when needed.
- Modal presentation is anchored and non-blocking to avoid control bar layout jitter.

## Debug Panel (Dev Mode)

- Starts collapsed.
- Exposes only:
  - roll dice (random)
  - roll dice (chaos)
  - roll dice (planechase)
  - show hidden cards

## Planned Additions

### Player Help / How-To-Use

- Non-dev users must have a visible "How to Use" entry point.
- Help content should explain:
  - how to start a session
  - what roll outcomes do
  - mode-specific movement/planeswalk behavior
  - modal interactions
  - what debug controls are (and that they may be hidden outside dev mode)
