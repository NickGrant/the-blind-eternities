import type { DomainIntent } from "./intents.types";
import type { ModalDescriptor, SessionState } from "./session.types";
import { createNewSessionState } from "./session.factory";

type ReduceResult = { next: SessionState; handled: boolean };

const withLastIntent = (state: SessionState, intent: DomainIntent): SessionState => ({
  ...state,
  fsm: {
    ...state.fsm,
    context: {
      ...state.fsm.context,
      lastIntent: { type: intent.type, atMs: intent.atMs },
    },
  },
});

const openModal = (state: SessionState, modal: ModalDescriptor): SessionState => {
  // If a modal is already open, queue it (Milestone 3 hardens this).
  if (state.modal.isOpen && state.modal.active) {
    return {
      ...state,
      modal: {
        ...state.modal,
        queue: [...state.modal.queue, modal],
      },
    };
  }

  return {
    ...state,
    modal: {
      ...state.modal,
      active: modal,
      isOpen: true,
    },
    fsm: {
      ...state.fsm,
      state: "MODAL_OPEN",
    },
  };
};

const closeModal = (state: SessionState, modalId?: string): SessionState => {
  const active = state.modal.active;
  const isClosingActive = !modalId || (active && active.id === modalId);

  if (!isClosingActive) {
    // We only support closing the active modal in Milestone 1.
    return state;
  }

  const nextInQueue = state.modal.queue[0];
  const remainingQueue = state.modal.queue.slice(1);

  if (nextInQueue) {
    // Continue modal flow without returning to resume state yet.
    return {
      ...state,
      modal: {
        ...state.modal,
        active: nextInQueue,
        queue: remainingQueue,
        isOpen: true,
      },
      fsm: {
        ...state.fsm,
        state: "MODAL_OPEN",
      },
    };
  }

  const resumeTo = active?.resumeToState ?? "IDLE";

  return {
    ...state,
    modal: {
      ...state.modal,
      active: undefined,
      queue: [],
      isOpen: false,
    },
    fsm: {
      ...state.fsm,
      state: resumeTo,
    },
  };
};

/**
 * reduceSessionState
 *
 * Pure reducer that applies DomainIntents according to the canonical FSM.
 * Invalid intents are ignored (no state change). Callers may warn in dev mode.
 */
