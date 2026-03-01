# Definition of Ready (DoR)

## Purpose

The Definition of Ready (DoR) determines whether a **task, feature, or milestone**
is sufficiently specified to begin work **without introducing ambiguity, rework,
or architectural drift**.

If a work item does not meet the DoR, it **must not enter execution**.

---

## A Work Item Is "Ready" When All of the Following Are True

### 1. Scope & Intent Are Clear
- The goal of the work is explicitly stated.
- The work can be explained in **one or two sentences** without qualifiers.
- The work is categorized as one of:
  - Bug fix
  - Feature
  - Refactor
  - Hardening / guardrail

---

### 2. FSM Impact Is Identified
- The **FSM state(s)** impacted are explicitly listed.
- It is clear whether the work:
  - introduces a new transition
  - tightens or restricts an existing transition
  - operates entirely within an existing state
- No implicit or assumed transitions exist.

---

### 3. State Ownership Is Explicit
For all state touched by the work:
- Ownership is clearly identified as:
  - **Angular-owned**, or
  - **Phaser-derived (read-only)**
- The work does **not**:
  - mutate state from Phaser
  - bypass the Session Orchestrator
  - introduce hidden or duplicated state

---

### 4. Failure Modes Are Considered
The following questions are answered:
- What happens if this fails?
  - Fatal error
  - Recoverable error
  - Silent fallback
- Where is the failure surfaced?
  - Modal
  - Event log
  - Console only

If failure behavior is unclear, the work item is **not ready**.

---

### 5. Logging Expectations Are Defined
- It is clear whether this work:
  - produces a player-facing log entry
  - produces a debug-only log
  - produces no log
- Player-facing logs are intended to be **human-readable**.

---

### 6. Documentation Impact Is Identified
- Any documentation that must be updated is listed **before work begins**, including:
  - System Architecture
  - Runtime Flow / FSM
  - Operational Considerations
- If no documentation updates are required, this is stated explicitly.

---

### 7. Task Is Executable
- The work can be expressed as a **Gherkin-style scenario**.
- Success criteria are observable via:
  - state inspection
  - log output
  - visible behavior

If success cannot be observed, the work item is **not ready**.

---

## Usage

- DoR is checked **before starting work**
- Items that fail DoR must be clarified, split, or re-scoped
- DoR exists to prevent partial or speculative implementation

