import { signal } from "@angular/core";
import { describe, expect, it, vi } from "vitest";

import { ControlBarComponent } from "./control-bar.component";
import type { SessionStore } from "../core/session.store";
import type { SessionOrchestrator } from "../core/session-orchestrator.service";
import { createNewSessionState } from "../../state/session.factory";
import type { DomainIntent } from "../../state/intents.types";
import type { DeckService } from "../core/deck.service";

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
    const deckMock: Pick<DeckService, "listPlaneSetOptions" | "countPlayablePlanesForSets"> = {
      listPlaneSetOptions: () => [{ code: "OPCA", label: "Planechase Anthology", count: 10, isPlanechaseDefault: true }],
      countPlayablePlanesForSets: () => 10,
    };

    const cmp = new ControlBarComponent(
      orchestratorMock as SessionOrchestrator,
      storeMock as SessionStore,
      deckMock as DeckService
    );

    cmp.dispatch("domain/roll_die");

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock.mock.calls[0][0].type).toBe("domain/roll_die");
  });

  it("dispatches start_session with selected set filters", () => {
    const initial = createNewSessionState({ atMs: 1 });
    initial.fsm.state = "SETUP";

    const _state = signal(initial);
    const storeMock: Pick<SessionStore, "state"> = {
      state: _state.asReadonly(),
    };
    const dispatchMock = vi.fn<(intent: DomainIntent) => void>();
    const orchestratorMock: Pick<SessionOrchestrator, "dispatch"> = {
      dispatch: dispatchMock,
    };
    const deckMock: Pick<DeckService, "listPlaneSetOptions" | "countPlayablePlanesForSets"> = {
      listPlaneSetOptions: () => [{ code: "OPCA", label: "Planechase Anthology", count: 10, isPlanechaseDefault: true }],
      countPlayablePlanesForSets: () => 10,
    };

    const cmp = new ControlBarComponent(
      orchestratorMock as SessionOrchestrator,
      storeMock as SessionStore,
      deckMock as DeckService
    );

    cmp.startSession();

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    const intent = dispatchMock.mock.calls[0][0];
    expect(intent.type).toBe("domain/start_session");
    if (intent.type === "domain/start_session") {
      expect(intent.includedSetCodes).toEqual(["OPCA"]);
    }
  });

  it("does not start session when selected sets provide fewer than 5 planes", () => {
    const initial = createNewSessionState({ atMs: 1 });
    initial.fsm.state = "SETUP";

    const _state = signal(initial);
    const storeMock: Pick<SessionStore, "state"> = {
      state: _state.asReadonly(),
    };
    const dispatchMock = vi.fn<(intent: DomainIntent) => void>();
    const orchestratorMock: Pick<SessionOrchestrator, "dispatch"> = {
      dispatch: dispatchMock,
    };
    const deckMock: Pick<DeckService, "listPlaneSetOptions" | "countPlayablePlanesForSets"> = {
      listPlaneSetOptions: () => [{ code: "OPCA", label: "Planechase Anthology", count: 4, isPlanechaseDefault: true }],
      countPlayablePlanesForSets: () => 4,
    };

    const cmp = new ControlBarComponent(
      orchestratorMock as SessionOrchestrator,
      storeMock as SessionStore,
      deckMock as DeckService
    );

    cmp.startSession();

    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it("dispatches restart_session when quitting an active session", () => {
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
    const deckMock: Pick<DeckService, "listPlaneSetOptions" | "countPlayablePlanesForSets"> = {
      listPlaneSetOptions: () => [{ code: "OPCA", label: "Planechase Anthology", count: 10, isPlanechaseDefault: true }],
      countPlayablePlanesForSets: () => 10,
    };

    const cmp = new ControlBarComponent(
      orchestratorMock as SessionOrchestrator,
      storeMock as SessionStore,
      deckMock as DeckService
    );

    cmp.quitSession();

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock.mock.calls[0][0].type).toBe("domain/restart_session");
  });
});
