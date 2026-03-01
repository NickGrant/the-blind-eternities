import { Component, Input, computed, signal } from "@angular/core";
import { DeckService } from "../core/deck.service";
import { SessionOrchestrator } from "../core/session-orchestrator.service";
import { SessionStore } from "../core/session.store";
import { DOMAIN_INTENT } from "../../state/intents.types";

@Component({
  selector: "app-control-bar",
  standalone: true,
  templateUrl: "./control-bar.component.html",
  styleUrls: ["./control-bar.component.scss"],
})
/**
 * Renders primary session controls and pre-session set selection.
 */
export class ControlBarComponent {
  @Input() rollToastVisible = false;

  protected readonly DOMAIN_INTENT = DOMAIN_INTENT;
  readonly state;
  readonly fsmState = computed(() => this.state().fsm.state);
  readonly planeSets;
  readonly minimumSessionPlanes: number;
  readonly selectedSetCodes = computed(() => [...this.selectedSets()].sort());
  readonly selectedPlayableCount = computed(() => this.deckService.countPlayablePlanesForSets(this.selectedSetCodes()));
  readonly canStartSession = computed(() => this.selectedPlayableCount() >= this.minimumSessionPlanes);
  readonly showRollButton = computed(() => this.fsmState() === "IDLE" || this.rollToastVisible);
  readonly rollButtonDisabled = computed(() => this.rollToastVisible || this.fsmState() !== "IDLE");
  readonly isQuitConfirming = signal(false);
  private readonly selectedSets = signal<Set<string>>(new Set());

  constructor(
    private readonly orchestrator: SessionOrchestrator,
    private readonly sessionStore: SessionStore,
    private readonly deckService: DeckService
  ) {
    this.state = this.sessionStore.state;
    this.minimumSessionPlanes = this.deckService.getMinimumSessionPlanes();
    const sets = this.deckService.listPlaneSetOptions();
    this.planeSets = signal(sets).asReadonly();
    const preferredDefault = this.deckService.getPreferredDefaultSetCode();
    const hasPreferredDefault = preferredDefault ? sets.some((s) => s.code === preferredDefault) : false;
    const initial = hasPreferredDefault && preferredDefault ? [preferredDefault] : sets.slice(0, 1).map((s) => s.code);
    this.selectedSets.set(new Set(initial));
  }

  isSetSelected(code: string): boolean {
    return this.selectedSets().has(code);
  }

  /**
   * Toggles a set selection while enforcing at least one selected option.
   * @param code Plane set code to toggle.
   * @returns void
   */
  toggleSet(code: string): void {
    this.selectedSets.update((current) => {
      const next = new Set(current);
      if (next.has(code)) {
        if (next.size <= 1) return current;
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }

  /**
   * Dispatches a filtered start-session intent when selection is valid.
   * @returns void
   */
  startSession(): void {
    if (!this.canStartSession()) return;
    this.isQuitConfirming.set(false);
    this.orchestrator.dispatch({
      type: DOMAIN_INTENT.START_SESSION,
      atMs: Date.now(),
      includedSetCodes: this.selectedSetCodes(),
    });
  }

  /**
   * Quits current play and returns to setup selection state.
   * @returns void
   */
  quitSession(): void {
    if (!this.isQuitConfirming()) {
      this.isQuitConfirming.set(true);
      return;
    }
    this.isQuitConfirming.set(false);
    this.orchestrator.dispatch({
      type: DOMAIN_INTENT.RESTART_SESSION,
      atMs: Date.now(),
    });
  }

  cancelQuitSession(): void {
    this.isQuitConfirming.set(false);
  }

  /**
   * Dispatches standard control-bar intents.
   * @param type Domain intent type dispatched by control actions.
   * @returns void
   */
  dispatch(
    type:
      | typeof DOMAIN_INTENT.ROLL_DIE
      | typeof DOMAIN_INTENT.CONFIRM_MOVE
      | typeof DOMAIN_INTENT.CANCEL_MOVE
      | typeof DOMAIN_INTENT.RESTART_SESSION
  ): void {
    this.isQuitConfirming.set(false);
    this.orchestrator.dispatch({ type, atMs: Date.now() });
  }
}