export const reduceSessionState = (state: SessionState, intent: DomainIntent): ReduceResult => {
  const s = withLastIntent(state, intent);

  // For debugging (and for the upcoming debug panel), we always record lastIntent.
  // If an intent is invalid for the current state, we return `handled:false` but
  // still return the updated state `s`.
  const unhandled = (): ReduceResult => ({ next: s, handled: false });

  switch (intent.type) {
    // ----------------
    // Session lifecycle
    // ----------------
    case "domain/start_session": {
      if (s.fsm.state !== "SETUP") return unhandled();

      // Milestone 1: move into BOOTSTRAP_REVEAL; Milestone 2+ will init deck/map.
      return {
        next: {
          ...s,
          fsm: { ...s.fsm, state: "BOOTSTRAP_REVEAL" },
        },
        handled: true,
      };
    }

    case "domain/bootstrap_reveal_complete": {
      if (s.fsm.state !== "BOOTSTRAP_REVEAL") return unhandled();
      return {
        next: {
          ...s,
          fsm: { ...s.fsm, state: "IDLE" },
        },
        handled: true,
      };
    }

    case "domain/restart_session": {
      if (s.fsm.state !== "ERROR") return unhandled();
      return {
        next: createNewSessionState({ atMs: intent.atMs }),
        handled: true,
      };
    }

    // -----
    // Rolling
    // -----
    case "domain/roll_die": {
      if (s.fsm.state !== "IDLE") return unhandled();
      return {
        next: {
          ...s,
          fsm: { ...s.fsm, state: "ROLLING" },
          rng: { ...s.rng, rollCount: s.rng.rollCount + 1 },
        },
        handled: true,
      };
    }

    case "domain/roll_resolved": {
      if (s.fsm.state !== "ROLLING") return unhandled();

      if (intent.outcome === "blank") {
        return { next: { ...s, fsm: { ...s.fsm, state: "IDLE" } }, handled: true };
      }

      if (intent.outcome === "planeswalk") {
        return {
          next: {
            ...s,
            fsm: { ...s.fsm, state: "AWAIT_MOVE" },
            map: {
              ...s.map,
              highlights: { eligibleMoveCoords: s.map.highlights?.eligibleMoveCoords ?? [] },
            },
          },
          handled: true,
        };
      }

      // chaos -> open current plane modal (placeholder until deck/map exist)
      const modal: ModalDescriptor = {
        id: `modal_${intent.atMs}`,
        type: "PLANE",
        planeId: s.deck.currentPlaneId,
        title: "Chaos",
        body: "Resolve the current plane's Chaos ability.",
        resumeToState: "IDLE",
      };

      return { next: openModal(s, modal), handled: true };
    }

    // --------
    // Movement
    // --------
    case "domain/select_plane": {
      if (s.fsm.state !== "AWAIT_MOVE") return unhandled();

      const fromCoord = s.map.partyCoord ?? "0,0";
      return {
        next: {
          ...s,
          fsm: {
            ...s.fsm,
            state: "CONFIRM_MOVE",
            context: {
              ...s.fsm.context,
              pendingMove: { fromCoord, toCoord: intent.toCoord },
            },
          },
          ui: {
            ...s.ui,
            selections: {
              ...s.ui.selections,
              selectedCoord: intent.toCoord,
            },
          },
        },
        handled: true,
      };
    }

    case "domain/cancel_move": {
      if (s.fsm.state !== "AWAIT_MOVE" && s.fsm.state !== "CONFIRM_MOVE") {
        return unhandled();
      }

      if (s.fsm.state === "AWAIT_MOVE") {
        return {
          next: {
            ...s,
            fsm: { ...s.fsm, state: "IDLE", context: { ...s.fsm.context, pendingMove: undefined } },
            map: { ...s.map, highlights: { eligibleMoveCoords: [] } },
            ui: { ...s.ui, selections: { ...s.ui.selections, selectedCoord: undefined } },
          },
          handled: true,
        };
      }

      // CONFIRM_MOVE -> back to AWAIT_MOVE
      return {
        next: {
          ...s,
          fsm: { ...s.fsm, state: "AWAIT_MOVE", context: { ...s.fsm.context, pendingMove: undefined } },
          ui: { ...s.ui, selections: { ...s.ui.selections, selectedCoord: undefined } },
        },
        handled: true,
      };
    }

    case "domain/confirm_move": {
      if (s.fsm.state !== "CONFIRM_MOVE") return unhandled();
      return { next: { ...s, fsm: { ...s.fsm, state: "MOVING" } }, handled: true };
    }

    case "domain/movement_complete": {
      if (s.fsm.state !== "MOVING") return unhandled();
      return {
        next: {
          ...s,
          fsm: { ...s.fsm, state: "IDLE", context: { ...s.fsm.context, pendingMove: undefined } },
          map: { ...s.map, highlights: { eligibleMoveCoords: [] } },
          ui: { ...s.ui, selections: { ...s.ui.selections, selectedCoord: undefined } },
        },
        handled: true,
      };
    }

    // ------
    // Modals
    // ------
    case "domain/open_modal": {
      const modal: ModalDescriptor = {
        id: intent.modal.id,
        type: intent.modal.modalType,
        planeId: intent.modal.planeId,
        title: intent.modal.title,
        body: intent.modal.body,
        resumeToState: (intent.modal.resumeToState as any) ?? s.fsm.state,
      };
      return { next: openModal(s, modal), handled: true };
    }

    case "domain/close_modal": {
      if (s.fsm.state !== "MODAL_OPEN") return unhandled();

      const next = closeModal(s, intent.modalId);
      // If the caller tried to close a modal that wasn't active, treat as unhandled.
      return { next, handled: next !== s };
    }

    // ------
    // Errors
    // ------
    case "domain/fatal_error": {
      return {
        next: {
          ...s,
          fsm: {
            ...s.fsm,
            state: "ERROR",
            context: { ...s.fsm.context, error: { code: intent.code, detail: intent.detail } },
          },
        },
        handled: true,
      };
    }

    default: {
      // Exhaustive check
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustive: never = intent;
      return unhandled();
    }
  }
};
