# Operational Considerations

This document captures **non-functional expectations, operational assumptions, and guardrails**
for the Blind Eternities Planechase application.

It is intended primarily for:
- long-term maintainers
- future contributors
- anyone debugging unexpected behavior during live play

This document **does not define gameplay rules** and **does not override architectural documents**.
It exists to clarify how the system should behave when things go wrong, change over time,
or are extended beyond v1.

---

## 1. Error Handling & Failure Modes

The application assumes a **happy-path-first design**, but failures must be handled
in a way that preserves table trust and minimizes disruption.

### 1.1 Fatal Errors

The following conditions are considered *fatal* and should result in:
- a clear error message
- a prompt to restart the session

Examples:
- Required card data (`cards.json`) fails to load
- Phaser scene fails to initialize
- Deck initialization results in an empty card pool
- Critical invariants are violated (e.g., no valid planes can be drawn)

Fatal errors should:
- stop further interaction
- avoid partially initialized state
- prefer a clean reset over attempting recovery

---

### 1.2 Recoverable Errors

The following should be treated as *recoverable*:

- Individual card image fails to load
- A single animation promise fails or is interrupted
- A non-critical UI component fails to render

Recoverable errors should:
- fall back to safe defaults (e.g., placeholder image)
- log a warning to the event log or console
- allow play to continue uninterrupted

---

### 1.3 Modal & Sequencing Safety

Modal queue progression is critical to correctness.

Safeguards should exist to prevent:
- a modal blocking progression indefinitely
- animation promises never resolving
- input being re-enabled in an invalid FSM state

If sequencing becomes inconsistent:
- the system should prefer advancing to a stable state
- worst case: reset the current reveal sequence

---

## 2. Testing Philosophy

This project intentionally limits formal testing scope.

### 2.1 What Should Be Testable

Core logic **must be testable without Phaser**:

- Deck draw / discard / reshuffle behavior
- Phenomenon gating logic
- Decay calculations
- Ensure-plus algorithm
- FSM state transitions

These should be implemented as pure or near-pure functions where possible.

---

### 2.2 What Is Not Required to Be Tested

The following are not required to have automated tests in v1:

- Phaser rendering correctness
- Visual animations
- Modal presentation details
- CSS or layout behavior

These are expected to be validated via manual playtesting.

---

### 2.3 Determinism as a Debugging Tool

Randomness should be:
- centralized
- optionally seedable in development builds

This enables:
- reproducible bug reports
- step-by-step replay during debugging

---

## 3. Performance Assumptions & Constraints

### 3.1 Target Devices

The application targets:
- modern desktop browsers
- mid-range modern mobile devices in landscape orientation

No guarantees are made for:
- low-memory devices
- background-tab execution
- extreme screen sizes

---

### 3.2 Map Size Expectations

While the grid is conceptually infinite:
- practical tile count is constrained by decay
- expected active tiles <= ~50 at any time

Performance optimizations should assume:
- frequent pan/zoom
- occasional full re-render of tiles
- relatively infrequent map growth

---

### 3.3 Asset Performance

- One image per card is loaded
- Images may be scaled down at render time
- No aggressive image optimization is required in v1

If performance issues arise:
- prioritize limiting draw calls
- avoid per-frame logic tied to state
- favor static sprites over dynamic effects

---

## 4. Logging & Observability

### 4.1 Purpose of the Event Log

The event log serves as:
- a player-facing explanation tool
- a trust mechanism for randomness
- a lightweight debugging aid

The log is **not** intended to be:
- a full replay system
- a developer-only debug console

---

### 4.2 Logging Guidelines

Events worth logging:
- card reveals
- phenomena resolution
- die rolls and results
- planeswalks
- decay events (at a human-readable level)

Events not worth logging (must not be logged):
- internal state transitions
- animation start/end
- internal service calls

Verbosity should remain:
- readable at a distance
- understandable without technical knowledge

---

## 5. Data Evolution & Compatibility

### 5.1 Card Data Expectations

Card data is treated as:
- static for a given app version
- regenerated via build-time scripts when updated

No backward compatibility guarantees are made for:
- saved sessions (none exist in v1)
- older data formats

---

### 5.2 Adding New Sets

When new Planechase sets or cards are added:
- build-time ingestion scripts should be re-run
- generated data should replace existing assets
- no runtime migration is expected or required

---

## 6. Extension Guardrails

Future contributors should **not**:

- move game logic into Phaser
- enforce Magic rules programmatically
- introduce hidden automation
- add persistence without revisiting state contracts
- overload the modal system with optional confirmations

When extending the system, prefer:
- additive configuration
- explicit documentation updates
- preserving facilitator-first philosophy

---

## 7. Design Philosophy (Operational Summary)

When in doubt, the system should prefer:

1. **Transparency over automation**
2. **Clarity over cleverness**
3. **Recoverability over strictness**
4. **Table flow over UI completeness**

If an operational decision risks slowing down a live game,
it should be reconsidered.

