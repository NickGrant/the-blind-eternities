import type { DomainIntent } from "./intents.types";
import type { SessionState } from "./session.types";
import { isAdjacentCardinal, parseCoordKey } from "./map/coord";
import { transition, withLastIntent, withRollCountIncremented } from "./reducer/fsm-core";
import { appendLog } from "./reducer/logging";
import { applyBootstrapReveal, applyMapPostMove, initMapForSession, setEligibleMoves } from "./reducer/map-flow";
import { closeModal, enqueueModal, toModalDescriptor } from "./reducer/modal-flow";

type FsmState = SessionState["fsm"]["state"];

function withRollOutcomeLogged(
  state: SessionState,
  args: { atMs: number; outcome: "blank" | "chaos" | "planeswalk" }
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

export function reduceSessionState(state: SessionState, intent: DomainIntent): SessionState {
  if (intent.type === "domain/fatal_error") {
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

  if (intent.type === "domain/open_modal") {
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
      if (intent.type === "domain/start_session") {
        const seeded = initMapForSession(state, intent);
        return transition(seeded, "BOOTSTRAP_REVEAL", intent);
      }
      return state;
    }

    case "BOOTSTRAP_REVEAL": {
      if (intent.type === "domain/bootstrap_reveal_complete") {
        const revealed = applyBootstrapReveal(state, intent.atMs);
        return transition(revealed, "IDLE", intent);
      }
      return state;
    }

    case "IDLE": {
      if (intent.type === "domain/roll_die") {
        return transition(state, "ROLLING", intent);
      }
      return state;
    }

    case "ROLLING": {
      if (intent.type === "domain/roll_resolved") {
        if (intent.outcome === "blank") {
          const rolled = withRollCountIncremented(state);
          const logged = withRollOutcomeLogged(rolled, { atMs: intent.atMs, outcome: "blank" });
          return transition(logged, "IDLE", intent);
        }
        if (intent.outcome === "planeswalk") {
          const rolled = withRollCountIncremented(state);
          const logged = withRollOutcomeLogged(rolled, { atMs: intent.atMs, outcome: "planeswalk" });
          const next = transition(logged, "AWAIT_MOVE", intent);
          return setEligibleMoves(next);
        }
        if (intent.outcome === "chaos") {
          const withModal = enqueueModal(withRollCountIncremented(state), {
            id: `chaos_${intent.atMs}`,
            type: "PLANE",
            planeId: state.deck.currentPlaneId,
            title: "Current Plane",
            resumeToState: "IDLE",
          });
          const logged = withRollOutcomeLogged(withModal, { atMs: intent.atMs, outcome: "chaos" });
          return transition(logged, "MODAL_OPEN", intent);
        }
      }
      return state;
    }

    case "AWAIT_MOVE": {
      if (intent.type === "domain/select_plane") {
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
      if (intent.type === "domain/cancel_move") {
        return transition(state, "IDLE", intent);
      }
      return state;
    }

    case "CONFIRM_MOVE": {
      if (intent.type === "domain/confirm_move") {
        return transition(state, "MOVING", intent);
      }
      if (intent.type === "domain/cancel_move") {
        return transition(state, "AWAIT_MOVE", intent);
      }
      return state;
    }

    case "MOVING": {
      if (intent.type === "domain/movement_complete") {
        const mapped = applyMapPostMove(state, intent.atMs);
        return transition(mapped, "IDLE", intent, { pendingMove: undefined });
      }
      return state;
    }

    case "MODAL_OPEN": {
      if (intent.type === "domain/close_modal") {
        return closeModal(state, intent);
      }
      return state;
    }

    case "ERROR": {
      if (intent.type === "domain/restart_session") {
        return transition(state, "SETUP", intent);
      }
      return state;
    }

    default:
      return state;
  }
}
