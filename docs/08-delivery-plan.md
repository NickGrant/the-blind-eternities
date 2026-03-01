# Blind Eternities Planechase — Delivery Plan

## Purpose

This document defines the execution plan for delivering the Blind Eternities Planechase
application from architecture-locked design to a playable v1.

It is the authoritative source for:
- milestones
- features
- tasks
- execution order

All work items must meet the Definition of Ready (DoR) before starting and the
Definition of Done (DoD) before being considered complete.

---

## Guiding Principles

- Architecture documents are source-of-truth
- FSM integrity is non-negotiable
- Angular owns all game logic and state
- Phaser is rendering + input only
- Facilitator clarity is prioritized over automation
- Determinism is preserved at all times

---

# Milestone 0 — Project Skeleton & Contracts

## Status

Complete

## Goal
The application boots cleanly, contracts are enforceable, and no gameplay logic executes.

---

## Feature 0.1 — Application Scaffolding

### Task 0.1.1 — Angular shell renders without logic
Given the application loads  
When the root Angular component initializes  
Then a shell UI is rendered  
And no game logic is executed

### Task 0.1.2 — Phaser scene initializes inertly
Given the Angular shell is active  
When Phaser initializes  
Then a canvas is rendered  
And no state mutation occurs

---

## Feature 0.2 — Core Contracts & Interfaces

### Task 0.2.1 — Define SessionState shape
Given a new session is created  
Then the session state conforms to a serializable JSON structure  
And contains no functions or circular references

### Task 0.2.2 — Define Phaser → Angular intent contract
Given user interaction occurs in Phaser  
When an intent is emitted  
Then the payload is pure data  
And contains no state mutation logic

---

# Milestone 1 — Core State & FSM Engine

## Status

Complete

## Goal
The game can exist logically without rendering.

---

## Feature 1.1 — Finite State Machine

### Task 1.1.1 — Implement explicit FSM transitions
Given the session is in IDLE  
When a roll intent is received  
Then the state transitions to ROLLING  
And all other inputs are ignored

### Task 1.1.2 — Reject invalid transitions
Given the session is in MOVING  
When a roll intent is received  
Then the input is rejected  
And a warning is logged

---

## Feature 1.2 — Session Orchestrator

### Task 1.2.1 — Centralize all state transitions
Given any state mutation occurs  
Then it passes through the Session Orchestrator  
And no direct state mutation is allowed elsewhere

---

# Milestone 2 — Map Model & Ensure-Plus Logic

## Status

Complete

## Goal
Planes exist, adjacency is enforced, and map growth is bounded.

---

## Feature 2.1 — Grid-Based Map Model

### Task 2.1.1 — Implement integer coordinate grid
Given a plane is placed on the map  
Then its coordinates are integers  
And adjacency is cardinal only

---

## Feature 2.2 — Ensure-Plus Invariant

### Task 2.2.1 — Maintain C/N/E/S/W neighbors
Given a plane exists at a coordinate  
When neighbors are missing  
Then planes are drawn to fill all four directions

---

## Feature 2.3 — Decay Logic

### Task 2.3.1 — Remove distant planes
Given a plane exceeds the decay distance  
When decay is evaluated  
Then the plane is discarded  
And removed from the map

---

# Milestone 3 — Deck, Reveal, and Modal Sequencing

## Status

Complete

## Goal
Planes are revealed deterministically and safely.

---

## Feature 3.1 — Deck Service

### Task 3.1.1 — Initialize deck from build-time assets
Given cards.json is loaded  
When a session starts  
Then a shuffled deck is created  
And no runtime API calls occur

---

## Feature 3.2 — Canonical Reveal Order

### Task 3.2.1 — Enforce reveal sequence
Given multiple planes are revealed  
Then they are revealed in Center, North, East, South, West order

---

## Feature 3.3 — Modal Queue

### Task 3.3.1 — Enforce single active modal
Given a modal is open  
When additional modals are triggered  
Then they are queued  
And not shown until the current modal closes

---

# Milestone 4 — Dice, Movement, and Turn Loop

## Status

Complete

## Goal
A full Planechase turn can be completed.

---

## Feature 4.1 — Die Roll Resolution

### Task 4.1.1 — Resolve die outcomes
Given a die is rolled  
When the result is Chaos  
Then the current plane modal opens

---

## Feature 4.2 — Planeswalk Movement

### Task 4.2.1 — Highlight valid movement options
Given a Planeswalk result  
Then adjacent planes are highlighted  
And no automatic movement occurs

---

## Feature 4.3 — Turn Completion

### Task 4.3.1 — Return to idle state
Given movement is confirmed  
When the turn completes  
Then the session returns to IDLE

---

# Milestone 5 — Phaser Integration & Visual Feedback

## Status

Complete

## Goal
Existing logic is rendered visibly and interactively.

---

## Feature 5.1 — Map Rendering

### Task 5.1.1 — Render planes from state
Given the session state changes  
Then Phaser renders planes based on state  
Without mutating that state

---

## Feature 5.2 — Input Intents

