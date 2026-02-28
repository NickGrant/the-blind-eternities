import { signal } from "@angular/core";
import { describe, expect, it, vi } from "vitest";

import { ControlBarComponent } from "./control-bar.component";
import type { SessionStore } from "../core/session.store";
import type { SessionOrchestrator } from "../core/session-orchestrator.service";
import { createNewSessionState } from "../../state/session.factory";
import type { DomainIntent } from "../../state/intents.types";

describe("ControlBarComponent (class-only)", () => {
  it("dispatches roll_die when requested", () => {
    const initial = createNewSessionState({ atMs: 1 });
    initial.fsm.state = "IDLE";

    const _state = signal(initial);
    const storeMock: Pick<SessionStore, "state"> = {
      state: _state.asReadonly(),
    };
    const dispatchMock = vi.fn<(intent: DomainIntent) => void>();
    const orchestratorMock: Pick<SessionOrchestrator, "dispatch"> = {
      dispatch: dispatchMock,
    };

    const cmp = new ControlBarComponent(
      orchestratorMock as SessionOrchestrator,
      storeMock as SessionStore
    );

    cmp.dispatch("domain/roll_die");

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock.mock.calls[0][0].type).toBe("domain/roll_die");
  });
});

