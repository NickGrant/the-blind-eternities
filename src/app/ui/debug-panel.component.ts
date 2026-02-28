import { Component, Inject, computed, signal } from "@angular/core";

import { DEV_MODE } from "../core/dev-mode";
import { SessionOrchestrator } from "../core/session-orchestrator.service";
import { SessionStore } from "../core/session.store";

@Component({
  selector: "app-debug-panel",
  standalone: true,
  template: `
    @if (devMode) {
      <div class="debugPanel" [class.isCollapsed]="collapsed()">
        <div class="debugHeader">
          <h2>Debug Panel</h2>
          <button type="button" class="toggle" (click)="toggle()">
            {{ collapsed() ? "Expand" : "Collapse" }}
          </button>
        </div>

        @if (!collapsed()) {
          <div class="debugBody">
            <button type="button" (click)="rollRandom()" [disabled]="fsmState() !== 'IDLE'">
              Roll Dice (Random)
            </button>
            <button type="button" (click)="rollChaos()" [disabled]="fsmState() !== 'IDLE'">
              Roll Dice (Chaos)
            </button>
            <button type="button" (click)="rollPlaneswalk()" [disabled]="fsmState() !== 'IDLE'">
              Roll Dice (Planechase)
            </button>
            <button type="button" (click)="showHiddenCards()" [disabled]="hiddenCount() === 0">
              Show Hidden Cards ({{ hiddenCount() }})
            </button>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      .debugPanel {
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        padding: 12px;
        display: grid;
        gap: 10px;
      }
      .debugHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      h2 {
        margin: 0;
        font-size: 14px;
      }
      .debugBody {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .toggle,
      button {
        padding: 8px 10px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        background: rgba(0, 0, 0, 0.18);
        color: inherit;
        cursor: pointer;
      }
      button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class DebugPanelComponent {
  readonly collapsed = signal(true);
  readonly state;
  readonly fsmState = computed(() => this.state().fsm.state);
  readonly hiddenCount = computed(
    () => Object.values(this.state().map.tilesByCoord).filter((tile) => !tile.isFaceUp).length
  );

  constructor(
    @Inject(DEV_MODE) public readonly devMode: boolean,
    private readonly orchestrator: SessionOrchestrator,
    private readonly sessionStore: SessionStore
  ) {
    this.state = this.sessionStore.state;
  }

  toggle(): void {
    this.collapsed.update((v) => !v);
  }

  rollRandom(): void {
    this.orchestrator.dispatch({ type: "domain/roll_die", atMs: Date.now() });
  }

  rollChaos(): void {
    this.orchestrator.debugRollForced("chaos");
  }

  rollPlaneswalk(): void {
    this.orchestrator.debugRollForced("planeswalk");
  }

  showHiddenCards(): void {
    this.orchestrator.debugRevealAllCards();
  }
}
