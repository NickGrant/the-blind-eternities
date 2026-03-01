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

export const DIE_OUTCOME = {
  BLANK: "blank",
  CHAOS: "chaos",
  PLANESWALK: "planeswalk",
} as const;

export type DieOutcome = (typeof DIE_OUTCOME)[keyof typeof DIE_OUTCOME];

export const MODAL_TYPE = {
  PLANE: "PLANE",
  PHENOMENON: "PHENOMENON",
  ERROR: "ERROR",
  CONFIRM_MOVE: "CONFIRM_MOVE",
} as const;

export type ModalType = (typeof MODAL_TYPE)[keyof typeof MODAL_TYPE];

export const GAME_MODE = {
  BLIND_ETERNITIES: "BLIND_ETERNITIES",
  REGULAR_PLANECHASE: "REGULAR_PLANECHASE",
} as const;

export type GameMode = (typeof GAME_MODE)[keyof typeof GAME_MODE];

export const DOMAIN_INTENT = {
  START_SESSION: "domain/start_session",
  RESTART_SESSION: "domain/restart_session",
  DEBUG_FORCE_ROLL: "domain/debug_force_roll",
  DEBUG_REVEAL_ALL: "domain/debug_reveal_all",
  BOOTSTRAP_REVEAL_COMPLETE: "domain/bootstrap_reveal_complete",
  ROLL_DIE: "domain/roll_die",
  ROLL_RESOLVED: "domain/roll_resolved",
  SELECT_PLANE: "domain/select_plane",
  CONFIRM_MOVE: "domain/confirm_move",
  CANCEL_MOVE: "domain/cancel_move",
  MOVEMENT_COMPLETE: "domain/movement_complete",
  OPEN_MODAL: "domain/open_modal",
  CLOSE_MODAL: "domain/close_modal",
  FATAL_ERROR: "domain/fatal_error",
} as const;

/**
 * DomainIntent
 *
 * Game-level intents consumed by SessionOrchestrator.
 * These are the ONLY intents that should drive FSM transitions.
 */
export type DomainIntent =
  // Session lifecycle
  | {
      type: typeof DOMAIN_INTENT.START_SESSION;
      atMs: number;
      includedSetCodes?: string[];
      gameMode?: GameMode;
      initialDeck?: {
        drawPile: string[];
        discardPile: string[];
      };
    }
  | { type: typeof DOMAIN_INTENT.RESTART_SESSION; atMs: number }
  | {
      type: typeof DOMAIN_INTENT.DEBUG_FORCE_ROLL;
      atMs: number;
      outcome: Extract<DieOutcome, typeof DIE_OUTCOME.CHAOS | typeof DIE_OUTCOME.PLANESWALK>;
    }
  | { type: typeof DOMAIN_INTENT.DEBUG_REVEAL_ALL; atMs: number }

  // Bootstrap sequencing (system-driven; UI should not emit directly)
  | { type: typeof DOMAIN_INTENT.BOOTSTRAP_REVEAL_COMPLETE; atMs: number }

  // Rolling
  | { type: typeof DOMAIN_INTENT.ROLL_DIE; atMs: number }
  | { type: typeof DOMAIN_INTENT.ROLL_RESOLVED; atMs: number; outcome: DieOutcome }

  // Movement
  | { type: typeof DOMAIN_INTENT.SELECT_PLANE; atMs: number; toCoord: CoordKey }
  | { type: typeof DOMAIN_INTENT.CONFIRM_MOVE; atMs: number }
  | { type: typeof DOMAIN_INTENT.CANCEL_MOVE; atMs: number }
  | { type: typeof DOMAIN_INTENT.MOVEMENT_COMPLETE; atMs: number }

  // Modals
  | {
      type: typeof DOMAIN_INTENT.OPEN_MODAL;
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
  | { type: typeof DOMAIN_INTENT.CLOSE_MODAL; atMs: number; modalId?: string }

  // Errors
  | { type: typeof DOMAIN_INTENT.FATAL_ERROR; atMs: number; code: string; detail?: string };

// -------------------------
// Optional type guards
// -------------------------

export const isPhaserIntent = (value: unknown): value is PhaserIntent => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate["type"] === "string";
};

export const isDomainIntent = (value: unknown): value is DomainIntent => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate["type"] === "string";
};
