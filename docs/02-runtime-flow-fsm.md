# Runtime Flow and FSM

## Purpose

Implementation-grade reference for runtime sequencing, valid actions by state, and movement/modal rules.

## FSM States

- `SETUP`
- `BOOTSTRAP_REVEAL`
- `IDLE`
- `ROLLING`
- `AWAIT_MOVE`
- `CONFIRM_MOVE`
- `MOVING`
- `MODAL_OPEN`
- `ERROR`

## Transition Summary

| Current | Event | Next | Notes |
|---|---|---|---|
| `SETUP` | `start_session` | `BOOTSTRAP_REVEAL` | Initializes deck/map/config from setup choices |
| `BOOTSTRAP_REVEAL` | `bootstrap_reveal_complete` | `MODAL_OPEN` or `IDLE` | Reveals according to configured bootstrap pattern; opens center modal when present |
| `IDLE` | `roll_die` | `ROLLING` | Only valid player roll entry |
| `ROLLING` | `roll_resolved(blank)` | `IDLE` | Log + return |
| `ROLLING` | `roll_resolved(chaos)` | `MODAL_OPEN` | Current plane modal |
| `ROLLING` | `roll_resolved(planeswalk)` | `AWAIT_MOVE` or `MODAL_OPEN` | Blind Eternities enters move select; Regular Planechase replaces center plane |
| `AWAIT_MOVE` | `select_plane` | `CONFIRM_MOVE` | Target must be in eligible highlights (cardinal and/or hellride list) |
| `AWAIT_MOVE` | `cancel_move` | `IDLE` | Exit move flow |
| `CONFIRM_MOVE` | `confirm_move` | `MOVING` | Commits pending move |
| `CONFIRM_MOVE` | `cancel_move` | `AWAIT_MOVE` | Returns to selection |
| `MOVING` | `movement_complete` | `MODAL_OPEN` or `IDLE` | Applies movement pipeline, then opens landed modal when available |
| `MODAL_OPEN` | `close_modal` | `resumeToState` | Queue-safe modal sequencing |
| `*` | `fatal_error` | `ERROR` | Terminal runtime error state |
| `ERROR` | `restart_session` | `SETUP` | Full reset |

## Bootstrap Reveal Rules

- Bootstrap reveal starts with center tile face-up.
- Fog-of-War reveal distance is numeric:
  - `0`: reveal only the entered square on move
  - `1`: reveal entered square plus adjacent cardinals on move

## Movement Eligibility

- Cardinal movement uses adjacency highlights.
- Hellride movement uses separate diagonal highlights and is always-on in Blind Eternities mode.
- Anti-stall option can exclude immediate backtracking to prior party coordinate.

## Movement Pipeline (Current)

1. Move party to pending destination.
2. Ensure adjacency/decay rules.
3. Fill placeholder tiles from deck.
4. Phenomenon replacement pass during fill:
   - cards identified as phenomenon are not placed on map
   - they are discarded and replaced by continuing draw
5. Finalize state and enqueue landed modal when applicable.

## Modal Rules

- Only one modal active at a time.
- Additional modal requests are queued.
- Closing modal resumes stored state.

## Logging and Determinism

- Draw/recycle remain deterministic under seed.
- Runtime logs include mode/profile context and movement phase markers:
  - `move`
  - `board_fill`
  - `phenomenon_resolve`
  - `finalize`
