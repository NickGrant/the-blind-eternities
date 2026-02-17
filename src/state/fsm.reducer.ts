import type { SessionState } from "./session.types";
import type { DomainIntent } from "./intents.types";

type FsmState = SessionState["fsm"]["state"];

function withLastIntent(state: SessionState, intent: DomainIntent): SessionState {
  return {
    ...state,
    fsm: {
      ...state.fsm,
      context: {
        ...(state.fsm.context ?? {}),
        lastIntent: {
          type: intent.type,
          atMs: intent.atMs,
        },
      },
    },
  };
}

function transition(
  state: SessionState,
  nextState: FsmState,
  intent: DomainIntent,
  contextPatch?: Partial<NonNullable<SessionState["fsm"]["context"]>>
): SessionState {
  const base: SessionState = {
    ...state,
    fsm: {
      ...state.fsm,
      state: nextState,
      context: {
        ...(state.fsm.context ?? {}),
        ...(contextPatch ?? {}),
      },
    },
  };

  return withLastIntent(base, intent);
}

export function reduceSessionState(state: SessionState, intent: DomainIntent): SessionState {
  switch (state.fsm.state) {
    case "SETUP": {
      if (intent.type === "domain/start_session") {
        return transition(state, "BOOTSTRAP_REVEAL", intent);
      }
      return state;
    }

    case "BOOTSTRAP_REVEAL": {
      if (intent.type === "domain/bootstrap_reveal_complete") {
        return transition(state, "IDLE", intent);
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
          return transition(state, "IDLE", intent);
        }
        if (intent.outcome === "planeswalk") {
          return transition(state, "AWAIT_MOVE", intent);
        }
        if (intent.outcome === "chaos") {
          return transition(state, "MODAL_OPEN", intent);
        }
      }
      return state;
    }

    case "AWAIT_MOVE": {
      if (intent.type === "domain/select_plane") {
        return transition(state, "CONFIRM_MOVE", intent, {
          pendingMove: {
            fromCoord: state.map.partyCoord!,
            toCoord: intent.toCoord,
          },
        });
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
        return transition(state, "IDLE", intent, {
          pendingMove: undefined,
        });
      }
      return state;
    }

    case "MODAL_OPEN": {
      if (intent.type === "domain/close_modal") {
        const resumeTo = (state.modal.active?.resumeToState as FsmState | undefined) ?? "IDLE";
        return transition(state, resumeTo, intent);
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