import { DIE_OUTCOME, DOMAIN_INTENT, type DomainIntent } from "./intents.types";
import type { SessionState } from "./session.types";
import { isAdjacentCardinal, parseCoordKey } from "./map/coord";
import { createNewSessionState } from "./session.factory";
import { transition, withLastIntent, withRollCountIncremented } from "./reducer/fsm-core";
import { appendLog } from "./reducer/logging";
import {
  applyBootstrapReveal,
  applyMapPostMove,
  applyRegularPlaneswalk,
  initMapForSession,
  setEligibleMoves,
} from "./reducer/map-flow";
import { closeModal, enqueueModal, toModalDescriptor } from "./reducer/modal-flow";

type FsmState = SessionState["fsm"]["state"];

/**
 * Appends a standard die-resolution log entry with current roll context.
 */
function withRollOutcomeLogged(
  state: SessionState,
  args: { atMs: number; outcome: (typeof DIE_OUTCOME)[keyof typeof DIE_OUTCOME] }
): SessionState {
  return appendLog(state, {
    atMs: args.atMs,
    level: "info",
    message: `Die roll resolved: ${args.outcome}.`,
    meta: {
      rollCount: state.rng.rollCount,
      currentPlaneId: state.deck.currentPlaneId ?? null,
    },
  });
}

/**
 * Canonical pure reducer for all domain intents.
 */
