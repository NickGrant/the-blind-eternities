import type { DomainIntent } from "../intents.types";
import type { SessionState } from "../session.types";

export type FsmState = SessionState["fsm"]["state"];

export function withLastIntent(state: SessionState, intent: DomainIntent): SessionState {
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

export function transition(
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

export function withRollCountIncremented(state: SessionState): SessionState {
  return {
    ...state,
    rng: {
      ...state.rng,
      rollCount: state.rng.rollCount + 1,
    },
  };
}

