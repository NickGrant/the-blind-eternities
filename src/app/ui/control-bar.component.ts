import { Component, computed } from "@angular/core";
import { SessionOrchestrator } from "../core/session-orchestrator.service";
import { SessionStore } from "../core/session.store";

@Component({
  selector: "app-control-bar",
  standalone: true,
  template: `
    <div class="controlBar">
      <div class="status">State: {{ fsmState() }}</div>

      @if (fsmState() === "SETUP") {
        <button type="button" (click)="dispatch('domain/start_session')">Start Session</button>
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
    </div>
  `,
  styles: [
    `
      .controlBar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
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
export class ControlBarComponent {
  readonly state;
  readonly fsmState = computed(() => this.state().fsm.state);

  constructor(
    private readonly orchestrator: SessionOrchestrator,
    private readonly sessionStore: SessionStore
  ) {
    this.state = this.sessionStore.state;
  }

  dispatch(
    type:
      | "domain/start_session"
      | "domain/roll_die"
      | "domain/confirm_move"
      | "domain/cancel_move"
      | "domain/restart_session"
  ): void {
    this.orchestrator.dispatch({ type, atMs: Date.now() });
  }
}
