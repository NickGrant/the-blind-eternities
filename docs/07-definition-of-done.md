# Definition of Done (DoD)

## Purpose

The Definition of Done (DoD) determines whether completed work is **safe to build upon**,
**consistent with system invariants**, and **trustworthy during live play**.

A work item is not considered "done" until **all DoD criteria are met**.

---

## A Work Item Is "Done" When All of the Following Are True

### 1. FSM Integrity Is Preserved
- No illegal FSM transitions are possible.
- Inputs are ignored or rejected when not allowed.
- The system cannot enter an undefined state due to this change.

FSM violations are **always blockers**.

---

### 2. State Invariants Hold
- A single source of truth is preserved.
- State remains fully serializable.
- No new mutation paths are introduced.
- State transitions are deterministic given the same inputs.

---

### 3. Error Handling Matches Operational Expectations
- Fatal errors:
  - halt interaction
  - present a clear recovery path
- Recoverable errors:
  - fall back safely
  - do not block play
- No silent corruption of state is possible.

Behavior aligns with **Operational Considerations**.

---

### 4. Logging Is Appropriate and Useful
- Player-facing logs are:
  - readable at a distance
  - understandable without technical knowledge
- Logs explain **what happened**, not how it was implemented.
- No excessive or noisy logging has been added.

---

### 5. Angular / Phaser Contract Is Respected
- All game logic remains in Angular.
- Phaser:
  - renders from state
  - emits input intents only
- No rule enforcement, sequencing, or automation exists in Phaser.

---

### 6. Determinism Is Preserved
- Randomness is centralized.
- Outcomes are reproducible in development when seeded.
- No frame-based, timing-based, or animation-based logic affects correctness.

---

### 7. Documentation Is Accurate
- Any impacted documentation is updated **in the same change**.
- Documentation and code do not disagree.
- Behavior changes are reflected in the docs.

If documentation is outdated, the work is **not done**, even if the code works.

---

### 8. The System Remains Playable
After the change:
- A session can be started
- A basic turn can be completed (where applicable)
- No new dead ends or blocked states are introduced

"Technically correct but unusable" does **not** count as done.

---

## Usage

- DoD is checked **before marking work complete**
- Repeated DoD failures indicate the task should be split or re-scoped
- DoD exists to ensure long-term maintainability and table trust

