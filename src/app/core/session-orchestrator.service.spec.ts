import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";

import { SessionOrchestrator } from "./session-orchestrator.service";
import type { SessionStore } from "./session.store";
import type { DeckService } from "./deck.service";
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

    const orchestrator = new SessionOrchestrator(
      storeMock as SessionStore,
      deckMock as DeckService,
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
});

