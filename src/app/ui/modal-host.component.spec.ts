import { signal } from "@angular/core";
import { describe, expect, it, vi } from "vitest";

import { ModalHostComponent } from "./modal-host.component";
import type { SessionOrchestrator } from "../core/session-orchestrator.service";
import type { SessionStore } from "../core/session.store";
import { DeckService } from "../core/deck.service";
import { createNewSessionState } from "../../state/session.factory";
import type { DomainIntent } from "../../state/intents.types";
import cardsCatalog from "../../assets/cards.json";

function createDeckService(): DeckService {
  const service = new DeckService();
  service.hydrateCatalog(cardsCatalog);
  return service;
}

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
      createDeckService()
    );

    cmp.closeActiveModal();

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    const arg = dispatchMock.mock.calls[0][0];
    expect(arg.type).toBe("domain/close_modal");
    if (arg.type === "domain/close_modal") {
      expect(arg.modalId).toBe("m1");
    }
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
      createDeckService()
    );

    expect(cmp.modalTitle()).toBe("Akoum");
    expect(cmp.modalBodyHtml()).toContain("Whenever chaos ensues");
  });

  it("normalizes carriage-return line breaks in modal text with stronger spacing", () => {
    const initial = createNewSessionState({ atMs: 10 });
    initial.modal.active = {
      id: "m2b",
      type: "PLANE",
      planeId: "plane-akoum",
      body: "Line one\r\nLine two\rLine three",
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
      createDeckService()
    );

    expect(cmp.modalBodyHtml()).toBe("Line one<br /><br />Line two<br /><br />Line three");
  });

  it("uses phenomenon metadata for modal body and art when available", () => {
    const initial = createNewSessionState({ atMs: 10 });
    initial.modal.active = {
      id: "m2c",
      type: "PHENOMENON",
      planeId: "phenomenon-chaotic-aether",
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
      createDeckService()
    );

    expect(cmp.modalBodyHtml()).toContain("encounter Chaotic Aether");
    expect(cmp.modalArtUrl()).toContain("assets/plane-art/phenomenon-chaotic-aether.jpg");
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
      createDeckService()
    );

    cmp.onDocumentKeydown(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    const arg = dispatchMock.mock.calls[0][0];
    expect(arg.type).toBe("domain/close_modal");
    if (arg.type === "domain/close_modal") {
      expect(arg.modalId).toBe("m3");
    }
  });

  it("updates modal offset while dragging non-button modal surface", () => {
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
      createDeckService()
    );

    cmp.onModalPointerDown({
      button: 0,
      pointerId: 11,
      clientX: 100,
      clientY: 100,
      target: { closest: () => null },
      preventDefault: vi.fn(),
    } as unknown as PointerEvent);
    expect(cmp.isDragging()).toBe(true);

    cmp.onPointerMove({
      pointerId: 11,
      clientX: 130,
      clientY: 120,
    } as PointerEvent);
    cmp.onPointerUp({ pointerId: 11 } as PointerEvent);

    expect(cmp.isDragging()).toBe(false);
    expect(cmp.modalOffset()).toEqual({ x: 30, y: 20 });
    expect(cmp.modalOffsetX()).toBe("30px");
    expect(cmp.modalOffsetY()).toBe("20px");
  });

  it("does not start drag when pointerdown originates from button", () => {
    const initial = createNewSessionState({ atMs: 10 });
    initial.modal.active = {
      id: "m4b",
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
      createDeckService()
    );

    cmp.onModalPointerDown({
      button: 0,
      pointerId: 21,
      clientX: 100,
      clientY: 100,
      target: { closest: () => ({}) },
      preventDefault: vi.fn(),
    } as unknown as PointerEvent);
    expect(cmp.isDragging()).toBe(false);

    cmp.onPointerMove({
      pointerId: 21,
      clientX: 140,
      clientY: 120,
    } as PointerEvent);

    expect(cmp.modalOffset()).toEqual({ x: 0, y: 0 });
  });

  it("clamps modal drag to viewport bounds", () => {
    const initial = createNewSessionState({ atMs: 10 });
    initial.modal.active = {
      id: "m5",
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
      createDeckService()
    );

    (cmp as unknown as { modalPanel: { nativeElement: HTMLElement } }).modalPanel = {
      nativeElement: {
        getBoundingClientRect: () =>
          ({
            left: 5,
            top: 5,
            right: 400,
            bottom: 300,
          }) as DOMRect,
      } as HTMLElement,
    };

    cmp.onModalPointerDown({
      button: 0,
      pointerId: 12,
      clientX: 100,
      clientY: 100,
      target: { closest: () => null },
      preventDefault: vi.fn(),
    } as unknown as PointerEvent);

    cmp.onPointerMove({
      pointerId: 12,
      clientX: 80,
      clientY: 80,
    } as PointerEvent);

    expect(cmp.modalOffset()).toEqual({ x: -5, y: -5 });
  });
});
