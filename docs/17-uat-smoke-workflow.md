# UAT Smoke Workflow

Use this workflow for repeatable sanity verification of the core gameplay loop before broader UAT sessions.

## Preconditions

- App running locally (`npm run start`) or on target environment build.
- At least one deck set selected with minimum playable plane count met.
- Browser console visible to confirm no blocking runtime errors.

## Smoke Flow A: Blind Eternities

1. Start session in `Blind Eternities` mode with Fog-of-War switch on.
2. Confirm center plane is face-up and initial modal opens.
3. Close modal and click `Roll Die` until a planeswalk occurs.
4. Select a highlighted destination and confirm move.
5. Verify:
   - movement auto-completes
   - landed plane modal opens automatically
   - event log records roll and movement phases
6. Trigger at least one `chaos` outcome and confirm current plane modal opens.
7. Close modal and ensure roll controls return to expected enabled state.

## Smoke Flow B: Regular Planechase

1. Return to setup, switch mode to `Planechase`, and start a new session.
2. Roll until planeswalk occurs.
3. Verify center plane is replaced directly (no move selection state).
4. Confirm replacement modal opens and closes cleanly.
5. Verify camera stays centered on active plane.

## Pass Criteria

- No invalid control states (stuck disabled roll, missing confirm path, modal queue deadlock).
- No fatal error banner.
- No critical missing-art/runtime exceptions that block play.
- Core flow remains playable in both modes.

## Recommended Command Gate

Run these before recording smoke pass as complete:

1. `npm run lint`
2. `npm run test:unit`
3. `npm run build`
