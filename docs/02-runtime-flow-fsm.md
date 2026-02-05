# Runtime Flow & Finite State Machine

## FSM States
- SETUP
- BOOTSTRAP_REVEAL
- IDLE
- ROLLING
- AWAIT_MOVE
- CONFIRM_MOVE
- MOVING
- MODAL_OPEN
- ERROR

## Reveal Order
Canonical reveal order:
1. Center
2. North
3. East
4. South
5. West

## Die Results
- Blank: log only
- Chaos: open current plane modal
- Planeswalk: highlight adjacent planes

## Decay
Manhattan distance > decayDistance
Tiles discarded and removed from map.

## FSM Transition Table

| Current State | Action / Event        | Next State        | Notes |
|--------------|-----------------------|-------------------|-------|
| IDLE         | roll_die              | ROLLING           | —     |
| ROLLING      | roll_resolved         | AWAIT_MOVE        | —     |
| AWAIT_MOVE   | select_plane          | CONFIRM_MOVE      | —     |
| CONFIRM_MOVE | confirm               | MOVING            | —     |
| MOVING       | movement_complete     | IDLE              | —     |
| *            | fatal_error           | ERROR             | —     |
