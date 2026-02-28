import { Inject, Injectable } from "@angular/core";
import { DEV_MODE } from "./dev-mode";
import { DeckService } from "./deck.service";
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
    private readonly deckService: DeckService,
    @Inject(DEV_MODE) private readonly devMode: boolean,
  ) {}

  dispatch(intent: DomainIntent): void {
    const current = this.store.state();
    const preparedIntent =
      intent.type === "domain/start_session"
        ? {
            ...intent,
            initialDeck: this.deckService.createInitialDeck({
              atMs: intent.atMs,
              seed: current.rng.seed,
            }),
          }
        : intent;

    const next = reduceSessionState(current, preparedIntent);
    const handled = next !== current;

    if (!handled && this.devMode) {
      console.warn(
        `[FSM] Ignored intent "${preparedIntent.type}" in state "${current.fsm.state}"`,
        preparedIntent
      );
    }

    if (next !== current) {
      this.store.setState(next);
    }
  }
}
