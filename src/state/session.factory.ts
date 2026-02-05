import type { SessionState } from "./session.types";

/**
 * Creates a brand-new session state. Pure + deterministic based on inputs.
 * Milestone 1 scope: initializes the FSM + config and provides empty slices for future services.
 */
export const createNewSessionState = (args: {
  atMs: number;
  sessionId?: string;
  seed?: string;
}): SessionState => {
  const sessionId = args.sessionId ?? `session_${args.atMs}`;

  return {
    meta: {
      version: 1,
      createdAtMs: args.atMs,
      sessionId,
    },

    fsm: {
      state: "SETUP",
      context: {
        lastIntent: { type: "init", atMs: args.atMs },
      },
    },

    config: {
      // Reasonable v1 default; can be tuned in Milestone 2 (decay doc).
      decayDistance: 3,
      bootstrapRevealOrder: ["C", "N", "E", "S", "W"],
      ensurePlusEnabled: true,
    },

    rng: {
      seed: args.seed,
      rollCount: 0,
    },

    deck: {
      drawPile: [],
      discardPile: [],
      currentPlaneId: undefined,
      phenomenonGate: {
        isResolving: false,
        sourcePlaneId: undefined,
      },
    },

    map: {
      tilesByCoord: {},
      partyCoord: undefined,
      highlights: { eligibleMoveCoords: [] },
    },

    modal: {
      active: undefined,
      queue: [],
      isOpen: false,
    },

    log: {
      entries: [],
    },

    ui: {
      camera: { zoom: 1, panX: 0, panY: 0 },
      selections: { hoveredCoord: undefined, selectedCoord: undefined },
    },
  };
};
