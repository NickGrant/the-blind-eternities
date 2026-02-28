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

## Completion Criteria

- All milestones completed in order
- All tasks meet Definition of Done
- No unresolved FSM violations
- The application supports uninterrupted facilitator-led play

---

## Change Policy

Any deviation from this plan requires:
1. Updating the relevant documentation
2. Explicit acknowledgement of scope change
3. Re-validation against DoR and DoD

