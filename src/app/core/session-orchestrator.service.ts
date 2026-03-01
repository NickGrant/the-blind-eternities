import { Inject, Injectable } from "@angular/core";
import { DEV_MODE } from "./dev-mode";
import { DeckService, DeckValidationError } from "./deck.service";
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

  /**
   * Injects system-sourced payloads before reducer handling.
   */
  private prepareIntent(current: ReturnType<SessionStore["state"]>, intent: DomainIntent): DomainIntent {
    if (intent.type !== "domain/start_session") return intent;

    return {
      ...intent,
      initialDeck: this.deckService.createInitialDeck({
        atMs: intent.atMs,
        seed: current.rng.seed,
        includedSetCodes: intent.includedSetCodes,
      }),
    };
  }

  /**
   * Applies a domain intent and commits resulting state transitions.
   */
  dispatch(intent: DomainIntent): void {
    const current = this.store.state();
    let preparedIntent: DomainIntent = intent;

    if (intent.type === "domain/start_session") {
      try {
        preparedIntent = this.prepareIntent(current, intent);
        this.fatalErrorStore.clear();
      } catch (err) {
        if (err instanceof DeckValidationError) {
          this.fatalErrorStore.set({
            code: "SESSION_VALIDATION_FAILED",
            message: err.message,
          });
          return;
        }

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

    let finalState = next;
    let finalStateIntentTime = preparedIntent.atMs;

    if (preparedIntent.type === "domain/start_session" && next.fsm.state === "BOOTSTRAP_REVEAL") {
      const bootstrapIntent: DomainIntent = {
        type: "domain/bootstrap_reveal_complete",
        atMs: preparedIntent.atMs + 1,
      };
      finalState = reduceSessionState(next, bootstrapIntent);
      finalStateIntentTime = bootstrapIntent.atMs;
    }

    if (preparedIntent.type === "domain/roll_die" && finalState.fsm.state === "ROLLING") {
      const outcome = this.dieService.roll({
        atMs: finalStateIntentTime,
        seed: finalState.rng.seed,
        rollCount: finalState.rng.rollCount,
      });

      const resolvedIntent: DomainIntent = {
        type: "domain/roll_resolved",
        atMs: finalStateIntentTime,
        outcome,
      };

      const resolved = reduceSessionState(finalState, resolvedIntent);
      finalState = resolved;
    }

    if (preparedIntent.type === "domain/confirm_move" && finalState.fsm.state === "MOVING") {
      const completedIntent: DomainIntent = {
        type: "domain/movement_complete",
        atMs: finalStateIntentTime + 1,
      };
      finalState = reduceSessionState(finalState, completedIntent);
    }

    if (finalState !== current) {
      this.store.setState(finalState);
    }
  }

  /**
   * Forces a deterministic debug roll outcome.
   */
  debugRollForced(outcome: "chaos" | "planeswalk"): void {
    if (!this.devMode) return;
    this.dispatch({
      type: "domain/debug_force_roll",
      atMs: Date.now(),
      outcome,
    });
  }

  /**
   * Reveals all currently hidden cards for debugging.
   */
  debugRevealAllCards(): void {
    if (!this.devMode) return;
    this.dispatch({
      type: "domain/debug_reveal_all",
      atMs: Date.now(),
    });
  }

  /**
   * Starts a session from setup when debug mode is enabled.
   */
  debugStartSession(): void {
    if (!this.devMode) return;
    if (this.store.state().fsm.state !== "SETUP") return;

    this.dispatch({ type: "domain/start_session", atMs: Date.now() });
  }

  /**
   * Resets state and immediately starts a fresh debug session.
   */
  debugRestartSession(): void {
    if (!this.devMode) return;
    const atMs = Date.now();

    this.dispatch({ type: "domain/restart_session", atMs });
    this.dispatch({ type: "domain/start_session", atMs: atMs + 1 });
  }
}
