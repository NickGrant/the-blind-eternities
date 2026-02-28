import { Injectable, signal } from "@angular/core";
import type { SessionState } from "../../state/session.types";
import { createNewSessionState } from "../../state/session.factory";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: "root" })
export class SessionStore {
  private readonly _state = signal<SessionState>(
    createNewSessionState({
      atMs: Date.now(),
      seed: environment.dev ? environment.debugSeed : undefined,
    })
  );

  readonly state = this._state.asReadonly();

  /** Intended for SessionOrchestrator only. */
  setState(next: SessionState): void {
    this._state.set(next);
  }
}
