import { describe, expect, it } from "vitest";
import { coordToWorld, isSelectableTile } from "./map-rendering";
import type { SessionState } from "../../state/session.types";

describe("map-rendering helpers", () => {
  it("maps grid coords to world coords", () => {
    const world = coordToWorld(
      { x: 2, y: -1 },
      { originX: 100, originY: 200, tileWidth: 120, tileHeight: 72, gapX: 16, gapY: 12 }
    );

    expect(world).toEqual({ x: 372, y: 116 });
  });

  it("enables tile selection only in AWAIT_MOVE and only for eligible coords", () => {
    const state = buildState("AWAIT_MOVE");
    state.map.highlights = { eligibleMoveCoords: ["1,0"] };

    expect(isSelectableTile(state, "1,0")).toBe(true);
    expect(isSelectableTile(state, "2,0")).toBe(false);

    state.fsm.state = "IDLE";
    expect(isSelectableTile(state, "1,0")).toBe(false);
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
    rng: { rollCount: 0 },
    deck: { drawPile: [], discardPile: [] },
    map: { tilesByCoord: {}, partyCoord: "0,0", highlights: { eligibleMoveCoords: [] } },
    modal: { queue: [], isOpen: false },
    log: { entries: [] },
    ui: {},
  };
}

