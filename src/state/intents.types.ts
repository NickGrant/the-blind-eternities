// Intents are pure-data payloads that represent either:
// - PhaserIntent: raw UI/render-layer events emitted by Phaser (pointer events, ready)
// - DomainIntent: game-level actions consumed by the SessionOrchestrator / FSM
//
// Rule:
// - Phaser emits PhaserIntent ONLY.
// - Angular translates PhaserIntent -> DomainIntent.
// - SessionOrchestrator consumes DomainIntent ONLY.

import type { CoordKey, FsmState } from "./session.types";

// -------------------------
// Phaser Intents (existing; keep stable)
// -------------------------

export type PhaserIntent =
  | { type: "phaser/ready"; atMs: number }
  | { type: "input/pointer_down"; atMs: number; x: number; y: number }
  | { type: "input/pointer_up"; atMs: number; x: number; y: number };

/**
 * Milestone 0 note:
 * - Intents are defined and passed around, but not yet required to drive orchestration.
 * - Payloads must remain serializable (no functions, Dates, Maps/Sets, class instances).
 */

// -------------------------
// Domain Intents (Milestone 1+)
// -------------------------

export type DieOutcome = "blank" | "chaos" | "planeswalk";

export type ModalType = "PLANE" | "PHENOMENON" | "ERROR" | "CONFIRM_MOVE";

/**
 * DomainIntent
 *
 * Game-level intents consumed by SessionOrchestrator.
 * These are the ONLY intents that should drive FSM transitions.
 */
export type DomainIntent =
  // Session lifecycle
  | {
      type: "domain/start_session";
      atMs: number;
      initialDeck?: {
        drawPile: string[];
        discardPile: string[];
      };
    }
  | { type: "domain/restart_session"; atMs: number }

  // Bootstrap sequencing (system-driven; UI should not emit directly)
  | { type: "domain/bootstrap_reveal_complete"; atMs: number }

  // Rolling
  | { type: "domain/roll_die"; atMs: number }
  | { type: "domain/roll_resolved"; atMs: number; outcome: DieOutcome }

  // Movement
  | { type: "domain/select_plane"; atMs: number; toCoord: CoordKey }
  | { type: "domain/confirm_move"; atMs: number }
  | { type: "domain/cancel_move"; atMs: number }
  | { type: "domain/movement_complete"; atMs: number }

  // Modals
  | {
      type: "domain/open_modal";
      atMs: number;
      modal: {
        id: string; // unique id for queue management
        modalType: ModalType;
        planeId?: string;
        title?: string;
        body?: string;
        resumeToState?: FsmState;
      };
    }
  | { type: "domain/close_modal"; atMs: number; modalId?: string }

  // Errors
  | { type: "domain/fatal_error"; atMs: number; code: string; detail?: string };

// -------------------------
// Optional type guards
// -------------------------

export const isPhaserIntent = (value: unknown): value is PhaserIntent => {
  if (!value || typeof value !== "object") return false;
  return "type" in value && typeof (value as any).type === "string";
};

export const isDomainIntent = (value: unknown): value is DomainIntent => {
  if (!value || typeof value !== "object") return false;
  return "type" in value && typeof (value as any).type === "string";
};
