import { describe, expect, it } from "vitest";
import { reduceSessionState } from "./fsm.reducer";
import type { SessionState } from "./session.types";

describe("reduceSessionState (Milestone 4 dice/movement/turn loop)", () => {
  it("highlights adjacent movement options on planeswalk without auto-moving", () => {
    const rolling = buildState("ROLLING");
    rolling.map.partyCoord = "0,0";
    rolling.map.tilesByCoord = {
      "0,0": mkTile("0,0"),
      "0,-1": mkTile("0,-1"),
      "1,0": mkTile("1,0"),
      "0,1": mkTile("0,1"),
      "-1,0": mkTile("-1,0"),
      "2,0": mkTile("2,0"),
    };

    const next = reduceSessionState(rolling, {
      type: "domain/roll_resolved",
      atMs: 10,
      outcome: "planeswalk",
    });

    expect(next.fsm.state).toBe("AWAIT_MOVE");
    expect(next.map.partyCoord).toBe("0,0");
    expect(next.fsm.context?.pendingMove).toBeUndefined();
    expect(next.map.highlights?.eligibleMoveCoords.slice().sort()).toEqual(
      ["0,-1", "1,0", "0,1", "-1,0"].sort()
    );
  });

  it("replaces active plane directly on planeswalk in regular planechase mode", () => {
    const rolling = buildState("ROLLING");
    rolling.config.gameMode = "REGULAR_PLANECHASE";
    rolling.map.partyCoord = "0,0";
    rolling.map.tilesByCoord = {
      "0,0": mkTile("0,0"),
      "1,0": mkTile("1,0"),
    };
    rolling.deck.currentPlaneId = "plane-current";
    rolling.deck.drawPile = ["plane-next", "plane-after"];
    rolling.deck.discardPile = ["plane-old"];

    const next = reduceSessionState(rolling, {
      type: "domain/roll_resolved",
      atMs: 10,
      outcome: "planeswalk",
    });

    expect(next.fsm.state).toBe("MODAL_OPEN");
    expect(next.deck.currentPlaneId).toBe("plane-next");
    expect(next.deck.drawPile).toEqual(["plane-after"]);
    expect(next.deck.discardPile).toEqual(["plane-old", "plane-current"]);
    expect(Object.keys(next.map.tilesByCoord)).toEqual(["0,0"]);
    expect(next.modal.active?.planeId).toBe("plane-next");
  });

  it("opens landing modal when movement completes", () => {
    const moving = buildState("MOVING");
    moving.map.partyCoord = "0,0";
    moving.deck.drawPile = ["plane-next-1", "plane-next-2", "plane-next-3"];
    moving.map.tilesByCoord = {
      "0,0": mkTile("0,0"),
      "1,0": mkTile("1,0"),
      "2,0": mkTile("2,0"),
      "3,0": mkTile("3,0"),
      "4,0": mkTile("4,0"),
    };
    moving.fsm.context = {
      pendingMove: { fromCoord: "0,0", toCoord: "1,0" },
    };

    const next = reduceSessionState(moving, {
      type: "domain/movement_complete",
      atMs: 20,
    });

    expect(next.fsm.state).toBe("MODAL_OPEN");
    expect(next.map.partyCoord).toBe("1,0");
    expect(next.fsm.context?.pendingMove).toBeUndefined();
    expect(next.ui.selections?.selectedCoord).toBeUndefined();
    expect(next.map.tilesByCoord["1,0"].isFaceUp).toBe(true);
    expect(next.modal.active?.planeId).toBe(next.map.tilesByCoord["1,0"].planeId);
  });

  it("expands only one-step adjacency around moved party tile", () => {
    const moving = buildState("MOVING");
    moving.map.partyCoord = "0,0";
    moving.deck.drawPile = ["plane-a", "plane-b", "plane-c", "plane-d", "plane-e", "plane-f"];
    moving.map.tilesByCoord = {
      "0,0": mkTile("0,0"),
      "0,-1": mkTile("0,-1"),
      "1,0": mkTile("1,0", false),
      "0,1": mkTile("0,1"),
      "-1,0": mkTile("-1,0"),
    };
    moving.fsm.context = {
      pendingMove: { fromCoord: "0,0", toCoord: "1,0" },
    };

    const next = reduceSessionState(moving, {
      type: "domain/movement_complete",
      atMs: 30,
    });

    expect(next.map.tilesByCoord["2,0"]).toBeTruthy();
    expect(next.map.tilesByCoord["1,-1"]).toBeTruthy();
    expect(next.map.tilesByCoord["1,1"]).toBeTruthy();
    expect(next.map.tilesByCoord["3,0"]).toBeFalsy();
    expect(next.map.tilesByCoord["2,1"]).toBeFalsy();
    expect(next.map.tilesByCoord["2,-1"]).toBeFalsy();
  });

  it("assigns real plane ids to newly created placeholder tiles from draw pile", () => {
    const moving = buildState("MOVING");
    moving.map.partyCoord = "0,0";
    moving.deck.drawPile = ["plane-real-1", "plane-real-2", "plane-real-3"];
    moving.map.tilesByCoord = {
      "0,0": mkTile("0,0"),
      "1,0": mkTile("1,0", false),
    };
    moving.fsm.context = {
      pendingMove: { fromCoord: "0,0", toCoord: "1,0" },
    };

    const next = reduceSessionState(moving, {
      type: "domain/movement_complete",
      atMs: 40,
    });

    const adjacentCreated = ["2,0", "1,-1", "1,1"].map((k) => next.map.tilesByCoord[k]?.planeId);
    expect(adjacentCreated.every((id) => typeof id === "string" && !id?.startsWith("plane@"))).toBe(true);
  });

  it("recycles discard pile into draw pile when assignment draw would run out", () => {
    const moving = buildState("MOVING");
    moving.map.partyCoord = "0,0";
    moving.config.ensurePlusEnabled = false;
    moving.deck.drawPile = [];
    moving.deck.discardPile = ["plane-recycled-1", "plane-recycled-2"];
    moving.map.tilesByCoord = {
      "0,0": mkTile("0,0"),
      "1,0": mkTile("1,0", false),
      "0,1": { ...mkTile("0,1", false), planeId: "plane@0,1" },
    };
    moving.fsm.context = {
      pendingMove: { fromCoord: "0,0", toCoord: "1,0" },
    };

    const next = reduceSessionState(moving, {
      type: "domain/movement_complete",
      atMs: 50,
    });

    expect(next.map.tilesByCoord["0,1"].planeId.startsWith("plane@")).toBe(false);
    expect(next.deck.discardPile).toEqual([]);
  });

  it("assigns placeholders in deterministic coord order", () => {
    const moving = buildState("MOVING");
    moving.map.partyCoord = "0,0";
    moving.config.ensurePlusEnabled = false;
    moving.deck.drawPile = ["plane-a", "plane-b", "plane-c"];
    moving.map.tilesByCoord = {
      "0,0": mkTile("0,0"),
      "0,-1": { ...mkTile("0,-1", false), planeId: "plane@0,-1" },
      "-1,0": { ...mkTile("-1,0", false), planeId: "plane@-1,0" },
      "1,1": { ...mkTile("1,1", false), planeId: "plane@1,1" },
    };
    moving.fsm.context = {
      pendingMove: { fromCoord: "0,0", toCoord: "0,0" },
    };

    const next = reduceSessionState(moving, {
      type: "domain/movement_complete",
      atMs: 60,
    });

    expect(next.map.tilesByCoord["0,-1"].planeId).toBe("plane-a");
    expect(next.map.tilesByCoord["-1,0"].planeId).toBe("plane-b");
    expect(next.map.tilesByCoord["1,1"].planeId).toBe("plane-c");
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
    rng: { seed: "seed-1", rollCount: 0 },
    deck: { drawPile: [], discardPile: [], currentPlaneId: "p:0,0" },
    map: {
      tilesByCoord: {},
      partyCoord: undefined,
      highlights: { eligibleMoveCoords: [] },
    },
    modal: { queue: [], isOpen: false },
    log: { entries: [] },
    ui: { selections: {} },
  };
}

function mkTile(coordKey: string, isFaceUp = true) {
  const [x, y] = coordKey.split(",").map((n) => Number.parseInt(n, 10));
  return {
    coord: { x, y },
    planeId: `p:${coordKey}`,
    revealedAtMs: 0,
    isFaceUp,
  };
}
