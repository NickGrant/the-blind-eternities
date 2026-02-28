import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";

import { SessionOrchestrator } from "./session-orchestrator.service";
import type { SessionStore } from "./session.store";
import type { DeckService } from "./deck.service";
import type { DieService } from "./die.service";
import type { FatalErrorStore } from "./fatal-error.store";
import { createNewSessionState } from "../../state/session.factory";

describe("SessionOrchestrator", () => {
  it("injects initial deck from DeckService when starting a session", () => {
    const initial = createNewSessionState({ atMs: 1, seed: "seed-x" });
    initial.fsm.state = "SETUP";

    const _state = signal(initial);
    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next as any),
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
    const fatalMock: Pick<FatalErrorStore, "set"> = {
      set: () => void 0,
    };

    const orchestrator = new SessionOrchestrator(
      storeMock as SessionStore,
      deckMock as DeckService,
      dieMock as DieService,
      fatalMock as FatalErrorStore,
      false
    );

    orchestrator.dispatch({ type: "domain/start_session", atMs: 100 });

    const next = _state();
    expect(next.fsm.state).toBe("BOOTSTRAP_REVEAL");
    expect(next.deck.drawPile).toEqual(["plane-6"]);
    expect(next.map.tilesByCoord["0,0"].planeId).toBe("plane-1");
    expect(next.map.tilesByCoord["0,-1"].planeId).toBe("plane-2");
    expect(next.map.tilesByCoord["1,0"].planeId).toBe("plane-3");
    expect(next.map.tilesByCoord["0,1"].planeId).toBe("plane-4");
    expect(next.map.tilesByCoord["-1,0"].planeId).toBe("plane-5");
  });

  it("auto-resolves roll_die using DieService", () => {
    const initial = createNewSessionState({ atMs: 1, seed: "seed-x" });
    initial.fsm.state = "IDLE";
    initial.deck.currentPlaneId = "plane-test";

    const _state = signal(initial);
    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next as any),
    };

    const deckMock: Pick<DeckService, "createInitialDeck"> = {
      createInitialDeck: () => ({ drawPile: [], discardPile: [] }),
    };
    const dieMock: Pick<DieService, "roll"> = {
      roll: () => "chaos",
    };
    const fatalMock: Pick<FatalErrorStore, "set"> = {
      set: () => void 0,
    };

    const orchestrator = new SessionOrchestrator(
      storeMock as SessionStore,
      deckMock as DeckService,
      dieMock as DieService,
      fatalMock as FatalErrorStore,
      false
    );

    orchestrator.dispatch({ type: "domain/roll_die", atMs: 100 });

    const next = _state();
    expect(next.fsm.state).toBe("MODAL_OPEN");
    expect(next.modal.active?.type).toBe("PLANE");
    expect(next.modal.active?.planeId).toBe("plane-test");
    expect(next.rng.rollCount).toBe(1);
  });

  it("moves to ERROR and stores fatal banner when deck init fails", () => {
    const initial = createNewSessionState({ atMs: 1, seed: "seed-x" });
    initial.fsm.state = "SETUP";

    const _state = signal(initial);
    const storeMock: Pick<SessionStore, "state" | "setState"> = {
      state: _state.asReadonly(),
      setState: (next) => _state.set(next as any),
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
    const fatalMock: Pick<FatalErrorStore, "set"> = {
      set: (error) => {
        fatalCode = error.code;
      },
    };

    const orchestrator = new SessionOrchestrator(
      storeMock as SessionStore,
      deckMock as DeckService,
      dieMock as DieService,
      fatalMock as FatalErrorStore,
      false
    );

    orchestrator.dispatch({ type: "domain/start_session", atMs: 100 });

    const next = _state();
    expect(fatalCode).toBe("CARD_DATA_INIT_FAILED");
    expect(next.fsm.state).toBe("ERROR");
    expect(next.fsm.context?.error?.code).toBe("CARD_DATA_INIT_FAILED");
  });
});
