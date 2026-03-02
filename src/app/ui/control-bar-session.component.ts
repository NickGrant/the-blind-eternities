import { Component, EventEmitter, Input, Output } from "@angular/core";
import { DOMAIN_INTENT } from "../../state/intents.types";
import type { SessionState } from "../../state/session.types";

type SessionActionIntent =
  | typeof DOMAIN_INTENT.ROLL_DIE
  | typeof DOMAIN_INTENT.CONFIRM_MOVE
  | typeof DOMAIN_INTENT.CANCEL_MOVE
  | typeof DOMAIN_INTENT.RESTART_SESSION;

@Component({
  selector: "app-control-bar-session",
  standalone: true,
  templateUrl: "./control-bar-session.component.html",
  styleUrls: ["./control-bar-session.component.scss"],
})
/**
 * In-session controls rendered after setup.
 */
export class ControlBarSessionComponent {
  @Input() fsmState: SessionState["fsm"]["state"] = "SETUP";
  @Input() showRollButton = false;
  @Input() rollButtonDisabled = false;
  @Input() isQuitConfirming = false;

  @Output() intent = new EventEmitter<SessionActionIntent>();
  @Output() quitSession = new EventEmitter<void>();
  @Output() cancelQuitSession = new EventEmitter<void>();

  protected readonly DOMAIN_INTENT = DOMAIN_INTENT;

  emitAction(action: SessionActionIntent): void {
    this.intent.emit(action);
  }
}
