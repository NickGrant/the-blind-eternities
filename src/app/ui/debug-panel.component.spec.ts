import { signal } from "@angular/core";
import { describe, it, expect, vi } from "vitest";

import { DebugPanelComponent } from "./debug-panel.component";
import { DeckService } from "../core/deck.service";
import type { SessionStore } from "../core/session.store";
import type { SessionOrchestrator } from "../core/session-orchestrator.service";
import { createNewSessionState } from "../../state/session.factory";

describe("DebugPanelComponent (class-only)", () => {
  it("dispatches a start_session intent", () => {
    const initial = createNewSessionState({ atMs: 123 });
    initial.fsm.state = "SETUP";

    const _state = signal(initial);

    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next as any),
    };

    const orchestratorMock: Pick<SessionOrchestrator, "dispatch"> = {
      dispatch: vi.fn(),
    };

    const cmp = new DebugPanelComponent(
      true, // devMode
      orchestratorMock as SessionOrchestrator,
      storeMock as SessionStore,
      new DeckService(),
    );

    // This is what the UI button ultimately does; test the behavior directly.
    cmp.dispatch("domain/start_session");

    expect(orchestratorMock.dispatch).toHaveBeenCalledTimes(1);
    const arg = (orchestratorMock.dispatch as any).mock.calls[0][0];
    expect(arg.type).toBe("domain/start_session");
  });
});
