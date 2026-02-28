import { Component, Inject, computed, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";

import { DEV_MODE } from "../core/dev-mode";
import { SessionOrchestrator } from "../core/session-orchestrator.service";
import { SessionStore } from "../core/session.store";
import { DeckService } from "../core/deck.service";
import type { DomainIntent, DieOutcome } from "../../state/intents.types";

@Component({
  selector: "app-debug-panel",
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (devMode) {
      <div class="debugPanel" [class.isCollapsed]="collapsed()">
        <div class="debugHeader">
          <div class="titleRow">
            <h2>Debug Panel</h2>
            <span class="pill">DEV</span>
          </div>

          <div class="headerRight">
            <div class="state">
              <span class="label">FSM</span>
              <span class="value">{{ fsmState() }}</span>
            </div>

            <button type="button" class="toggle" (click)="toggle()">
              {{ collapsed() ? "Expand" : "Collapse" }}
            </button>
          </div>
        </div>

        @if (!collapsed()) {
          <div class="debugBody">
            <div class="row">
              <button type="button" (click)="dispatch('domain/start_session')" [disabled]="fsmState() !== 'SETUP'">Start Session</button>
              <button type="button" (click)="dispatch('domain/bootstrap_reveal_complete')" [disabled]="fsmState() !== 'BOOTSTRAP_REVEAL'">
                Bootstrap Reveal Complete
              </button>
              <button type="button" (click)="dispatch('domain/roll_die')" [disabled]="fsmState() !== 'IDLE'">Roll Die</button>
            </div>

            <div class="row">
              <button type="button" (click)="dispatchRollResolved('blank')" [disabled]="fsmState() !== 'ROLLING'">Resolve: Blank</button>
              <button type="button" (click)="dispatchRollResolved('chaos')" [disabled]="fsmState() !== 'ROLLING'">Resolve: Chaos</button>
              <button type="button" (click)="dispatchRollResolved('planeswalk')" [disabled]="fsmState() !== 'ROLLING'">Resolve: Planeswalk</button>
            </div>

            <div class="row">
              <label>
                toCoord
                <input type="text" [(ngModel)]="toCoord" placeholder="e.g. 1,0" />
              </label>
              <button type="button" (click)="dispatchSelectPlane()" [disabled]="fsmState() !== 'AWAIT_MOVE'">Select Plane</button>
              <button type="button" (click)="dispatch('domain/confirm_move')" [disabled]="fsmState() !== 'CONFIRM_MOVE'">Confirm Move</button>
              <button type="button" (click)="dispatch('domain/cancel_move')" [disabled]="!canCancelMove()">Cancel Move</button>
              <button type="button" (click)="dispatch('domain/movement_complete')" [disabled]="fsmState() !== 'MOVING'">Movement Complete</button>
            </div>

            <div class="row">
              <button type="button" (click)="dispatchOpenPlaneModal()">Open Plane Modal</button>
              <label>
                modalId
                <input type="text" [(ngModel)]="modalId" placeholder="(optional)" />
              </label>
              <button type="button" (click)="dispatchCloseModal()" [disabled]="fsmState() !== 'MODAL_OPEN'">Close Modal</button>
            </div>

            <div class="row">
              <label>
                errorCode
                <input type="text" [(ngModel)]="errorCode" placeholder="E_TEST" />
              </label>
              <label>
                detail
                <input type="text" [(ngModel)]="errorDetail" placeholder="optional" />
              </label>
              <button type="button" (click)="dispatchFatalError()">Fatal Error</button>
              <button type="button" (click)="dispatch('domain/restart_session')" [disabled]="fsmState() !== 'ERROR'">Restart Session</button>
            </div>

            <div class="meta">
              <div><strong>lastIntent</strong>: {{ lastIntentSummary() }}</div>
              <div><strong>sessionId</strong>: {{ sessionId() }}</div>
              <div><strong>currentPlane</strong>: {{ currentPlaneLabel() }}</div>
            </div>

            <details class="json">
              <summary>SessionState JSON</summary>
              <pre>{{ stateJson() }}</pre>
            </details>
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
        display: block;
      }
      .debugHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .titleRow {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .pill {
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        opacity: 0.9;
      }
      .headerRight {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .state {
        display: flex;
        align-items: baseline;
        gap: 6px;
      }
      .state .label {
        opacity: 0.75;
        font-size: 12px;
      }
      .state .value {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      }
      .toggle {
        padding: 6px 10px;
      }
      .debugBody {
        margin-top: 12px;
        display: grid;
        gap: 10px;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      label {
        display: inline-flex;
        gap: 6px;
        align-items: center;
        font-size: 12px;
        opacity: 0.9;
      }
      input {
        width: 120px;
        padding: 6px 8px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(0, 0, 0, 0.25);
        color: inherit;
      }
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
      .meta {
        display: grid;
        gap: 4px;
        font-size: 12px;
        opacity: 0.9;
      }
      .json summary {
        cursor: pointer;
        font-size: 12px;
        opacity: 0.95;
      }
      pre {
        margin: 8px 0 0;
        max-height: 320px;
        overflow: auto;
        padding: 10px;
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.12);
        font-size: 12px;
      }
    `,
  ],
})
export class DebugPanelComponent {
  readonly collapsed = signal(false);

  // Simple inputs for intent payloads.
  toCoord = "1,0";
  modalId = "";
  errorCode = "E_TEST";
  errorDetail = "";

  readonly state;

  readonly fsmState = computed(() => this.state().fsm.state);
  readonly sessionId = computed(() => this.state().meta.sessionId);
  readonly currentPlaneLabel = computed(() => {
    const planeId = this.state().deck.currentPlaneId;
    const name = this.deckService.getPlaneName(planeId);
    return name ? `${name} (${planeId})` : (planeId ?? "(none)");
  });
  readonly lastIntentSummary = computed(() => {
    const li = this.state().fsm.context?.lastIntent;
    if (!li) return "(none)";
    return `${li.type} @ ${li.atMs}`;
  });

  readonly stateJson = computed(() => JSON.stringify(this.state(), null, 2));

  constructor(
    @Inject(DEV_MODE) public readonly devMode: boolean,
    private readonly orchestrator: SessionOrchestrator,
    private readonly sessionStore: SessionStore,
    private readonly deckService: DeckService,
  ) {
    this.state = this.sessionStore.state;
  }

  toggle(): void {
    this.collapsed.update((v) => !v);
  }

  canCancelMove(): boolean {
    const s = this.fsmState();
    return s === "AWAIT_MOVE" || s === "CONFIRM_MOVE";
  }

  dispatch(type: DomainIntentType): void {
    const atMs = Date.now();
    const intent: DomainIntent = { type, atMs } as DomainIntent;
    this.orchestrator.dispatch(intent);
  }

  dispatchRollResolved(outcome: DieOutcome): void {
    this.orchestrator.dispatch({ type: "domain/roll_resolved", atMs: Date.now(), outcome });
  }

  dispatchSelectPlane(): void {
    const toCoord = (this.toCoord || "").trim();
    this.orchestrator.dispatch({ type: "domain/select_plane", atMs: Date.now(), toCoord });
  }

  dispatchOpenPlaneModal(): void {
    const planeId = this.state().deck.currentPlaneId;
    const planeName = this.deckService.getPlaneName(planeId);

    this.orchestrator.dispatch({
      type: "domain/open_modal",
      atMs: Date.now(),
      modal: {
        id: `dbg_modal_${Date.now()}`,
        modalType: "PLANE",
        planeId,
        title: planeName ? `Debug: ${planeName}` : "Debug: Plane Modal",
        body: "Opened from Debug Panel.",
        resumeToState: this.state().fsm.state,
      },
    });
  }

  dispatchCloseModal(): void {
    const modalId = (this.modalId || "").trim();
    this.orchestrator.dispatch({ type: "domain/close_modal", atMs: Date.now(), modalId: modalId || undefined });
  }

  dispatchFatalError(): void {
    const code = (this.errorCode || "E_TEST").trim();
    const detail = (this.errorDetail || "").trim();
    this.orchestrator.dispatch({ type: "domain/fatal_error", atMs: Date.now(), code, detail: detail || undefined });
  }
}

type DomainIntentType =
  | "domain/start_session"
  | "domain/bootstrap_reveal_complete"
  | "domain/roll_die"
  | "domain/confirm_move"
  | "domain/cancel_move"
  | "domain/movement_complete"
  | "domain/restart_session";
