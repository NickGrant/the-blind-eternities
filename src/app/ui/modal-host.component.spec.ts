import { signal } from "@angular/core";
import { describe, expect, it, vi } from "vitest";

import { ModalHostComponent } from "./modal-host.component";
import type { SessionOrchestrator } from "../core/session-orchestrator.service";
import type { SessionStore } from "../core/session.store";
import { DeckService } from "../core/deck.service";
import { createNewSessionState } from "../../state/session.factory";

describe("ModalHostComponent (class-only)", () => {
  it("dispatches close_modal for active modal", () => {
    const initial = createNewSessionState({ atMs: 10 });
    initial.modal.active = {
      id: "m1",
      type: "PLANE",
      planeId: "plane-akoum",
      title: "Akoum",
      resumeToState: "IDLE",
    };
    initial.modal.isOpen = true;

    const _state = signal(initial);

    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next as any),
    };

    const orchestratorMock: Pick<SessionOrchestrator, "dispatch"> = {
      dispatch: vi.fn(),
    };

    const cmp = new ModalHostComponent(
      storeMock as SessionStore,
      orchestratorMock as SessionOrchestrator,
      new DeckService()
    );

    cmp.closeActiveModal();

    expect(orchestratorMock.dispatch).toHaveBeenCalledTimes(1);
    const arg = (orchestratorMock.dispatch as any).mock.calls[0][0];
    expect(arg.type).toBe("domain/close_modal");
    expect(arg.modalId).toBe("m1");
  });
});

