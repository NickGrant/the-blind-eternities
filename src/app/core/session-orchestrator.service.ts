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
    const next = reduceSessionState(current, intent);
    const handled = next !== current;

    if (!handled && this.devMode) {
      console.warn(
        `[FSM] Ignored intent "${intent.type}" in state "${current.fsm.state}"`,
        intent
      );
    }

    if (next !== current) {
      this.store.setState(next);
    }
  }
}