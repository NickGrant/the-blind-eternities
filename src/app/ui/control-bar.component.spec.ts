import { signal } from "@angular/core";
import { describe, expect, it, vi } from "vitest";

import { ControlBarComponent } from "./control-bar.component";
import type { SessionStore } from "../core/session.store";
import type { SessionOrchestrator } from "../core/session-orchestrator.service";
import { createNewSessionState } from "../../state/session.factory";
import type { DomainIntent } from "../../state/intents.types";
import type { DeckService, PlaneSetOption } from "../core/deck.service";

type DeckMock = Pick<
  DeckService,
  "listPlaneSetOptions" | "countPlayablePlanesForSets" | "getMinimumSessionPlanes" | "getPreferredDefaultSetCode"
>;

describe("ControlBarComponent (class-only)", () => {
  it("dispatches roll_die when requested", () => {
    const { cmp, dispatchMock } = buildComponent({
      fsmState: "IDLE",
      deckMock: buildDeckMock(),
    });

    cmp.dispatch("domain/roll_die");

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock.mock.calls[0][0].type).toBe("domain/roll_die");
  });

  it("dispatches start_session with selected set filters", () => {
    const { cmp, dispatchMock } = buildComponent({
      fsmState: "SETUP",
      deckMock: buildDeckMock(),
    });

    cmp.startSession();

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    const intent = dispatchMock.mock.calls[0][0];
    expect(intent.type).toBe("domain/start_session");
    if (intent.type === "domain/start_session") {
      expect(intent.includedSetCodes).toEqual(["OPCA"]);
      expect(intent.gameMode).toBe("BLIND_ETERNITIES");
      expect(intent.rulesProfile).toBe("BLIND_FOG_OF_WAR");
    }
  });

  it("dispatches selected Regular Planechase mode when changed before start", () => {
    const { cmp, dispatchMock } = buildComponent({
      fsmState: "SETUP",
      deckMock: buildDeckMock(),
    });

    cmp.setGameMode("REGULAR_PLANECHASE");
    cmp.startSession();

    const intent = dispatchMock.mock.calls[0][0];
    expect(intent.type).toBe("domain/start_session");
    if (intent.type === "domain/start_session") {
      expect(intent.gameMode).toBe("REGULAR_PLANECHASE");
      expect(intent.rulesProfile).toBe("REGULAR_STANDARD");
      expect(intent.enableHellride).toBe(false);
    }
  });

  it("allows selecting classic blind profile before session start", () => {
    const { cmp, dispatchMock } = buildComponent({
      fsmState: "SETUP",
      deckMock: buildDeckMock(),
    });

    cmp.setRulesProfile("BLIND_CLASSIC_PLUS");
    cmp.startSession();

    const intent = dispatchMock.mock.calls[0][0];
    expect(intent.type).toBe("domain/start_session");
    if (intent.type === "domain/start_session") {
      expect(intent.rulesProfile).toBe("BLIND_CLASSIC_PLUS");
    }
  });

  it("includes hellride toggle in start_session payload when enabled", () => {
    const { cmp, dispatchMock } = buildComponent({
      fsmState: "SETUP",
      deckMock: buildDeckMock(),
    });

    cmp.setEnableHellride(true);
    cmp.startSession();

    const intent = dispatchMock.mock.calls[0][0];
    expect(intent.type).toBe("domain/start_session");
    if (intent.type === "domain/start_session") {
      expect(intent.enableHellride).toBe(true);
    }
  });

  it("includes anti-stall toggle in start_session payload when enabled", () => {
    const { cmp, dispatchMock } = buildComponent({
      fsmState: "SETUP",
      deckMock: buildDeckMock(),
    });

    cmp.setEnableAntiStall(true);
    cmp.startSession();

    const intent = dispatchMock.mock.calls[0][0];
    expect(intent.type).toBe("domain/start_session");
    if (intent.type === "domain/start_session") {
      expect(intent.enableAntiStall).toBe(true);
    }
  });

  it("hides rules profile selector when only one profile is available", () => {
    const { cmp } = buildComponent({
      fsmState: "SETUP",
      deckMock: buildDeckMock(),
    });
    expect(cmp.showRulesProfilePicker()).toBe(true);
    cmp.setGameMode("REGULAR_PLANECHASE");
    expect(cmp.showRulesProfilePicker()).toBe(false);
  });

  it("uses DeckService minimum threshold to gate session start", () => {
    const { cmp, dispatchMock } = buildComponent({
      fsmState: "SETUP",
      deckMock: buildDeckMock({ minPlanes: 2, playableCount: 2, setCount: 2 }),
    });

    expect(cmp.canStartSession()).toBe(true);
    cmp.startSession();
    expect(dispatchMock).toHaveBeenCalledTimes(1);
  });

  it("does not start session when selected sets provide fewer than 5 planes", () => {
    const { cmp, dispatchMock } = buildComponent({
      fsmState: "SETUP",
      deckMock: buildDeckMock({ minPlanes: 5, playableCount: 4, setCount: 4 }),
    });

    cmp.startSession();

    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it("dispatches restart_session on second quit click after in-app confirmation", () => {
    const { cmp, dispatchMock } = buildComponent({
      fsmState: "IDLE",
      deckMock: buildDeckMock(),
    });

    cmp.quitSession();
    expect(dispatchMock).not.toHaveBeenCalled();
    expect(cmp.isQuitConfirming()).toBe(true);

    cmp.quitSession();

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock.mock.calls[0][0].type).toBe("domain/restart_session");
  });

  it("cancels in-app quit confirmation without dispatching", () => {
    const { cmp, dispatchMock } = buildComponent({
      fsmState: "IDLE",
      deckMock: buildDeckMock(),
    });

    cmp.quitSession();
    expect(cmp.isQuitConfirming()).toBe(true);

    cmp.cancelQuitSession();
    expect(cmp.isQuitConfirming()).toBe(false);
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it("defaults selected set from shared preferred default code when available", () => {
    const { cmp } = buildComponent({
      fsmState: "SETUP",
      deckMock: buildDeckMock({
        options: [
          { code: "WHO", label: "Doctor Who Commander", count: 10, isPlanechaseDefault: false },
          { code: "OPCA", label: "Planechase Anthology", count: 10, isPlanechaseDefault: true },
        ],
        preferredDefault: "OPCA",
      }),
    });

    expect(cmp.selectedSetCodes()).toEqual(["OPCA"]);
  });

  it("keeps Roll Die visible but disabled while roll toast is active", () => {
    const { cmp } = buildComponent({
      fsmState: "MODAL_OPEN",
      deckMock: buildDeckMock(),
    });

    cmp.rollToastVisible = true;

    expect(cmp.showRollButton()).toBe(true);
    expect(cmp.rollButtonDisabled()).toBe(true);
  });

  it("re-enables Roll Die after toast clears in IDLE state", () => {
    const { cmp } = buildComponent({
      fsmState: "IDLE",
      deckMock: buildDeckMock(),
    });

    cmp.rollToastVisible = true;
    expect(cmp.rollButtonDisabled()).toBe(true);

    cmp.rollToastVisible = false;
    expect(cmp.showRollButton()).toBe(true);
    expect(cmp.rollButtonDisabled()).toBe(false);
  });
});

function buildComponent(args: { fsmState: ReturnType<typeof createNewSessionState>["fsm"]["state"]; deckMock: DeckMock }) {
  const initial = createNewSessionState({ atMs: 1 });
  initial.fsm.state = args.fsmState;

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
    storeMock as SessionStore,
    args.deckMock as DeckService
  );

  return { cmp, dispatchMock };
}

function buildDeckMock(args?: {
  options?: PlaneSetOption[];
  playableCount?: number;
  minPlanes?: number;
  preferredDefault?: string;
  setCount?: number;
}): DeckMock {
  const optionCount = args?.setCount ?? args?.playableCount ?? 10;
  const options =
    args?.options ??
    ([{ code: "OPCA", label: "Planechase Anthology", count: optionCount, isPlanechaseDefault: true }] satisfies PlaneSetOption[]);

  return {
    listPlaneSetOptions: () => options,
    countPlayablePlanesForSets: () => args?.playableCount ?? 10,
    getMinimumSessionPlanes: () => args?.minPlanes ?? 5,
    getPreferredDefaultSetCode: () => args?.preferredDefault ?? "OPCA",
  };
}
