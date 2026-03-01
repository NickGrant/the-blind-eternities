import { Component, computed, signal } from "@angular/core";

import { DevModeStore } from "../core/dev-mode";
import { SessionOrchestrator } from "../core/session-orchestrator.service";
import { SessionStore } from "../core/session.store";
import { DOMAIN_INTENT } from "../../state/intents.types";

@Component({
  selector: "app-debug-panel",
  standalone: true,
  templateUrl: "./debug-panel.component.html",
  styleUrls: ["./debug-panel.component.scss"],
})
/**
 * Development-only panel for deterministic/session diagnostics and debug actions.
 */
export class DebugPanelComponent {
  readonly collapsed = signal(true);
  readonly devMode;
  readonly state;
  readonly fsmState = computed(() => this.state().fsm.state);
  readonly hiddenCount = computed(
    () => Object.values(this.state().map.tilesByCoord).filter((tile) => !tile.isFaceUp).length
  );
  readonly drawPile = computed(() => this.state().deck.drawPile);
  readonly discardPile = computed(() => this.state().deck.discardPile);

  constructor(
    private readonly devModeStore: DevModeStore,
    private readonly orchestrator: SessionOrchestrator,
    private readonly sessionStore: SessionStore
  ) {
    this.devMode = this.devModeStore.enabled;
    this.state = this.sessionStore.state;
  }

  /**
   * Expands/collapses the panel.
   * @returns void
   */
  toggle(): void {
    this.collapsed.update((v) => !v);
  }

  /**
   * Dispatches a standard random die roll.
   * @returns void
   */
  rollRandom(): void {
    this.orchestrator.dispatch({ type: DOMAIN_INTENT.ROLL_DIE, atMs: Date.now() });
  }

  /**
   * Debug shortcut to start session from setup.
   * @returns void
   */
  startSession(): void {
    this.orchestrator.debugStartSession();
  }

  /**
   * Debug shortcut to restart and re-bootstrap a session.
   * @returns void
   */
  restartSession(): void {
    this.orchestrator.debugRestartSession();
  }

  /**
   * Forces chaos result.
   * @returns void
   */
  rollChaos(): void {
    this.orchestrator.debugRollForced("chaos");
  }

  /**
   * Forces planeswalk result.
   * @returns void
   */
  rollPlaneswalk(): void {
    this.orchestrator.debugRollForced("planeswalk");
  }

  /**
   * Reveals all hidden cards.
   * @returns void
   */
  showHiddenCards(): void {
    this.orchestrator.debugRevealAllCards();
  }

  /**
   * Turns off all dev-mode-only behavior until next page reload.
   * @returns void
   */
  disableDevMode(): void {
    this.devModeStore.disableUntilReload();
  }
}

