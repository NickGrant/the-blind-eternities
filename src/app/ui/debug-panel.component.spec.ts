import { signal } from "@angular/core";
import { describe, it, expect, vi } from "vitest";

import { DebugPanelComponent } from "./debug-panel.component";
import type { SessionStore } from "../core/session.store";
import type { SessionOrchestrator } from "../core/session-orchestrator.service";
import { createNewSessionState } from "../../state/session.factory";
import type { DomainIntent } from "../../state/intents.types";

describe("DebugPanelComponent (class-only)", () => {
  it("invokes debug session controls", () => {
    const initial = createNewSessionState({ atMs: 123 });
    const _state = signal(initial);

    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next),
    };

    const orchestratorMock: Pick<SessionOrchestrator, "dispatch" | "debugStartSession" | "debugRestartSession"> = {
      dispatch: vi.fn(),
      debugStartSession: vi.fn(),
      debugRestartSession: vi.fn(),
    };

    const cmp = new DebugPanelComponent(
      true,
      orchestratorMock as SessionOrchestrator,
      storeMock as SessionStore,
    );

    cmp.startSession();
    cmp.restartSession();

    expect(orchestratorMock.debugStartSession).toHaveBeenCalledTimes(1);
    expect(orchestratorMock.debugRestartSession).toHaveBeenCalledTimes(1);
  });

  it("dispatches roll_die for random roll", () => {
    const initial = createNewSessionState({ atMs: 123 });
    initial.fsm.state = "IDLE";

    const _state = signal(initial);

    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next),
    };

    const dispatchMock = vi.fn<(intent: DomainIntent) => void>();
    const orchestratorMock: Pick<SessionOrchestrator, "dispatch" | "debugStartSession" | "debugRestartSession"> = {
      dispatch: dispatchMock,
      debugStartSession: vi.fn(),
      debugRestartSession: vi.fn(),
    };

    const cmp = new DebugPanelComponent(
      true, // devMode
      orchestratorMock as SessionOrchestrator,
      storeMock as SessionStore,
    );

    cmp.rollRandom();

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    const arg = dispatchMock.mock.calls[0][0];
    expect(arg.type).toBe("domain/roll_die");
  });

  it("exposes draw and discard piles in state order", () => {
    const initial = createNewSessionState({ atMs: 123 });
    initial.deck.drawPile = ["plane-a", "plane-b"];
    initial.deck.discardPile = ["plane-x"];

    const _state = signal(initial);

    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next),
    };

    const orchestratorMock: Pick<SessionOrchestrator, "dispatch" | "debugStartSession" | "debugRestartSession"> = {
      dispatch: vi.fn(),
      debugStartSession: vi.fn(),
      debugRestartSession: vi.fn(),
    };

    const cmp = new DebugPanelComponent(
      true,
      orchestratorMock as SessionOrchestrator,
      storeMock as SessionStore,
    );

    expect(cmp.drawPile()).toEqual(["plane-a", "plane-b"]);
    expect(cmp.discardPile()).toEqual(["plane-x"]);
  });
});
