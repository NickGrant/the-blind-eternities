import { Inject, Injectable } from "@angular/core";
import { DEV_MODE } from "./dev-mode";
import { DeckService } from "./deck.service";
import { DieService } from "./die.service";
import { FatalErrorStore } from "./fatal-error.store";
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
    private readonly dieService: DieService,
    private readonly fatalErrorStore: FatalErrorStore,
    @Inject(DEV_MODE) private readonly devMode: boolean,
  ) {}

  dispatch(intent: DomainIntent): void {
    const current = this.store.state();
    let preparedIntent: DomainIntent = intent;

    if (intent.type === "domain/start_session") {
      try {
        preparedIntent = {
          ...intent,
          initialDeck: this.deckService.createInitialDeck({
            atMs: intent.atMs,
            seed: current.rng.seed,
          }),
        };
      } catch (err) {
        const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        this.fatalErrorStore.set({
          code: "CARD_DATA_INIT_FAILED",
          message: "Unable to initialize card data. Session cannot continue.",
          detail,
        });

        const fatalIntent: DomainIntent = {
          type: "domain/fatal_error",
          atMs: intent.atMs,
          code: "CARD_DATA_INIT_FAILED",
          detail,
        };
        const fatalState = reduceSessionState(current, fatalIntent);
        if (fatalState !== current) {
          this.store.setState(fatalState);
        }
        return;
      }
    }

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

    if (preparedIntent.type === "domain/roll_die" && next.fsm.state === "ROLLING") {
      const outcome = this.dieService.roll({
        atMs: preparedIntent.atMs,
        seed: next.rng.seed,
        rollCount: next.rng.rollCount,
      });

      const resolvedIntent: DomainIntent = {
        type: "domain/roll_resolved",
        atMs: preparedIntent.atMs,
        outcome,
      };

      const resolved = reduceSessionState(next, resolvedIntent);
      if (resolved !== next) {
        this.store.setState(resolved);
      }
    }
  }
}