export function reduceSessionState(state: SessionState, intent: DomainIntent): SessionState {
  if (intent.type === DOMAIN_INTENT.RESTART_SESSION) {
    const reset = createNewSessionState({
      atMs: intent.atMs,
      seed: state.rng.seed,
    });
    return transition(
      {
        ...reset,
        config: { ...state.config },
      },
      "SETUP",
      intent
    );
  }

  if (intent.type === DOMAIN_INTENT.DEBUG_FORCE_ROLL) {
    if (state.fsm.state !== "IDLE") return state;
    const rolling = reduceSessionState(state, { type: DOMAIN_INTENT.ROLL_DIE, atMs: intent.atMs });
    if (rolling === state) return state;
    return reduceSessionState(rolling, {
      type: DOMAIN_INTENT.ROLL_RESOLVED,
      atMs: intent.atMs + 1,
      outcome: intent.outcome,
    });
  }

  if (intent.type === DOMAIN_INTENT.DEBUG_REVEAL_ALL) {
    const hidden = Object.entries(state.map.tilesByCoord).filter(([, tile]) => !tile.isFaceUp);
    if (hidden.length === 0) return state;

    const tilesByCoord = { ...state.map.tilesByCoord };
    hidden.forEach(([coordKey, tile], idx) => {
      tilesByCoord[coordKey] = { ...tile, isFaceUp: true, revealedAtMs: intent.atMs + idx };
    });

    return appendLog(
      {
        ...state,
        map: {
          ...state.map,
          tilesByCoord,
        },
      },
      {
        atMs: intent.atMs,
        level: "info",
        message: `Debug reveal all applied (${hidden.length} tiles).`,
        meta: { revealedCount: hidden.length },
      }
    );
  }

  if (intent.type === DOMAIN_INTENT.FATAL_ERROR) {
    const errored = appendLog(state, {
      atMs: intent.atMs,
      level: "error",
      message: `Fatal error: ${intent.code}`,
      meta: { detail: intent.detail ?? null },
    });

    return transition(errored, "ERROR", intent, {
      error: { code: intent.code, detail: intent.detail },
      pendingMove: undefined,
    });
  }

  if (intent.type === DOMAIN_INTENT.OPEN_MODAL) {
    const resumeTo =
      state.fsm.state === "MODAL_OPEN"
        ? ((state.modal.active?.resumeToState as FsmState | undefined) ?? "IDLE")
        : state.fsm.state;

    const withModal = enqueueModal(state, toModalDescriptor(intent.modal, resumeTo));

    if (state.modal.isOpen && state.fsm.state === "MODAL_OPEN") {
      return withLastIntent(withModal, intent);
    }

    return transition(withModal, "MODAL_OPEN", intent);
  }

  switch (state.fsm.state) {
    case "SETUP": {
      if (intent.type === DOMAIN_INTENT.START_SESSION) {
        const seeded = initMapForSession(state, intent);
        return transition(seeded, "BOOTSTRAP_REVEAL", intent);
      }
      return state;
    }

    case "BOOTSTRAP_REVEAL": {
      if (intent.type === DOMAIN_INTENT.BOOTSTRAP_REVEAL_COMPLETE) {
        const revealed = applyBootstrapReveal(state, intent.atMs);
        if (!revealed.deck.currentPlaneId) {
          return transition(revealed, "IDLE", intent);
        }

        const withModal = enqueueModal(revealed, {
          id: `bootstrap_${intent.atMs}`,
          type: "PLANE",
          planeId: revealed.deck.currentPlaneId,
          resumeToState: "IDLE",
        });
        return transition(withModal, "MODAL_OPEN", intent);
      }
      return state;
    }

    case "IDLE": {
      if (intent.type === DOMAIN_INTENT.ROLL_DIE) {
        return transition(state, "ROLLING", intent);
      }
      return state;
    }

    case "ROLLING": {
      if (intent.type === DOMAIN_INTENT.ROLL_RESOLVED) {
        if (intent.outcome === DIE_OUTCOME.BLANK) {
          const rolled = withRollCountIncremented(state);
          const logged = withRollOutcomeLogged(rolled, { atMs: intent.atMs, outcome: DIE_OUTCOME.BLANK });
          return transition(logged, "IDLE", intent);
        }
        if (intent.outcome === DIE_OUTCOME.PLANESWALK) {
          const rolled = withRollCountIncremented(state);
          const logged = withRollOutcomeLogged(rolled, { atMs: intent.atMs, outcome: DIE_OUTCOME.PLANESWALK });
          if (state.config.gameMode === "REGULAR_PLANECHASE") {
            const advanced = applyRegularPlaneswalk(logged, intent.atMs);
            const withModal = enqueueModal(advanced, {
              id: `planeswalk_${intent.atMs}`,
              type: "PLANE",
              planeId: advanced.deck.currentPlaneId,
              resumeToState: "IDLE",
            });
            return transition(withModal, "MODAL_OPEN", intent);
          }
          const next = transition(logged, "AWAIT_MOVE", intent);
          return setEligibleMoves(next);
        }
        if (intent.outcome === DIE_OUTCOME.CHAOS) {
          const withModal = enqueueModal(withRollCountIncremented(state), {
            id: `chaos_${intent.atMs}`,
            type: "PLANE",
            planeId: state.deck.currentPlaneId,
            resumeToState: "IDLE",
          });
          const logged = withRollOutcomeLogged(withModal, { atMs: intent.atMs, outcome: DIE_OUTCOME.CHAOS });
          return transition(logged, "MODAL_OPEN", intent);
        }
      }
      return state;
    }

    case "AWAIT_MOVE": {
      if (intent.type === DOMAIN_INTENT.SELECT_PLANE) {
        const from = state.map.partyCoord;
        if (!from) return state;
        if (!state.map.tilesByCoord[intent.toCoord]) return state;

        const fromCoord = parseCoordKey(from);
        const toCoord = parseCoordKey(intent.toCoord);
        if (!isAdjacentCardinal(fromCoord, toCoord)) return state;

        const next = transition(state, "CONFIRM_MOVE", intent, {
          pendingMove: { fromCoord: from, toCoord: intent.toCoord },
        });

        return {
          ...next,
          ui: {
            ...next.ui,
            selections: {
              ...(next.ui.selections ?? {}),
              selectedCoord: intent.toCoord,
            },
          },
        };
      }
      if (intent.type === DOMAIN_INTENT.CANCEL_MOVE) {
        return transition(state, "IDLE", intent);
      }
      return state;
    }

    case "CONFIRM_MOVE": {
      if (intent.type === DOMAIN_INTENT.CONFIRM_MOVE) {
        return transition(state, "MOVING", intent);
      }
      if (intent.type === DOMAIN_INTENT.CANCEL_MOVE) {
        return transition(state, "AWAIT_MOVE", intent);
      }
      return state;
    }

    case "MOVING": {
      if (intent.type === DOMAIN_INTENT.MOVEMENT_COMPLETE) {
        const mapped = applyMapPostMove(state, intent.atMs);
        if (mapped.deck.currentPlaneId) {
          const withModal = enqueueModal(mapped, {
            id: `landed_${intent.atMs}`,
            type: "PLANE",
            planeId: mapped.deck.currentPlaneId,
            resumeToState: "IDLE",
          });
          return transition(withModal, "MODAL_OPEN", intent, { pendingMove: undefined });
        }
        return transition(mapped, "IDLE", intent, { pendingMove: undefined });
      }
      return state;
    }

    case "MODAL_OPEN": {
      if (intent.type === DOMAIN_INTENT.CLOSE_MODAL) {
        return closeModal(state, intent);
      }
      return state;
    }

    case "ERROR": {
      return state;
    }

    default:
      return state;
  }
}
