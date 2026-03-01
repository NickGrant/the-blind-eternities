# System Architecture & State Model

## Overview
This document describes the core technical architecture, state ownership model,
and subsystem responsibilities for the Blind Eternities Planechase application.

---

## High-Level Architecture

- Angular application orchestrates **state, sequencing, and rules facilitation**
- Phaser is used strictly for **canvas-based map rendering and input intent emission**

### Ownership Boundaries

**Angular owns:**
- Session state (single source of truth)
- Finite State Machine (FSM)
- Sequencing and orchestration
- Rules facilitation
- Error handling and logging

**Phaser owns:**
- Rendering
- Camera movement
- Visual feedback
- Input intent emission (read-only)

Phaser must never:
- Mutate session state
- Enforce rules
- Advance the FSM

---

## Core Services

- **SessionStore** - holds the canonical SessionState
- **SessionOrchestrator** - the only component allowed to advance the FSM
- **DeckService** - manages draw / discard / reshuffle behavior
- **ModalQueueService** - enforces single-modal visibility and deterministic sequencing
- **LogService** - records player-facing events

---

## State Principles

- Single source of truth
- Fully serializable JSON
- Deterministic transitions
- Centralized randomness
- Phaser is stateless with respect to rules

---

## Canonical SessionState Shape (Skeleton)

### Design Constraints

- Serializable JSON only (no class instances, Maps, Sets, Dates, or functions)
- Angular is the single source of truth
- Phaser renders from state and emits intents only
- State transitions must be deterministic

---

### High-Level Ownership Map

| Slice | Owned By | Notes |
|------|----------|------|
| fsm | SessionOrchestrator | Authoritative lifecycle and gating |
| deck | DeckService | Draw / discard / reshuffle |
| map | SessionOrchestrator | Placement, adjacency, decay |
| modal | ModalQueueService | Modal queue + lock |
| log | LogService | Player-facing event feed |
| rng | SessionOrchestrator | Centralized randomness |
| ui | Angular components | Non-authoritative view state |

---

### SessionState Skeleton

```ts
export type SessionState = {
  meta: {
    version: number;
    createdAtMs: number;
    sessionId: string;
  };

  fsm: {
    state:
      | "SETUP"
      | "BOOTSTRAP_REVEAL"
      | "IDLE"
      | "ROLLING"
      | "AWAIT_MOVE"
      | "CONFIRM_MOVE"
      | "MOVING"
      | "MODAL_OPEN"
      | "ERROR";

    context?: {
      lastIntent?: {
        type: string;
        atMs: number;
      };

      pendingMove?: {
        fromCoord: CoordKey;
        toCoord: CoordKey;
      };

      error?: {
        code: string;
        detail?: string;
      };
    };
  };

  config: {
    decayDistance: number;
    bootstrapRevealOrder: ("C" | "N" | "E" | "S" | "W")[];
    ensurePlusEnabled: boolean;
  };

  rng: {
    seed?: string;
    rollCount: number;
  };

  deck: {
    drawPile: string[];
    discardPile: string[];
    currentPlaneId?: string;

    phenomenonGate?: {
      isResolving: boolean;
      sourcePlaneId?: string;
    };
  };

  map: {
    tilesByCoord: Record<CoordKey, MapTile>;
    partyCoord?: CoordKey;

    highlights?: {
      eligibleMoveCoords: CoordKey[];
    };
  };

  modal: {
    active?: ModalDescriptor;
    queue: ModalDescriptor[];
    isOpen: boolean;
  };

  log: {
    entries: LogEntry[];
  };

  ui: {
    camera?: {
      zoom: number;
      panX: number;
      panY: number;
    };

    selections?: {
      hoveredCoord?: CoordKey;
      selectedCoord?: CoordKey;
    };
  };
};

export type CoordKey = string;

export type MapTile = {
  coord: { x: number; y: number };
  planeId: string;
  revealedAtMs: number;
  isFaceUp: boolean;
  distanceFromParty?: number;
};

export type ModalDescriptor = {
  id: string;
  type: "PLANE" | "PHENOMENON" | "ERROR" | "CONFIRM_MOVE";
  planeId?: string;
  title?: string;
  body?: string;
  resumeToState?: SessionState["fsm"]["state"];
};

export type LogEntry = {
  id: string;
  atMs: number;
  level: "info" | "warn" | "error";
  message: string;
  meta?: Record<string, string | number | boolean | null>;
};
```

---

## State Invariants

- SessionState is always fully serializable
- FSM transitions occur only via SessionOrchestrator
- Phaser never mutates state
- `deck.currentPlaneId` matches the plane at `map.partyCoord` after bootstrap
- Modal system allows only one active modal
- Ensure-Plus invariant always maintains C/N/E/S/W adjacency

Violations of these invariants are fatal errors.

---

