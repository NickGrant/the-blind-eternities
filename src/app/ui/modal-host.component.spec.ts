import { signal } from "@angular/core";
import { describe, expect, it, vi } from "vitest";

import { ModalHostComponent } from "./modal-host.component";
import type { SessionOrchestrator } from "../core/session-orchestrator.service";
import type { SessionStore } from "../core/session.store";
import { DeckService } from "../core/deck.service";
import { createNewSessionState } from "../../state/session.factory";
import type { DomainIntent } from "../../state/intents.types";

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
      setState: (next) => _state.set(next),
    };

    const dispatchMock = vi.fn<(intent: DomainIntent) => void>();
    const orchestratorMock: Pick<SessionOrchestrator, "dispatch"> = {
      dispatch: dispatchMock,
    };

    const cmp = new ModalHostComponent(
      storeMock as SessionStore,
      orchestratorMock as SessionOrchestrator,
      new DeckService()
    );

    cmp.closeActiveModal();

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    const arg = dispatchMock.mock.calls[0][0];
    expect(arg.type).toBe("domain/close_modal");
    expect(arg.modalId).toBe("m1");
  });

  it("uses plane metadata for title/body when modal omits explicit copy", () => {
    const initial = createNewSessionState({ atMs: 10 });
    initial.modal.active = {
      id: "m2",
      type: "PLANE",
      planeId: "plane-akoum",
      resumeToState: "IDLE",
    };
    initial.modal.isOpen = true;

    const _state = signal(initial);
    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next),
    };
    const orchestratorMock: Pick<SessionOrchestrator, "dispatch"> = {
      dispatch: vi.fn(),
    };

    const cmp = new ModalHostComponent(
      storeMock as SessionStore,
      orchestratorMock as SessionOrchestrator,
      new DeckService()
    );

    expect(cmp.modalTitle()).toBe("Akoum");
    expect(cmp.modalBody()).toContain("Whenever chaos ensues");
  });

  it("closes modal on Escape key", () => {
    const initial = createNewSessionState({ atMs: 10 });
    initial.modal.active = {
      id: "m3",
      type: "PLANE",
      planeId: "plane-akoum",
      resumeToState: "IDLE",
    };
    initial.modal.isOpen = true;

    const _state = signal(initial);
    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next),
    };
    const dispatchMock = vi.fn<(intent: DomainIntent) => void>();
    const orchestratorMock: Pick<SessionOrchestrator, "dispatch"> = {
      dispatch: dispatchMock,
    };

    const cmp = new ModalHostComponent(
      storeMock as SessionStore,
      orchestratorMock as SessionOrchestrator,
      new DeckService()
    );

    cmp.onDocumentKeydown(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock.mock.calls[0][0].type).toBe("domain/close_modal");
    expect(dispatchMock.mock.calls[0][0].modalId).toBe("m3");
  });

  it("updates modal offset while dragging header handle", () => {
    const initial = createNewSessionState({ atMs: 10 });
    initial.modal.active = {
      id: "m4",
      type: "PLANE",
      planeId: "plane-akoum",
      resumeToState: "IDLE",
    };
    initial.modal.isOpen = true;

    const _state = signal(initial);
    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next),
    };
    const orchestratorMock: Pick<SessionOrchestrator, "dispatch"> = {
      dispatch: vi.fn(),
    };

    const cmp = new ModalHostComponent(
      storeMock as SessionStore,
      orchestratorMock as SessionOrchestrator,
      new DeckService()
    );

    cmp.onDragHandleDown({
      button: 0,
      pointerId: 11,
      clientX: 100,
      clientY: 100,
      preventDefault: vi.fn(),
    } as unknown as PointerEvent);

    cmp.onPointerMove({
      pointerId: 11,
      clientX: 130,
      clientY: 120,
    } as PointerEvent);
    cmp.onPointerUp({ pointerId: 11 } as PointerEvent);

    expect(cmp.modalOffset()).toEqual({ x: 30, y: 20 });
    expect(cmp.modalOffsetX()).toBe("30px");
    expect(cmp.modalOffsetY()).toBe("20px");
  });
});
