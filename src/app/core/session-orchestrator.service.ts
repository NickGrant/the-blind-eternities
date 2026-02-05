import { Inject, Injectable } from "@angular/core";
import { DEV_MODE } from "./dev-mode";
import type { DomainIntent } from "../../state/intents.types";
import { reduceSessionState } from "../../state/fsm.reducer";
import { SessionStore } from "./session.store";

/**
 * SessionOrchestrator
 *
 * The only service allowed to advance the session FSM and mutate SessionState.
 * It consumes DomainIntents and applies them via the canonical reducer.
 */
@Injectable({ providedIn: "root" })
export class SessionOrchestrator {
  constructor(
    private readonly store: SessionStore,
    @Inject(DEV_MODE) private readonly devMode: boolean,
  ) {}

  dispatch(intent: DomainIntent): void {
    const current = this.store.state();
    const result = reduceSessionState(current, intent);

    if (!result.handled && this.devMode) {
      console.warn(
        `[FSM] Ignored intent "${intent.type}" in state "${current.fsm.state}"`,
        intent
      );
    }

    // Persist state if reducer returned a new object
    // (e.g. lastIntent updated even when unhandled)
    if (result.next !== current) {
      this.store.setState(result.next);
    }
  }

}
