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
        highlights: { eligibleMoveCoords: ["1,0"], hellrideMoveCoords: [] },
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

  it("reveals tiles according to configured bootstrap reveal profile", () => {
    const classic = buildState("BOOTSTRAP_REVEAL");
    classic.config.bootstrapRevealOrder = ["C", "N", "E", "S", "W"];
    classic.config.rulesProfile = "BLIND_CLASSIC_PLUS";
    classic.map.partyCoord = "0,0";
    classic.map.tilesByCoord = {
      "0,0": { ...mkTile("0,0"), isFaceUp: false },
      "0,-1": { ...mkTile("0,-1"), isFaceUp: false },
      "1,0": { ...mkTile("1,0"), isFaceUp: false },
      "0,1": { ...mkTile("0,1"), isFaceUp: false },
      "-1,0": { ...mkTile("-1,0"), isFaceUp: false },
    };

    const classicNext = reduceSessionState(classic, {
      type: "domain/bootstrap_reveal_complete",
      atMs: 10,
    });
    expect(Object.values(classicNext.map.tilesByCoord).every((t) => t.isFaceUp)).toBe(true);

    const fog = buildState("BOOTSTRAP_REVEAL");
    fog.config.bootstrapRevealOrder = ["C"];
    fog.config.rulesProfile = "BLIND_FOG_OF_WAR";
    fog.map.partyCoord = "0,0";
    fog.map.tilesByCoord = {
      "0,0": { ...mkTile("0,0"), isFaceUp: false },
      "0,-1": { ...mkTile("0,-1"), isFaceUp: false },
      "1,0": { ...mkTile("1,0"), isFaceUp: false },
      "0,1": { ...mkTile("0,1"), isFaceUp: false },
      "-1,0": { ...mkTile("-1,0"), isFaceUp: false },
    };
    const fogNext = reduceSessionState(fog, {
      type: "domain/bootstrap_reveal_complete",
      atMs: 11,
    });
    expect(fogNext.map.tilesByCoord["0,0"].isFaceUp).toBe(true);
    expect(fogNext.map.tilesByCoord["0,-1"].isFaceUp).toBe(false);
    expect(fogNext.map.tilesByCoord["1,0"].isFaceUp).toBe(false);
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
      rulesProfile: "BLIND_CLASSIC_PLUS",
      enableHellride: false,
    },
    rng: { rollCount: 0 },
    deck: { drawPile: [], discardPile: [] },
    map: { tilesByCoord: {}, partyCoord: undefined, highlights: { eligibleMoveCoords: [], hellrideMoveCoords: [] } },
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
