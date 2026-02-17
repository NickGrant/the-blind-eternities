import { describe, it, expect } from "vitest";
import { reduceSessionState } from "./fsm.reducer";
import type { SessionState } from "./session.types";

describe("reduceSessionState (Milestone 2 map invariants)", () => {
  it("seeds a center tile and ensure-plus neighbors on start_session", () => {
    const s = buildState("SETUP");
    const next = reduceSessionState(s, { type: "domain/start_session", atMs: 100 });

    expect(next).not.toBe(s);
    expect(next.fsm.state).toBe("BOOTSTRAP_REVEAL");
    expect(next.map.partyCoord).toBe("0,0");

    // center + 4 neighbors
    const coords = Object.keys(next.map.tilesByCoord);
    expect(coords).toContain("0,0");
    expect(coords).toContain("0,-1");
    expect(coords).toContain("1,0");
    expect(coords).toContain("0,1");
    expect(coords).toContain("-1,0");
  });

  it("rejects select_plane that is not cardinal-adjacent", () => {
    const sAwait = {
      ...buildState("AWAIT_MOVE"),
      map: {
        partyCoord: "0,0",
        tilesByCoord: {
          "0,0": mkTile("0,0"),
          "2,0": mkTile("2,0"),
          "1,0": mkTile("1,0"),
        },
        highlights: { eligibleMoveCoords: [] },
      },
    };

    const ignored = reduceSessionState(sAwait, {
      type: "domain/select_plane",
      atMs: 1,
      toCoord: "2,0",
    });
    expect(ignored).toBe(sAwait);

    const accepted = reduceSessionState(sAwait, {
      type: "domain/select_plane",
      atMs: 2,
      toCoord: "1,0",
    });
    expect(accepted).not.toBe(sAwait);
    expect(accepted.fsm.state).toBe("CONFIRM_MOVE");
    expect(accepted.fsm.context?.pendingMove?.fromCoord).toBe("0,0");
    expect(accepted.fsm.context?.pendingMove?.toCoord).toBe("1,0");
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
    map: { tilesByCoord: {}, partyCoord: undefined, highlights: { eligibleMoveCoords: [] } },
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