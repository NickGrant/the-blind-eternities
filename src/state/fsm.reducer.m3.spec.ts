import { describe, expect, it } from "vitest";
import { reduceSessionState } from "./fsm.reducer";
import type { SessionState } from "./session.types";

describe("reduceSessionState (Milestone 3 deck/reveal/modal)", () => {
  it("initializes a shuffled deck and opens modal for center plane on bootstrap reveal complete", () => {
    const setup = buildState("SETUP");

    const boot = reduceSessionState(setup, {
      type: "domain/start_session",
      atMs: 100,
      initialDeck: {
        drawPile: ["p1", "p2", "p3", "p4", "p5", "p6"],
        discardPile: [],
      },
    });
    expect(boot.fsm.state).toBe("BOOTSTRAP_REVEAL");
    expect(boot.deck.drawPile).toEqual(["p6"]);

    const center = boot.map.tilesByCoord["0,0"];
    const north = boot.map.tilesByCoord["0,-1"];
    const east = boot.map.tilesByCoord["1,0"];
    const south = boot.map.tilesByCoord["0,1"];
    const west = boot.map.tilesByCoord["-1,0"];

    expect(center?.isFaceUp).toBe(false);
    expect(north?.isFaceUp).toBe(false);
    expect(east?.isFaceUp).toBe(false);
    expect(south?.isFaceUp).toBe(false);
    expect(west?.isFaceUp).toBe(false);

    const revealed = reduceSessionState(boot, {
      type: "domain/bootstrap_reveal_complete",
      atMs: 500,
    });

    expect(revealed.fsm.state).toBe("MODAL_OPEN");
    expect(revealed.map.tilesByCoord["0,0"].isFaceUp).toBe(true);
    expect(revealed.map.tilesByCoord["0,-1"].isFaceUp).toBe(false);
    expect(revealed.map.tilesByCoord["1,0"].isFaceUp).toBe(false);
    expect(revealed.map.tilesByCoord["0,1"].isFaceUp).toBe(false);
    expect(revealed.map.tilesByCoord["-1,0"].isFaceUp).toBe(false);

    expect(revealed.map.tilesByCoord["0,0"].revealedAtMs).toBe(500);
    expect(revealed.map.tilesByCoord["0,-1"].revealedAtMs).toBe(100);
    expect(revealed.map.tilesByCoord["1,0"].revealedAtMs).toBe(100);
    expect(revealed.map.tilesByCoord["0,1"].revealedAtMs).toBe(100);
    expect(revealed.map.tilesByCoord["-1,0"].revealedAtMs).toBe(100);

    expect(revealed.deck.currentPlaneId).toBe(revealed.map.tilesByCoord["0,0"].planeId);
    expect(revealed.modal.active?.type).toBe("PLANE");
    expect(revealed.modal.active?.planeId).toBe(revealed.deck.currentPlaneId);
    expect(revealed.modal.active?.resumeToState).toBe("IDLE");
  });

  it("queues additional modals and enforces single active modal", () => {
    const sIdle = buildState("IDLE");

    const firstOpen = reduceSessionState(sIdle, {
      type: "domain/open_modal",
      atMs: 1,
      modal: {
        id: "m1",
        modalType: "PLANE",
        title: "First",
        resumeToState: "IDLE",
      },
    });

    expect(firstOpen.fsm.state).toBe("MODAL_OPEN");
    expect(firstOpen.modal.isOpen).toBe(true);
    expect(firstOpen.modal.active?.id).toBe("m1");
    expect(firstOpen.modal.queue).toEqual([]);

    const secondOpen = reduceSessionState(firstOpen, {
      type: "domain/open_modal",
      atMs: 2,
      modal: {
        id: "m2",
        modalType: "PLANE",
        title: "Second",
      },
    });

    expect(secondOpen.fsm.state).toBe("MODAL_OPEN");
    expect(secondOpen.modal.active?.id).toBe("m1");
    expect(secondOpen.modal.queue.map((m) => m.id)).toEqual(["m2"]);

    const closeFirst = reduceSessionState(secondOpen, {
      type: "domain/close_modal",
      atMs: 3,
      modalId: "m1",
    });

    expect(closeFirst.fsm.state).toBe("MODAL_OPEN");
    expect(closeFirst.modal.active?.id).toBe("m2");
    expect(closeFirst.modal.queue).toEqual([]);

    const closeSecond = reduceSessionState(closeFirst, {
      type: "domain/close_modal",
      atMs: 4,
      modalId: "m2",
    });

    expect(closeSecond.fsm.state).toBe("IDLE");
    expect(closeSecond.modal.isOpen).toBe(false);
    expect(closeSecond.modal.active).toBeUndefined();
  });

  it("opens the current plane modal on chaos result", () => {
    const sRolling = {
      ...buildState("ROLLING"),
      deck: {
        drawPile: [],
        discardPile: [],
        currentPlaneId: "plane-test",
      },
    };

    const next = reduceSessionState(sRolling, {
      type: "domain/roll_resolved",
      atMs: 9,
      outcome: "chaos",
    });

    expect(next.fsm.state).toBe("MODAL_OPEN");
    expect(next.modal.active?.type).toBe("PLANE");
    expect(next.modal.active?.planeId).toBe("plane-test");
    expect(next.modal.queue).toEqual([]);
  });

  it("does not enqueue duplicate modal identities for the same plane target", () => {
    const sIdle = buildState("IDLE");

    const firstOpen = reduceSessionState(sIdle, {
      type: "domain/open_modal",
      atMs: 1,
      modal: {
        id: "m-plane-akoum-1",
        modalType: "PLANE",
        planeId: "plane-akoum",
        title: "Akoum",
      },
    });

    const duplicateByPlane = reduceSessionState(firstOpen, {
      type: "domain/open_modal",
      atMs: 2,
      modal: {
        id: "m-plane-akoum-2",
        modalType: "PLANE",
        planeId: "plane-akoum",
        title: "Akoum duplicate",
      },
    });

    const duplicateById = reduceSessionState(duplicateByPlane, {
      type: "domain/open_modal",
      atMs: 3,
      modal: {
        id: "m-plane-akoum-1",
        modalType: "PLANE",
        planeId: "plane-kessig",
      },
    });

    expect(duplicateByPlane.modal.active?.id).toBe("m-plane-akoum-1");
    expect(duplicateByPlane.modal.queue).toEqual([]);
    expect(duplicateById.modal.active?.id).toBe("m-plane-akoum-1");
    expect(duplicateById.modal.queue).toEqual([]);
  });
});

function buildState(fsmState: SessionState["fsm"]["state"]): SessionState {
  return {
    meta: { version: 1, createdAtMs: 0, sessionId: "test" },
    fsm: { state: fsmState },
    config: {
      decayDistance: 3,
      bootstrapRevealOrder: ["C", "N", "E", "S", "W"],
      ensurePlusEnabled: true,
      gameMode: "BLIND_ETERNITIES",
    },
    rng: { seed: "unit-seed", rollCount: 0 },
    deck: { drawPile: [], discardPile: [] },
    map: { tilesByCoord: {}, partyCoord: undefined, highlights: { eligibleMoveCoords: [] } },
    modal: { queue: [], isOpen: false },
    log: { entries: [] },
    ui: { selections: {} },
  };
}
