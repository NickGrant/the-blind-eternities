import { DOMAIN_INTENT, type DomainIntent } from "../intents.types";
import type { ModalDescriptor, SessionState } from "../session.types";
import { transition, withLastIntent, type FsmState } from "./fsm-core";

export function toModalDescriptor(
  modal: Extract<DomainIntent, { type: typeof DOMAIN_INTENT.OPEN_MODAL }>["modal"],
  resumeToState: FsmState
): ModalDescriptor {
  return {
    id: modal.id,
    type: modal.modalType,
    planeId: modal.planeId,
    title: modal.title,
    body: modal.body,
    resumeToState: modal.resumeToState ?? resumeToState,
  };
}

export function enqueueModal(state: SessionState, modal: ModalDescriptor): SessionState {
  if (isDuplicateModal(state, modal)) return state;

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
  };
}

function isDuplicateModal(state: SessionState, candidate: ModalDescriptor): boolean {
  const active = state.modal.active;
  if (active && matchesModalIdentity(active, candidate)) return true;
  return state.modal.queue.some((queued) => matchesModalIdentity(queued, candidate));
}

function matchesModalIdentity(left: ModalDescriptor, right: ModalDescriptor): boolean {
  if (left.id === right.id) return true;
  if (!left.planeId || !right.planeId) return false;
  return left.type === right.type && left.planeId === right.planeId;
}

export function closeModal(
  state: SessionState,
  intent: Extract<DomainIntent, { type: typeof DOMAIN_INTENT.CLOSE_MODAL }>
): SessionState {
  const active = state.modal.active;
  if (!state.modal.isOpen || !active) return state;

  if (intent.modalId && intent.modalId !== active.id) {
    return state;
  }

  const [nextActive, ...rest] = state.modal.queue;
  if (nextActive) {
    return withLastIntent(
      {
        ...state,
        modal: {
          ...state.modal,
          active: nextActive,
          queue: rest,
          isOpen: true,
        },
      },
      intent
    );
  }

  const resumeTo = (active.resumeToState as FsmState | undefined) ?? "IDLE";
  const closed = {
    ...state,
    modal: {
      ...state.modal,
      active: undefined,
      queue: [],
      isOpen: false,
    },
  };

  return transition(closed, resumeTo, intent);
}
