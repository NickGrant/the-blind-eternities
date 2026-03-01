import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";

import { SessionOrchestrator } from "./session-orchestrator.service";
import type { SessionStore } from "./session.store";
import type { DeckService } from "./deck.service";
import { DeckValidationError } from "./deck.service";
import type { DieService } from "./die.service";
import type { FatalErrorStore } from "./fatal-error.store";
import { createNewSessionState } from "../../state/session.factory";
import type { DevModeStore } from "./dev-mode";

describe("SessionOrchestrator", () => {
  const createDevModeStore = (enabled: boolean): DevModeStore => ({
    enabled: signal(enabled).asReadonly(),
    disableUntilReload: () => void 0,
  }) as DevModeStore;
  it("injects initial deck from DeckService when starting a session", () => {
    const initial = createNewSessionState({ atMs: 1, seed: "seed-x" });
    initial.fsm.state = "SETUP";

    const _state = signal(initial);
    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next),
    };

    const deckMock: Pick<DeckService, "createInitialDeck"> = {
      createInitialDeck: () => ({
        drawPile: ["plane-1", "plane-2", "plane-3", "plane-4", "plane-5", "plane-6"],
        discardPile: [],
      }),
    };
    const dieMock: Pick<DieService, "roll"> = {
      roll: () => "blank",
    };
    const fatalMock: Pick<FatalErrorStore, "set" | "clear"> = {
      set: () => void 0,
      clear: () => void 0,
    };

    const orchestrator = new SessionOrchestrator(
      storeMock as SessionStore,
      deckMock as DeckService,
      dieMock as DieService,
      fatalMock as FatalErrorStore,
      createDevModeStore(false)
    );

    orchestrator.dispatch({ type: "domain/start_session", atMs: 100 });

    const next = _state();
    expect(next.fsm.state).toBe("MODAL_OPEN");
    expect(next.deck.drawPile).toEqual(["plane-2", "plane-3", "plane-4", "plane-5", "plane-6"]);
    expect(next.map.tilesByCoord["0,0"].planeId).toBe("plane-1");
    expect(next.map.tilesByCoord["0,-1"].planeId).toBe("plane@0,-1");
    expect(next.map.tilesByCoord["1,0"].planeId).toBe("plane@1,0");
    expect(next.map.tilesByCoord["0,1"].planeId).toBe("plane@0,1");
    expect(next.map.tilesByCoord["-1,0"].planeId).toBe("plane@-1,0");
    expect(next.map.tilesByCoord["0,0"].isFaceUp).toBe(true);
    expect(next.map.tilesByCoord["0,-1"].isFaceUp).toBe(false);
  });

  it("passes selected set codes into deck initialization", () => {
    const initial = createNewSessionState({ atMs: 1, seed: "seed-x" });
    initial.fsm.state = "SETUP";

    const _state = signal(initial);
    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next),
    };

    let receivedSets: readonly string[] | undefined;
    const deckMock: Pick<DeckService, "createInitialDeck"> = {
      createInitialDeck: (args) => {
        receivedSets = args.includedSetCodes;
        return {
          drawPile: ["plane-1", "plane-2", "plane-3", "plane-4", "plane-5", "plane-6"],
          discardPile: [],
        };
      },
    };
    const dieMock: Pick<DieService, "roll"> = {
      roll: () => "blank",
    };
    const fatalMock: Pick<FatalErrorStore, "set" | "clear"> = {
      set: () => void 0,
      clear: () => void 0,
    };

    const orchestrator = new SessionOrchestrator(
      storeMock as SessionStore,
      deckMock as DeckService,
      dieMock as DieService,
      fatalMock as FatalErrorStore,
      createDevModeStore(false)
    );

    orchestrator.dispatch({ type: "domain/start_session", atMs: 100, includedSetCodes: ["OPCA"] });
    expect(receivedSets).toEqual(["OPCA"]);
  });

  it("clears prior fatal banner on successful start_session preparation", () => {
    const initial = createNewSessionState({ atMs: 1, seed: "seed-x" });
    initial.fsm.state = "SETUP";

    const _state = signal(initial);
    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next),
    };
    const deckMock: Pick<DeckService, "createInitialDeck"> = {
      createInitialDeck: () => ({
        drawPile: ["plane-1", "plane-2", "plane-3", "plane-4", "plane-5", "plane-6"],
        discardPile: [],
      }),
    };
    const dieMock: Pick<DieService, "roll"> = {
      roll: () => "blank",
    };

    let clearCalls = 0;
    const fatalMock: Pick<FatalErrorStore, "set" | "clear"> = {
      set: () => void 0,
      clear: () => {
        clearCalls += 1;
      },
    };

    const orchestrator = new SessionOrchestrator(
      storeMock as SessionStore,
      deckMock as DeckService,
      dieMock as DieService,
      fatalMock as FatalErrorStore,
      createDevModeStore(false)
    );

    orchestrator.dispatch({ type: "domain/start_session", atMs: 100 });
    expect(clearCalls).toBe(1);
  });

  it("auto-resolves roll_die using DieService", () => {
    const initial = createNewSessionState({ atMs: 1, seed: "seed-x" });
    initial.fsm.state = "IDLE";
    initial.deck.currentPlaneId = "plane-test";

    const _state = signal(initial);
    let setCount = 0;
    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => {
        setCount += 1;
        _state.set(next);
      },
    };

    const deckMock: Pick<DeckService, "createInitialDeck"> = {
      createInitialDeck: () => ({ drawPile: [], discardPile: [] }),
    };
    const dieMock: Pick<DieService, "roll"> = {
      roll: () => "chaos",
    };
    const fatalMock: Pick<FatalErrorStore, "set" | "clear"> = {
      set: () => void 0,
      clear: () => void 0,
    };

    const orchestrator = new SessionOrchestrator(
      storeMock as SessionStore,
      deckMock as DeckService,
      dieMock as DieService,
      fatalMock as FatalErrorStore,
      createDevModeStore(false)
    );

    orchestrator.dispatch({ type: "domain/roll_die", atMs: 100 });

    const next = _state();
    expect(next.fsm.state).toBe("MODAL_OPEN");
    expect(next.modal.active?.type).toBe("PLANE");
    expect(next.modal.active?.planeId).toBe("plane-test");
    expect(next.rng.rollCount).toBe(1);
    expect(setCount).toBe(1);
  });

  it("moves to ERROR and stores fatal banner when deck init fails", () => {
    const initial = createNewSessionState({ atMs: 1, seed: "seed-x" });
    initial.fsm.state = "SETUP";

    const _state = signal(initial);
    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next),
    };

    const deckMock: Pick<DeckService, "createInitialDeck"> = {
      createInitialDeck: () => {
        throw new Error("cards missing");
      },
    };
    const dieMock: Pick<DieService, "roll"> = {
      roll: () => "blank",
    };

    let fatalCode = "";
    const fatalMock: Pick<FatalErrorStore, "set" | "clear"> = {
      set: (error) => {
        fatalCode = error.code;
      },
      clear: () => void 0,
    };

    const orchestrator = new SessionOrchestrator(
      storeMock as SessionStore,
      deckMock as DeckService,
      dieMock as DieService,
      fatalMock as FatalErrorStore,
      createDevModeStore(false)
    );

    orchestrator.dispatch({ type: "domain/start_session", atMs: 100 });

    const next = _state();
    expect(fatalCode).toBe("CARD_DATA_INIT_FAILED");
    expect(next.fsm.state).toBe("ERROR");
    expect(next.fsm.context?.error?.code).toBe("CARD_DATA_INIT_FAILED");
  });

  it("keeps SETUP and surfaces validation banner for user-correctable start errors", () => {
    const initial = createNewSessionState({ atMs: 1, seed: "seed-x" });
    initial.fsm.state = "SETUP";

    const _state = signal(initial);
    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next),
    };

    const deckMock: Pick<DeckService, "createInitialDeck"> = {
      createInitialDeck: () => {
        throw new DeckValidationError("At least 5 playable planes are required to start a session.");
      },
    };
    const dieMock: Pick<DieService, "roll"> = {
      roll: () => "blank",
    };

    let fatalCode = "";
    let fatalMessage = "";
    const fatalMock: Pick<FatalErrorStore, "set" | "clear"> = {
      set: (error) => {
        fatalCode = error.code;
        fatalMessage = error.message;
      },
      clear: () => void 0,
    };

    const orchestrator = new SessionOrchestrator(
      storeMock as SessionStore,
      deckMock as DeckService,
      dieMock as DieService,
      fatalMock as FatalErrorStore,
      createDevModeStore(false)
    );

    orchestrator.dispatch({ type: "domain/start_session", atMs: 100 });

    expect(_state().fsm.state).toBe("SETUP");
    expect(fatalCode).toBe("SESSION_VALIDATION_FAILED");
    expect(fatalMessage).toContain("At least 5 playable planes");
  });

  it("auto-completes movement after confirm_move", () => {
    const initial = createNewSessionState({ atMs: 1, seed: "seed-x" });
    initial.fsm.state = "CONFIRM_MOVE";
    initial.fsm.context = { pendingMove: { fromCoord: "0,0", toCoord: "1,0" } };
    initial.map.partyCoord = "0,0";
    initial.map.tilesByCoord = {
      "0,0": {
        coord: { x: 0, y: 0 },
        planeId: "plane-akoum",
        revealedAtMs: 0,
        isFaceUp: true,
      },
      "1,0": {
        coord: { x: 1, y: 0 },
        planeId: "plane-bant",
        revealedAtMs: 0,
        isFaceUp: false,
      },
    };

    const _state = signal(initial);
    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next),
    };

    const deckMock: Pick<DeckService, "createInitialDeck"> = {
      createInitialDeck: () => ({ drawPile: [], discardPile: [] }),
    };
    const dieMock: Pick<DieService, "roll"> = {
      roll: () => "blank",
    };
    const fatalMock: Pick<FatalErrorStore, "set" | "clear"> = {
      set: () => void 0,
      clear: () => void 0,
    };

    const orchestrator = new SessionOrchestrator(
      storeMock as SessionStore,
      deckMock as DeckService,
      dieMock as DieService,
      fatalMock as FatalErrorStore,
      createDevModeStore(false)
    );

    orchestrator.dispatch({ type: "domain/confirm_move", atMs: 200 });

    const next = _state();
    expect(next.fsm.state).toBe("MODAL_OPEN");
    expect(next.map.partyCoord).toBe("1,0");
    expect(next.map.tilesByCoord["1,0"].isFaceUp).toBe(true);
    expect(next.fsm.context?.pendingMove).toBeUndefined();
    expect(next.modal.active?.planeId).toBe(next.map.tilesByCoord["1,0"].planeId);
  });

  it("debugRollForced resolves deterministic debug outcomes from IDLE", () => {
    const initial = createNewSessionState({ atMs: 1, seed: "seed-x" });
    initial.fsm.state = "IDLE";
    initial.deck.currentPlaneId = "plane-akoum";

    const _state = signal(initial);
    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next),
    };
    const deckMock: Pick<DeckService, "createInitialDeck"> = {
      createInitialDeck: () => ({ drawPile: [], discardPile: [] }),
    };
    const dieMock: Pick<DieService, "roll"> = {
      roll: () => "blank",
    };
    const fatalMock: Pick<FatalErrorStore, "set" | "clear"> = {
      set: () => void 0,
      clear: () => void 0,
    };

    const orchestrator = new SessionOrchestrator(
      storeMock as SessionStore,
      deckMock as DeckService,
      dieMock as DieService,
      fatalMock as FatalErrorStore,
      createDevModeStore(true)
    );

    orchestrator.debugRollForced("chaos");
    expect(_state().fsm.state).toBe("MODAL_OPEN");
  });

  it("debugRevealAllCards flips all face-down tiles", () => {
    const initial = createNewSessionState({ atMs: 1, seed: "seed-x" });
    initial.map.tilesByCoord = {
      "0,0": { coord: { x: 0, y: 0 }, planeId: "plane-a", revealedAtMs: 0, isFaceUp: true },
      "1,0": { coord: { x: 1, y: 0 }, planeId: "plane-b", revealedAtMs: 0, isFaceUp: false },
    };

    const _state = signal(initial);
    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next),
    };
    const deckMock: Pick<DeckService, "createInitialDeck"> = {
      createInitialDeck: () => ({ drawPile: [], discardPile: [] }),
    };
    const dieMock: Pick<DieService, "roll"> = {
      roll: () => "blank",
    };
    const fatalMock: Pick<FatalErrorStore, "set" | "clear"> = {
      set: () => void 0,
      clear: () => void 0,
    };

    const orchestrator = new SessionOrchestrator(
      storeMock as SessionStore,
      deckMock as DeckService,
      dieMock as DieService,
      fatalMock as FatalErrorStore,
      createDevModeStore(true)
    );

    orchestrator.debugRevealAllCards();
    expect(_state().map.tilesByCoord["1,0"].isFaceUp).toBe(true);
  });

  it("debugStartSession starts only from SETUP", () => {
    const initial = createNewSessionState({ atMs: 1, seed: "seed-x" });
    initial.fsm.state = "SETUP";

    const _state = signal(initial);
    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next),
    };
    const deckMock: Pick<DeckService, "createInitialDeck"> = {
      createInitialDeck: () => ({
        drawPile: ["p1", "p2", "p3", "p4", "p5", "p6"],
        discardPile: [],
      }),
    };
    const dieMock: Pick<DieService, "roll"> = {
      roll: () => "blank",
    };
    const fatalMock: Pick<FatalErrorStore, "set" | "clear"> = {
      set: () => void 0,
      clear: () => void 0,
    };

    const orchestrator = new SessionOrchestrator(
      storeMock as SessionStore,
      deckMock as DeckService,
      dieMock as DieService,
      fatalMock as FatalErrorStore,
      createDevModeStore(true)
    );

    orchestrator.debugStartSession();
    expect(_state().fsm.state).toBe("MODAL_OPEN");
  });

  it("debugRestartSession resets and auto-starts a new session", () => {
    const initial = createNewSessionState({ atMs: 1, seed: "seed-x" });
    initial.fsm.state = "IDLE";
    initial.map.tilesByCoord = {
      "0,0": { coord: { x: 0, y: 0 }, planeId: "plane-x", revealedAtMs: 0, isFaceUp: true },
    };

    const _state = signal(initial);
    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next),
    };
    const deckMock: Pick<DeckService, "createInitialDeck"> = {
      createInitialDeck: () => ({
        drawPile: ["p1", "p2", "p3", "p4", "p5", "p6"],
        discardPile: [],
      }),
    };
    const dieMock: Pick<DieService, "roll"> = {
      roll: () => "blank",
    };
    const fatalMock: Pick<FatalErrorStore, "set" | "clear"> = {
      set: () => void 0,
      clear: () => void 0,
    };

    const orchestrator = new SessionOrchestrator(
      storeMock as SessionStore,
      deckMock as DeckService,
      dieMock as DieService,
      fatalMock as FatalErrorStore,
      createDevModeStore(true)
    );

    orchestrator.debugRestartSession();
    expect(_state().fsm.state).toBe("MODAL_OPEN");
    expect(_state().map.partyCoord).toBe("0,0");
  });
});




