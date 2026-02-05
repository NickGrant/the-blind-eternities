# Runtime Flow & Finite State Machine

## Purpose
This document defines the **runtime sequencing model** for the Blind Eternities Planechase application.
It is intended to be **implementation-grade** and acts as the canonical reference for:
- session flow
- allowed actions per state
- modal gating
- die roll outcome routing
- movement and decay sequencing

---

## FSM States

- **SETUP**
- **BOOTSTRAP_REVEAL**
- **IDLE**
- **ROLLING**
- **AWAIT_MOVE**
- **CONFIRM_MOVE**
- **MOVING**
- **MODAL_OPEN**
- **ERROR**

---

## Canonical Reveal Order

Canonical reveal order:
1. Center
2. North
3. East
4. South
5. West

> This ordering is enforced for deterministic play and predictable table flow.

---

## Die Results

- **Blank**: log only; no modal; no movement
- **Chaos**: open the **current plane** modal (or phenomenon modal, if applicable)
- **Planeswalk**: highlight adjacent planes and allow movement selection

---

## Decay

Planes whose Manhattan distance from the party exceeds `decayDistance` are discarded and removed from the map.

---

## Input Handling Policy (Reject vs Ignore)

- If an input is received that is **not valid** for the current FSM state:
  - the system **ignores** it (no state change)
  - may optionally log a **warn** (developer-facing), but must not spam player-facing logs

This prevents UI event noise from causing state corruption.

---

## Modal Resume Rule

When a modal is opened, the system transitions to **MODAL_OPEN** and stores a `resumeToState`.
When the modal closes, the system transitions back to `resumeToState`.

> Modal presentation must never “leak” additional transitions.

---

## FSM Transition Table (Canonical)

| Current State       | Action / Event                    | Next State         | Notes |
|--------------------|-----------------------------------|--------------------|------|
| SETUP              | start_session                      | BOOTSTRAP_REVEAL   | Initialize deck + map; begin reveal sequencing |
| BOOTSTRAP_REVEAL   | bootstrap_reveal_complete          | IDLE               | C/N/E/S/W revealed in order; party set to center |
| IDLE               | roll_die                           | ROLLING            | Only valid roll entry point |
| ROLLING            | roll_resolved(blank)               | IDLE               | Log roll result only |
| ROLLING            | roll_resolved(chaos)               | MODAL_OPEN         | Open current plane modal; `resumeToState = IDLE` |
| ROLLING            | roll_resolved(planeswalk)          | AWAIT_MOVE         | Highlight eligible adjacent planes |
| AWAIT_MOVE         | select_plane(coord)                | CONFIRM_MOVE       | Selection must be adjacent |
| AWAIT_MOVE         | cancel_move                        | IDLE               | Optional: allows backing out to idle if no selection made |
| CONFIRM_MOVE       | confirm_move                       | MOVING             | Commit movement; animation may occur |
| CONFIRM_MOVE       | cancel_move                        | AWAIT_MOVE         | Return to selection state |
| MOVING             | movement_complete                  | IDLE               | After movement + ensure-plus + decay complete |
| *                 | open_modal(type, payload)           | MODAL_OPEN         | Any state may open modal if rules require; must set resumeToState |
| MODAL_OPEN         | close_modal                         | (resumeToState)    | Return to state recorded when modal opened |
| *                 | fatal_error(code)                   | ERROR              | Stops play; prompt restart |
| ERROR              | restart_session                     | SETUP              | Discards state; reinitializes |

---

## Allowed User Actions by State (Summary)

### SETUP
- Allowed: `start_session`

### BOOTSTRAP_REVEAL
- Allowed: none (system-driven sequencing)
- Notes: inputs ignored

### IDLE
- Allowed: `roll_die`

### ROLLING
- Allowed: none (system-driven)
- Notes: inputs ignored until `roll_resolved(...)`

### AWAIT_MOVE
- Allowed: `select_plane`, `cancel_move`
- Notes: only adjacent planes are selectable

### CONFIRM_MOVE
- Allowed: `confirm_move`, `cancel_move`

### MOVING
- Allowed: none (system-driven)
- Notes: completes map update, ensure-plus, decay

### MODAL_OPEN
- Allowed: `close_modal`
- Notes: no other inputs processed

### ERROR
- Allowed: `restart_session`

---

## Sequencing Notes (Implementation Expectations)

- **Ensure-Plus** should be applied after movement (and also after bootstrap as needed) to maintain C/N/E/S/W adjacency.
- **Decay** should be evaluated after movement resolution and map stabilization.
- Modal queue behavior must ensure only **one modal is visible** at a time; additional modal triggers are queued.
