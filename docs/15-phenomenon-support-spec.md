# Phenomenon Support Specification (Draft)

This document defines the target behavior for adding Phenomenon card support.
It is a planning/specification artifact and does not imply implementation is complete.

## 1. Play Pattern Definition

### 1.1 Trigger Context

- Phenomenon handling is relevant during planeswalking and reveal sequences.
- When a revealed card is a Phenomenon, it resolves immediately and does not become the active long-term plane.

### 1.2 Facilitator-Facing Behavior

- Reveal indicates the card is a Phenomenon.
- A dedicated Phenomenon resolution modal is shown with full card text.
- After resolution, play continues to the next valid plane reveal step.

### 1.3 Rules Intent (Product-Level)

- Phenomenon is treated as an interruptive, transient event.
- Resolution must be explicit and user-visible.
- The system must preserve flow clarity over hidden automation.

## 2. Backend and State Flow (Proposed)

### 2.1 State Additions

- Extend deck metadata to distinguish `PLANE` vs `PHENOMENON` cards.
- Track phenomenon lifecycle in session state (for example:
  - pending phenomenon card id
  - is resolving flag
  - source reveal context).

### 2.2 FSM Flow (Proposed)

- On reveal draw:
  - if `PLANE`: continue current reveal/movement flow.
  - if `PHENOMENON`: transition to phenomenon resolution state/modal flow.
- On phenomenon resolution complete:
  - return to deterministic reveal continuation state.
  - ensure no invalid input paths are accepted during resolution.

### 2.3 Determinism and Logging

- All draws remain deterministic under seed.
- Log entries must include:
  - phenomenon revealed
  - phenomenon resolved
  - continuation outcome.

## 3. UX Flow (Proposed)

### 3.1 Visual Treatment

- Phenomenon cards should have clear visual distinction from planes.
- Modal title uses card name.
- Modal body uses full rules text.

### 3.2 Interaction Model

- During active phenomenon modal, conflicting controls are disabled.
- Closing/resolving the modal advances play automatically to the next valid state.

### 3.3 Error/Fallback Behavior

- If phenomenon metadata is missing:
  - show safe fallback modal with card id
  - log warning
  - continue flow without hard crash.

## 4. Definition of Ready for Implementation

Before coding begins:

- Phenomenon card source format is finalized in `cards.json` schema.
- FSM transition table updates are documented and reviewed.
- UX copy and modal rules are approved.
- Test acceptance criteria are listed in `ISSUES.md`.

## 5. Open Decisions

- Exact card data source precedence for phenomenon text (MTGJSON vs Scryfall fallback).
- Whether phenomenon resolution ever requires multi-step confirmation.
- How to represent chained phenomenon events, if supported.