### Task 5.2.1 — Emit intent on plane click
Given a plane is clicked  
When input is enabled  
Then a movement intent is emitted to Angular

---

# Milestone 6 — Hardening, Logging, and Error Paths

## Status

Complete

## Goal
The system survives failure and supports live play.

---

## Feature 6.1 — Event Log

### Task 6.1.1 — Log player-visible events
Given a die roll or reveal occurs  
Then a human-readable log entry is recorded

---

## Feature 6.2 — Error Handling

### Task 6.2.1 — Handle fatal initialization errors
Given required card data fails to load  
Then a fatal error is shown  
And the session cannot continue

---

## Feature 6.3 — Deterministic Debugging

### Task 6.3.1 — Seedable randomness (development only)
Given a development seed is provided  
When actions are replayed  
Then outcomes are reproducible

---

# Milestone 7 - UAT Corrections and Flow Integrity

## Status

Ready to start

## Goal
Resolve UAT-discovered behavior gaps in debug controls and bootstrap reveal behavior.

---

## Feature 7.1 - Debug Session Lifecycle Controls

### Task 7.1.1 - Add debug start-session action
Given development mode is enabled  
When the session is in SETUP  
Then the debug panel provides a Start Session action  
And it dispatches the correct session start intent

### Task 7.1.2 - Add debug restart-session action
Given development mode is enabled  
When the session is in ERROR  
Then the debug panel provides a Restart Session action  
And it dispatches the correct restart intent

---

## Feature 7.2 - Bootstrap Reveal Strictness

### Task 7.2.1 - Keep adjacent bootstrap tiles face-down at session start
Given a new session is initialized  
When bootstrap setup completes  
Then only the center tile is face-up  
And adjacent bootstrap tiles remain face-down until normal gameplay reveal

### Task 7.2.2 - Validate bootstrap visibility behavior in tests
Given bootstrap reveal logic is updated  
When unit tests run  
Then coverage verifies center-only initial face-up behavior  
And prevents regression to multi-tile initial reveal

---

# Milestone 8 - Phenomenon Card Support

## Status

Ready to start

## Goal
Introduce Phenomenon cards with explicit play pattern, deterministic backend flow, and facilitator-friendly UX.

---

## Feature 8.1 - Play Pattern and Data Model

### Task 8.1.1 - Define phenomenon play pattern in runtime flow
Given a reveal draw returns a PHENOMENON card  
When the card is revealed  
Then it is treated as a transient resolution event  
And not persisted as the long-term active plane

### Task 8.1.2 - Extend card schema for plane vs phenomenon typing
Given cards are loaded from local data  
When card metadata is parsed  
Then each card includes canonical type metadata (PLANE or PHENOMENON)  
And backward compatibility for existing plane data is preserved

---

## Feature 8.2 - Backend Flow and FSM Integration

### Task 8.2.1 - Route phenomenon reveals into dedicated resolution flow
Given a phenomenon card is drawn  
When reveal processing occurs  
Then FSM transitions into phenomenon resolution handling  
And conflicting actions are blocked until completion

### Task 8.2.2 - Resume deterministic flow after phenomenon resolution
Given phenomenon resolution completes  
When continuation logic runs  
Then play returns to the correct follow-up state  
And deterministic reveal sequencing is preserved

---

## Feature 8.3 - UX Flow for Phenomenon Resolution

### Task 8.3.1 - Show dedicated phenomenon modal with full rules text
Given a phenomenon triggers  
When the modal opens  
Then title uses the phenomenon name  
And modal body displays full rules text

### Task 8.3.2 - Define post-resolution continuation behavior
Given a phenomenon modal is resolved  
When user closes or confirms resolution  
Then the application continues to the correct next gameplay step  
And user feedback/logging clearly communicates the transition

---

## Feature 8.4 - Testing, Logging, and Safety

### Task 8.4.1 - Log phenomenon reveal and resolution events
Given a phenomenon is encountered  
When reveal and resolution events occur  
Then player-readable log entries are recorded  
And event ordering reflects actual runtime sequence

### Task 8.4.2 - Add coverage for phenomenon transitions and fallback paths
Given phenomenon flow is implemented  
When automated tests run  
Then valid transitions and invalid transition rejection are covered  
And missing-data fallback behavior is verified

---

## Completion Criteria

- All milestones completed in order
- All tasks meet Definition of Done
- No unresolved FSM violations
- The application supports uninterrupted facilitator-led play

---

## Post-Milestone Execution Model

With Milestones 0-6 complete, active execution is now issue-driven.

Current process:

1. Capture bugs, polish work, and documentation gaps in `ISSUES.md`
2. Prioritize `reopened` and `unstarted` release-impacting items
3. Implement fixes in scoped batches
4. Re-verify with unit tests and production build
5. Update issue status and append `Resolution:` notes

This delivery plan remains the historical implementation baseline, while `ISSUES.md`
is the operational backlog for UAT and polish.

---

## Change Policy

Any deviation from this plan requires:
1. Updating the relevant documentation
2. Explicit acknowledgement of scope change
3. Re-validation against DoR and DoD

