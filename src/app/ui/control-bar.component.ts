import { Component, computed, signal } from "@angular/core";
import { DeckService } from "../core/deck.service";
import { SessionOrchestrator } from "../core/session-orchestrator.service";
import { SessionStore } from "../core/session.store";

@Component({
  selector: "app-control-bar",
  standalone: true,
  template: `
    <div class="controlBar">
      <div class="status">State: {{ fsmState() }}</div>

      @if (fsmState() === "SETUP") {
        <div class="setPicker">
          <div class="setPickerTitle">Deck Sets</div>
          <div class="setOptions">
            @for (set of planeSets(); track set.code) {
              <label>
                <input
                  type="checkbox"
                  [checked]="isSetSelected(set.code)"
                  (change)="toggleSet(set.code)"
                />
                {{ set.label }} ({{ set.code }}) - {{ set.count }}
              </label>
            }
          </div>
        </div>
        <button type="button" (click)="startSession()" [disabled]="!canStartSession()">
          Start Session
        </button>
        <span class="hint">Playable planes from selection: {{ selectedPlayableCount() }} (minimum {{ minimumSessionPlanes }}).</span>
      }

      @if (fsmState() === "IDLE") {
        <button type="button" (click)="dispatch('domain/roll_die')">Roll Die</button>
      }

      @if (fsmState() === "AWAIT_MOVE") {
        <button type="button" class="secondary" (click)="dispatch('domain/cancel_move')">Cancel Move</button>
        <span class="hint">Click a highlighted plane to select movement.</span>
      }

      @if (fsmState() === "CONFIRM_MOVE") {
        <button type="button" (click)="dispatch('domain/confirm_move')">Confirm Move</button>
        <button type="button" class="secondary" (click)="dispatch('domain/cancel_move')">Back</button>
      }

      @if (fsmState() === "ERROR") {
        <button type="button" (click)="dispatch('domain/restart_session')">Restart Session</button>
      }

      @if (fsmState() !== "SETUP") {
        <button type="button" class="secondary" (click)="quitSession()">Quit Session</button>
      }
    </div>
  `,
  styles: [
    `
      .controlBar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        min-height: 42px;
      }
      .status {
        font-size: 12px;
        color: #4a556b;
        padding: 4px 8px;
        border: 1px solid #dce2ea;
        border-radius: 999px;
        background: #f7f9fb;
      }
      .hint {
        font-size: 12px;
        color: #5f6c84;
      }
      .setPicker {
        display: grid;
        gap: 6px;
        padding: 8px;
        border: 1px solid #dce2ea;
        border-radius: 8px;
        background: #f7f9fb;
      }
      .setPickerTitle {
        font-size: 12px;
        font-weight: 700;
        color: #354155;
      }
      .setOptions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        font-size: 12px;
      }
      .setOptions label {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      button {
        padding: 8px 12px;
        border: 1px solid #c6d0df;
        border-radius: 8px;
        background: #fff;
        cursor: pointer;
      }
      button.secondary {
        background: #f6f8fb;
      }
    `,
  ],
})
/**
 * Renders primary session controls and pre-session set selection.
 */
export class ControlBarComponent {
  readonly state;
  readonly fsmState = computed(() => this.state().fsm.state);
  readonly planeSets;
  readonly minimumSessionPlanes: number;
  readonly selectedSetCodes = computed(() => [...this.selectedSets()].sort());
  readonly selectedPlayableCount = computed(() => this.deckService.countPlayablePlanesForSets(this.selectedSetCodes()));
  readonly canStartSession = computed(() => this.selectedPlayableCount() >= this.minimumSessionPlanes);
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
    const defaults = sets.filter((s) => s.isPlanechaseDefault).map((s) => s.code);
    const initial = defaults.length > 0 ? defaults : sets.map((s) => s.code);
    this.selectedSets.set(new Set(initial));
  }

  isSetSelected(code: string): boolean {
    return this.selectedSets().has(code);
  }

  /**
   * Toggles a set selection while enforcing at least one selected option.
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
   */
  startSession(): void {
    if (!this.canStartSession()) return;
    this.orchestrator.dispatch({
      type: "domain/start_session",
      atMs: Date.now(),
      includedSetCodes: this.selectedSetCodes(),
    });
  }

  /**
   * Quits current play and returns to setup selection state.
   */
  quitSession(): void {
    this.orchestrator.dispatch({
      type: "domain/restart_session",
      atMs: Date.now(),
    });
  }

  /**
   * Dispatches standard control-bar intents.
   */
  dispatch(type: "domain/roll_die" | "domain/confirm_move" | "domain/cancel_move" | "domain/restart_session"): void {
    this.orchestrator.dispatch({ type, atMs: Date.now() });
  }
}
