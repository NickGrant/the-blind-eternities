import { describe, it, expect } from "vitest";
import { applyDecay, createTile, ensurePlusBounded, withDistancesFromParty } from "./map-model";

describe("map-model", () => {
  it("ensurePlusBounded fills N/E/S/W around a single center tile", () => {
    const tiles = {
      "0,0": createTile({ coordKey: "0,0", planeId: "center", atMs: 1, isFaceUp: true }),
    };

    const ensured = ensurePlusBounded({
      tilesByCoord: tiles,
      partyCoord: "0,0",
      radius: 3,
      atMs: 2,
      drawPlaneId: (k) => `p:${k}`,
    });

    expect(Object.keys(ensured.tilesByCoord).sort()).toEqual(
      ["0,0", "0,-1", "1,0", "0,1", "-1,0"].sort()
    );
    expect(ensured.placed.sort()).toEqual(["0,-1", "1,0", "0,1", "-1,0"].sort());
  });

  it("applyDecay removes tiles beyond decayDistance from party", () => {
    const tiles = {
      "0,0": createTile({ coordKey: "0,0", planeId: "a", atMs: 1 }),
      "3,0": createTile({ coordKey: "3,0", planeId: "b", atMs: 1 }),
      "4,0": createTile({ coordKey: "4,0", planeId: "c", atMs: 1 }),
    };

    const decayed = applyDecay({ tilesByCoord: tiles, partyCoord: "0,0", decayDistance: 3 });
    expect(Object.keys(decayed.tilesByCoord).sort()).toEqual(["0,0", "3,0"].sort());
    expect(decayed.removed).toEqual(["4,0"]);
  });

  it("withDistancesFromParty annotates Manhattan distance", () => {
    const tiles = {
      "0,0": createTile({ coordKey: "0,0", planeId: "a", atMs: 1 }),
      "2,1": createTile({ coordKey: "2,1", planeId: "b", atMs: 1 }),
    };

    const withD = withDistancesFromParty(tiles, "0,0");
    expect(withD["0,0"].distanceFromParty).toBe(0);
    expect(withD["2,1"].distanceFromParty).toBe(3);
  });
});