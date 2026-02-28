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

  it("returns to IDLE when movement completes", () => {
    const moving = buildState("MOVING");
    moving.map.partyCoord = "0,0";
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

    expect(next.fsm.state).toBe("IDLE");
    expect(next.map.partyCoord).toBe("1,0");
    expect(next.fsm.context?.pendingMove).toBeUndefined();
    expect(next.ui.selections?.selectedCoord).toBeUndefined();
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

function mkTile(coordKey: string) {
  const [x, y] = coordKey.split(",").map((n) => Number.parseInt(n, 10));
  return {
    coord: { x, y },
    planeId: `p:${coordKey}`,
    revealedAtMs: 0,
    isFaceUp: true,
  };
}

