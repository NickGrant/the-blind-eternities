import { Injectable } from "@angular/core";
import { DevModeStore } from "./dev-mode";
import { DeckService, DeckValidationError } from "./deck.service";
import { DieService } from "./die.service";
import { FatalErrorStore } from "./fatal-error.store";
import { DOMAIN_INTENT, type DomainIntent } from "../../state/intents.types";
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
    private readonly devModeStore: DevModeStore,
  ) {}

  /**
   * Injects system-sourced payloads before reducer handling.
   * @param current Current immutable session state snapshot.
   * @param intent Incoming domain intent.
   * @returns Prepared intent with injected dependencies when required.
   */
  private prepareIntent(current: ReturnType<SessionStore["state"]>, intent: DomainIntent): DomainIntent {
    if (intent.type !== DOMAIN_INTENT.START_SESSION) return intent;

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
   * @param intent Domain intent to process through reducer/orchestration flow.
   * @returns void
   */
  dispatch(intent: DomainIntent): void {
    const current = this.store.state();
    let preparedIntent: DomainIntent = intent;

    if (intent.type === DOMAIN_INTENT.START_SESSION) {
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
          type: DOMAIN_INTENT.FATAL_ERROR,
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

    if (!handled && this.devModeStore.enabled()) {
      console.warn(
        `[FSM] Ignored intent "${preparedIntent.type}" in state "${current.fsm.state}"`,
        preparedIntent
      );
    }

    let finalState = next;
    let finalStateIntentTime = preparedIntent.atMs;

    if (preparedIntent.type === DOMAIN_INTENT.START_SESSION && next.fsm.state === "BOOTSTRAP_REVEAL") {
      const bootstrapIntent: DomainIntent = {
        type: DOMAIN_INTENT.BOOTSTRAP_REVEAL_COMPLETE,
        atMs: preparedIntent.atMs + 1,
      };
      finalState = reduceSessionState(next, bootstrapIntent);
      finalStateIntentTime = bootstrapIntent.atMs;
    }

    if (preparedIntent.type === DOMAIN_INTENT.ROLL_DIE && finalState.fsm.state === "ROLLING") {
      const outcome = this.dieService.roll({
        atMs: finalStateIntentTime,
        seed: finalState.rng.seed,
        rollCount: finalState.rng.rollCount,
      });

      const resolvedIntent: DomainIntent = {
        type: DOMAIN_INTENT.ROLL_RESOLVED,
        atMs: finalStateIntentTime,
        outcome,
      };

      const resolved = reduceSessionState(finalState, resolvedIntent);
      finalState = resolved;
    }

    if (preparedIntent.type === DOMAIN_INTENT.CONFIRM_MOVE && finalState.fsm.state === "MOVING") {
      const completedIntent: DomainIntent = {
        type: DOMAIN_INTENT.MOVEMENT_COMPLETE,
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
   * @param outcome Forced non-blank die outcome.
   * @returns void
   */
  debugRollForced(outcome: "chaos" | "planeswalk"): void {
    if (!this.devModeStore.enabled()) return;
    this.dispatch({
      type: DOMAIN_INTENT.DEBUG_FORCE_ROLL,
      atMs: Date.now(),
      outcome,
    });
  }

  /**
   * Reveals all currently hidden cards for debugging.
   * @returns void
   */
  debugRevealAllCards(): void {
    if (!this.devModeStore.enabled()) return;
    this.dispatch({
      type: DOMAIN_INTENT.DEBUG_REVEAL_ALL,
      atMs: Date.now(),
    });
  }

  /**
   * Starts a session from setup when debug mode is enabled.
   * @returns void
   */
  debugStartSession(): void {
    if (!this.devModeStore.enabled()) return;
    if (this.store.state().fsm.state !== "SETUP") return;

    this.dispatch({ type: DOMAIN_INTENT.START_SESSION, atMs: Date.now() });
  }

  /**
   * Resets state and immediately starts a fresh debug session.
   * @returns void
   */
  debugRestartSession(): void {
    if (!this.devModeStore.enabled()) return;
    const atMs = Date.now();

    this.dispatch({ type: DOMAIN_INTENT.RESTART_SESSION, atMs });
    this.dispatch({ type: DOMAIN_INTENT.START_SESSION, atMs: atMs + 1 });
  }
}
